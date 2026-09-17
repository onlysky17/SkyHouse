import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { supabase } from './lib/supabase'

type Product = {
  id: number
  name: string
  price: number | null
  price_label?: string | null
  unit?: string | null
  category: string
  description?: string | null
  image_url?: string | null
  in_stock: boolean
  visible: boolean
  best_seller: boolean
  signature: boolean
  sort_order: number
}

type Theme = 'dried' | 'fruit' | 'nuts' | 'deli'
type CartMap = Record<string, number>

const CART_KEY = 'skyhouse_cart_v1'
const SHOP = {
  phone: '0786646634',
  phoneDisplay: '0786 646 634',
  zalo: 'https://zalo.me/0786646634',
  facebook: 'https://www.facebook.com/vishiaonlysky',
}

const gradients: Record<Theme, string> = {
  dried: 'radial-gradient(circle at center,#6B4423 0%,#2A1810 50%,#080403 100%)',
  fruit: 'radial-gradient(circle at center,#FFF3DC 0%,#F3D7AC 43%,#B97039 100%)',
  nuts: 'radial-gradient(circle at center,#DDECC6 0%,#73904D 45%,#17220F 100%)',
  deli: 'radial-gradient(circle at center,#7A3929 0%,#341812 48%,#090403 100%)',
}

const priceText = (p: Product) =>
  p.price_label?.trim() ||
  (p.price == null ? 'Liên hệ giá' : `${new Intl.NumberFormat('vi-VN').format(p.price)}đ${p.unit ? `/${p.unit}` : ''}`)

