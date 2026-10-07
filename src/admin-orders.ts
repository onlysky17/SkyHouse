import { supabase } from './lib/supabase'

type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'completed' | 'cancelled'
type OrderFilter = 'all' | 'unread' | OrderStatus
type RealtimeState = 'connecting' | 'connected' | 'degraded' | 'offline'
type NotificationTraceTone = 'info' | 'ok' | 'warn' | 'error'
type NotificationTrace = { at: number; tone: NotificationTraceTone; message: string }
type AdminPanelFieldKey = 'shipping_fee' | 'final_total' | 'admin_note'
type AdminPanelViewState = {
  renderedOrderId: number | null
  detailScrollTop: number
  detailBottomGap: number
  detailWasAtBottom: boolean
  listScrollTop: number
  filterScrollLeft: number
  traceOpen: boolean
  traceScrollTop: number
  activeField: null | {
    key: AdminPanelFieldKey
    value: string
    selectionStart: number | null
    selectionEnd: number | null
  }
}

type OrderItem = {
  product_id?: number | null
  name?: string
  category?: string
  qty?: number
  price?: number | null
  price_text?: string
  unit?: string
  image_url?: string
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
  inventory_state?: 'unprocessed' | 'deducted' | 'restored' | 'legacy'
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
const SEEN_ORDER_IDS_KEY = 'skyhouse_admin_seen_order_ids_v2'
const LEGACY_SEEN_THROUGH_KEY = 'skyhouse_admin_orders_seen_through_v1'
const SOUND_KEY = 'skyhouse_admin_order_sound_v1'
const BACKGROUND_NOTIFICATION_KEY = 'skyhouse_admin_background_notifications_v1'
const RECENT_NOTIFIED_KEY = 'skyhouse_admin_recent_notified_orders_v1'
const NOTIFICATION_TRACE_KEY = 'skyhouse_admin_notification_trace_v1'
const NOTIFICATION_DEDUPE_MS = 24 * 60 * 60 * 1000
const NOTIFICATION_TRACE_LIMIT = 40
let orders: OrderRow[] = []
let filter: OrderFilter = 'all'
let selectedId: number | null = null
let panelOpen = false
let loading = false
let loadedOnce = false
let trigger: HTMLButtonElement | null = null
let panelRoot: HTMLElement | null = null
let panelRenderEpoch = 0
let toastRoot: HTMLElement | null = null
let toastTimer: number | null = null
let noticeText = ''
let noticeState: 'ok' | 'error' | '' = ''
let unseenOrderIds = new Set<number>()
let seenOrderIds = loadSeenOrderIds()
let legacySeenThroughOrderId = loadLegacySeenThroughOrderId()
let soundEnabled = loadSoundPreference()
let backgroundNotificationsEnabled = loadBackgroundNotificationPreference()
let recentlyNotifiedOrders = loadRecentNotifiedOrders()
let recentlyAlertedOrderUpdates = new Set<string>()
let notificationTrace = loadNotificationTrace()
let audioContext: AudioContext | null = null
let currentAdminUserId: string | null = null
let realtimeChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null
let realtimeState: RealtimeState = navigator.onLine ? 'connecting' : 'offline'
let lastSyncAt: Date | null = null
const baseDocumentTitle = document.title

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

function formatClockTime(value: Date | null) {
  if (!value) return 'Chưa đồng bộ'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(value)
  } catch {
    return value.toLocaleTimeString()
  }
}

function realtimeMeta() {
  if (realtimeState === 'connected') return { label: 'Realtime ổn định', tone: 'ok' }
  if (realtimeState === 'connecting') return { label: 'Đang kết nối', tone: 'connecting' }
  if (realtimeState === 'offline') return { label: 'Mất mạng', tone: 'offline' }
  return { label: 'Đang dùng fallback', tone: 'degraded' }
}

function setRealtimeState(next: RealtimeState) {
  if (realtimeState === next) return
  const previous = realtimeState
  realtimeState = next
  recordNotificationTrace(`Realtime: ${previous} → ${next}.`, next === 'connected' ? 'ok' : next === 'offline' ? 'error' : 'warn')
  updatePanelRuntimeChrome()
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

function loadSeenOrderIds() {
  try {
    const raw = localStorage.getItem(SEEN_ORDER_IDS_KEY)
    if (!raw) return new Set<number>()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<number>()
    return new Set(parsed.map(Number).filter(id => Number.isSafeInteger(id) && id > 0))
  } catch {
    return new Set<number>()
  }
}

function loadLegacySeenThroughOrderId() {
  try {
    const value = Number(localStorage.getItem(LEGACY_SEEN_THROUGH_KEY) || '0')
    return Number.isSafeInteger(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

function loadSoundPreference() {
  try { return localStorage.getItem(SOUND_KEY) === '1' } catch { return false }
}

function loadBackgroundNotificationPreference() {
  try { return localStorage.getItem(BACKGROUND_NOTIFICATION_KEY) === '1' } catch { return false }
}

function loadNotificationTrace() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_TRACE_KEY)
    if (!raw) return [] as NotificationTrace[]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [] as NotificationTrace[]
    return parsed
      .map(item => ({
        at: Number(item?.at),
        tone: item?.tone as NotificationTraceTone,
        message: String(item?.message ?? ''),
      }))
      .filter(item => Number.isFinite(item.at) && ['info', 'ok', 'warn', 'error'].includes(item.tone) && item.message)
      .slice(0, NOTIFICATION_TRACE_LIMIT)
  } catch {
    return [] as NotificationTrace[]
  }
}

function persistNotificationTrace() {
  notificationTrace = notificationTrace.slice(0, NOTIFICATION_TRACE_LIMIT)
  try { localStorage.setItem(NOTIFICATION_TRACE_KEY, JSON.stringify(notificationTrace)) } catch { /* ignore storage errors */ }
}

function recordNotificationTrace(message: string, tone: NotificationTraceTone = 'info') {
  notificationTrace = [{ at: Date.now(), tone, message }, ...notificationTrace].slice(0, NOTIFICATION_TRACE_LIMIT)
  persistNotificationTrace()
}

function clearNotificationTrace() {
  notificationTrace = []
  persistNotificationTrace()
  noticeText = 'Đã xóa nhật ký chẩn đoán trên thiết bị này.'
  noticeState = 'ok'
  if (panelOpen) renderPanel()
}

function formatTraceTime(value: number) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(new Date(value))
  } catch {
    return new Date(value).toLocaleTimeString()
  }
}

