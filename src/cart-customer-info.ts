import { supabase } from './lib/supabase'

type DeliveryMethod = 'delivery' | 'pickup'

type CustomerInfo = {
  name: string
  phone: string
  deliveryMethod: DeliveryMethod
  address: string
  note: string
}

type OrderItemSnapshot = {
  product_id: number | null
  name: string
  category: string
  qty: number
  price: number | null
  price_text: string
  unit: string
  image_url: string
}

type OrderSnapshot = {
  items: OrderItemSnapshot[]
  subtotal_known: number
  has_contact_price: boolean
}

const CUSTOMER_INFO_KEY = 'skyhouse_customer_info_v1'
const ORDER_MERGE_TOKEN_KEY = 'skyhouse_order_merge_token_v1'
const emptyInfo: CustomerInfo = { name: '', phone: '', deliveryMethod: 'delivery', address: '', note: '' }
let lastSavedFingerprint = ''
let lastSavedAt = 0
let lastSavedOrderId: number | null = null
let lastSavedMerged = false
let volatileMergeToken = ''

function loadInfo(): CustomerInfo {
  try {
    const raw = localStorage.getItem(CUSTOMER_INFO_KEY)
    if (!raw) return { ...emptyInfo }
    const parsed = JSON.parse(raw) as Partial<CustomerInfo>
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      deliveryMethod: parsed.deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
      address: typeof parsed.address === 'string' ? parsed.address : '',
      note: typeof parsed.note === 'string' ? parsed.note : '',
    }
  } catch {
    return { ...emptyInfo }
  }
}

function saveInfo(info: CustomerInfo) {
  try { localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(info)) } catch { /* ignore storage errors */ }
}

function createMergeToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function orderMergeToken() {
  try {
    const stored = localStorage.getItem(ORDER_MERGE_TOKEN_KEY)
    if (stored && /^[a-f0-9]{48}$/i.test(stored)) return stored

    const token = createMergeToken()
    localStorage.setItem(ORDER_MERGE_TOKEN_KEY, token)
    return token
  } catch {
    if (!volatileMergeToken) volatileMergeToken = createMergeToken()
    return volatileMergeToken
  }
}

function deliveryLabel(info: CustomerInfo) {
  return info.deliveryMethod === 'pickup' ? 'Tự đến lấy' : 'Giao tận nơi'
}

function adminNote(info: CustomerInfo) {
  const parts = [deliveryLabel(info)]
  if (info.deliveryMethod === 'delivery' && info.address.trim()) parts.push(`Địa chỉ: ${info.address.trim()}`)
  if (info.note.trim()) parts.push(`Ghi chú: ${info.note.trim()}`)
  return parts.join(' · ')
}

function readInfo(drawer?: Element | null): CustomerInfo {
  const stored = loadInfo()
  if (!drawer) return stored
  const name = drawer.querySelector<HTMLInputElement>('[data-customer-field="name"]')?.value ?? stored.name
  const phone = drawer.querySelector<HTMLInputElement>('[data-customer-field="phone"]')?.value ?? stored.phone
  const deliveryMethod = (drawer.querySelector<HTMLSelectElement>('[data-customer-field="deliveryMethod"]')?.value === 'pickup' ? 'pickup' : 'delivery') as DeliveryMethod
  const address = drawer.querySelector<HTMLInputElement>('[data-customer-field="address"]')?.value ?? stored.address
  const note = drawer.querySelector<HTMLTextAreaElement>('[data-customer-field="note"]')?.value ?? stored.note
  return { name, phone, deliveryMethod, address, note }
}

function getValidationNotice(drawer: Element | null) {
  return drawer?.querySelector<HTMLElement>('[data-customer-validation]') || null
}

function getSendNotice(drawer: Element | null) {
  return drawer?.querySelector<HTMLElement>('[data-customer-send-notice]') || null
}

function setSendNotice(drawer: Element | null, text: string, state: 'ok' | 'error' = 'ok') {
  const notice = getSendNotice(drawer)
  if (!notice) return
  notice.textContent = text
  notice.dataset.state = state
  notice.hidden = false
}

