const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

const CATALOG_SPRITE = '/assets/catalog-sprite.webp'
const HERO_SPRITE = '/assets/hero-sprite.webp'

const HERO_POSITIONS: Record<number, string> = {
  96: '0% 0%',
  109: '100% 0%',
  70: '0% 100%',
  17: '100% 100%',
}

function getProductId(img: HTMLImageElement) {
  const match = img.src.match(/product-(\d{3})\.webp/i)
  return match ? Number(match[1]) : null
}

function applySprite(img: HTMLImageElement) {
  if (img.dataset.skySpriteApplied === '1') return
  const id = getProductId(img)
  if (!id || id < 1 || id > 111) return

  const isHero = Boolean(img.closest('.productFloat')) && Boolean(HERO_POSITIONS[id])

  img.dataset.skySpriteApplied = '1'
  img.src = TRANSPARENT_PIXEL
  img.style.backgroundImage = `url("${isHero ? HERO_SPRITE : CATALOG_SPRITE}")`
  img.style.backgroundRepeat = 'no-repeat'
  img.style.backgroundColor = 'transparent'

  if (isHero) {
    img.style.backgroundSize = '200% 200%'
    img.style.backgroundPosition = HERO_POSITIONS[id]
  } else {
    const index = id - 1
    const col = index % 10
    const row = Math.floor(index / 10)
    img.style.backgroundSize = '1000% 1200%'
    img.style.backgroundPosition = `${(col / 9) * 100}% ${(row / 11) * 100}%`
  }
}

function scan(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>('img[src*="product-"][src$=".webp"]').forEach(applySprite)
}

export function installProductImageFallback() {
  scan()

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        if (node instanceof HTMLImageElement) applySprite(node)
        scan(node)
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })

  document.addEventListener(
    'error',
    (event) => {
      if (event.target instanceof HTMLImageElement) applySprite(event.target)
    },
    true,
  )
}
