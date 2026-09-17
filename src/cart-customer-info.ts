type CustomerInfo = {
  name: string
  phone: string
  note: string
}

const CUSTOMER_INFO_KEY = 'skyhouse_customer_info_v1'

const emptyInfo: CustomerInfo = { name: '', phone: '', note: '' }

function loadInfo(): CustomerInfo {
  try {
    const raw = localStorage.getItem(CUSTOMER_INFO_KEY)
    if (!raw) return { ...emptyInfo }
    const parsed = JSON.parse(raw) as Partial<CustomerInfo>
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      note: typeof parsed.note === 'string' ? parsed.note : '',
    }
  } catch {
    return { ...emptyInfo }
  }
}

function saveInfo(info: CustomerInfo) {
  try { localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(info)) } catch { /* ignore storage errors */ }
}

function customerPrefix(info: CustomerInfo) {
  const lines = [
    'THÔNG TIN NGƯỜI ĐẶT',
    `Tên khách: ${info.name.trim()}`,
    `Số điện thoại: ${info.phone.trim()}`,
    info.note.trim() ? `Ghi chú: ${info.note.trim()}` : '',
    '',
  ].filter((line, index) => index === 0 || line !== '')
  return `${lines.join('\n')}\n`
}

function readInfo(drawer?: Element | null): CustomerInfo {
  const stored = loadInfo()
  if (!drawer) return stored
  const name = drawer.querySelector<HTMLInputElement>('[data-customer-field="name"]')?.value ?? stored.name
  const phone = drawer.querySelector<HTMLInputElement>('[data-customer-field="phone"]')?.value ?? stored.phone
  const note = drawer.querySelector<HTMLTextAreaElement>('[data-customer-field="note"]')?.value ?? stored.note
  return { name, phone, note }
}

function getValidationNotice(drawer: Element | null) {
  return drawer?.querySelector<HTMLElement>('[data-customer-validation]') || null
}

function validateInfo(drawer: Element | null, info: CustomerInfo) {
  const nameInput = drawer?.querySelector<HTMLInputElement>('[data-customer-field="name"]') || null
  const phoneInput = drawer?.querySelector<HTMLInputElement>('[data-customer-field="phone"]') || null
  const notice = getValidationNotice(drawer)

  const missingName = !info.name.trim()
  const missingPhone = !info.phone.trim()
  nameInput?.toggleAttribute('aria-invalid', missingName)
  phoneInput?.toggleAttribute('aria-invalid', missingPhone)

  if (!missingName && !missingPhone) {
    if (notice) {
      notice.textContent = ''
      notice.hidden = true
    }
    return true
  }

  if (notice) {
    notice.textContent = missingName && missingPhone
      ? 'Nhập tên khách và số điện thoại trước khi gửi đơn nhé.'
      : missingName
        ? 'Nhập tên khách trước khi gửi đơn nhé.'
        : 'Nhập số điện thoại trước khi gửi đơn nhé.'
    notice.hidden = false
  }

  const firstMissing = missingName ? nameInput : phoneInput
  firstMissing?.focus({ preventScroll: true })
  firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return false
}

function extractBaseOrderText(text: string) {
  const marker = "Chào Sky's house"
  const markerIndex = text.indexOf(marker)
  return markerIndex >= 0 ? text.slice(markerIndex) : text
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
      <label class="cartCustomerNote">
        <span>Ghi chú</span>
        <textarea data-customer-field="note" rows="2" placeholder="Ví dụ: giao buổi chiều, gọi trước khi giao..."></textarea>
      </label>
    </div>
    <p class="cartCustomerValidation" data-customer-validation hidden></p>
  `

  footer.insertBefore(block, footer.firstChild)
  const nameInput = block.querySelector<HTMLInputElement>('[data-customer-field="name"]')!
  const phoneInput = block.querySelector<HTMLInputElement>('[data-customer-field="phone"]')!
  const noteInput = block.querySelector<HTMLTextAreaElement>('[data-customer-field="note"]')!
  nameInput.value = info.name
  phoneInput.value = info.phone
  noteInput.value = info.note

  const persist = () => {
    saveInfo({ name: nameInput.value, phone: phoneInput.value, note: noteInput.value })
    if (nameInput.value.trim()) nameInput.removeAttribute('aria-invalid')
    if (phoneInput.value.trim()) phoneInput.removeAttribute('aria-invalid')
    const notice = block.querySelector<HTMLElement>('[data-customer-validation]')
    if (notice && nameInput.value.trim() && phoneInput.value.trim()) {
      notice.textContent = ''
      notice.hidden = true
    }
  }
  nameInput.addEventListener('input', persist)
  phoneInput.addEventListener('input', persist)
  noteInput.addEventListener('input', persist)
}

function augmentZaloLink(link: HTMLAnchorElement) {
  const drawer = link.closest('.cartDrawer')
  const info = readInfo(drawer)
  saveInfo(info)
  if (!validateInfo(drawer, info)) return false

  try {
    const url = new URL(link.href)
    const baseText = extractBaseOrderText(url.searchParams.get('text') || '')
    url.searchParams.set('text', `${customerPrefix(info)}${baseText}`)
    link.href = url.toString()
    return true
  } catch {
    return true
  }
}

async function copyAugmentedOrder(button: HTMLButtonElement) {
  const drawer = button.closest('.cartDrawer')
  const zalo = drawer?.querySelector<HTMLAnchorElement>('.cartPrimary')
  if (!zalo) return
  const info = readInfo(drawer)
  saveInfo(info)
  if (!validateInfo(drawer, info)) return

  try {
    const url = new URL(zalo.href)
    const baseText = extractBaseOrderText(url.searchParams.get('text') || '')
    const text = `${customerPrefix(info)}${baseText}`
    await navigator.clipboard.writeText(text)
    const original = button.textContent || 'Sao chép danh sách'
    button.textContent = 'Đã sao chép ✓'
    window.setTimeout(() => { button.textContent = original }, 1800)
  } catch { /* keep native behavior unavailable rather than breaking cart */ }
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
      const ok = augmentZaloLink(zalo)
      if (!ok) {
        event.preventDefault()
        event.stopPropagation()
      }
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
