import { supabase } from './lib/supabase'

type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'completed' | 'cancelled'
type OrderFilter = 'all' | OrderStatus

type OrderItem = {
  name?: string
  category?: string
  qty?: number
  price?: number | null
  price_text?: string
  unit?: string
}

type OrderRow = {
  id: number
  customer_name: string
  customer_phone: string
  customer_note: string
  items: OrderItem[]
  subtotal_known: number
  has_contact_price: boolean
  shipping_fee: number
  final_total: number | null
  admin_note: string
  status: OrderStatus
  source: string
  created_at: string
  updated_at: string
}

const statusMeta: Record<OrderStatus, { label: string; tone: string }> = {
  new: { label: 'Đơn mới', tone: 'new' },
  confirmed: { label: 'Đã xác nhận', tone: 'confirmed' },
  shipping: { label: 'Đang giao', tone: 'shipping' },
  completed: { label: 'Hoàn tất', tone: 'completed' },
  cancelled: { label: 'Đã hủy', tone: 'cancelled' },
}

const statusOrder: OrderStatus[] = ['new', 'confirmed', 'shipping', 'completed', 'cancelled']
let orders: OrderRow[] = []
let filter: OrderFilter = 'all'
let selectedId: number | null = null
let panelOpen = false
let loading = false
let loadedOnce = false
let trigger: HTMLButtonElement | null = null
let panelRoot: HTMLElement | null = null
let noticeText = ''
let noticeState: 'ok' | 'error' | '' = ''

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(value))
  } catch {
    return value
  }
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

