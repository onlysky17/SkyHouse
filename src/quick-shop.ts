function text(el: Element | null) {
  return (el?.textContent || '').trim()
}

function cardName(card: Element) {
  return text(card.querySelector('.cardBody h3'))
}

function cardCategory(card: Element) {
  return text(card.querySelector('.cardBody small'))
}

function addQuickControls() {
  document.querySelectorAll<HTMLElement>('.card').forEach(card => {
    if (card.querySelector('[data-quick-add]')) return
    const body = card.querySelector<HTMLElement>('.cardBody')
    if (!body) return

    const control = document.createElement('span')
    control.className = 'quickAddControl'
    control.dataset.quickAdd = 'true'
    control.setAttribute('role', 'button')
    control.setAttribute('tabindex', '0')
    control.setAttribute('aria-label', `Thêm nhanh ${cardName(card)} vào giỏ`)
    control.textContent = '+ Thêm nhanh'
    body.appendChild(control)
  })
}

function addToCartFromCard(card: HTMLElement, control: HTMLElement) {
  if (control.classList.contains('isBusy')) return
  const original = control.textContent || '+ Thêm nhanh'
  control.classList.add('isBusy')
  document.documentElement.classList.add('quickAddInProgress')
  card.click()

  window.setTimeout(() => {
    const add = document.querySelector<HTMLButtonElement>('.modalAddButton')
    const close = document.querySelector<HTMLButtonElement>('.modal .close')
    if (add && !add.disabled) {
      add.click()
      control.textContent = '✓ Đã thêm'
      control.classList.add('isAdded')
      window.setTimeout(() => {
        control.textContent = original
        control.classList.remove('isAdded', 'isBusy')
      }, 1200)
    } else {
      control.textContent = 'Tạm hết hàng'
      window.setTimeout(() => {
        control.textContent = original
        control.classList.remove('isBusy')
      }, 1200)
    }
    close?.click()
    window.setTimeout(() => document.documentElement.classList.remove('quickAddInProgress'), 80)
  }, 35)
}

function buildRelated() {
  const modal = document.querySelector<HTMLElement>('.modalCard')
  if (!modal || modal.querySelector('[data-related-products]')) return

  const currentName = text(modal.querySelector('.modalCopy h3'))
  const currentCategory = text(modal.querySelector('.modalCopy .kicker'))
  if (!currentName) return

  const cards = Array.from(document.querySelectorAll<HTMLElement>('.card'))
    .filter(card => cardName(card) && cardName(card) !== currentName)
  const same = cards.filter(card => cardCategory(card) === currentCategory)
  const other = cards.filter(card => cardCategory(card) !== currentCategory)
  const candidates = [...same, ...other].slice(0, 4)
  if (!candidates.length) return

  const copy = modal.querySelector<HTMLElement>('.modalCopy')
  if (!copy) return

  const section = document.createElement('section')
  section.className = 'relatedProducts'
  section.dataset.relatedProducts = 'true'
  section.innerHTML = '<div class="relatedTitle"><small>Có thể ní cũng thích</small><strong>Thêm vài món cho đủ giỏ.</strong></div><div class="relatedGrid"></div>'
  const grid = section.querySelector<HTMLElement>('.relatedGrid')!

  candidates.forEach(card => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'relatedItem'
    const img = card.querySelector<HTMLImageElement>('.cardImg img')?.src || ''
    const name = cardName(card)
    const price = text(card.querySelector('.cardBottom b'))
    button.innerHTML = `<img src="${img}" alt=""><span><small>${cardCategory(card)}</small><b>${name}</b><em>${price}</em></span><i>→</i>`
    button.addEventListener('click', () => {
      document.querySelector<HTMLButtonElement>('.modal .close')?.click()
      window.setTimeout(() => card.click(), 45)
    })
    grid.appendChild(button)
  })

  copy.appendChild(section)
}

export function installQuickShop() {
  const scan = () => {
    addQuickControls()
    buildRelated()
  }

  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
  scan()

  document.addEventListener('click', event => {
    const target = event.target as Element | null
    const control = target?.closest<HTMLElement>('[data-quick-add]')
    if (!control) return
    const card = control.closest<HTMLElement>('.card')
    if (!card) return
    event.preventDefault()
    event.stopPropagation()
    addToCartFromCard(card, control)
  }, true)

  document.addEventListener('keydown', event => {
    const target = event.target as Element | null
    const control = target?.closest<HTMLElement>('[data-quick-add]')
    if (!control || (event.key !== 'Enter' && event.key !== ' ')) return
    const card = control.closest<HTMLElement>('.card')
    if (!card) return
    event.preventDefault()
    event.stopPropagation()
    addToCartFromCard(card, control)
  }, true)
}