function validateInfo(drawer: Element | null, info: CustomerInfo) {
  const nameInput = drawer?.querySelector<HTMLInputElement>('[data-customer-field="name"]') || null
  const phoneInput = drawer?.querySelector<HTMLInputElement>('[data-customer-field="phone"]') || null
  const addressInput = drawer?.querySelector<HTMLInputElement>('[data-customer-field="address"]') || null
  const notice = getValidationNotice(drawer)

  const missingName = !info.name.trim()
  const missingPhone = !info.phone.trim()
  const missingAddress = info.deliveryMethod === 'delivery' && !info.address.trim()
  nameInput?.toggleAttribute('aria-invalid', missingName)
  phoneInput?.toggleAttribute('aria-invalid', missingPhone)
  addressInput?.toggleAttribute('aria-invalid', missingAddress)

  if (!missingName && !missingPhone && !missingAddress) {
    if (notice) {
      notice.textContent = ''
      notice.hidden = true
    }
    return true
  }

  if (notice) {
    const missing = [
      missingName ? 'tên khách' : '',
      missingPhone ? 'số điện thoại' : '',
      missingAddress ? 'địa chỉ nhận hàng' : '',
    ].filter(Boolean)
    notice.textContent = `Nhập ${missing.join(', ')} trước khi gửi đơn nhé.`
    notice.hidden = false
  }

  const firstMissing = missingName ? nameInput : missingPhone ? phoneInput : addressInput
  firstMissing?.focus({ preventScroll: true })
  firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return false
}

function parseMoney(text: string) {
  if (!text || /liên hệ/i.test(text)) return null
  const match = text.match(/([\d][\d.,\s]*)\s*đ/i)
  if (!match) return null
  const digits = match[1].replace(/\D/g, '')
  if (!digits) return null
  const value = Number(digits)
  return Number.isFinite(value) ? value : null
}

function parseUnit(text: string) {
  const match = text.match(/đ\s*\/\s*(.+)$/i)
  return match?.[1]?.trim() || ''
}

function collectOrderSnapshot(drawer: Element | null): OrderSnapshot {
  const items = Array.from(drawer?.querySelectorAll<HTMLElement>('.cartItem') || []).map(item => {
    const main = item.querySelector<HTMLElement>('.cartItemMain')
    const priceText = main?.querySelector<HTMLElement>(':scope > span')?.textContent?.trim() || 'Liên hệ giá'
    const qty = Number(main?.querySelector<HTMLElement>('.qtyControl b')?.textContent || '0') || 0
    const productId = Number(item.dataset.productId || '')
    return {
      product_id: Number.isSafeInteger(productId) && productId > 0 ? productId : null,
      name: main?.querySelector<HTMLElement>('strong')?.textContent?.trim() || 'Sản phẩm',
      category: main?.querySelector<HTMLElement>('small')?.textContent?.trim() || '',
      qty,
      price: parseMoney(priceText),
      price_text: priceText,
      unit: parseUnit(priceText),
      image_url: item.querySelector<HTMLImageElement>('img')?.src || '',
    }
  }).filter(item => item.qty > 0)

  const totalText = drawer?.querySelector<HTMLElement>('.cartTotal b')?.textContent?.trim() || ''
  return {
    items,
    subtotal_known: parseMoney(totalText) || 0,
    has_contact_price: items.some(item => item.price == null || /liên hệ/i.test(item.price_text)),
  }
}

async function saveOrder(drawer: Element | null, info: CustomerInfo) {
  if (!supabase) return { saved: false, reused: false, merged: false, orderId: null as number | null }
  const snapshot = collectOrderSnapshot(drawer)
  if (!snapshot.items.length) return { saved: false, reused: false, merged: false, orderId: null as number | null }

  for (const row of drawer?.querySelectorAll<HTMLElement>('.cartItem') ?? []) {
    const rawStock = row.dataset.stockQuantity
    const qty = Number(row.querySelector('.qtyControl b')?.textContent ?? 0)
    if (row.dataset.stockAvailable === 'false' || (rawStock != null && qty > Number(rawStock))) {
      throw new Error(`Không đủ tồn: ${row.querySelector('strong')?.textContent ?? 'sản phẩm'}. Giảm số lượng hoặc xóa món trước khi đặt hàng.`)
    }
  }

  const payload = {
    customer_name: info.name.trim(),
    customer_phone: info.phone.trim(),
    customer_note: adminNote(info),
    items: snapshot.items,
    subtotal_known: snapshot.subtotal_known,
    has_contact_price: snapshot.has_contact_price,
  }
  const fingerprint = JSON.stringify(payload)
  const now = Date.now()
  if (fingerprint === lastSavedFingerprint && now - lastSavedAt < 120000 && lastSavedOrderId) {
    // A confirmed order must not be reused by the local double-click cache.
    const tracked = await supabase.rpc('track_order', { p_order_id: lastSavedOrderId, p_phone: payload.customer_phone }).returns<{ status: string }[]>()
    if (tracked.error) throw new Error('Chưa kiểm tra được trạng thái đơn trước. Thử lại trước khi gửi thêm đơn nhé.')
    if (tracked.data?.[0]?.status === 'new') {
      return { saved: true, reused: true, merged: lastSavedMerged, orderId: lastSavedOrderId }
    }
  }

  const rpcArgs = {
    p_customer_name: payload.customer_name,
    p_customer_phone: payload.customer_phone,
    p_customer_note: payload.customer_note,
    p_items: payload.items,
    p_subtotal_known: payload.subtotal_known,
    p_has_contact_price: payload.has_contact_price,
  }
  const secureRpcArgs = {
    ...rpcArgs,
    p_merge_token: orderMergeToken(),
  }

  let orderId: number | null = null
  let merged = false

  const preferred = await supabase.rpc('submit_storefront_order', secureRpcArgs)
  if (!preferred.error) {
    const response = preferred.data as { order_id?: unknown; merged?: unknown } | null
    orderId = Number(response?.order_id)
    merged = response?.merged === true
  } else if ((preferred.error as { code?: string }).code === 'PGRST202') {
    // Backward-compatible rollout: keep checkout working until the DB migration is applied.
    const fallback = await supabase.rpc('create_storefront_order', rpcArgs)
    if (fallback.error) throw new Error(fallback.error.message)
    orderId = Number(fallback.data)
    merged = false
  } else {
    throw new Error(preferred.error.message)
  }

  if (!Number.isSafeInteger(orderId) || Number(orderId) <= 0) throw new Error('invalid_order_id')

  lastSavedFingerprint = fingerprint
  lastSavedAt = now
  lastSavedOrderId = Number(orderId)
  lastSavedMerged = merged
  return { saved: true, reused: false, merged, orderId: Number(orderId) }
}

