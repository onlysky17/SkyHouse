import { supabase } from './lib/supabase'

type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'completed' | 'cancelled'
type DateRange = 'all' | 'today' | '7d' | '30d'

type OpsOrderItem = {
  name?: string
  qty?: number
  price_text?: string
}

type OpsOrder = {
  id: number
  customer_name: string
  customer_phone: string
  customer_note: string
  admin_note: string
  items: OpsOrderItem[]
  subtotal_known: number
  shipping_fee: number
  final_total: number | null
  has_contact_price: boolean
  status: OrderStatus
  source: string
  created_at: string
}

const statusLabel: Record<OrderStatus, string> = {
  new: 'Đơn mới',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
}

let orderCache: OpsOrder[] = []
let searchTerm = ''
let dateRange: DateRange = 'all'
let loading = false
let lastLoadedAt = 0
let mutationQueued = false

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function localDayKey(value: Date) {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function inDateRange(order: OpsOrder) {
  if (dateRange === 'all') return true
  const created = new Date(order.created_at)
  if (Number.isNaN(created.getTime())) return false
  const now = new Date()
  if (dateRange === 'today') return localDayKey(created) === localDayKey(now)
  const days = dateRange === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - (days - 1))
  return created >= cutoff
}

function searchableText(order: OpsOrder) {
  const items = Array.isArray(order.items) ? order.items : []
  return normalize([
    order.id,
    order.customer_name,
    order.customer_phone,
    order.customer_note,
    order.admin_note,
    statusLabel[order.status] || order.status,
    ...items.map(item => `${item.name || ''} ${item.qty || ''} ${item.price_text || ''}`),
  ].join(' '))
}

function matchesSearch(order: OpsOrder) {
  const q = normalize(searchTerm)
  if (!q) return true
  return searchableText(order).includes(q)
}

function visibleData() {
  return orderCache.filter(order => inDateRange(order) && matchesSearch(order))
}

