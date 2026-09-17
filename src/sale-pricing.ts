import { supabase } from './lib/supabase'

type SaleRow = {
  id: number
  name: string
  price: number | null
  compare_at_price: number | null
}

const byId = new Map<number, SaleRow>()
const byName = new Map<string, SaleRow>()
let scanQueued = false
let refreshTimer = 0

const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`

function isSale(row: SaleRow | undefined | null) {
  if (!row || row.price == null || row.compare_at_price == null) return false
  return Number(row.compare_at_price) > Number(row.price)
}

function discount(row: SaleRow) {
  const original = Number(row.compare_at_price)
  const current = Number(row.price)
  if (!(original > current) || original <= 0) return 0
  return Math.max(1, Math.min(100, Math.round(((original - current) / original) * 100)))
}

function rowForName(name: string) {
  return byName.get(name.trim()) || null
}

function ensureSaleBadge(container: HTMLElement | null, row: SaleRow | null) {
  if (!container) return
  const existing = container.querySelector<HTMLElement>(':scope > .saleBadge')
  if (!row || !isSale(row)) {
    existing?.remove()
    return
  }
  const nextText = `-${discount(row)}%`
  if (existing) {
    if (existing.textContent !== nextText) existing.textContent = nextText
    return
  }
  const badge = document.createElement('span')
  badge.className = 'saleBadge'
  badge.textContent = nextText
  container.appendChild(badge)
}

function applySalePrice(priceEl: HTMLElement | null, row: SaleRow | null) {
  if (!priceEl) return
  if (!row || !isSale(row)) {
    if (priceEl.dataset.saleBasePrice) {
      priceEl.textContent = priceEl.dataset.saleBasePrice
      delete priceEl.dataset.saleBasePrice
      delete priceEl.dataset.saleApplied
      priceEl.classList.remove('salePrice')
    }
    return
  }

  const appliedKey = `${row.price}|${row.compare_at_price}`
  if (priceEl.dataset.saleApplied === appliedKey) return

  if (!priceEl.dataset.saleBasePrice) {
    priceEl.dataset.saleBasePrice = (priceEl.textContent || '').trim()
  }
  const current = priceEl.dataset.saleBasePrice || money(Number(row.price))
  priceEl.classList.add('salePrice')
  priceEl.innerHTML = `<span class="saleCurrent"></span><del></del>`
  const currentEl = priceEl.querySelector<HTMLElement>('.saleCurrent')
  const oldEl = priceEl.querySelector<HTMLElement>('del')
  if (currentEl) currentEl.textContent = current
  if (oldEl) oldEl.textContent = money(Number(row.compare_at_price))
  priceEl.dataset.saleApplied = appliedKey
}

function enhanceStorefront() {
  document.querySelectorAll<HTMLElement>('.card').forEach(card => {
    const row = rowForName(card.querySelector('.cardBody h3')?.textContent || '')
    applySalePrice(card.querySelector<HTMLElement>('.cardBottom b'), row)
    ensureSaleBadge(card.querySelector<HTMLElement>('.cardImg'), row)
  })

  document.querySelectorAll<HTMLElement>('.highlightCard').forEach(card => {
    const row = rowForName(card.querySelector('.highlightCopy h3')?.textContent || '')
    applySalePrice(card.querySelector<HTMLElement>('.highlightCopy b'), row)
    ensureSaleBadge(card.querySelector<HTMLElement>('.highlightImage'), row)
  })

  document.querySelectorAll<HTMLElement>('.world').forEach(world => {
    const row = rowForName(world.querySelector('.featured b')?.textContent || '')
    applySalePrice(world.querySelector<HTMLElement>('.featured strong'), row)
    ensureSaleBadge(world.querySelector<HTMLElement>('.productFloat'), row)
  })

  const modal = document.querySelector<HTMLElement>('.modalCard')
  if (modal) {
    const row = rowForName(modal.querySelector('.modalCopy h3')?.textContent || '')
    applySalePrice(modal.querySelector<HTMLElement>('.modalPrice'), row)
    ensureSaleBadge(modal.querySelector<HTMLElement>('.modalImageWrap'), row)
  }

  document.querySelectorAll<HTMLElement>('.relatedItem').forEach(item => {
    const row = rowForName(item.querySelector('span > b')?.textContent || '')
    ensureSaleBadge(item, row)
  })
}

function selectedAdminProductId() {
  const text = document.querySelector('.adminEditorTitle .adminEyebrow')?.textContent || ''
  const match = text.match(/#(\d+)/)
  return match ? Number(match[1]) : null
}

function findAdminPriceInput() {
  const labels = Array.from(document.querySelectorAll<HTMLLabelElement>('.adminFormGrid label'))
  const priceLabel = labels.find(label => !label.classList.contains('saleCompareField') && (label.childNodes[0]?.textContent || '').trim() === 'Giá')
  return priceLabel?.querySelector<HTMLInputElement>('input[type="number"]') || null
}

function setStatus(status: HTMLElement, text: string, sale: boolean) {
  if (status.textContent !== text) status.textContent = text
  status.classList.toggle('isSale', sale)
}

function updateAdminHint(field: HTMLElement, row: SaleRow | null) {
  const input = field.querySelector<HTMLInputElement>('input')
  const status = field.querySelector<HTMLElement>('[data-sale-admin-status]')
  if (!input || !status) return

  const currentInput = findAdminPriceInput()
  const current = currentInput?.value === '' ? row?.price ?? null : Number(currentInput?.value)
  const original = input.value === '' ? null : Number(input.value)

  if (original == null) {
    setStatus(status, 'Để trống nếu sản phẩm không giảm giá.', false)
    return
  }
  if (current == null || !Number.isFinite(Number(current))) {
    setStatus(status, 'Nhập giá bán trước để tính phần trăm giảm.', false)
    return
  }
  if (original <= Number(current)) {
    setStatus(status, 'Giá gốc phải cao hơn giá bán để hiện badge SALE.', false)
    return
  }

  const pct = Math.max(1, Math.min(100, Math.round(((original - Number(current)) / original) * 100)))
  setStatus(status, `Sẽ hiển thị SALE -${pct}% · ${money(original)} → ${money(Number(current))}`, true)
}

async function saveAdminComparePrice(field: HTMLElement) {
  if (!supabase) return
  const id = selectedAdminProductId()
  const input = field.querySelector<HTMLInputElement>('input')
  const status = field.querySelector<HTMLElement>('[data-sale-admin-status]')
  if (!id || !input || !status) return

  const value = input.value.trim() === '' ? null : Number(input.value)
  if (value != null && (!Number.isFinite(value) || value < 0)) {
    setStatus(status, 'Giá gốc không hợp lệ.', false)
    return
  }

  input.disabled = true
  setStatus(status, 'Đang lưu giá gốc…', false)
  const { error } = await supabase.from('products').update({ compare_at_price: value }).eq('id', id)
  input.disabled = false
  if (error) {
    setStatus(status, `Không lưu được giá gốc: ${error.message}`, false)
    return
  }

  const row = byId.get(id)
  if (row) row.compare_at_price = value
  updateAdminHint(field, row || null)
  renderAdminSaleFlags()
}

function syncAdminField() {
  const grid = document.querySelector<HTMLElement>('.adminFormGrid')
  if (!grid) return

  let field = grid.querySelector<HTMLElement>('.saleCompareField')
  if (!field) {
    field = document.createElement('label')
    field.className = 'saleCompareField'
    field.innerHTML = 'Giá gốc <input type="number" min="0" step="1000" placeholder="Ví dụ 200000" /><small data-sale-admin-status>Để trống nếu sản phẩm không giảm giá.</small>'

    const priceInput = findAdminPriceInput()
    const priceLabel = priceInput?.closest('label')
    if (priceLabel) priceLabel.insertAdjacentElement('afterend', field)
    else grid.prepend(field)

    const input = field.querySelector<HTMLInputElement>('input')!
    input.addEventListener('input', () => updateAdminHint(field!, byId.get(selectedAdminProductId() || -1) || null))
    input.addEventListener('change', () => void saveAdminComparePrice(field!))
  }

  const input = field.querySelector<HTMLInputElement>('input')!
  const status = field.querySelector<HTMLElement>('[data-sale-admin-status]')!
  const id = selectedAdminProductId()
  const key = id ? String(id) : 'new'
  if (field.dataset.saleProductId !== key) {
    field.dataset.saleProductId = key
    if (!id) {
      input.value = ''
      input.disabled = true
      setStatus(status, 'Sản phẩm mới: lưu sản phẩm trước, sau đó mở lại để nhập giá gốc.', false)
    } else {
      const row = byId.get(id) || null
      input.disabled = false
      input.value = row?.compare_at_price == null ? '' : String(row.compare_at_price)
      updateAdminHint(field, row)
    }
  }
}

function renderAdminSaleFlags() {
  document.querySelectorAll<HTMLElement>('.adminItems > button').forEach(button => {
    const name = button.querySelector('div > b')?.textContent || ''
    const row = rowForName(name)
    let flag = button.querySelector<HTMLElement>('.adminSaleFlag')
    if (!row || !isSale(row)) {
      flag?.remove()
      return
    }
    if (!flag) {
      flag = document.createElement('small')
      flag.className = 'adminSaleFlag'
      button.querySelector('div')?.appendChild(flag)
    }
    const nextText = `SALE -${discount(row)}%`
    if (flag.textContent !== nextText) flag.textContent = nextText
  })
}

function scan() {
  if (location.pathname.startsWith('/admin')) {
    syncAdminField()
    renderAdminSaleFlags()
  } else {
    enhanceStorefront()
  }
}

function queueScan() {
  if (scanQueued) return
  scanQueued = true
  window.queueMicrotask(() => {
    scanQueued = false
    scan()
  })
}

async function refreshRows() {
  if (!supabase) return
  const { data, error } = await supabase.from('products').select('id,name,price,compare_at_price')
  if (error) return
  byId.clear()
  byName.clear()
  ;((data ?? []) as SaleRow[]).forEach(row => {
    byId.set(Number(row.id), row)
    byName.set(row.name.trim(), row)
  })
  queueScan()
}

export function installSalePricing() {
  if (!supabase) return

  const observer = new MutationObserver(queueScan)
  observer.observe(document.body, { childList: true, subtree: true })

  document.addEventListener('click', event => {
    if (!location.pathname.startsWith('/admin')) return
    const target = event.target as Element | null
    if (target?.closest('.adminItems > button, .adminListHead button')) {
      window.setTimeout(syncAdminField, 0)
    }
  }, true)

  document.addEventListener('submit', event => {
    const form = (event.target as Element | null)?.closest('.adminEditor')
    if (!form) return
    window.clearTimeout(refreshTimer)
    refreshTimer = window.setTimeout(() => void refreshRows(), 900)
  }, true)

  supabase.auth.onAuthStateChange(() => window.setTimeout(() => void refreshRows(), 120))
  void refreshRows()
  queueScan()
}