const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`

function ProductBadges({ p }: { p: Product }) {
  if (!p.best_seller && !p.signature) return null
  return <div className="productBadges" aria-label="Nhãn sản phẩm">
    {p.best_seller && <span className="badgeBest">★ Best Seller</span>}
    {p.signature && <span className="badgeSignature">◆ Signature</span>}
  </div>
}

function Navbar({ theme, cartCount, onOpenCart }: { theme: Theme; cartCount: number; onOpenCart: () => void }) {
  const light = theme === 'fruit' || theme === 'nuts'
  return <header style={{ position: 'fixed', inset: '0 0 auto', zIndex: 50, padding: '10px 10px 0' }}>
    <div className="navshell" style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 999, padding: '10px 14px', border: `1px solid ${light ? 'rgba(42,24,16,.10)' : 'rgba(255,255,255,.10)'}`, background: light ? 'rgba(255,248,236,.90)' : 'rgba(8,4,3,.42)', backdropFilter: 'blur(18px)', boxShadow: '0 10px 30px rgba(0,0,0,.12)', color: light ? '#2A1810' : 'white' }}>
      <a href="#top" className="serif" style={{ fontWeight: 900, letterSpacing: '.13em', fontSize: 'clamp(14px,4vw,22px)', whiteSpace: 'nowrap' }}>SKY'S HOUSE</a>
      <div className="navActions">
        <a className="navPhone" href={`tel:${SHOP.phone}`} style={{ border: '1px solid currentColor', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{SHOP.phoneDisplay}</a>
        <button className="cartNavButton" type="button" onClick={onOpenCart} aria-label={`Mở giỏ hàng, ${cartCount} sản phẩm`}>
          <span>Giỏ hàng</span><b>{cartCount}</b>
        </button>
      </div>
    </div>
  </header>
}

function Intro() {
  return <section id="top" style={{ minHeight: '100dvh', scrollSnapAlign: 'start', background: '#f7f0e5', color: '#24160f', padding: '110px 20px 36px', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
    <div style={{ maxWidth: 1000, textAlign: 'center', position: 'relative', zIndex: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.32em', textTransform: 'uppercase', color: '#c85b2f', marginBottom: 24 }}>Sky's house · catalog</div>
      <h1 className="serif" style={{ fontSize: 'clamp(54px,14vw,124px)', lineHeight: .9, letterSpacing: '-.05em', margin: 0, fontWeight: 900 }}>Thấy món ưng ý,<br /><i style={{ fontWeight: 600 }}>liên hệ liền ní.</i></h1>
      <p style={{ maxWidth: 680, margin: '30px auto 0', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.7, color: 'rgba(36,22,15,.64)' }}>Đặc sản, đồ sấy, hạt và món ăn vặt chọn lọc. Xem ảnh thật, giá rõ ràng và gom nhiều món vào giỏ trước khi liên hệ Sky's house.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
        <a href="#catalog" style={{ background: '#24160f', color: 'white', borderRadius: 999, padding: '13px 20px', fontWeight: 800 }}>Khám phá bộ sưu tập</a>
        <a href={`tel:${SHOP.phone}`} style={{ border: '1px solid rgba(36,22,15,.22)', borderRadius: 999, padding: '13px 20px', fontWeight: 800 }}>Gọi {SHOP.phoneDisplay}</a>
      </div>
    </div>
  </section>
}

type ShowcaseData = { id: string; theme: Theme; kicker: string; watermark: string; subtitle: string; description: string; product: Product }

function Showcase({ s, onActive }: { s: ShowcaseData; onActive: (theme: Theme) => void }) {
  const { ref, inView } = useInView({ threshold: .5 })
  useEffect(() => { if (inView) onActive(s.theme) }, [inView, onActive, s.theme])
  const light = s.theme === 'fruit' || s.theme === 'nuts'
  return <section ref={ref} className={`world ${light ? 'light' : 'dark'}`} style={{ background: gradients[s.theme] }}>
    <div className="watermark serif">{s.watermark}</div>
    <div className="worldInner">
      <motion.div className="productZone" initial={{ opacity: 0, x: -70 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: .2 }} transition={{ duration: .8 }}>
        <div className="productFloat"><img src={s.product.image_url || ''} alt={s.product.name} /><span className="wm">Sky's house</span><ProductBadges p={s.product} /></div>
      </motion.div>
      <motion.div className="copy" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: .2 }} transition={{ duration: .8, delay: .08 }}>
        <div className="kicker">{s.kicker}</div>
        <h2 className="serif">{s.subtitle.split('\n').map((x, i) => <span key={i}>{x}{i === 0 && <br />}</span>)}</h2>
        <p>{s.description.split('\n').map((x, i) => <span key={i}>{x}{i === 0 && <br />}</span>)}</p>
        <div className="featured"><div><small>{s.product.category}</small><b>{s.product.name}</b></div><strong className="serif">{priceText(s.product)}</strong></div>
        <a className="explore" href="#catalog">Khám phá catalog ↓</a>
      </motion.div>
    </div>
  </section>
}

function HighlightSection({ kind, products, onSelect }: { kind: 'best' | 'signature'; products: Product[]; onSelect: (p: Product) => void }) {
  if (!products.length) return null
  const isSignature = kind === 'signature'
  const title = isSignature ? 'Signature của Sky’s house.' : 'Best Seller được chọn nhiều.'
  const eyebrow = isSignature ? 'Sky’s house signature' : 'Khách chọn nhiều'
  const note = isSignature
    ? 'Những món mang dấu ấn riêng của Sky’s house — ưu tiên để biếu tặng, nhâm nhi hoặc chọn khi chưa biết bắt đầu từ đâu.'
    : 'Những món bán chạy được Sky’s house đánh dấu trực tiếp trong trang quản trị.'
  return <section className={`highlightSection ${isSignature ? 'signatureSection' : 'bestSection'}`}>
    <div className="highlightHead">
      <div><div className="over">{eyebrow}</div><h2 className="serif">{title}</h2></div>
      <p>{note}</p>
    </div>
    <div className="highlightGrid">
      {products.slice(0, 8).map((p, index) => <motion.button key={p.id} className="highlightCard" onClick={() => onSelect(p)} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .45, delay: Math.min(index * .04, .2) }}>
        <div className="highlightImage"><img src={p.image_url || ''} alt={p.name} loading="lazy" /><ProductBadges p={p} /></div>
        <div className="highlightCopy"><small>{p.category}</small><h3 className="serif">{p.name}</h3><div><b>{priceText(p)}</b><span>Xem món →</span></div></div>
      </motion.button>)}
    </div>
  </section>
}

function Modal({ p, onClose, onAdd }: { p: Product | null; onClose: () => void; onAdd: (p: Product) => void }) {
  if (!p) return null
  return <div className="modal"><button className="modalBack" onClick={onClose} aria-label="Đóng" /><div className="modalCard"><button className="close" onClick={onClose}>×</button><div className="modalImageWrap"><img src={p.image_url || ''} alt={p.name} /><ProductBadges p={p} /></div><div className="modalCopy"><div className="kicker">{p.category}</div><h3 className="serif">{p.name}</h3><div className="modalPrice serif">{priceText(p)}</div><p>{p.description || "Ảnh sản phẩm thật từ Sky's house. Nhắn Zalo hoặc Facebook để hỏi giá và tình trạng hàng."}</p><div className="modalActions"><button className="modalAddButton" type="button" onClick={() => onAdd(p)} disabled={!p.in_stock}>{p.in_stock ? '＋ Thêm vào giỏ' : 'Tạm hết hàng'}</button><a href={`${SHOP.zalo}?text=${encodeURIComponent(`Chào Sky's house, mình muốn hỏi ${p.name}`)}`} target="_blank">Nhắn Zalo</a><a href={`tel:${SHOP.phone}`}>Gọi đặt hàng</a><a href={SHOP.facebook} target="_blank">Facebook</a></div></div></div></div>
}

function Catalog({ products, selected, onSelect, onClose, onAdd }: { products: Product[]; selected: Product | null; onSelect: (p: Product) => void; onClose: () => void; onAdd: (p: Product) => void }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Tất cả')
  const cats = useMemo(() => ['Tất cả', ...Array.from(new Set(products.map(p => p.category))).sort()], [products])
  const shown = products.filter(p => (cat === 'Tất cả' || p.category === cat) && (`${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase())))
  return <section id="catalog" className="catalog"><div className="catalogHead"><div><div className="over">The collection</div><h2 className="serif">Tất cả món ngon<br /><i>của Sky's house.</i></h2><p>Ảnh thật, giá bán lẻ hiện tại và liên hệ trực tiếp. Món chưa có giá sẽ hiển thị “Liên hệ giá” để tránh niêm yết sai.</p></div><div className="tools"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm sản phẩm..." /><select value={cat} onChange={e => setCat(e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select></div></div><div className="grid">{shown.map(p => <button className="card" key={p.id} onClick={() => onSelect(p)}><div className="cardImg"><img src={p.image_url || ''} loading="lazy" alt={p.name} /><span>{p.in_stock ? 'Còn hàng' : 'Liên hệ'}</span><em>Sky's house</em><ProductBadges p={p} /></div><div className="cardBody"><small>{p.category}</small><h3 className="serif">{p.name}</h3><div className="cardBottom"><b>{priceText(p)}</b><span>Xem →</span></div></div></button>)}</div><Modal p={selected} onClose={onClose} onAdd={onAdd} /></section>
}

