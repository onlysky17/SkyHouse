export function installOrderTrackingLink() {
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/track')) return

  const ensure = () => {
    const actions = document.querySelector<HTMLElement>('.navActions')
    if (!actions || actions.querySelector('[data-order-track-link]')) return
    const link = document.createElement('a')
    link.href = '/track'
    link.className = 'navTrackLink'
    link.dataset.orderTrackLink = 'true'
    link.textContent = 'Tra cứu đơn'
    link.title = 'Tra cứu trạng thái đơn hàng'
    const cart = actions.querySelector('.cartNavButton')
    if (cart) actions.insertBefore(link, cart)
    else actions.appendChild(link)
  }

  const observer = new MutationObserver(ensure)
  observer.observe(document.body, { childList: true, subtree: true })
  ensure()
}
