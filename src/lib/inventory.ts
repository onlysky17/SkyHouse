export type InventoryFields = {
  stock_quantity?: number | null
  low_stock_threshold?: number
  in_stock?: boolean | null
}

export const isSoldOut = (p: InventoryFields) =>
  p.in_stock === false || (p.stock_quantity != null && p.stock_quantity <= 0)

export const isLowStock = (p: InventoryFields) =>
  p.stock_quantity != null && p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold ?? 5)

export const cartLimit = (p: InventoryFields) => isSoldOut(p) ? 0 :
  p.stock_quantity == null ? 99 : Math.max(0, Math.min(99, Math.floor(p.stock_quantity)))

export function stockLabel(p: InventoryFields, unit = '') {
  if (isSoldOut(p)) return 'Hết hàng'
  if (p.stock_quantity == null) return 'Còn hàng · Chưa quản lý tồn'
  const qty = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(p.stock_quantity)
  return `${isLowStock(p) ? 'Sắp hết · ' : ''}Còn ${qty}${unit ? ` ${unit}` : ''}`
}

export const inventoryColumns = ',stock_quantity,low_stock_threshold'
export const missingInventoryColumns = (error: { code?: string; message: string }) =>
  ['42703', 'PGRST204'].includes(error.code ?? '') && /stock_quantity|low_stock_threshold/.test(error.message)