function itemCount(order: OrderRow) {
  return (order.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
}

function subtotalLabel(order: OrderRow) {
  if (order.subtotal_known > 0) return order.has_contact_price ? `${money(order.subtotal_known)} + món hỏi giá` : money(order.subtotal_known)
  return order.has_contact_price ? 'Liên hệ giá' : '0đ'
}

function totalLabel(order: OrderRow) {
  if (order.final_total != null) return money(order.final_total)
  const suggested = Number(order.subtotal_known || 0) + Number(order.shipping_fee || 0)
  if (!order.has_contact_price && suggested > 0) return `${money(suggested)} dự kiến`
  return subtotalLabel(order)
}

function countStatus(status: OrderStatus) {
  return orders.filter(order => order.status === status).length
}

function renderTrigger() {
  if (!trigger) return
  const count = countStatus('new')
  const badge = trigger.querySelector<HTMLElement>('b')
  if (badge) {
    badge.textContent = String(count)
    badge.hidden = count === 0
  }
  trigger.classList.toggle('hasNew', count > 0)
  trigger.title = count > 0 ? `${count} đơn mới đang chờ xử lý` : 'Mở quản lý đơn hàng'
}

function filteredOrders() {
  return filter === 'all' ? orders : orders.filter(order => order.status === filter)
}

function ensureSelection() {
  const shown = filteredOrders()
  if (selectedId != null && shown.some(order => order.id === selectedId)) return
  selectedId = shown[0]?.id ?? null
}

function statusBadge(status: OrderStatus) {
  const meta = statusMeta[status]
  return `<span class="adminOrderStatus ${meta.tone}">${escapeHtml(meta.label)}</span>`
}

function orderListHtml() {
  const shown = filteredOrders()
  if (loading && !loadedOnce) return '<div class="adminOrdersEmpty">Đang tải đơn hàng…</div>'
  if (!shown.length) return '<div class="adminOrdersEmpty">Chưa có đơn nào trong nhóm này.</div>'

  return shown.map(order => `
    <button type="button" class="adminOrderRow ${selectedId === order.id ? 'active' : ''}" data-order-id="${order.id}">
      <div class="adminOrderRowTop"><strong>#${order.id} · ${escapeHtml(order.customer_name)}</strong>${statusBadge(order.status)}</div>
      <div class="adminOrderRowMeta"><span>${escapeHtml(order.customer_phone)}</span><span>${escapeHtml(formatDate(order.created_at))}</span></div>
      <div class="adminOrderRowBottom"><span>${itemCount(order)} món</span><b>${escapeHtml(totalLabel(order))}</b></div>
    </button>
  `).join('')
}

function orderDetailHtml() {
  const order = orders.find(item => item.id === selectedId)
  if (!order) return '<div class="adminOrdersDetailEmpty">Chọn một đơn bên trái để xem chi tiết.</div>'

  const phone = phoneDigits(order.customer_phone)
  const items = Array.isArray(order.items) ? order.items : []
  const itemRows = items.map((item, index) => `
    <div class="adminOrderItem">
      <div><small>Món ${index + 1}</small><strong>${escapeHtml(item.name || 'Sản phẩm')}</strong>${item.category ? `<span>${escapeHtml(item.category)}</span>` : ''}</div>
      <div class="adminOrderItemPrice"><b>×${Number(item.qty) || 0}</b><span>${escapeHtml(item.price_text || (item.price == null ? 'Liên hệ giá' : money(Number(item.price))))}</span></div>
    </div>
  `).join('')

  const statusOptions = statusOrder.map(status => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${escapeHtml(statusMeta[status].label)}</option>`).join('')
  const shippingFee = Number(order.shipping_fee || 0)
  const suggestedTotal = Number(order.subtotal_known || 0) + shippingFee
  const finalValue = order.final_total == null ? '' : String(order.final_total)

  return `
    <div class="adminOrderDetailHead">
      <div><small>ĐƠN #${order.id}</small><h2>${escapeHtml(order.customer_name)}</h2><span>${escapeHtml(formatDate(order.created_at))}</span></div>
      ${statusBadge(order.status)}
    </div>

    <div class="adminOrderCustomerGrid">
      <div><small>Số điện thoại</small><strong>${escapeHtml(order.customer_phone)}</strong></div>
      <div><small>Tạm tính đã có giá</small><strong>${escapeHtml(subtotalLabel(order))}</strong></div>
      <div><small>Phí giao hàng</small><strong>${shippingFee > 0 ? escapeHtml(money(shippingFee)) : 'Chưa nhập'}</strong></div>
      <div><small>Tổng chốt</small><strong class="adminOrderFinalTotal">${escapeHtml(order.final_total != null ? money(order.final_total) : 'Chưa chốt')}</strong></div>
      <div class="wide"><small>Ghi chú khách / giao nhận</small><strong>${escapeHtml(order.customer_note || 'Không có ghi chú')}</strong></div>
    </div>

    <section class="adminOrderItemsBlock">
      <div class="adminOrdersSectionTitle"><span>Danh sách món</span><b>${itemCount(order)} món</b></div>
      <div class="adminOrderItems">${itemRows || '<div class="adminOrdersEmpty">Đơn chưa có snapshot sản phẩm.</div>'}</div>
    </section>

    <section class="adminOrderSettlement">
      <div class="adminOrdersSectionTitle"><span>Chốt tiền & ghi chú nội bộ</span><b>${order.final_total != null ? 'Đã chốt' : 'Chưa chốt'}</b></div>
      <div class="adminOrderSettlementGrid">
        <label>Phí giao hàng
          <input type="number" min="0" step="1000" inputmode="numeric" data-order-shipping-fee value="${shippingFee}" placeholder="0" />
        </label>
        <label>Tổng chốt với khách
          <input type="number" min="0" step="1000" inputmode="numeric" data-order-final-total value="${escapeHtml(finalValue)}" placeholder="${!order.has_contact_price && suggestedTotal > 0 ? escapeHtml(String(suggestedTotal)) : 'Nhập tổng cuối'}" />
          <small>${order.has_contact_price ? 'Có món hỏi giá — nhập tổng cuối sau khi xác nhận.' : `Gợi ý: ${money(suggestedTotal)}`}</small>
        </label>
        <label class="wide">Ghi chú nội bộ
          <textarea rows="2" data-order-admin-note placeholder="Ví dụ: khách chuyển khoản, ship GHN, giao sau 18h…">${escapeHtml(order.admin_note || '')}</textarea>
        </label>
      </div>
      <div class="adminOrderSettlementActions">
        <button type="button" data-order-settlement-save="${order.id}">Lưu chốt đơn</button>
        <button type="button" data-order-copy-confirmation="${order.id}">Sao chép xác nhận cho khách</button>
      </div>
    </section>

    <div class="adminOrderManage">
      <label>Trạng thái đơn
        <select data-order-status-select="${order.id}">${statusOptions}</select>
      </label>
      <div class="adminOrderContactActions">
        ${phone ? `<a href="tel:${phone}">Gọi khách</a><a href="https://zalo.me/${phone}" target="_blank" rel="noreferrer">Mở Zalo</a>` : ''}
      </div>
    </div>
    ${order.has_contact_price ? '<p class="adminOrderPriceNotice">Đơn có món chưa niêm yết giá. Hãy nhập “Tổng chốt với khách” sau khi xác nhận giá.</p>' : ''}
  `
}

function renderPanel() {
  if (!panelRoot) return
  ensureSelection()
  const counts = { all: orders.length, new: countStatus('new'), confirmed: countStatus('confirmed'), shipping: countStatus('shipping'), completed: countStatus('completed'), cancelled: countStatus('cancelled') }
  const filterButtons: Array<[OrderFilter, string]> = [
    ['all', 'Tất cả'], ['new', 'Đơn mới'], ['confirmed', 'Đã xác nhận'], ['shipping', 'Đang giao'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy'],
  ]
  const filters = filterButtons.map(([value, label]) => `
    <button type="button" data-order-filter="${value}" class="${filter === value ? 'active' : ''}"><span>${escapeHtml(label)}</span><b>${counts[value]}</b></button>
  `).join('')

  panelRoot.innerHTML = `
    <button type="button" class="adminOrdersBackdrop" data-orders-close aria-label="Đóng quản lý đơn"></button>
    <section class="adminOrdersPanel" role="dialog" aria-modal="true" aria-label="Quản lý đơn hàng">
      <header class="adminOrdersHeader">
        <div><small>SKY'S HOUSE · ADMIN</small><h1 class="serif">Đơn hàng.</h1><p>Theo dõi từ lúc khách gửi giỏ đến khi giao xong.</p></div>
        <div class="adminOrdersHeaderActions"><button type="button" data-orders-refresh>↻ Làm mới</button><button type="button" data-orders-close aria-label="Đóng">×</button></div>
      </header>
      <nav class="adminOrderFilters">${filters}</nav>
      ${noticeText ? `<div class="adminOrdersNotice ${noticeState}">${escapeHtml(noticeText)}</div>` : ''}
      <div class="adminOrdersWorkspace">
        <aside class="adminOrdersList">${orderListHtml()}</aside>
        <article class="adminOrdersDetail">${orderDetailHtml()}</article>
      </div>
    </section>
  `
}

function closePanel() {
  panelOpen = false
  panelRoot?.classList.remove('open')
  document.documentElement.classList.remove('adminOrdersOpen')
}

async function openPanel() {
  ensurePanel()
  panelOpen = true
  panelRoot?.classList.add('open')
  document.documentElement.classList.add('adminOrdersOpen')
  renderPanel()
  await loadOrders(false)
}

async function loadOrders(silent = true) {
  if (!supabase || loading) return
  loading = true
  if (!silent) {
    noticeText = ''
    noticeState = ''
    renderPanel()
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    loading = false
    return
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id,customer_name,customer_phone,customer_note,items,subtotal_known,has_contact_price,shipping_fee,final_total,admin_note,status,source,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(300)

  loading = false
  if (error) {
    noticeText = `Không tải được đơn hàng: ${error.message}`
    noticeState = 'error'
    if (panelOpen) renderPanel()
    return
  }

  orders = (data ?? []) as OrderRow[]
  loadedOnce = true
  ensureSelection()
  renderTrigger()
  if (panelOpen) renderPanel()
}

async function updateStatus(id: number, status: OrderStatus) {
  if (!supabase || !statusOrder.includes(status)) return
  noticeText = 'Đang cập nhật trạng thái…'
  noticeState = ''
  renderPanel()

  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) {
    noticeText = `Không cập nhật được: ${error.message}`
    noticeState = 'error'
    renderPanel()
    return
  }

  const order = orders.find(item => item.id === id)
  if (order) {
    order.status = status
    order.updated_at = new Date().toISOString()
  }
  noticeText = `Đã chuyển đơn #${id} sang “${statusMeta[status].label}”.`
  noticeState = 'ok'
  renderTrigger()
  renderPanel()
}

function readSettlementValue(selector: string) {
  const input = panelRoot?.querySelector<HTMLInputElement>(selector)
  if (!input) return 0
  const raw = input.value.trim()
  if (!raw) return 0
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0
}

async function saveSettlement(id: number) {
  if (!supabase) return
  const order = orders.find(item => item.id === id)
  if (!order) return

  const shippingFee = readSettlementValue('[data-order-shipping-fee]')
  const finalInput = panelRoot?.querySelector<HTMLInputElement>('[data-order-final-total]')
  const adminNote = panelRoot?.querySelector<HTMLTextAreaElement>('[data-order-admin-note]')?.value.trim() || ''
  const rawFinal = finalInput?.value.trim() || ''
  let finalTotal: number | null = null
  if (rawFinal) {
    const parsed = Number(rawFinal)
    finalTotal = Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null
  } else if (!order.has_contact_price) {
    finalTotal = Number(order.subtotal_known || 0) + shippingFee
  }

  noticeText = 'Đang lưu phần chốt đơn…'
  noticeState = ''
  renderPanel()

  const { error } = await supabase
    .from('orders')
    .update({ shipping_fee: shippingFee, final_total: finalTotal, admin_note: adminNote, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    noticeText = `Không lưu được phần chốt đơn: ${error.message}`
    noticeState = 'error'
    renderPanel()
    return
  }

  order.shipping_fee = shippingFee
  order.final_total = finalTotal
  order.admin_note = adminNote
  order.updated_at = new Date().toISOString()
  noticeText = finalTotal == null
    ? `Đã lưu đơn #${id}. Tổng cuối vẫn đang chờ xác nhận.`
    : `Đã chốt đơn #${id}: ${money(finalTotal)}.`
  noticeState = 'ok'
  renderPanel()
}

function confirmationText(order: OrderRow) {
  const items = (order.items || []).map((item, index) => {
    const qty = Number(item.qty) || 0
    const price = item.price_text || (item.price == null ? 'Liên hệ giá' : money(Number(item.price)))
    return `${index + 1}. ${item.name || 'Sản phẩm'} ×${qty} — ${price}`
  })
  const lines = [
    `SKY'S HOUSE · XÁC NHẬN ĐƠN #${order.id}`,
    `Khách: ${order.customer_name}`,
    `SĐT: ${order.customer_phone}`,
    '',
    ...items,
    '',
    `Tạm tính: ${subtotalLabel(order)}`,
    `Phí giao hàng: ${money(Number(order.shipping_fee || 0))}`,
    `TỔNG CHỐT: ${order.final_total != null ? money(order.final_total) : 'Chưa chốt'}`,
    order.customer_note ? `Giao nhận / ghi chú: ${order.customer_note}` : '',
    '',
    'Sky’s house cảm ơn ní. Nhờ ní kiểm tra lại thông tin đơn giúp mình nhé.',
  ].filter(Boolean)
  return lines.join('\n')
}

async function copyConfirmation(id: number) {
  const order = orders.find(item => item.id === id)
  if (!order) return
  const text = confirmationText(order)
  try {
    await navigator.clipboard.writeText(text)
    noticeText = `Đã sao chép xác nhận đơn #${id}. Mở Zalo và Ctrl+V để gửi khách.`
    noticeState = 'ok'
  } catch {
    noticeText = 'Trình duyệt không cho sao chép tự động. Hãy thử lại hoặc cấp quyền clipboard.'
    noticeState = 'error'
  }
  renderPanel()
}

function ensurePanel() {
  if (panelRoot) return panelRoot
  panelRoot = document.createElement('div')
  panelRoot.className = 'adminOrdersLayer'
  panelRoot.dataset.adminOrdersLayer = 'true'
  document.body.appendChild(panelRoot)

  panelRoot.addEventListener('click', event => {
    const target = event.target as Element | null
    if (!target) return
    if (target.closest('[data-orders-close]')) {
      closePanel()
      return
    }
    if (target.closest('[data-orders-refresh]')) {
      void loadOrders(false)
      return
    }
    const settlementSave = target.closest<HTMLElement>('[data-order-settlement-save]')
    if (settlementSave) {
      void saveSettlement(Number(settlementSave.dataset.orderSettlementSave))
      return
    }
    const copyConfirmationButton = target.closest<HTMLElement>('[data-order-copy-confirmation]')
    if (copyConfirmationButton) {
      void copyConfirmation(Number(copyConfirmationButton.dataset.orderCopyConfirmation))
      return
    }
    const filterButton = target.closest<HTMLElement>('[data-order-filter]')
    if (filterButton) {
      const next = filterButton.dataset.orderFilter as OrderFilter
      if (next === 'all' || statusOrder.includes(next as OrderStatus)) {
        filter = next
        ensureSelection()
        renderPanel()
      }
      return
    }
    const row = target.closest<HTMLElement>('[data-order-id]')
    if (row) {
      selectedId = Number(row.dataset.orderId)
      renderPanel()
    }
  })

  panelRoot.addEventListener('change', event => {
    const select = (event.target as Element | null)?.closest<HTMLSelectElement>('[data-order-status-select]')
    if (!select) return
    const id = Number(select.dataset.orderStatusSelect)
    const next = select.value as OrderStatus
    void updateStatus(id, next)
  })

  return panelRoot
}

function ensureTrigger() {
  const userArea = document.querySelector<HTMLElement>('.adminTopbar .adminUser')
  if (!userArea) return
  const existing = userArea.querySelector<HTMLButtonElement>('[data-admin-orders-trigger]')
  if (existing) {
    trigger = existing
    renderTrigger()
    return
  }

  trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.className = 'adminOrdersTrigger'
  trigger.dataset.adminOrdersTrigger = 'true'
  trigger.innerHTML = '<span>Đơn hàng</span><b hidden>0</b>'
  trigger.addEventListener('click', () => void openPanel())

  const logoutButton = Array.from(userArea.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes('Đăng xuất'))
  if (logoutButton) userArea.insertBefore(trigger, logoutButton)
  else userArea.appendChild(trigger)

  renderTrigger()
  if (!loadedOnce) void loadOrders(true)
}

export function installAdminOrders() {
  if (!location.pathname.startsWith('/admin') || !supabase) return

  const observer = new MutationObserver(ensureTrigger)
  observer.observe(document.body, { childList: true, subtree: true })
  ensureTrigger()

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      window.setTimeout(() => {
        ensureTrigger()
        void loadOrders(true)
      }, 80)
    } else {
      orders = []
      loadedOnce = false
      closePanel()
      trigger?.remove()
      trigger = null
    }
  })

  window.setInterval(() => {
    if (document.hidden) return
    void loadOrders(true)
  }, 60000)
}