function notificationTraceHtml() {
  if (!notificationTrace.length) return '<div class="adminOrdersTraceEmpty">Chưa có sự kiện chẩn đoán trên thiết bị này.</div>'
  return notificationTrace.map(entry => `
    <div class="adminOrdersTraceRow ${entry.tone}">
      <time>${escapeHtml(formatTraceTime(entry.at))}</time>
      <span>${escapeHtml(entry.message)}</span>
    </div>
  `).join('')
}

function diagnosticSnapshotText() {
  const realtime = realtimeMeta()
  const lines = [
    "SKY'S HOUSE · NOTIFICATION DIAGNOSTICS",
    `Realtime: ${realtime.label}`,
    `Online: ${navigator.onLine ? 'yes' : 'no'}`,
    `Tab hidden: ${document.hidden ? 'yes' : 'no'}`,
    `Last sync: ${lastSyncAt ? lastSyncAt.toISOString() : 'none'}`,
    `Unread: ${unseenOrderIds.size}`,
    `New-status backlog: ${countStatus('new')}`,
    `Sound: ${soundEnabled ? 'on' : 'off'}`,
    `Browser notification setting: ${backgroundNotificationsEnabled ? 'on' : 'off'}`,
    `Browser notification permission: ${browserNotificationPermission()}`,
    `Recent alerted IDs cached: ${recentlyNotifiedOrders.size}`,
    '',
    'Recent diagnostic events:',
    ...notificationTrace.map(entry => `${new Date(entry.at).toISOString()} [${entry.tone}] ${entry.message}`),
  ]
  return lines.join('\n')
}

async function copyNotificationDiagnostics() {
  try {
    await navigator.clipboard.writeText(diagnosticSnapshotText())
    noticeText = 'Đã sao chép chẩn đoán thông báo. Nội dung không chứa tên, SĐT hay ghi chú khách.'
    noticeState = 'ok'
    recordNotificationTrace('Đã sao chép snapshot chẩn đoán không chứa PII.', 'ok')
  } catch {
    noticeText = 'Trình duyệt không cho sao chép chẩn đoán tự động.'
    noticeState = 'error'
    recordNotificationTrace('Không sao chép được snapshot chẩn đoán do quyền clipboard.', 'error')
  }
  if (panelOpen) renderPanel()
}

function loadRecentNotifiedOrders() {
  const result = new Map<number, number>()
  try {
    const raw = localStorage.getItem(RECENT_NOTIFIED_KEY)
    if (!raw) return result
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return result
    const now = Date.now()
    for (const entry of parsed) {
      if (!Array.isArray(entry) || entry.length !== 2) continue
      const id = Number(entry[0])
      const notifiedAt = Number(entry[1])
      if (!Number.isSafeInteger(id) || id <= 0 || !Number.isFinite(notifiedAt)) continue
      if (now - notifiedAt < NOTIFICATION_DEDUPE_MS) result.set(id, notifiedAt)
    }
  } catch {
    return new Map<number, number>()
  }
  return result
}

