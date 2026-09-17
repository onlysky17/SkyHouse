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
const emptyInfo: CustomerInfo = { name: '', phone: '', deliveryMethod: 'delivery', address: '', note: '' }
let lastSavedFingerprint = ''
let lastSavedAt = 0

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

function deliveryLabel(info: CustomerInfo) {
  return info.deliveryMethod === 'pickup' ? 'Tự đến lấy' : 'Giao tận nơi'
}

function customerPrefix(info: CustomerInfo) {
  const lines = [
    'THÔNG TIN NGƯỜI ĐẶT',
    `Tên khách: ${info.name.trim()}`,
    `Số điện thoại: ${info.phone.trim()}`,
    `Nhận hàng: ${deliveryLabel(info)}`,
    info.deliveryMethod === 'delivery' ? `Địa chỉ: ${info.address.trim()}` : '',
    info.note.trim() ? `Ghi chú: ${info.note.trim()}` : '',
  ].filter(Boolean)
  return `${lines.join('\n')}\n\n`
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

function extractBaseOrderText(text: string) {
  const marker = "Chào Sky's house"
  const markerIndex = text.indexOf(marker)
  return markerIndex >= 0 ? text.slice(markerIndex) : text
}

function orderTextFromZaloLink(link: HTMLAnchorElement, info: CustomerInfo) {
  try {
    const url = new URL(link.href)
    const baseText = extractBaseOrderText(url.searchParams.get('text') || '')
    return `${customerPrefix(info)}${baseText}`.trim()
  } catch {
    return customerPrefix(info).trim()
  }
}

function zaloChatUrl(link: HTMLAnchorElement) {
  try {
    const url = new URL(link.href)
    const phone = url.pathname.split('/').filter(Boolean).pop() || ''
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    return mobile
      ? `https://zalo.me/${encodeURIComponent(phone)}`
      : `https://chat.zalo.me/?phone=${encodeURIComponent(phone)}`
  } catch {
    return link.href.split('?')[0]
  }
}

function copyTextFallback(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  let copied = false
  try { copied = document.execCommand('copy') } catch { copied = false }
  textarea.remove()
  return copied
}

function copyOrderText(text: string) {
  const copiedSynchronously = copyTextFallback(text)
  if (!copiedSynchronously && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => { /* keep the page usable if browser blocks clipboard */ })
  }
  return copiedSynchronously || Boolean(navigator.clipboard?.writeText)
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
    return {
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
  if (!supabase) return { saved: false, reused: false }
  const snapshot = collectOrderSnapshot(drawer)
  if (!snapshot.items.length) return { saved: false, reused: false }

  const payload = {
    customer_name: info.name.trim(),
    customer_phone: info.phone.trim(),
    customer_note: adminNote(info),
    items: snapshot.items,
    subtotal_known: snapshot.subtotal_known,
    has_contact_price: snapshot.has_contact_price,
    status: 'new',
    source: 'zalo',
  }
  const fingerprint = JSON.stringify(payload)
  const now = Date.now()
  if (fingerprint === lastSavedFingerprint && now - lastSavedAt < 120000) {
    return { saved: true, reused: true }
  }

  const { error } = await supabase.from('orders').insert(payload)
  if (error) throw new Error(error.message)
  lastSavedFingerprint = fingerprint
  lastSavedAt = now
  return { saved: true, reused: false }
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

  footer.insertBefore(block, footer.firstChild)
  const zaloButton = footer.querySelector<HTMLAnchorElement>('.cartPrimary')
  if (zaloButton) {
    zaloButton.textContent = 'Sao chép đơn & mở Zalo'
    zaloButton.title = 'Đơn sẽ được lưu vào hệ thống và sao chép trước khi mở Zalo'
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

async function openZaloWithCopiedOrder(link: HTMLAnchorElement) {
  const drawer = link.closest('.cartDrawer')
  const info = readInfo(drawer)
  saveInfo(info)
  if (!validateInfo(drawer, info)) return

  const popup = window.open('', '_blank')
  if (popup) {
    try {
      popup.opener = null
      popup.document.title = 'Sky’s house · Đang mở Zalo'
      popup.document.body.textContent = 'Đang lưu đơn và mở Zalo…'
    } catch { /* navigation fallback below */ }
  }

  setSendNotice(drawer, 'Đang lưu đơn vào hệ thống…', 'ok')
  let stored = false
  let reused = false
  try {
    const result = await saveOrder(drawer, info)
    stored = result.saved
    reused = result.reused
  } catch {
    stored = false
  }

  const text = orderTextFromZaloLink(link, info)
  const copied = copyOrderText(text)
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  if (stored) {
    setSendNotice(
      drawer,
      copied
        ? `${reused ? 'Đơn này đã được lưu trước đó. ' : 'Đã lưu đơn vào hệ thống. '}Nội dung đã sao chép; sang Zalo rồi ${mobile ? 'chạm giữ và chọn Dán' : 'nhấn Ctrl+V'} để gửi.`
        : `${reused ? 'Đơn này đã được lưu trước đó. ' : 'Đã lưu đơn vào hệ thống. '}Trình duyệt chặn sao chép; dùng nút “Sao chép danh sách” rồi dán vào Zalo.`,
      copied ? 'ok' : 'error',
    )
  } else {
    setSendNotice(
      drawer,
      copied
        ? `Chưa lưu được đơn vào hệ thống, nhưng nội dung đã được sao chép. Sang Zalo rồi ${mobile ? 'Dán' : 'nhấn Ctrl+V'} để gửi.`
        : 'Chưa lưu được đơn và trình duyệt cũng chặn sao chép tự động. Hãy thử lại.',
      'error',
    )
  }

  const chatUrl = zaloChatUrl(link)
  if (popup && !popup.closed) {
    try { popup.location.replace(chatUrl) } catch { popup.location.href = chatUrl }
  } else {
    window.open(chatUrl, '_blank', 'noopener,noreferrer')
  }
}

async function copyAugmentedOrder(button: HTMLButtonElement) {
  const drawer = button.closest('.cartDrawer')
  const zalo = drawer?.querySelector<HTMLAnchorElement>('.cartPrimary')
  if (!zalo) return
  const info = readInfo(drawer)
  saveInfo(info)
  if (!validateInfo(drawer, info)) return

  const text = orderTextFromZaloLink(zalo, info)
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
    else if (!copyTextFallback(text)) throw new Error('clipboard unavailable')
    const original = button.textContent || 'Sao chép danh sách'
    button.textContent = 'Đã sao chép ✓'
    setSendNotice(drawer, 'Đã sao chép đầy đủ thông tin người đặt, địa chỉ nhận hàng và danh sách món.', 'ok')
    window.setTimeout(() => { button.textContent = original }, 1800)
  } catch {
    setSendNotice(drawer, 'Không sao chép được tự động. Hãy thử lại hoặc cho phép trình duyệt truy cập clipboard.', 'error')
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

    const zalo = target.closest<HTMLAnchorElement>('.cartPrimary')
    if (zalo) {
      event.preventDefault()
      event.stopPropagation()
      void openZaloWithCopiedOrder(zalo)
      return
    }

    const copy = target.closest<HTMLButtonElement>('.cartSecondary button')
    if (copy) {
      event.preventDefault()
      event.stopPropagation()
      void copyAugmentedOrder(copy)
    }
  }, true)
}