function CartDrawer({ open, products, cart, onClose, onChange, onRemove, onClear }: { open: boolean; products: Product[]; cart: CartMap; onClose: () => void; onChange: (id: number, qty: number) => void; onRemove: (id: number) => void; onClear: () => void }) {
  const [copied, setCopied] = useState(false)
  const items = products.filter(p => (cart[String(p.id)] || 0) > 0)
  const total = items.reduce((sum, p) => sum + (p.price == null ? 0 : p.price * (cart[String(p.id)] || 0)), 0)
  const hasUnknown = items.some(p => p.price == null)
  const orderText = items.length ? [
    "Chào Sky's house, mình muốn đặt các món:",
    ...items.map((p, i) => `${i + 1}. ${p.name} ×${cart[String(p.id)] || 0} — ${priceText(p)}`),
    '',
    total > 0 ? `Tạm tính các món đã có giá: ${money(total)}` : '',
    hasUnknown ? 'Có món đang để Liên hệ giá.' : '',
    'Nhờ Sky xác nhận tồn kho và tổng tiền giúp mình nhé.',
  ].filter(Boolean).join('\n') : ''

  const copyOrder = async () => {
    if (!orderText) return
    try {
      await navigator.clipboard.writeText(orderText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return <AnimatePresence>{open && <motion.div className="cartLayer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <button className="cartBackdrop" aria-label="Đóng giỏ hàng" onClick={onClose} />
    <motion.aside className="cartDrawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
      <div className="cartHeader"><div><span>Sky's house</span><h2 className="serif">Giỏ hàng của ní.</h2></div><button type="button" onClick={onClose} aria-label="Đóng">×</button></div>
      <p className="cartHint">Gom nhiều món ở đây rồi gửi một lần cho Sky xác nhận. Không thanh toán online.</p>
      <div className="cartItems">
        {items.length === 0 && <div className="cartEmpty"><b>Giỏ đang trống.</b><span>Mở một sản phẩm rồi bấm “Thêm vào giỏ”.</span></div>}
        {items.map(p => {
          const qty = cart[String(p.id)] || 0
          return <div className="cartItem" key={p.id}>
            <img src={p.image_url || ''} alt={p.name} />
            <div className="cartItemMain"><small>{p.category}</small><strong>{p.name}</strong><span>{priceText(p)}</span><div className="qtyControl"><button type="button" onClick={() => onChange(p.id, qty - 1)}>−</button><b>{qty}</b><button type="button" onClick={() => onChange(p.id, qty + 1)}>＋</button></div></div>
            <button className="removeCartItem" type="button" onClick={() => onRemove(p.id)}>Xóa</button>
          </div>
        })}
      </div>
      {items.length > 0 && <div className="cartFooter">
        <div className="cartTotal"><span>Tạm tính</span><b className="serif">{total > 0 ? money(total) : 'Liên hệ giá'}</b></div>
        {hasUnknown && <p>Có món chưa niêm yết giá; Sky sẽ xác nhận lại khi nhận danh sách.</p>}
        <a className="cartPrimary" href={`${SHOP.zalo}?text=${encodeURIComponent(orderText)}`} target="_blank">Gửi danh sách qua Zalo</a>
        <div className="cartSecondary"><button type="button" onClick={copyOrder}>{copied ? 'Đã sao chép ✓' : 'Sao chép danh sách'}</button><a href={`tel:${SHOP.phone}`}>Gọi Sky</a></div>
        <button className="clearCart" type="button" onClick={onClear}>Xóa toàn bộ giỏ</button>
      </div>}
    </motion.aside>
  </motion.div>}</AnimatePresence>
}

function Contact() {
  return <section id="contact" className="contact"><div><div className="kicker">Liên hệ đặt hàng</div><h2 className="serif">Thấy món ưng ý,<br /><i>liên hệ liền ní.</i></h2><p>Không cần tài khoản, không thanh toán online. Có thể gom nhiều món vào giỏ rồi gửi danh sách một lần để Sky's house xác nhận giá và tồn kho.</p></div><div className="contactLinks"><a href={`tel:${SHOP.phone}`}><b>Gọi điện</b><span>{SHOP.phoneDisplay}</span></a><a href={SHOP.zalo} target="_blank"><b>Zalo</b><span>Thiên-Milo</span></a><a href={SHOP.facebook} target="_blank"><b>Facebook</b><span>Sky's house</span></a></div></section>
}

export default function Storefront() {
  const [theme, setTheme] = useState<Theme>('fruit')
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartMap>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      return raw ? JSON.parse(raw) as CartMap : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch { /* ignore storage errors */ }
  }, [cart])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!supabase) { setError('Storefront chưa kết nối Supabase.'); return }
      const { data, error } = await supabase.from('products').select('id,name,price,price_label,unit,category,description,image_url,in_stock,visible,best_seller,signature,sort_order').eq('visible', true).order('sort_order', { ascending: true }).order('id', { ascending: true })
      if (!alive) return
      if (error) setError(error.message)
      else setProducts((data ?? []) as Product[])
    }
    load()
    return () => { alive = false }
  }, [])

  const addToCart = (p: Product) => {
    if (!p.in_stock) return
    setCart(current => ({ ...current, [String(p.id)]: Math.min((current[String(p.id)] || 0) + 1, 99) }))
  }
  const changeCartQty = (id: number, qty: number) => {
    setCart(current => {
      const next = { ...current }
      if (qty <= 0) delete next[String(id)]
      else next[String(id)] = Math.min(qty, 99)
      return next
    })
  }
  const removeFromCart = (id: number) => setCart(current => {
    const next = { ...current }
    delete next[String(id)]
    return next
  })
  const clearCart = () => setCart({})
  const cartCount = products.reduce((sum, p) => sum + (cart[String(p.id)] || 0), 0)

  const bySort = (n: number) => products.find(p => p.sort_order === n)
  const byCategory = (needle: string) => products.find(p => p.category.toLowerCase().includes(needle.toLowerCase()))
  const fallback = products[0]
  const showcaseProducts = [bySort(96) || byCategory('Đồ sấy') || fallback, bySort(109) || byCategory('Mứt') || fallback, bySort(70) || byCategory('Hạt') || fallback, bySort(17) || byCategory('Đồ khô') || fallback]
  const bestSellers = products.filter(p => p.best_seller)
  const signatures = products.filter(p => p.signature)
  const showcases: ShowcaseData[] = fallback ? [
    { id: 'dried', theme: 'dried', kicker: 'Đồ sấy chọn lọc', watermark: 'DRIED', subtitle: 'Giòn rụm.\nĐậm vị Đà Lạt.', description: 'Đồ sấy giòn thơm, chọn từ những món được yêu thích.\nMột món ăn vặt đơn giản nhưng rất dễ ghiền.', product: showcaseProducts[0] },
    { id: 'fruit', theme: 'fruit', kicker: 'Mứt & trái cây', watermark: 'FRUIT', subtitle: 'Thanh nhẹ.\nDẻo ngon. Tinh tế.', description: 'Mứt và trái cây sấy cân bằng vị, dễ ăn và dễ chọn.\nMột lựa chọn rất “Sky’s house”.', product: showcaseProducts[1] },
    { id: 'nuts', theme: 'nuts', kicker: 'Hạt cao cấp', watermark: 'NUTS', subtitle: 'Bùi béo.\nChọn hạt thật ngon.', description: 'Các loại hạt tuyển chọn cho những lúc cần một món nhâm nhi\nvừa ngon vừa sang để biếu tặng.', product: showcaseProducts[2] },
    { id: 'deli', theme: 'deli', kicker: 'Đồ khô & đặc sản', watermark: 'DELI', subtitle: 'Đậm đà.\nĂn là nhớ.', description: 'Từ khô gà lá chanh đến các món đặc sản ăn vặt.\nƯu tiên ảnh thật, vị thật và liên hệ trực tiếp.', product: showcaseProducts[3] },
  ] : []

  return <><AnimatePresence mode="wait"><motion.div key={theme} style={{ position: 'fixed', inset: 0, zIndex: -10, background: gradients[theme] }} initial={{ opacity: .7 }} animate={{ opacity: 1 }} exit={{ opacity: .85 }} transition={{ duration: .2 }} /></AnimatePresence><Navbar theme={theme} cartCount={cartCount} onOpenCart={() => setCartOpen(true)} /><Intro />{error && <section className="catalog"><div className="adminMessage">Không tải được catalog: {error}</div></section>}{!error && products.length === 0 && <section className="catalog"><div className="adminMessage">Đang tải sản phẩm…</div></section>}{showcases.map(s => <Showcase key={s.id} s={s} onActive={setTheme} />)}<HighlightSection kind="best" products={bestSellers} onSelect={setSelected} /><HighlightSection kind="signature" products={signatures} onSelect={setSelected} />{products.length > 0 && <Catalog products={products} selected={selected} onSelect={setSelected} onClose={() => setSelected(null)} onAdd={addToCart} />}<Contact /><CartDrawer open={cartOpen} products={products} cart={cart} onClose={() => setCartOpen(false)} onChange={changeCartQty} onRemove={removeFromCart} onClear={clearCart} /></>
}