function persistRecentNotifiedOrders() {
  const now = Date.now()
  const recent = Array.from(recentlyNotifiedOrders.entries())
    .filter(([id, notifiedAt]) => Number.isSafeInteger(id) && id > 0 && now - notifiedAt < NOTIFICATION_DEDUPE_MS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
  recentlyNotifiedOrders = new Map(recent)
  try { localStorage.setItem(RECENT_NOTIFIED_KEY, JSON.stringify(recent)) } catch { /* ignore storage errors */ }
}

function refreshRecentNotifiedOrders() {
  recentlyNotifiedOrders = loadRecentNotifiedOrders()
}

function wasOrderRecentlyNotified(id: number) {
  refreshRecentNotifiedOrders()
  const notifiedAt = recentlyNotifiedOrders.get(id)
  return notifiedAt != null && Date.now() - notifiedAt < NOTIFICATION_DEDUPE_MS
}

function markOrdersNotified(ids: number[]) {
  const now = Date.now()
  for (const id of ids) {
    if (Number.isSafeInteger(id) && id > 0) recentlyNotifiedOrders.set(id, now)
  }
  persistRecentNotifiedOrders()
}

function browserNotificationsSupported() {
  return 'Notification' in window
}

function browserNotificationPermission() {
  return browserNotificationsSupported() ? Notification.permission : 'unsupported'
}

function persistBackgroundNotificationPreference() {
  try { localStorage.setItem(BACKGROUND_NOTIFICATION_KEY, backgroundNotificationsEnabled ? '1' : '0') } catch { /* ignore storage errors */ }
}

function backgroundNotificationMeta() {
  if (!browserNotificationsSupported()) return { label: 'Thông báo nền: Không hỗ trợ', tone: 'unsupported', disabled: true }
  const permission = browserNotificationPermission()
  if (permission === 'denied') return { label: 'Thông báo nền: Bị chặn', tone: 'blocked', disabled: false }
  if (backgroundNotificationsEnabled && permission === 'granted') return { label: '🖥 Thông báo nền: Bật', tone: 'on', disabled: false }
  return { label: '🖥 Thông báo nền: Tắt', tone: 'off', disabled: false }
}

function hasSeenOrderState() {
  try { return localStorage.getItem(SEEN_ORDER_IDS_KEY) != null } catch { return false }
}

function persistSeenOrderIds() {
  const recent = Array.from(seenOrderIds)
    .filter(id => Number.isSafeInteger(id) && id > 0)
    .sort((a, b) => b - a)
    .slice(0, 500)
  seenOrderIds = new Set(recent)
  try { localStorage.setItem(SEEN_ORDER_IDS_KEY, JSON.stringify(recent)) } catch { /* ignore storage errors */ }
}

function persistSoundPreference() {
  try { localStorage.setItem(SOUND_KEY, soundEnabled ? '1' : '0') } catch { /* ignore storage errors */ }
}

async function toggleBackgroundNotifications() {
  if (!browserNotificationsSupported()) {
    recordNotificationTrace('Trình duyệt không hỗ trợ Notification API.', 'warn')
    noticeText = 'Trình duyệt này không hỗ trợ thông báo hệ thống.'
    noticeState = 'error'
    if (panelOpen) renderPanel()
    return
  }

  if (backgroundNotificationsEnabled && Notification.permission === 'granted') {
    backgroundNotificationsEnabled = false
    persistBackgroundNotificationPreference()
    recordNotificationTrace('Admin tắt thông báo nền trên thiết bị.', 'info')
    noticeText = 'Đã tắt thông báo nền trên thiết bị này.'
    noticeState = 'ok'
    if (panelOpen) renderPanel()
    return
  }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission()

  if (permission !== 'granted') {
    backgroundNotificationsEnabled = false
    persistBackgroundNotificationPreference()
    recordNotificationTrace(`Quyền thông báo nền không được cấp: ${permission}.`, permission === 'denied' ? 'error' : 'warn')
    noticeText = permission === 'denied'
      ? 'Thông báo hệ thống đang bị trình duyệt chặn. Hãy cho phép notification trong cài đặt site nếu muốn bật lại.'
      : 'Chưa cấp quyền thông báo nền.'
    noticeState = 'error'
    if (panelOpen) renderPanel()
    return
  }

  backgroundNotificationsEnabled = true
  persistBackgroundNotificationPreference()
  recordNotificationTrace('Admin bật thông báo nền; quyền trình duyệt = granted.', 'ok')
  noticeText = 'Đã bật thông báo nền. Tính năng hoạt động khi tab admin vẫn đang mở.'
  noticeState = 'ok'
  showSystemNotification({
    title: "Sky's house · Đã bật thông báo nền",
    body: 'Khi có đơn mới lúc tab đang ở nền, trình duyệt sẽ hiện cảnh báo hệ thống.',
    tag: 'skyhouse-notification-enabled',
  })
  if (panelOpen) renderPanel()
}

function seedSeenStateForExistingOrders() {
  for (const order of orders) {
    const id = Number(order.id)
    if (!Number.isSafeInteger(id) || id <= 0) continue
    if (legacySeenThroughOrderId === 0 || id <= legacySeenThroughOrderId) seenOrderIds.add(id)
  }
  persistSeenOrderIds()
}

function rebuildUnseenOrders() {
  unseenOrderIds = new Set(
    orders
      .map(order => Number(order.id))
      .filter(id => Number.isSafeInteger(id) && id > 0 && !seenOrderIds.has(id)),
  )
}

async function persistRemoteSeenOrderIds(ids: number[]) {
  if (!supabase || !currentAdminUserId) return
  const uniqueIds = Array.from(new Set(ids.filter(id => Number.isSafeInteger(id) && id > 0)))
  if (!uniqueIds.length) return

  const rows = uniqueIds.map(orderId => ({
    user_id: currentAdminUserId,
    order_id: orderId,
  }))
  const { error } = await supabase
    .from('admin_order_reads')
    .upsert(rows, { onConflict: 'user_id,order_id', ignoreDuplicates: true })

  if (error) console.warn('Không đồng bộ được trạng thái đã xem:', error.message)
}

async function syncRemoteSeenState(userId: string) {
  if (!supabase) return
  currentAdminUserId = userId
  const hadLocalSeenState = hasSeenOrderState()

  const { data, error } = await supabase
    .from('admin_order_reads')
    .select('order_id')
    .eq('user_id', userId)
    .limit(1000)

  if (error) {
    if (!hadLocalSeenState) seedSeenStateForExistingOrders()
    return
  }

  const remoteIds = new Set(
    (data ?? [])
      .map(row => Number(row.order_id))
      .filter(id => Number.isSafeInteger(id) && id > 0),
  )

  const currentOrderIds = new Set(orders.map(order => Number(order.id)))

  if (remoteIds.size > 0 || hadLocalSeenState) {
    // Remote read rows are authoritative for current orders. A customer append may
    // intentionally remove a read row so the pending order becomes unread again.
    for (const id of currentOrderIds) seenOrderIds.delete(id)
    for (const id of remoteIds) seenOrderIds.add(id)
    persistSeenOrderIds()
  } else {
    seedSeenStateForExistingOrders()
    await persistRemoteSeenOrderIds(Array.from(seenOrderIds).filter(id => currentOrderIds.has(id)))
  }
}

function handleRealtimeSeenInsert(raw: Record<string, unknown>) {
  if (!currentAdminUserId || raw.user_id !== currentAdminUserId) return
  const id = Number(raw.order_id)
  if (!Number.isSafeInteger(id) || id <= 0 || seenOrderIds.has(id)) return
  seenOrderIds.add(id)
  unseenOrderIds.delete(id)
  persistSeenOrderIds()
  renderNotificationState()
  if (panelOpen) renderPanel()
}

function markOrderSeen(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) return
  seenOrderIds.add(id)
  unseenOrderIds.delete(id)
  persistSeenOrderIds()
  renderNotificationState()
  void persistRemoteSeenOrderIds([id])
}

function markAllOrdersSeen() {
  if (unseenOrderIds.size === 0) return
  const ids = Array.from(unseenOrderIds)
  for (const id of ids) seenOrderIds.add(id)
  unseenOrderIds.clear()
  persistSeenOrderIds()
  void persistRemoteSeenOrderIds(ids)
  if (filter === 'unread') selectedId = null
  noticeText = 'Đã đánh dấu tất cả đơn đang hiển thị là đã xem trên tài khoản admin.'
  noticeState = 'ok'
  renderNotificationState()
  if (panelOpen) renderPanel()
}

function renderTrigger() {
  if (!trigger) return
  const newCount = countStatus('new')
  const unseenCount = unseenOrderIds.size
  const badge = trigger.querySelector<HTMLElement>('b')
  if (badge) {
    const nextBadgeText = String(unseenCount > 0 ? unseenCount : newCount)
    const shouldHideBadge = unseenCount === 0 && newCount === 0
    if (badge.textContent !== nextBadgeText) badge.textContent = nextBadgeText
    if (badge.hidden !== shouldHideBadge) badge.hidden = shouldHideBadge
  }
  trigger.classList.toggle('hasNew', newCount > 0)
  trigger.classList.toggle('hasUnseen', unseenCount > 0)
  trigger.title = unseenCount > 0
    ? `${unseenCount} đơn vừa tới chưa xem · ${newCount} đơn mới đang chờ xử lý`
    : newCount > 0
      ? `${newCount} đơn mới đang chờ xử lý`
      : 'Mở quản lý đơn hàng'
}

function renderNotificationState() {
  renderTrigger()
  document.title = unseenOrderIds.size > 0
    ? `(${unseenOrderIds.size}) Đơn mới · Sky's house`
    : baseDocumentTitle
}

function ensureAudioContext() {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioContext) audioContext = new AudioContextCtor()
  return audioContext
}

