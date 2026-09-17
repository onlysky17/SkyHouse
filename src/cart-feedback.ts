const TOAST_DURATION = 1900
const BUTTON_SUCCESS_MS = 1150

function flashCartButton() {
  const cartButton = document.querySelector<HTMLButtonElement>('.cartNavButton')
  if (!cartButton) return
  cartButton.classList.remove('cartBump')
  void cartButton.offsetWidth
  cartButton.classList.add('cartBump')
  window.setTimeout(() => cartButton.classList.remove('cartBump'), 700)
}

function showToast(productName: string) {
  document.querySelector('.cartFeedbackToast')?.remove()
  const toast = document.createElement('div')
  toast.className = 'cartFeedbackToast'
  toast.innerHTML = `<span class="cartFeedbackCheck">✓</span><div><b>Đã thêm vào giỏ</b><small>${productName}</small></div>`
  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('show'))
  window.setTimeout(() => {
    toast.classList.remove('show')
    window.setTimeout(() => toast.remove(), 260)
  }, TOAST_DURATION)
}

function flyImageToCart(button: HTMLElement) {
  const modal = button.closest('.modalCard')
  const source = modal?.querySelector<HTMLImageElement>('.modalImageWrap img')
  const target = document.querySelector<HTMLElement>('.cartNavButton')
  if (!source || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const from = source.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const ghost = source.cloneNode(true) as HTMLImageElement
  ghost.className = 'cartFlyGhost'
  ghost.style.left = `${from.left + from.width / 2 - 36}px`
  ghost.style.top = `${from.top + from.height / 2 - 36}px`
  document.body.appendChild(ghost)

  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)

  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(.2) rotate(8deg)`
    ghost.style.opacity = '0.18'
  })
  window.setTimeout(() => ghost.remove(), 720)
}

function successState(button: HTMLButtonElement) {
  const original = button.dataset.cartOriginalText || button.textContent || '＋ Thêm vào giỏ'
  button.dataset.cartOriginalText = original
  button.classList.remove('cartAddSuccess')
  void button.offsetWidth
  button.classList.add('cartAddSuccess')
  button.textContent = '✓ Đã thêm vào giỏ'
  button.setAttribute('aria-live', 'polite')

  window.setTimeout(() => {
    if (!button.isConnected) return
    button.textContent = original
    button.classList.remove('cartAddSuccess')
  }, BUTTON_SUCCESS_MS)
}

function onCartAddClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const button = target?.closest<HTMLButtonElement>('.modalAddButton')
  if (!button || button.disabled) return

  const productName = button.closest('.modalCopy')?.querySelector('h3')?.textContent?.trim() || 'Sản phẩm'
  successState(button)
  flashCartButton()
  showToast(productName)
  flyImageToCart(button)
}

export function installCartFeedback() {
  document.addEventListener('click', onCartAddClick)
}
