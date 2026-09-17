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
  sort_order: number
}

type Theme = 'dried' | 'fruit' | 'nuts' | 'deli'

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

function Navbar({ theme }: { theme: Theme }) {
  const light = theme === 'fruit' || theme === 'nuts'
  return <header style={{ position: 'fixed', inset: '0 0 auto', zIndex: 50, padding: '10px 10px 0' }}>
    <div className="navshell" style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 999, padding: '10px 14px', border: `1px solid ${light ? 'rgba(42,24,16,.10)' : 'rgba(255,255,255,.10)'}`, background: light ? 'rgba(255,248,236,.90)' : 'rgba(8,4,3,.42)', backdropFilter: 'blur(18px)', boxShadow: '0 10px 30px rgba(0,0,0,.12)', color: light ? '#2A1810' : 'white' }}>
      <a href="#top" className="serif" style={{ fontWeight: 900, letterSpacing: '.13em', fontSize: 'clamp(14px,4vw,22px)', whiteSpace: 'nowrap' }}>SKY'S HOUSE</a>
      <a href={`tel:${SHOP.phone}`} style={{ border: '1px solid currentColor', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{SHOP.phoneDisplay}</a>
    </div>
  </header>
}

function Intro() {
  return <section id="top" style={{ minHeight: '100dvh', scrollSnapAlign: 'start', background: '#f7f0e5', color: '#24160f', padding: '110px 20px 36px', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
    <div style={{ maxWidth: 1000, textAlign: 'center', position: 'relative', zIndex: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.32em', textTransform: 'uppercase', color: '#c85b2f', marginBottom: 24 }}>Sky's house · catalog</div>
      <h1 className="serif" style={{ fontSize: 'clamp(54px,14vw,124px)', lineHeight: .9, letterSpacing: '-.05em', margin: 0, fontWeight: 900 }}>Thấy món ưng ý,<br /><i style={{ fontWeight: 600 }}>liên hệ liền ní.</i></h1>
      <p style={{ maxWidth: 680, margin: '30px auto 0', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.7, color: 'rgba(36,22,15,.64)' }}>Đặc sản, đồ sấy, hạt và món ăn vặt chọn lọc. Xem ảnh thật, giá rõ ràng và liên hệ trực tiếp với Sky's house khi cần đặt hàng.</p>
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
        <div className="productFloat"><img src={s.product.image_url || ''} alt={s.product.name} /><span className="wm">Sky's house</span></div>
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

function Modal({ p, onClose }: { p: Product | null; onClose: () => void }) {
  if (!p) return null
  return <div className="modal"><button className="modalBack" onClick={onClose} aria-label="Đóng" /><div className="modalCard"><button className="close" onClick={onClose}>×</button><img src={p.image_url || ''} alt={p.name} /><div className="modalCopy"><div className="kicker">{p.category}</div><h3 className="serif">{p.name}</h3><div className="modalPrice serif">{priceText(p)}</div><p>{p.description || "Ảnh sản phẩm thật từ Sky's house. Nhắn Zalo hoặc Facebook để hỏi giá và tình trạng hàng."}</p><div className="modalActions"><a href={`${SHOP.zalo}?text=${encodeURIComponent(`Chào Sky's house, mình muốn hỏi ${p.name}`)}`} target="_blank">Nhắn Zalo</a><a href={`tel:${SHOP.phone}`}>Gọi đặt hàng</a><a href={SHOP.facebook} target="_blank">Facebook</a></div></div></div></div>
}

function Catalog({ products }: { products: Product[] }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Tất cả')
  const [sel, setSel] = useState<Product | null>(null)
  const cats = useMemo(() => ['Tất cả', ...Array.from(new Set(products.map(p => p.category))).sort()], [products])
  const shown = products.filter(p => (cat === 'Tất cả' || p.category === cat) && (`${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase())))
  return <section id="catalog" className="catalog"><div className="catalogHead"><div><div className="over">The collection</div><h2 className="serif">Tất cả món ngon<br /><i>của Sky's house.</i></h2><p>Ảnh thật, giá bán lẻ hiện tại và liên hệ trực tiếp. Món chưa có giá sẽ hiển thị “Liên hệ giá” để tránh niêm yết sai.</p></div><div className="tools"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm sản phẩm..." /><select value={cat} onChange={e => setCat(e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select></div></div><div className="grid">{shown.map(p => <button className="card" key={p.id} onClick={() => setSel(p)}><div className="cardImg"><img src={p.image_url || ''} loading="lazy" alt={p.name} /><span>{p.in_stock ? 'Còn hàng' : 'Liên hệ'}</span><em>Sky's house</em></div><div className="cardBody"><small>{p.category}</small><h3 className="serif">{p.name}</h3><div className="cardBottom"><b>{priceText(p)}</b><span>Xem →</span></div></div></button>)}</div><Modal p={sel} onClose={() => setSel(null)} /></section>
}

function Contact() {
  return <section id="contact" className="contact"><div><div className="kicker">Liên hệ đặt hàng</div><h2 className="serif">Thấy món ưng ý,<br /><i>liên hệ liền ní.</i></h2><p>Không cần tài khoản, không thanh toán online. Gửi tên món hoặc ảnh chụp màn hình để Sky's house xác nhận giá và tồn kho trực tiếp.</p></div><div className="contactLinks"><a href={`tel:${SHOP.phone}`}><b>Gọi điện</b><span>{SHOP.phoneDisplay}</span></a><a href={SHOP.zalo} target="_blank"><b>Zalo</b><span>Thiên-Milo</span></a><a href={SHOP.facebook} target="_blank"><b>Facebook</b><span>Sky's house</span></a></div></section>
}

export default function Storefront() {
  const [theme, setTheme] = useState<Theme>('fruit')
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      if (!supabase) { setError('Storefront chưa kết nối Supabase.'); return }
      const { data, error } = await supabase.from('products').select('id,name,price,price_label,unit,category,description,image_url,in_stock,visible,sort_order').eq('visible', true).order('sort_order', { ascending: true }).order('id', { ascending: true })
      if (!alive) return
      if (error) setError(error.message)
      else setProducts((data ?? []) as Product[])
    }
    load()
    return () => { alive = false }
  }, [])

  const bySort = (n: number) => products.find(p => p.sort_order === n)
  const byCategory = (needle: string) => products.find(p => p.category.toLowerCase().includes(needle.toLowerCase()))
  const fallback = products[0]
  const showcaseProducts = [bySort(96) || byCategory('Đồ sấy') || fallback, bySort(109) || byCategory('Mứt') || fallback, bySort(70) || byCategory('Hạt') || fallback, bySort(17) || byCategory('Đồ khô') || fallback]
  const showcases: ShowcaseData[] = fallback ? [
    { id: 'dried', theme: 'dried', kicker: 'Đồ sấy chọn lọc', watermark: 'DRIED', subtitle: 'Giòn rụm.\nĐậm vị Đà Lạt.', description: 'Đồ sấy giòn thơm, chọn từ những món được yêu thích.\nMột món ăn vặt đơn giản nhưng rất dễ ghiền.', product: showcaseProducts[0] },
    { id: 'fruit', theme: 'fruit', kicker: 'Mứt & trái cây', watermark: 'FRUIT', subtitle: 'Thanh nhẹ.\nDẻo ngon. Tinh tế.', description: 'Mứt và trái cây sấy cân bằng vị, dễ ăn và dễ chọn.\nMột lựa chọn rất “Sky’s house”.', product: showcaseProducts[1] },
    { id: 'nuts', theme: 'nuts', kicker: 'Hạt cao cấp', watermark: 'NUTS', subtitle: 'Bùi béo.\nChọn hạt thật ngon.', description: 'Các loại hạt tuyển chọn cho những lúc cần một món nhâm nhi\nvừa ngon vừa sang để biếu tặng.', product: showcaseProducts[2] },
    { id: 'deli', theme: 'deli', kicker: 'Đồ khô & đặc sản', watermark: 'DELI', subtitle: 'Đậm đà.\nĂn là nhớ.', description: 'Từ khô gà lá chanh đến các món đặc sản ăn vặt.\nƯu tiên ảnh thật, vị thật và liên hệ trực tiếp.', product: showcaseProducts[3] },
  ] : []

  return <><AnimatePresence mode="wait"><motion.div key={theme} style={{ position: 'fixed', inset: 0, zIndex: -10, background: gradients[theme] }} initial={{ opacity: .7 }} animate={{ opacity: 1 }} exit={{ opacity: .85 }} transition={{ duration: .2 }} /></AnimatePresence><Navbar theme={theme} /><Intro />{error && <section className="catalog"><div className="adminMessage">Không tải được catalog: {error}</div></section>}{!error && products.length === 0 && <section className="catalog"><div className="adminMessage">Đang tải sản phẩm…</div></section>}{showcases.map(s => <Showcase key={s.id} s={s} onActive={setTheme} />)}{products.length > 0 && <Catalog products={products} />}<Contact /></>
}