function playOrderChime(force = false) {
  if (!soundEnabled && !force) return
  const context = ensureAudioContext()
  if (!context) return

  void context.resume().then(() => {
    const now = context.currentTime
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
    gain.connect(context.destination)

    const first = context.createOscillator()
    first.type = 'sine'
    first.frequency.setValueAtTime(880, now)
    first.connect(gain)
    first.start(now)
    first.stop(now + 0.16)

    const second = context.createOscillator()
    second.type = 'sine'
    second.frequency.setValueAtTime(1175, now + 0.16)
    second.connect(gain)
    second.start(now + 0.16)
    second.stop(now + 0.42)
  }).catch(() => { /* browser may block audio until a user gesture */ })
}

function toggleSound() {
  soundEnabled = !soundEnabled
  persistSoundPreference()
  if (soundEnabled) playOrderChime()
  if (panelOpen) renderPanel()
}

function showSystemNotification(input: { title: string; body: string; tag: string; orderId?: number }) {
  if (!browserNotificationsSupported() || Notification.permission !== 'granted') return false
  try {
    const notification = new Notification(input.title, {
      body: input.body,
      tag: input.tag,
    })
    notification.onclick = () => {
      window.focus()
      if (input.orderId != null) void openPanel(input.orderId)
      notification.close()
    }
    return true
  } catch {
    return false
  }
}

function showBackgroundOrderNotification(order: OrderRow, arrivalCount = 1) {
  if (!backgroundNotificationsEnabled || !document.hidden) return false
  return showSystemNotification({
    title: arrivalCount > 1
      ? `${arrivalCount} đơn mới vừa tới · Sky's house`
      : `Đơn mới #${order.id} · ${order.customer_name}`,
    body: arrivalCount > 1
      ? `Mới nhất #${order.id} · ${order.customer_name} · ${itemCount(order)} món`
      : `${itemCount(order)} món · ${totalLabel(order)}`,
    tag: `skyhouse-order-${order.id}`,
    orderId: order.id,
  })
}

function hideOrderToast() {
  if (toastTimer != null) {
    window.clearTimeout(toastTimer)
    toastTimer = null
  }
  toastRoot?.classList.remove('show')
}

function ensureOrderToast() {
  if (toastRoot) return toastRoot
  toastRoot = document.createElement('aside')
  toastRoot.className = 'adminOrderToast'
  toastRoot.dataset.adminOrderToast = 'true'
  toastRoot.setAttribute('role', 'status')
  toastRoot.setAttribute('aria-live', 'polite')
  document.body.appendChild(toastRoot)

  toastRoot.addEventListener('click', event => {
    const target = event.target as Element | null
    if (!target) return
    const open = target.closest<HTMLElement>('[data-order-toast-open]')
    if (open) {
      const id = Number(open.dataset.orderToastOpen)
      hideOrderToast()
      void openPanel(Number.isSafeInteger(id) ? id : undefined)
      return
    }
    if (target.closest('[data-order-toast-close]')) hideOrderToast()
  })
  return toastRoot
}

