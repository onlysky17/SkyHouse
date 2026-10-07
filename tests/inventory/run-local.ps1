#requires -Version 7.0
param([string]$Container = 'skyhouse-inventory-001-db')
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$label = docker inspect --format '{{index .Config.Labels "skyhouse.task"}}' $Container
$network = docker inspect --format '{{.HostConfig.NetworkMode}}' $Container
if ($label -ne 'INVENTORY-001' -or $network -ne 'none') { throw 'Only the isolated INVENTORY-001 container is permitted.' }
$db = 'skyhouse_inventory_' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
function Sql([string]$Query) {
  $output = docker exec $Container psql -U supabase_admin -d $db -v ON_ERROR_STOP=1 -Atc $Query 2>&1
  if ($LASTEXITCODE -ne 0) { throw ($output -join "`n") }
  return $output
}
function FileSql([string]$RelativePath) {
  $source = Join-Path $root $RelativePath
  $target = '/tmp/' + [IO.Path]::GetFileName($source)
  docker cp $source "${Container}:$target" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Copy failed' }
  $output = docker exec $Container psql -U supabase_admin -d $db -v ON_ERROR_STOP=1 -f $target 2>&1
  if ($LASTEXITCODE -ne 0) { throw ($output -join "`n") }
  $output | Where-Object { $_ -like '*PASS:*' }
}
docker exec $Container psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -c "create database $db" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Create isolated test database failed' }
FileSql 'tests/inventory/bootstrap.sql'
FileSql 'supabase/schema.sql'
FileSql 'supabase/migrations/20260917_add_order_tracking_rpc.sql'
FileSql 'tests/inventory/pre-migration.sql'
FileSql 'supabase/migrations/20261007_inventory_management.sql'
FileSql 'tests/inventory/acceptance.sql'
Sql @'
set request.jwt.claim.role='authenticated';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into products(id,name) values(80000,'Concurrent local fixture');
select adjust_inventory(80000,5,'Local concurrency initial','00000000-0000-0000-0000-000000000010',null);
insert into orders(id,customer_name,customer_phone,items) values
(80000,'Local fixture','concurrency','[{"product_id":80000,"qty":4}]'),
(80001,'Local fixture','concurrency','[{"product_id":80000,"qty":4}]');
'@ | Out-Null
$jobs = foreach ($order in @(80000,80001)) {
  $query = "set request.jwt.claim.role='authenticated'; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'; begin; select update_order_status_with_inventory($order,'confirmed'); select pg_sleep(1); commit;"
  Start-Job -ScriptBlock {
    param($Container,$Db,$Query)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $output = docker exec $Container psql -U supabase_admin -d $Db -v ON_ERROR_STOP=1 -Atc $Query 2>&1
    [pscustomobject]@{ Code=$LASTEXITCODE; Output=($output -join "`n") }
  } -ArgumentList $Container,$db,$query
}
$jobs | Wait-Job -Timeout 30 | Out-Null
if ($jobs | Where-Object State -ne 'Completed') { throw 'Concurrency test timed out' }
$results = $jobs | Receive-Job
if (@($results | Where-Object Code -eq 0).Count -ne 1 -or @($results | Where-Object { $_.Output -like '*Không đủ tồn:*' }).Count -ne 1) {
  throw ('Unexpected concurrent results: ' + ($results | ConvertTo-Json -Compress))
}
$actual = Sql "select stock_quantity || '|' || (select count(*) from orders where id in (80000,80001) and status='confirmed') || '|' || (select count(*) from inventory_movements where product_id=80000 and movement_type='order_confirm') from products where id=80000;"
if ($actual -ne '1.000|1|1') { throw "Concurrency accounting mismatch: $actual" }
'PASS: case G, concurrent confirmations: one success, one insufficient; stock 1; one deduction.'
"Evidence database retained in isolated container: $db"