function money(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`
}

function setText(root: Element, selector: string, text: string) {
  const el = root.querySelector<HTMLElement>(selector)
  if (el && el.textContent !== text) el.textContent = text
}

function renderMetrics(toolbar: HTMLElement) {
  const rows = visibleData()
  const today = localDayKey(new Date())
  const todayCount = rows.filter(order => {
    const date = new Date(order.created_at)
    return !Number.isNaN(date.getTime()) && localDayKey(date) === today
  }).length
  const processing = rows.filter(order => order.status === 'new' || order.status === 'confirmed' || order.status === 'shipping').length
  const settled = rows.filter(order => order.final_total != null && order.status !== 'cancelled').length
  const completedRevenue = rows
    .filter(order => order.status === 'completed' && order.final_total != null)
    .reduce((sum, order) => sum + Number(order.final_total || 0), 0)

  setText(toolbar, '[data-ops-today]', String(todayCount))
  setText(toolbar, '[data-ops-processing]', String(processing))
  setText(toolbar, '[data-ops-settled]', String(settled))
  setText(toolbar, '[data-ops-revenue]', money(completedRevenue))
  setText(toolbar, '[data-ops-count]', `${rows.length} đơn khớp`)
}

function addFilteredEmptyState(list: HTMLElement, visibleRows: number, totalRows: number) {
  const old = list.querySelector<HTMLElement>('[data-order-ops-empty]')
  if (visibleRows > 0 || totalRows === 0) {
    old?.remove()
    return
  }
  if (old) return
  const empty = document.createElement('div')
  empty.className = 'adminOrdersEmpty adminOrderOpsEmpty'
  empty.dataset.orderOpsEmpty = 'true'
  empty.textContent = 'Không có đơn nào khớp tìm kiếm / khoảng thời gian này.'
  list.appendChild(empty)
}

function applyRowVisibility() {
  const panel = document.querySelector<HTMLElement>('.adminOrdersPanel')
  if (!panel) return
  const toolbar = panel.querySelector<HTMLElement>('[data-admin-order-ops]')
  if (toolbar) renderMetrics(toolbar)

  const list = panel.querySelector<HTMLElement>('.adminOrdersList')
  if (!list) return
  const rows = Array.from(list.querySelectorAll<HTMLElement>('.adminOrderRow'))
  let visibleRows = 0
  for (const row of rows) {
    const id = Number(row.dataset.orderId)
    const order = orderCache.find(item => item.id === id)
    const shouldShow = !order || (inDateRange(order) && matchesSearch(order))
    if (row.hidden === shouldShow) row.hidden = !shouldShow
    if (shouldShow) visibleRows += 1
  }
  addFilteredEmptyState(list, visibleRows, rows.length)
}

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function itemSummary(order: OpsOrder) {
  const items = Array.isArray(order.items) ? order.items : []
  return items.map(item => `${item.name || 'Sản phẩm'} x${Number(item.qty) || 0}`).join(' | ')
}

function exportCsv() {
  const rows = visibleData()
  if (!rows.length) return
  const header = [
    'Mã đơn', 'Thời gian', 'Khách hàng', 'Số điện thoại', 'Trạng thái', 'Sản phẩm',
    'Tạm tính', 'Phí giao hàng', 'Tổng chốt', 'Còn món hỏi giá', 'Ghi chú khách', 'Ghi chú nội bộ',
  ]
  const lines = [header.map(csvCell).join(',')]
  for (const order of rows) {
    lines.push([
      order.id,
      new Date(order.created_at).toLocaleString('vi-VN'),
      order.customer_name,
      order.customer_phone,
      statusLabel[order.status] || order.status,
      itemSummary(order),
      order.subtotal_known,
      order.shipping_fee,
      order.final_total ?? '',
      order.has_contact_price ? 'Có' : 'Không',
      order.customer_note,
      order.admin_note,
    ].map(csvCell).join(','))
  }

  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `skyhouse-orders-${localDayKey(new Date())}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

function toolbarHtml() {
  return `
    <div class="adminOrderOpsMetrics">
      <div><small>Đơn hôm nay</small><strong data-ops-today>0</strong></div>
      <div><small>Đang xử lý</small><strong data-ops-processing>0</strong></div>
      <div><small>Đã chốt tiền</small><strong data-ops-settled>0</strong></div>
      <div class="revenue"><small>Doanh thu hoàn tất</small><strong data-ops-revenue>0đ</strong></div>
    </div>
    <div class="adminOrderOpsToolbar">
      <label class="adminOrderOpsSearch">
        <span>⌕</span>
        <input type="search" data-order-ops-search placeholder="Tìm mã đơn, tên, SĐT, sản phẩm…" autocomplete="off" value="${searchTerm.replace(/"/g, '&quot;')}" />
      </label>
      <select data-order-ops-range aria-label="Lọc thời gian">
        <option value="all" ${dateRange === 'all' ? 'selected' : ''}>Tất cả thời gian</option>
        <option value="today" ${dateRange === 'today' ? 'selected' : ''}>Hôm nay</option>
        <option value="7d" ${dateRange === '7d' ? 'selected' : ''}>7 ngày gần đây</option>
        <option value="30d" ${dateRange === '30d' ? 'selected' : ''}>30 ngày gần đây</option>
      </select>
      <span class="adminOrderOpsCount" data-ops-count>0 đơn khớp</span>
      <button type="button" data-order-ops-export>Xuất CSV</button>
    </div>
  `
}

function ensureToolbar() {
  const panel = document.querySelector<HTMLElement>('.adminOrdersPanel')
  if (!panel) return
  let toolbar = panel.querySelector<HTMLElement>('[data-admin-order-ops]')
  if (!toolbar) {
    toolbar = document.createElement('section')
    toolbar.className = 'adminOrderOps'
    toolbar.dataset.adminOrderOps = 'true'
    toolbar.innerHTML = toolbarHtml()
    const filters = panel.querySelector('.adminOrderFilters')
    if (filters) filters.insertAdjacentElement('afterend', toolbar)
    else panel.querySelector('.adminOrdersHeader')?.insertAdjacentElement('afterend', toolbar)

    toolbar.querySelector<HTMLInputElement>('[data-order-ops-search]')?.addEventListener('input', event => {
      searchTerm = (event.currentTarget as HTMLInputElement).value
      applyRowVisibility()
    })
    toolbar.querySelector<HTMLSelectElement>('[data-order-ops-range]')?.addEventListener('change', event => {
      dateRange = (event.currentTarget as HTMLSelectElement).value as DateRange
      applyRowVisibility()
    })
    toolbar.querySelector<HTMLButtonElement>('[data-order-ops-export]')?.addEventListener('click', exportCsv)
  }
  renderMetrics(toolbar)
}

async function refreshData(force = false) {
  if (!supabase || loading) return
  if (!force && Date.now() - lastLoadedAt < 15000) return
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) return

  loading = true
  const { data, error } = await supabase
    .from('orders')
    .select('id,customer_name,customer_phone,customer_note,admin_note,items,subtotal_known,shipping_fee,final_total,has_contact_price,status,source,created_at')
    .order('created_at', { ascending: false })
    .limit(1000)
  loading = false
  if (error) return

  orderCache = (data ?? []) as OpsOrder[]
  lastLoadedAt = Date.now()
  ensureToolbar()
  applyRowVisibility()
}

function queueDomSync() {
  if (mutationQueued) return
  mutationQueued = true
  window.queueMicrotask(() => {
    mutationQueued = false
    const panel = document.querySelector<HTMLElement>('.adminOrdersPanel')
    if (!panel) return
    ensureToolbar()
    applyRowVisibility()
    void refreshData(false)
  })
}

export function installAdminOrderOps() {
  if (!location.pathname.startsWith('/admin') || !supabase) return

  const observer = new MutationObserver(queueDomSync)
  observer.observe(document.body, { childList: true, subtree: true })
  queueDomSync()

  document.addEventListener('click', event => {
    const target = event.target as Element | null
    if (!target) return
    if (target.closest('[data-admin-orders-trigger]') || target.closest('[data-orders-refresh]')) {
      window.setTimeout(() => void refreshData(true), 80)
    }
  }, true)

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) window.setTimeout(() => void refreshData(true), 120)
    else {
      orderCache = []
      lastLoadedAt = 0
    }
  })

  window.setInterval(() => {
    if (document.hidden || !document.querySelector('.adminOrdersPanel')) return
    void refreshData(true)
  }, 60000)
}