function renderOrderConfirmation(drawer: Element | null, orderId: number, merged = false) {
  const customerBlock = drawer?.querySelector<HTMLElement>('[data-customer-info]')
  if (!customerBlock) return

  let confirmation = customerBlock.querySelector<HTMLElement>('[data-order-confirmation]')
  if (!confirmation) {
    confirmation = document.createElement('section')
    confirmation.className = 'cartOrderConfirmation'
    confirmation.dataset.orderConfirmation = 'true'
    customerBlock.appendChild(confirmation)
  }

  confirmation.innerHTML = `
    <div>
      <small>${merged ? 'Đã bổ sung vào đơn đang chờ' : 'Đã ghi nhận đơn'}</small>
      <strong>Đơn #${orderId}</strong>
      <span>${merged ? 'Sky’s house đã gộp các món mới vào đơn này vì đơn vẫn chưa được xác nhận.' : 'Sky’s house đã lưu đơn này. Ní có thể mở trang theo dõi ngay.'}</span>
    </div>
    <a href="/track?order=${encodeURIComponent(String(orderId))}">Theo dõi đơn này →</a>
  `
}

function enhanceDrawer(drawer: HTMLElement) {
  if (drawer.querySelector('[data-customer-info]')) return
  const footer = drawer.querySelector('.cartFooter')
  if (!footer) return

  const info = loadInfo()
  const block = document.createElement('section')
  block.className = 'cartCustomerInfo'
  block.dataset.customerInfo = 'true'
  block.innerHTML = `
    <div class="cartCustomerHead">
      <div>
        <small>Thông tin người đặt</small>
        <strong>Để Sky xác nhận đơn nhanh hơn.</strong>
      </div>
      <span>Tự lưu trên máy này</span>
    </div>
    <div class="cartCustomerGrid">
      <label>
        <span>Tên khách <em>*</em></span>
        <input data-customer-field="name" autocomplete="name" placeholder="Ví dụ: Thiên" required />
      </label>
      <label>
        <span>Số điện thoại <em>*</em></span>
        <input data-customer-field="phone" inputmode="tel" autocomplete="tel" placeholder="Số để Sky liên hệ" required />
      </label>
      <label>
        <span>Hình thức nhận <em>*</em></span>
        <select data-customer-field="deliveryMethod">
          <option value="delivery">Giao tận nơi</option>
          <option value="pickup">Tự đến lấy</option>
        </select>
      </label>
      <label class="cartCustomerAddress">
        <span>Địa chỉ nhận hàng <em>*</em></span>
        <input data-customer-field="address" autocomplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
      </label>
      <label class="cartCustomerNote">
        <span>Ghi chú</span>
        <textarea data-customer-field="note" rows="2" placeholder="Ví dụ: giao buổi chiều, gọi trước khi giao..."></textarea>
      </label>
    </div>
    <p class="cartCustomerValidation" data-customer-validation hidden></p>
    <p class="cartCustomerSendNotice" data-customer-send-notice hidden></p>
  `

  const customerSlot = drawer.querySelector('.cartCustomerSlot')
  if (customerSlot) customerSlot.appendChild(block)
  else footer.insertBefore(block, footer.firstChild)
  const placeOrderButton = footer.querySelector<HTMLButtonElement>('[data-place-order]')
  if (placeOrderButton) {
    placeOrderButton.textContent = 'Đặt hàng'
    placeOrderButton.title = 'Gửi trực tiếp đơn hàng và thông tin người đặt cho Sky'
  }

  const nameInput = block.querySelector<HTMLInputElement>('[data-customer-field="name"]')!
  const phoneInput = block.querySelector<HTMLInputElement>('[data-customer-field="phone"]')!
  const deliverySelect = block.querySelector<HTMLSelectElement>('[data-customer-field="deliveryMethod"]')!
  const addressLabel = block.querySelector<HTMLElement>('.cartCustomerAddress')!
  const addressInput = block.querySelector<HTMLInputElement>('[data-customer-field="address"]')!
  const noteInput = block.querySelector<HTMLTextAreaElement>('[data-customer-field="note"]')!
  nameInput.value = info.name
  phoneInput.value = info.phone
  deliverySelect.value = info.deliveryMethod
  addressInput.value = info.address
  noteInput.value = info.note

  const syncDeliveryUi = () => {
    const isPickup = deliverySelect.value === 'pickup'
    addressLabel.hidden = isPickup
    addressInput.required = !isPickup
    if (isPickup) addressInput.removeAttribute('aria-invalid')
  }

  const persist = () => {
    const current: CustomerInfo = {
      name: nameInput.value,
      phone: phoneInput.value,
      deliveryMethod: deliverySelect.value === 'pickup' ? 'pickup' : 'delivery',
      address: addressInput.value,
      note: noteInput.value,
    }
    saveInfo(current)
    syncDeliveryUi()
    if (nameInput.value.trim()) nameInput.removeAttribute('aria-invalid')
    if (phoneInput.value.trim()) phoneInput.removeAttribute('aria-invalid')
    if (current.deliveryMethod === 'pickup' || addressInput.value.trim()) addressInput.removeAttribute('aria-invalid')
    const notice = block.querySelector<HTMLElement>('[data-customer-validation]')
    const complete = nameInput.value.trim() && phoneInput.value.trim() && (current.deliveryMethod === 'pickup' || addressInput.value.trim())
    if (notice && complete) {
      notice.textContent = ''
      notice.hidden = true
    }
  }

  syncDeliveryUi()
  nameInput.addEventListener('input', persist)
  phoneInput.addEventListener('input', persist)
  deliverySelect.addEventListener('change', persist)
  addressInput.addEventListener('input', persist)
  noteInput.addEventListener('input', persist)
}

