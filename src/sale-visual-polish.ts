function badgeText(source: Element | null) {
  const raw = (source?.textContent || '').trim()
  return raw ? `SALE ${raw}` : ''
}

function syncInlineBadge(source: Element | null, host: HTMLElement | null, before?: Element | null) {
  if (!host) return
  let badge = host.querySelector<HTMLElement>(':scope > .saleInlineBadge')
  const label = badgeText(source)

  if (!label) {
    badge?.remove()
    return
  }

  if (!badge) {
    badge = document.createElement('span')
    badge.className = 'saleInlineBadge'
    if (before && before.parentElement === host) host.insertBefore(badge, before)
    else host.appendChild(badge)
  }

  if (badge.textContent !== label) badge.textContent = label
}

function polishCards() {
  document.querySelectorAll<HTMLElement>('.card').forEach(card => {
    const source = card.querySelector('.cardImg > .saleBadge')
    const body = card.querySelector<HTMLElement>('.cardBody')
    syncInlineBadge(source, body, body?.querySelector('h3'))
  })
}

function polishHighlights() {
  document.querySelectorAll<HTMLElement>('.highlightCard').forEach(card => {
    const source = card.querySelector('.highlightImage > .saleBadge')
    const copy = card.querySelector<HTMLElement>('.highlightCopy')
    syncInlineBadge(source, copy, copy?.querySelector('h3'))
  })
}

function polishShowcases() {
  document.querySelectorAll<HTMLElement>('.world').forEach(world => {
    const source = world.querySelector('.productFloat > .saleBadge')
    const featured = world.querySelector<HTMLElement>('.featured')
    syncInlineBadge(source, featured, featured?.querySelector('strong'))
  })
}

function polishModal() {
  const modal = document.querySelector<HTMLElement>('.modalCard')
  if (!modal) return
  const source = modal.querySelector('.modalImageWrap > .saleBadge')
  const copy = modal.querySelector<HTMLElement>('.modalCopy')
  syncInlineBadge(source, copy, copy?.querySelector('.modalPrice'))
}

function polishRelated() {
  document.querySelectorAll<HTMLElement>('.relatedItem').forEach(item => {
    const source = item.querySelector(':scope > .saleBadge')
    const copy = item.querySelector<HTMLElement>(':scope > span')
    syncInlineBadge(source, copy, copy?.querySelector('b'))
  })
}

let queued = false
function scan() {
  polishCards()
  polishHighlights()
  polishShowcases()
  polishModal()
  polishRelated()
}

function queueScan() {
  if (queued) return
  queued = true
  window.queueMicrotask(() => {
    queued = false
    scan()
  })
}

export function installSaleVisualPolish() {
  if (location.pathname.startsWith('/admin')) return
  const observer = new MutationObserver(queueScan)
  observer.observe(document.body, { childList: true, subtree: true })
  queueScan()
}