function showOrderToast(order: OrderRow, arrivalCount = 1) {
  const toast = ensureOrderToast()
  toast.classList.remove('diagnostic')
  toast.innerHTML = `
    <button type="button" class="adminOrderToastClose" data-order-toast-close aria-label="Đóng thông báo">×</button>
    <div class="adminOrderToastIcon">✦</div>
    <div class="adminOrderToastCopy">
      <small>${arrivalCount > 1 ? `${arrivalCount} ĐƠN MỚI VỪA TỚI` : 'ĐƠN MỚI VỪA TỚI'}</small>
      <strong>${arrivalCount > 1 ? 'Mới nhất ' : ''}#${order.id} · ${escapeHtml(order.customer_name)}</strong>
      <span>${itemCount(order)} món · ${escapeHtml(totalLabel(order))}</span>
    </div>
    <button type="button" class="adminOrderToastOpen" data-order-toast-open="${order.id}">${arrivalCount > 1 ? 'Xem đơn mới nhất' : 'Xem đơn'}</button>
  `
  requestAnimationFrame(() => toast.classList.add('show'))
  playOrderChime()
  if (toastTimer != null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(hideOrderToast, 12000)
}

function orderUpdateAlertKey(order: OrderRow) {
  return `${order.id}:${order.updated_at || ''}`
}

function rememberOrderUpdateAlert(order: OrderRow) {
  const key = orderUpdateAlertKey(order)
  if (recentlyAlertedOrderUpdates.has(key)) return false
  recentlyAlertedOrderUpdates.add(key)
  if (recentlyAlertedOrderUpdates.size > 200) {
    recentlyAlertedOrderUpdates = new Set(Array.from(recentlyAlertedOrderUpdates).slice(-120))
  }
  return true
}

function showBackgroundOrderUpdateNotification(order: OrderRow) {
  if (!backgroundNotificationsEnabled || !document.hidden) return false
  return showSystemNotification({
    title: `Khách bổ sung đơn #${order.id} · ${order.customer_name}`,
    body: `${itemCount(order)} món hiện có · ${totalLabel(order)}`,
    tag: `skyhouse-order-update-${order.id}-${order.updated_at}`,
    orderId: order.id,
  })
}

function showOrderUpdateToast(order: OrderRow) {
  const toast = ensureOrderToast()
  toast.classList.remove('diagnostic')
  toast.innerHTML = `
    <button type="button" class="adminOrderToastClose" data-order-toast-close aria-label="Đóng thông báo">×</button>
    <div class="adminOrderToastIcon">＋</div>
    <div class="adminOrderToastCopy">
      <small>KHÁCH VỪA BỔ SUNG ĐƠN</small>
      <strong>#${order.id} · ${escapeHtml(order.customer_name)}</strong>
      <span>${itemCount(order)} món hiện có · ${escapeHtml(totalLabel(order))}</span>
    </div>
    <button type="button" class="adminOrderToastOpen" data-order-toast-open="${order.id}">Xem đơn</button>
  `
  requestAnimationFrame(() => toast.classList.add('show'))
  playOrderChime()
  if (toastTimer != null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(hideOrderToast, 12000)
}

function announcePendingOrderUpdate(order: OrderRow) {
  if (!rememberOrderUpdateAlert(order)) {
    recordNotificationTrace(`Dedupe chặn cảnh báo bổ sung lặp cho đơn #${order.id}.`, 'ok')
    return
  }

  recordNotificationTrace(`Realtime phát hiện khách bổ sung món vào đơn #${order.id}.`, 'ok')

  if (panelOpen) {
    noticeText = `Khách vừa bổ sung món vào đơn #${order.id}.`
    noticeState = 'ok'
    playOrderChime()
    renderPanel()
    return
  }

  if (showBackgroundOrderUpdateNotification(order)) {
    playOrderChime()
    recordNotificationTrace('Đã gửi browser system notification cho đơn vừa được bổ sung.', 'info')
    return
  }

  showOrderUpdateToast(order)
  recordNotificationTrace('Đã hiển thị in-page toast cho đơn vừa được bổ sung.', 'info')
}

function announceOrderArrivals(discovered: OrderRow[], source: 'realtime' | 'catch-up' = 'realtime') {
  const candidates = discovered.filter(order => {
    const id = Number(order.id)
    return Number.isSafeInteger(id) && id > 0 && !wasOrderRecentlyNotified(id)
  })
  const suppressed = discovered.length - candidates.length
  if (suppressed > 0) {
    recordNotificationTrace(`Dedupe chặn ${suppressed} cảnh báo lặp từ ${source}.`, 'ok')
  }
  if (!candidates.length) return

  const newest = candidates[0]
  markOrdersNotified(candidates.map(order => Number(order.id)))
  recordNotificationTrace(
    `${source === 'realtime' ? 'Realtime' : 'Catch-up'} phát hiện ${candidates.length} đơn mới; mới nhất #${newest.id}.`,
    'ok',
  )

  if (panelOpen) {
    noticeText = candidates.length === 1
      ? `Có đơn mới #${newest.id} vừa tới.`
      : `Có ${candidates.length} đơn mới vừa tới. Đơn mới nhất #${newest.id}.`
    noticeState = 'ok'
    playOrderChime()
    recordNotificationTrace('Đã cảnh báo trong panel admin.', 'info')
    renderPanel()
    return
  }

  if (showBackgroundOrderNotification(newest, candidates.length)) {
    playOrderChime()
    recordNotificationTrace('Đã gửi browser system notification cho đơn mới.', 'info')
    return
  }

  showOrderToast(newest, candidates.length)
  recordNotificationTrace('Đã hiển thị in-page toast cho đơn mới.', 'info')
}

function testNotification() {
  const toast = ensureOrderToast()
  toast.classList.add('diagnostic')
  toast.innerHTML = `
    <button type="button" class="adminOrderToastClose" data-order-toast-close aria-label="Đóng thông báo">×</button>
    <div class="adminOrderToastIcon">✓</div>
    <div class="adminOrderToastCopy">
      <small>KIỂM TRA THÔNG BÁO</small>
      <strong>Cảnh báo cục bộ đang hoạt động</strong>
      <span>Không tạo đơn và không ghi dữ liệu đơn hàng.</span>
    </div>
  `
  requestAnimationFrame(() => toast.classList.add('show'))
  playOrderChime(true)
  if (toastTimer != null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(hideOrderToast, 8000)
  const systemShown = backgroundNotificationsEnabled
    ? showSystemNotification({
        title: "Sky's house · Kiểm tra thông báo",
        body: 'Thông báo hệ thống đang hoạt động. Không có đơn test nào được tạo.',
        tag: 'skyhouse-notification-test',
      })
    : false
  recordNotificationTrace(
    systemShown ? 'Self-test: toast + audio + system notification.' : 'Self-test: toast + audio cục bộ.',
    'ok',
  )
  noticeText = systemShown
    ? 'Đã chạy thử toast + âm báo + thông báo hệ thống. Không tạo đơn test.'
    : 'Đã chạy thử toast + âm báo cục bộ. Không tạo đơn test.'
  noticeState = 'ok'
  if (panelOpen) renderPanel()
}

function filteredOrders() {
  if (filter === 'all') return orders
  if (filter === 'unread') {
    return orders.filter(order => unseenOrderIds.has(Number(order.id)) || Number(order.id) === selectedId)
  }
  return orders.filter(order => order.status === filter)
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

  return shown.map(order => {
    const unread = unseenOrderIds.has(Number(order.id))
    return `
      <button type="button" class="adminOrderRow ${selectedId === order.id ? 'active' : ''} ${unread ? 'unread' : ''}" data-order-id="${order.id}">
        <div class="adminOrderRowTop">
          <strong>#${order.id} · ${escapeHtml(order.customer_name)}</strong>
          <div class="adminOrderRowBadges">${unread ? '<span class="adminOrderUnread">Chưa xem</span>' : ''}${statusBadge(order.status)}</div>
        </div>
        <div class="adminOrderRowMeta"><span>${escapeHtml(order.customer_phone)}</span><span>${escapeHtml(formatDate(order.created_at))}</span></div>
        <div class="adminOrderRowBottom"><span>${itemCount(order)} món</span><b>${escapeHtml(totalLabel(order))}</b></div>
      </button>
    `
  }).join('')
}

function orderDetailHtml() {
  const order = orders.find(item => item.id === selectedId)
  if (!order) return '<div class="adminOrdersDetailEmpty">Chọn một đơn bên trái để xem chi tiết.</div>'

  const phone = phoneDigits(order.customer_phone)
  const items = Array.isArray(order.items) ? order.items : []
  const itemRows = items.map((item, index) => {
    const imageUrl = String(item.image_url || '').trim()
    const productImage = imageUrl
      ? `<img class="adminOrderItemImage" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name || 'Sản phẩm')}" loading="lazy" decoding="async" />`
      : '<div class="adminOrderItemImage adminOrderItemImageFallback" aria-hidden="true">Ảnh</div>'

    return `
      <div class="adminOrderItem">
        <div class="adminOrderItemMain">
          ${productImage}
          <div class="adminOrderItemInfo">
            <small>Món ${index + 1}</small>
            <strong>${escapeHtml(item.name || 'Sản phẩm')}</strong>
            ${item.category ? `<span>${escapeHtml(item.category)}</span>` : ''}
          </div>
        </div>
        <div class="adminOrderItemPrice">
          <b>×${Number(item.qty) || 0}</b>
          <span>${escapeHtml(item.price_text || (item.price == null ? 'Liên hệ giá' : money(Number(item.price))))}</span>
        </div>
      </div>
    `
  }).join('')

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
      ${order.inventory_state === 'legacy' || order.items.some(item => !item.product_id) ? '<p class="wide cartStockWarning">Đơn cũ chưa có hạch toán tồn tự động. Không đoán sản phẩm để trừ/hoàn tồn; kiểm kê và điều chỉnh tồn thủ công nếu cần.</p>' : ''}
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

function activePanelFieldKey(element: Element | null): AdminPanelFieldKey | null {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return null
  if (element.matches('[data-order-shipping-fee]')) return 'shipping_fee'
  if (element.matches('[data-order-final-total]')) return 'final_total'
  if (element.matches('[data-order-admin-note]')) return 'admin_note'
  return null
}

function captureAdminPanelViewState(): AdminPanelViewState | null {
  if (!panelRoot || !panelOpen) return null

  const activeRow = panelRoot.querySelector<HTMLElement>('.adminOrderRow.active[data-order-id]')
  const renderedOrderId = activeRow ? Number(activeRow.dataset.orderId) : null
  const detail = panelRoot.querySelector<HTMLElement>('.adminOrdersDetail')
  const list = panelRoot.querySelector<HTMLElement>('.adminOrdersList')
  const filters = panelRoot.querySelector<HTMLElement>('.adminOrderFilterScroller')
  const trace = panelRoot.querySelector<HTMLDetailsElement>('.adminOrdersTrace')
  const traceList = panelRoot.querySelector<HTMLElement>('.adminOrdersTraceList')

  const activeElement = document.activeElement
  const activeFieldKey = panelRoot.contains(activeElement) ? activePanelFieldKey(activeElement) : null
  const activeFieldElement = activeFieldKey && (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)
    ? activeElement
    : null

  const detailBottomGap = detail
    ? Math.max(0, detail.scrollHeight - detail.clientHeight - detail.scrollTop)
    : 0

  return {
    renderedOrderId: Number.isFinite(renderedOrderId) ? renderedOrderId : null,
    detailScrollTop: detail?.scrollTop ?? 0,
    detailBottomGap,
    detailWasAtBottom: Boolean(detail && detailBottomGap <= 24),
    listScrollTop: list?.scrollTop ?? 0,
    filterScrollLeft: filters?.scrollLeft ?? 0,
    traceOpen: Boolean(trace?.open),
    traceScrollTop: traceList?.scrollTop ?? 0,
    activeField: activeFieldKey && activeFieldElement
      ? {
          key: activeFieldKey,
          value: activeFieldElement.value,
          selectionStart: activeFieldElement.selectionStart,
          selectionEnd: activeFieldElement.selectionEnd,
        }
      : null,
  }
}

function panelFieldSelector(key: AdminPanelFieldKey) {
  if (key === 'shipping_fee') return '[data-order-shipping-fee]'
  if (key === 'final_total') return '[data-order-final-total]'
  return '[data-order-admin-note]'
}

function restoreAdminPanelScrollState(state: AdminPanelViewState, renderEpoch: number) {
  if (!panelRoot || renderEpoch !== panelRenderEpoch) return

  const trace = panelRoot.querySelector<HTMLDetailsElement>('.adminOrdersTrace')
  const traceList = panelRoot.querySelector<HTMLElement>('.adminOrdersTraceList')
  if (trace) trace.open = state.traceOpen
  if (traceList) traceList.scrollTop = state.traceScrollTop

  const filters = panelRoot.querySelector<HTMLElement>('.adminOrderFilterScroller')
  const list = panelRoot.querySelector<HTMLElement>('.adminOrdersList')
  if (filters) filters.scrollLeft = state.filterScrollLeft
  if (list) list.scrollTop = state.listScrollTop

  if (state.renderedOrderId !== selectedId) return

  const detail = panelRoot.querySelector<HTMLElement>('.adminOrdersDetail')
  if (!detail) return

  detail.scrollTop = state.detailWasAtBottom
    ? Math.max(0, detail.scrollHeight - detail.clientHeight - state.detailBottomGap)
    : state.detailScrollTop
}

function restoreAdminPanelViewState(state: AdminPanelViewState | null, renderEpoch: number) {
  if (!panelRoot || !state || renderEpoch !== panelRenderEpoch) return

  restoreAdminPanelScrollState(state, renderEpoch)

  if (state.renderedOrderId === selectedId && state.activeField) {
    const field = panelRoot.querySelector<HTMLInputElement | HTMLTextAreaElement>(panelFieldSelector(state.activeField.key))
    if (field) {
      field.value = state.activeField.value
      try {
        field.focus({ preventScroll: true })
        if (state.activeField.selectionStart != null && state.activeField.selectionEnd != null) {
          field.setSelectionRange(state.activeField.selectionStart, state.activeField.selectionEnd)
        }
      } catch {
        // Number inputs do not support text selection in every browser.
      }
      restoreAdminPanelScrollState(state, renderEpoch)
    }
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      restoreAdminPanelScrollState(state, renderEpoch)
    })
  })
}

function updatePanelRuntimeChrome() {
  if (!panelRoot || !panelOpen) return

  const health = panelRoot.querySelector<HTMLElement>('.adminOrdersHealth')
  if (health) {
    const realtime = realtimeMeta()
    health.innerHTML = `
      <span class="${realtime.tone}"><i></i>${escapeHtml(realtime.label)}</span>
      <small>Đồng bộ gần nhất: ${escapeHtml(formatClockTime(lastSyncAt))}</small>
    `
  }

  const trace = panelRoot.querySelector<HTMLDetailsElement>('.adminOrdersTrace')
  const traceCount = trace?.querySelector<HTMLElement>('summary b')
  if (traceCount) traceCount.textContent = String(notificationTrace.length)

  if (trace?.open) {
    const traceList = trace.querySelector<HTMLElement>('.adminOrdersTraceList')
    if (traceList) {
      const previousScrollTop = traceList.scrollTop
      traceList.innerHTML = notificationTraceHtml()
      traceList.scrollTop = previousScrollTop
    }
  }
}

function orderDataSignature(value: OrderRow[]) {
  return JSON.stringify(value)
}

function unseenDataSignature(value: Set<number>) {
  return Array.from(value).sort((a, b) => a - b).join(',')
}

function renderPanel() {
  if (!panelRoot) return
  const viewState = captureAdminPanelViewState()
  const renderEpoch = ++panelRenderEpoch
  ensureSelection()
  const realtime = realtimeMeta()
  const browserNotification = backgroundNotificationMeta()
  const counts: Record<OrderFilter, number> = {
    all: orders.length,
    unread: unseenOrderIds.size,
    new: countStatus('new'),
    confirmed: countStatus('confirmed'),
    shipping: countStatus('shipping'),
    completed: countStatus('completed'),
    cancelled: countStatus('cancelled'),
  }
  const filterButtons: Array<[OrderFilter, string]> = [
    ['all', 'Tất cả'], ['unread', 'Chưa xem'], ['new', 'Đơn mới'], ['confirmed', 'Đã xác nhận'], ['shipping', 'Đang giao'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy'],
  ]
  const filters = filterButtons.map(([value, label]) => `
    <button type="button" data-order-filter="${value}" class="${filter === value ? 'active' : ''}"><span>${escapeHtml(label)}</span><b>${counts[value]}</b></button>
  `).join('')

  panelRoot.innerHTML = `
    <button type="button" class="adminOrdersBackdrop" data-orders-close aria-label="Đóng quản lý đơn"></button>
    <section class="adminOrdersPanel" role="dialog" aria-modal="true" aria-label="Quản lý đơn hàng">
      <header class="adminOrdersHeader">
        <div>
          <small>SKY'S HOUSE · ADMIN</small>
          <h1 class="serif">Đơn hàng.</h1>
          <p>Theo dõi từ lúc khách gửi giỏ đến khi giao xong.</p>
          <div class="adminOrdersHealth">
            <span class="${realtime.tone}"><i></i>${escapeHtml(realtime.label)}</span>
            <small>Đồng bộ gần nhất: ${escapeHtml(formatClockTime(lastSyncAt))}</small>
          </div>
        </div>
        <div class="adminOrdersHeaderActions"><button type="button" data-orders-refresh>↻ Làm mới</button><button type="button" class="adminOrdersTestNotification" data-orders-test-notification>✦ Thử cảnh báo</button><button type="button" class="adminOrdersBrowserToggle ${browserNotification.tone}" data-orders-browser-notifications ${browserNotification.disabled ? 'disabled' : ''} title="Hoạt động khi tab admin vẫn đang mở">${escapeHtml(browserNotification.label)}</button><button type="button" class="adminOrdersSoundToggle ${soundEnabled ? 'on' : ''}" data-orders-sound-toggle aria-pressed="${soundEnabled}">${soundEnabled ? '🔔 Âm báo: Bật' : '🔕 Âm báo: Tắt'}</button><button type="button" data-orders-close aria-label="Đóng">×</button></div>
      </header>
      <nav class="adminOrderFilters">
        <div class="adminOrderFilterScroller">${filters}</div>
        <button type="button" class="adminOrderMarkAllSeen" data-orders-mark-all-seen ${unseenOrderIds.size === 0 ? 'disabled' : ''}>✓ Đã xem hết</button>
      </nav>
      ${noticeText ? `<div class="adminOrdersNotice ${noticeState}">${escapeHtml(noticeText)}</div>` : ''}
      <details class="adminOrdersTrace">
        <summary><span>Nhật ký cảnh báo</span><b>${notificationTrace.length}</b></summary>
        <div class="adminOrdersTraceToolbar">
          <p>Chỉ lưu cục bộ trên thiết bị; không ghi tên, SĐT hay ghi chú khách.</p>
          <div><button type="button" data-orders-copy-diagnostics>Sao chép chẩn đoán</button><button type="button" data-orders-clear-diagnostics>Xóa nhật ký</button></div>
        </div>
        <div class="adminOrdersTraceList">${notificationTraceHtml()}</div>
      </details>
      <div class="adminOrdersWorkspace">
        <aside class="adminOrdersList">${orderListHtml()}</aside>
        <article class="adminOrdersDetail">${orderDetailHtml()}</article>
      </div>
    </section>
  `

  restoreAdminPanelViewState(viewState, renderEpoch)
}

function closePanel() {
  panelOpen = false
  panelRoot?.classList.remove('open')
  document.documentElement.classList.remove('adminOrdersOpen')
}

async function openPanel(preferredId?: number) {
  ensurePanel()
  if (preferredId != null) {
    filter = 'all'
    selectedId = preferredId
  }
  panelOpen = true
  panelRoot?.classList.add('open')
  document.documentElement.classList.add('adminOrdersOpen')
  renderPanel()
  await loadOrders(false)
  if (preferredId != null && orders.some(order => order.id === preferredId)) selectedId = preferredId
  if (selectedId != null) markOrderSeen(selectedId)
  renderPanel()
}

async function loadOrders(silent = true) {
  if (!supabase || loading) return
  const knownIds = new Set(orders.map(order => Number(order.id)))
  const previousOrdersSignature = orderDataSignature(orders)
  const previousUnseenSignature = unseenDataSignature(unseenOrderIds)
  const previousNoticeText = noticeText
  const previousNoticeState = noticeState
  const wasLoaded = loadedOnce
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

  const columns = 'id,customer_name,customer_phone,customer_note,items,subtotal_known,has_contact_price,shipping_fee,final_total,admin_note,status,source,created_at,updated_at'
  let { data, error } = await supabase
    .from('orders')
    .select(columns + ',inventory_state')
    .order('created_at', { ascending: false })
    .limit(300)
    .returns<OrderRow[]>()
  if (error?.code === '42703' && /inventory_state/.test(error.message)) {
    const fallback = await supabase.from('orders').select(columns).order('created_at', { ascending: false }).limit(300).returns<OrderRow[]>()
    data = fallback.data; error = fallback.error
  }

  if (error) {
    loading = false
    recordNotificationTrace(`Tải đơn thất bại: ${error.message}`, 'error')
    noticeText = `Không tải được đơn hàng: ${error.message}`
    noticeState = 'error'
    if (panelOpen) renderPanel()
    return
  }

  const nextOrders = (data ?? []) as OrderRow[]
  const newlyDiscovered = wasLoaded
    ? nextOrders.filter(order => !knownIds.has(Number(order.id)))
    : []

  const nextOrdersSignature = orderDataSignature(nextOrders)
  orders = nextOrders
  await syncRemoteSeenState(sessionData.session.user.id)
  lastSyncAt = new Date()
  loading = false
  loadedOnce = true
  if (noticeState === 'error' && noticeText.startsWith('Không tải được đơn hàng:')) {
    noticeText = ''
    noticeState = ''
    recordNotificationTrace('Tải đơn thành công sau lỗi mạng; đã xóa cảnh báo lỗi cũ.', 'ok')
  }
  rebuildUnseenOrders()
  ensureSelection()
  renderNotificationState()
  startRealtime()

  if (newlyDiscovered.length > 0) announceOrderArrivals(newlyDiscovered, 'catch-up')

  if (panelOpen) {
    const ordersChanged = previousOrdersSignature !== nextOrdersSignature
    const unseenChanged = previousUnseenSignature !== unseenDataSignature(unseenOrderIds)
    const noticeChanged = previousNoticeText !== noticeText || previousNoticeState !== noticeState
    const shouldRebuildPanel = !silent || ordersChanged || unseenChanged || noticeChanged

    if (shouldRebuildPanel) renderPanel()
    else updatePanelRuntimeChrome()
  }
}

async function updateStatus(id: number, status: OrderStatus) {
  if (!supabase || !statusOrder.includes(status)) return
  noticeText = 'Đang cập nhật trạng thái…'
  noticeState = ''
  renderPanel()

  const result = await supabase.rpc('update_order_status_with_inventory', { p_order_id: id, p_status: status })
  const { error } = result.error?.code === 'PGRST202'
    ? await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    : result
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
  renderNotificationState()
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

function handleRealtimeInsert(raw: Record<string, unknown>) {
  const id = Number(raw.id)
  if (!Number.isSafeInteger(id) || id <= 0 || orders.some(order => order.id === id)) return

  const order = raw as unknown as OrderRow
  orders = [order, ...orders].slice(0, 300)
  loadedOnce = true
  if (!seenOrderIds.has(id)) unseenOrderIds.add(id)

  renderNotificationState()
  announceOrderArrivals([order], 'realtime')
}

function handleRealtimeUpdate(raw: Record<string, unknown>) {
  const id = Number(raw.id)
  if (!Number.isSafeInteger(id) || id <= 0) return

  const index = orders.findIndex(order => order.id === id)
  if (index < 0) {
    void loadOrders(true)
    return
  }

  const previous = orders[index]
  const next = raw as unknown as OrderRow
  const itemsChanged = JSON.stringify(previous.items || []) !== JSON.stringify(next.items || [])

  orders = orders.map(order => order.id === id ? next : order)
  lastSyncAt = new Date()

  if (itemsChanged && previous.status === 'new' && next.status === 'new') {
    // Customer append is new work even if this order was already read before.
    seenOrderIds.delete(id)
    unseenOrderIds.add(id)
    persistSeenOrderIds()
    renderNotificationState()
    announcePendingOrderUpdate(next)
  }
}

function startRealtime() {
  if (!supabase || realtimeChannel) return
  setRealtimeState(navigator.onLine ? 'connecting' : 'offline')
  realtimeChannel = supabase
    .channel('skyhouse-admin-order-notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
      handleRealtimeInsert(payload.new as Record<string, unknown>)
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
      handleRealtimeUpdate(payload.new as Record<string, unknown>)
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_order_reads' }, payload => {
      handleRealtimeSeenInsert(payload.new as Record<string, unknown>)
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') {
        recordNotificationTrace('Supabase Realtime subscribed.', 'ok')
        setRealtimeState('connected')
        void loadOrders(true)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        recordNotificationTrace(`Supabase Realtime status: ${status}; chuyển sang catch-up.`, 'warn')
        setRealtimeState(navigator.onLine ? 'degraded' : 'offline')
        const failedChannel = realtimeChannel
        realtimeChannel = null
        if (failedChannel) void supabase.removeChannel(failedChannel)
        window.setTimeout(() => void loadOrders(true), 1200)
      }
    })
}

function stopRealtime() {
  if (!supabase || !realtimeChannel) return
  void supabase.removeChannel(realtimeChannel)
  realtimeChannel = null
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
      recordNotificationTrace('Admin yêu cầu làm mới đơn thủ công.', 'info')
      void loadOrders(false)
      return
    }
    if (target.closest('[data-orders-copy-diagnostics]')) {
      void copyNotificationDiagnostics()
      return
    }
    if (target.closest('[data-orders-clear-diagnostics]')) {
      clearNotificationTrace()
      return
    }
    if (target.closest('[data-orders-test-notification]')) {
      testNotification()
      return
    }
    if (target.closest('[data-orders-browser-notifications]')) {
      void toggleBackgroundNotifications()
      return
    }
    if (target.closest('[data-orders-sound-toggle]')) {
      toggleSound()
      return
    }
    if (target.closest('[data-orders-mark-all-seen]')) {
      markAllOrdersSeen()
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
      if (next === 'all' || next === 'unread' || statusOrder.includes(next as OrderStatus)) {
        filter = next
        ensureSelection()
        renderPanel()
      }
      return
    }
    const row = target.closest<HTMLElement>('[data-order-id]')
    if (row) {
      selectedId = Number(row.dataset.orderId)
      markOrderSeen(selectedId)
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
    const triggerChanged = trigger !== existing
    trigger = existing
    if (triggerChanged) renderNotificationState()
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

  renderNotificationState()
  if (!loadedOnce) void loadOrders(true)
}

export function installAdminOrders() {
  if (!location.pathname.startsWith('/admin') || !supabase) return

  const observer = new MutationObserver(ensureTrigger)
  observer.observe(document.body, { childList: true, subtree: true })
  ensureTrigger()

  const refreshAfterResume = () => {
    if (document.hidden) return
    if (!navigator.onLine) {
      setRealtimeState('offline')
      return
    }
    if (realtimeState === 'offline') setRealtimeState('connecting')
    void loadOrders(true)
  }
  const handleOffline = () => {
    recordNotificationTrace('Browser phát hiện mất mạng.', 'error')
    setRealtimeState('offline')
  }
  document.addEventListener('visibilitychange', refreshAfterResume)
  window.addEventListener('online', () => {
    recordNotificationTrace('Browser online trở lại; chạy catch-up.', 'ok')
    refreshAfterResume()
  })
  window.addEventListener('offline', handleOffline)
  window.addEventListener('storage', event => {
    if (event.key === RECENT_NOTIFIED_KEY) refreshRecentNotifiedOrders()
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      window.setTimeout(() => {
        ensureTrigger()
        void loadOrders(true)
      }, 80)
    } else {
      stopRealtime()
      currentAdminUserId = null
      orders = []
      unseenOrderIds.clear()
      loadedOnce = false
      lastSyncAt = null
      realtimeState = navigator.onLine ? 'connecting' : 'offline'
      closePanel()
      hideOrderToast()
      trigger?.remove()
      trigger = null
      document.title = baseDocumentTitle
    }
  })

  window.setInterval(() => {
    if (document.hidden) return
    void loadOrders(true)
  }, 60000)
}