async function submitOrder(button: HTMLButtonElement) {
  const drawer = button.closest('.cartDrawer')
  const info = readInfo(drawer)
  saveInfo(info)
  if (!validateInfo(drawer, info)) return

  const originalText = button.textContent || 'Đặt hàng'
  button.disabled = true
  button.textContent = 'Đang gửi đơn…'
  setSendNotice(drawer, 'Đang gửi đơn vào hệ thống Sky’s house…', 'ok')

  try {
    const result = await saveOrder(drawer, info)
    if (!result.saved || !result.orderId) throw new Error('order_not_saved')

    renderOrderConfirmation(drawer, result.orderId, result.merged)
    setSendNotice(
      drawer,
      result.reused
        ? `Đơn #${result.orderId} đã được gửi trước đó. Sky đã nhận được thông tin đơn này.`
        : result.merged
          ? `Đã bổ sung vào đơn #${result.orderId}. Các món mới đã được gộp vào đơn đang chờ Sky xác nhận.`
          : `Đặt hàng thành công · Đơn #${result.orderId}. Sky đã nhận được danh sách món và thông tin người đặt.`,
      'ok',
    )
    button.textContent = result.reused
      ? 'Đơn đã được gửi ✓'
      : result.merged
        ? `Đã gộp vào đơn #${result.orderId} ✓`
        : 'Đặt hàng thành công ✓'
    window.setTimeout(() => {
      if (button.isConnected) button.textContent = originalText
    }, 2200)
  } catch {
    setSendNotice(drawer, 'Chưa gửi được đơn vào hệ thống. Vui lòng thử lại.', 'error')
    button.textContent = 'Thử đặt hàng lại'
  } finally {
    button.disabled = false
  }
}

export function installCartCustomerInfo() {
  const scan = () => document.querySelectorAll<HTMLElement>('.cartDrawer').forEach(enhanceDrawer)
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
  scan()

  document.addEventListener('click', event => {
    const target = event.target as Element | null
    if (!target) return

    const placeOrder = target.closest<HTMLButtonElement>('[data-place-order]')
    if (placeOrder) {
      event.preventDefault()
      event.stopPropagation()
      void submitOrder(placeOrder)
    }
  }, true)
}
