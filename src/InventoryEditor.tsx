import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { InventoryFields, stockLabel } from './lib/inventory'

type Movement = {
  id: number; movement_type: string; qty_delta: number; quantity_after: number
  reason: string; created_at: string; order_id: number | null
}
type Props = {
  product: InventoryFields & { id?: number; unit: string }
  onChanged: () => Promise<void>
  onThresholdChange: (value: number) => void
}

export default function InventoryEditor({ product, onChanged, onThresholdChange }: Props) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<Movement[]>([])
  const [request, setRequest] = useState<string | null>(null)
  const [expectedQuantity, setExpectedQuantity] = useState<number | null>(null)
  const available = product.stock_quantity !== undefined
  const activeId = useRef(product.id)

  useEffect(() => {
    activeId.current = product.id; setBusy(false)
    setOpen(false); setQuantity(''); setReason(''); setMessage(''); setHistory([]); setRequest(null)
  }, [product.id])

  async function loadHistory() {
    if (!supabase || !product.id) return
    const { data, error } = await supabase.from('inventory_movements')
      .select('id,movement_type,qty_delta,quantity_after,reason,created_at,order_id')
      .eq('product_id', product.id).order('id', { ascending: false }).limit(10)
    if (activeId.current !== product.id) return
    if (error) setMessage(`Không tải được lịch sử: ${error.message}`)
    else setHistory((data ?? []) as Movement[])
  }

  async function adjust() {
    if (!supabase || !product.id || busy) return
    const value = Number(quantity)
    if (!quantity.trim() || !Number.isFinite(value) || value < 0 || !/^\d+(\.\d{1,3})?$/.test(quantity) || !reason.trim()) {
      setMessage('Nhập tồn không âm (tối đa 3 số thập phân) và lý do điều chỉnh.'); return
    }
    setBusy(true); setMessage('')
    const requestId = request ?? crypto.randomUUID()
    setRequest(requestId)
    const { error } = await supabase.rpc('adjust_inventory', {
      p_product_id: product.id, p_quantity: value, p_reason: reason.trim(),
      p_request_id: requestId, p_expected_quantity: expectedQuantity,
    })
    if (activeId.current !== product.id) return
    if (error) setMessage(error.message)
    else {
      setMessage('Đã điều chỉnh tồn và ghi lịch sử.'); setRequest(null); setOpen(false)
      await onChanged(); await loadHistory()
    }
    setBusy(false)
  }

  return <section className="inventoryEditor" aria-label="Quản lý tồn kho">
    <strong>{stockLabel(product, product.unit)}</strong>
    <div className="adminFormGrid inventoryFields">
      <label>Tồn kho hiện tại ({product.unit})<input readOnly value={product.stock_quantity ?? ''} placeholder="Chưa quản lý tồn" /><small>Thay đổi bằng “Điều chỉnh tồn” để ghi lịch sử.</small></label>
      <label>Ngưỡng sắp hết<input type="number" min="0" step="0.001" disabled={!available} value={product.low_stock_threshold ?? 5} onChange={e => onThresholdChange(Number(e.target.value))} /></label>
    </div>
    <p>{!product.id ? 'Lưu sản phẩm trước, sau đó điều chỉnh tồn để ghi số lượng ban đầu.' :
      !available ? 'Quản lý tồn chưa được bật cho dữ liệu này.' :
      product.stock_quantity == null ? 'Chưa nhập số tồn thật. Sản phẩm vẫn bán theo trạng thái Còn hàng hiện có.' : 'Đơn được xác nhận sẽ trừ tồn; hủy trước hoàn tất sẽ hoàn tồn.'}</p>
    <div className="inventoryActions">
      <button type="button" disabled={!product.id || !available || busy} onClick={() => {
        setOpen(!open); setQuantity(product.stock_quantity == null ? '' : String(product.stock_quantity)); setReason(''); setRequest(null); setMessage(''); setExpectedQuantity(product.stock_quantity ?? null)
      }}>Điều chỉnh tồn</button>
      <button type="button" disabled={!product.id || !available || busy} onClick={() => void loadHistory()}>Lịch sử tồn</button>
    </div>
    {open && <div className="adminFormGrid inventoryAdjustment">
      <label>Số lượng mới ({product.unit})<input type="number" min="0" step="0.001" value={quantity} disabled={busy} onChange={e => { setQuantity(e.target.value); setRequest(null) }} /></label>
      <label className="adminFileField">Lý do<input value={reason} disabled={busy} onChange={e => { setReason(e.target.value); setRequest(null) }} placeholder="Nhập hàng / kiểm kê / hư hỏng…" /></label>
      <button type="button" disabled={busy} onClick={() => void adjust()}>{busy ? 'Đang ghi…' : 'Ghi điều chỉnh tồn'}</button>
    </div>}
    {message && <p role="status">{message}</p>}
    {history.length > 0 && <ul className="inventoryHistory">{history.map(row => <li key={row.id}>
      <b>{row.qty_delta > 0 ? '+' : ''}{row.qty_delta} → {row.quantity_after} {product.unit}</b>
      <span>{row.reason}{row.order_id ? ` · Đơn #${row.order_id}` : ''}</span>
      <small>{new Date(row.created_at).toLocaleString('vi-VN')}</small>
    </li>)}</ul>}
  </section>
}
