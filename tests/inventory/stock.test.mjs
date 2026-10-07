// Pure stock rules from the actual TypeScript module; no application/catalog mocks.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../../src/lib/inventory.ts',import.meta.url),'utf8')
const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {cartLimit,isSoldOut,isLowStock,stockLabel} = await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))
assert.equal(cartLimit({stock_quantity:null,in_stock:true}),99)
assert.equal(cartLimit({in_stock:true}),99)
assert.equal(isSoldOut({stock_quantity:0,in_stock:true}),true)
assert.equal(cartLimit({stock_quantity:0,in_stock:true}),0)
assert.equal(cartLimit({stock_quantity:10,in_stock:false}),0)
assert.equal(cartLimit({stock_quantity:2.5,in_stock:true}),2)
assert.equal(isLowStock({stock_quantity:4,low_stock_threshold:5}),true)
assert.equal(isLowStock({stock_quantity:0,low_stock_threshold:5}),false)
assert.equal(isLowStock({stock_quantity:null,low_stock_threshold:5}),false)
assert.equal(stockLabel({stock_quantity:4,low_stock_threshold:5},'kg'),'Sắp hết · Còn 4 kg')
assert.equal(stockLabel({stock_quantity:0},'kg'),'Hết hàng')
console.log('PASS: legacy availability, sold-out add/cart limit, fractional stock limit and low-stock labels')
