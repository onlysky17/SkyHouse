import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'

type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'completed' | 'cancelled'

type TrackItem = {
  name?: string
  qty?: number
  price_text?: string
  price?: number | null
}

type TrackOrderRow = {
  id: number
  status: OrderStatus
  customer_name: string
  customer_note: string
  items: TrackItem[]
  subtotal_known: number
  shipping_fee: number
  final_total: number | null
  has_contact_price: boolean
  created_at: string
  updated_at: string
}

const statusMeta: Record<OrderStatus, { label: string; note: string }> = {
  new: { label: 'Đơn mới', note: 'Sky’s house đã nhận đơn và đang kiểm tra hàng.' },
  confirmed: { label: 'Đã xác nhận', note: 'Đơn đã được xác nhận và đang chuẩn bị.' },
  shipping: { label: 'Đang giao', note: 'Đơn đang trên đường đến ní.' },
  completed: { label: 'Hoàn tất', note: 'Đơn đã hoàn tất. Cảm ơn ní đã ủng hộ Sky’s house.' },
  cancelled: { label: 'Đã hủy', note: 'Đơn này đã được hủy.' },
}

const progressSteps: Array<{ status: Exclude<OrderStatus, 'cancelled'>; label: string }> = [
  { status: 'new', label: 'Đã nhận đơn' },
  { status: 'confirmed', label: 'Đã xác nhận' },
  { status: 'shipping', label: 'Đang giao' },
  { status: 'completed', label: 'Hoàn tất' },
]

function money(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(value))
  } catch {
    return value
  }
}

function prefillCustomer() {
  try {
    const raw = localStorage.getItem('skyhouse_customer_info_v1')
    if (!raw) return { name: '', phone: '' }
    const parsed = JSON.parse(raw) as { name?: string; phone?: string }
    return { name: parsed.name || '', phone: parsed.phone || '' }
  } catch {
    return { name: '', phone: '' }
  }
}

function OrderCard({ order }: { order: TrackOrderRow }) {
  const meta = statusMeta[order.status]
  const activeIndex = order.status === 'cancelled' ? -1 : progressSteps.findIndex(step => step.status === order.status)
  const items = Array.isArray(order.items) ? order.items : []
  const payable = order.final_total != null
    ? money(order.final_total)
    : order.has_contact_price
      ? 'Sky sẽ xác nhận tổng tiền'
      : money(Number(order.subtotal_known || 0) + Number(order.shipping_fee || 0))

  return <article className={`trackCard ${order.status === 'cancelled' ? 'cancelled' : ''}`}>
    <div className="trackCardHead">
      <div><small>MÃ ĐƠN</small><h2>#{order.id}</h2><span>{formatDate(order.created_at)}</span></div>
      <div className={`trackStatus ${order.status}`}><b>{meta.label}</b><span>{meta.note}</span></div>
    </div>

    {order.status !== 'cancelled' && <div className="trackProgress" aria-label="Tiến độ đơn hàng">
      {progressSteps.map((step, index) => <div className={`trackStep ${index <= activeIndex ? 'done' : ''}`} key={step.status}>
        <i>{index < activeIndex ? '✓' : index + 1}</i><span>{step.label}</span>
      </div>)}
    </div>}

    <div className="trackOrderGrid">
      <section className="trackItems">
        <div className="trackSectionTitle"><span>Danh sách món</span><b>{items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)} món</b></div>
        {items.map((item, index) => <div className="trackItem" key={`${order.id}-${index}`}>
          <div><small>Món {index + 1}</small><strong>{item.name || 'Sản phẩm'}</strong></div>
          <div><b>×{Number(item.qty) || 0}</b><span>{item.price_text || (item.price == null ? 'Liên hệ giá' : money(Number(item.price)))}</span></div>
        </div>)}
      </section>

      <aside className="trackSummary">
        <div><span>Tạm tính</span><b>{order.subtotal_known > 0 ? money(order.subtotal_known) : 'Liên hệ giá'}</b></div>
        <div><span>Phí giao hàng</span><b>{order.shipping_fee > 0 ? money(order.shipping_fee) : 'Chưa chốt'}</b></div>
        <div className="total"><span>Tổng đơn</span><b>{payable}</b></div>
        {order.customer_note && <div className="trackNote"><span>Giao nhận / ghi chú</span><p>{order.customer_note}</p></div>}
      </aside>
    </div>
  </article>
}

function directOrderIdFromLocation() {
  try {
    const raw = new URLSearchParams(location.search).get('order')
    if (!raw || !/^\d+$/.test(raw)) return null
    const id = Number(raw)
    return Number.isSafeInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export default function TrackOrder() {
  const initial = useMemo(prefillCustomer, [])
  const directOrderId = useMemo(directOrderIdFromLocation, [])
  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone)
  const [orders, setOrders] = useState<TrackOrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = directOrderId ? `Đơn #${directOrderId} · Sky's house` : "Tra cứu đơn · Sky's house"
  }, [directOrderId])

  useEffect(() => {
    if (!directOrderId || !initial.phone.trim() || !supabase) return
    let cancelled = false

    const openDirectOrder = async () => {
      setLoading(true)
      setError('')
      setSearched(false)
      const { data, error: rpcError } = await supabase.rpc('track_order', {
        p_order_id: directOrderId,
        p_phone: initial.phone.trim(),
      })
      if (cancelled) return

      setLoading(false)
      setSearched(true)
      if (rpcError) {
        setOrders([])
        setError('Chưa mở được đơn lúc này. Ní thử lại sau một chút nhé.')
        return
      }
      setOrders((data ?? []) as TrackOrderRow[])
    }

    void openDirectOrder()
    return () => { cancelled = true }
  }, [directOrderId, initial.phone])

  const lookup = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSearched(false)

    if (directOrderId) {
      if (!phone.trim()) {
        setError(`Nhập số điện thoại đã dùng khi đặt đơn #${directOrderId} nhé.`)
        return
      }
    } else if (!name.trim() || !phone.trim()) {
      setError('Nhập đúng tên người đặt và số điện thoại để tra cứu nhé.')
      return
    }

    if (!supabase) {
      setError('Hệ thống tra cứu đang tạm unavailable. Thử lại sau giúp Sky nhé.')
      return
    }

    setLoading(true)
    const { data, error: rpcError } = directOrderId
      ? await supabase.rpc('track_order', {
          p_order_id: directOrderId,
          p_phone: phone.trim(),
        })
      : await supabase.rpc('track_orders', {
          p_phone: phone.trim(),
          p_customer_name: name.trim(),
        })
    setLoading(false)
    setSearched(true)

    if (rpcError) {
      setOrders([])
      setError('Chưa tra cứu được lúc này. Ní thử lại sau một chút nhé.')
      return
    }
    setOrders((data ?? []) as TrackOrderRow[])
  }

  return <main className="trackPage">
    <header className="trackNav"><a className="serif" href="/">SKY'S HOUSE</a><a href="/">← Về cửa hàng</a></header>

    <section className="trackHero">
      <div className="trackEyebrow">Order tracking</div>
      <h1 className="serif">{directOrderId ? <>Theo dõi<br /><i>đơn #{directOrderId}.</i></> : <>Tra cứu<br /><i>đơn của ní.</i></>}</h1>
      <p>{directOrderId
        ? <>Đây là link theo dõi riêng cho đơn <b>#{directOrderId}</b>. Trên máy vừa đặt hàng, hệ thống sẽ dùng số điện thoại đã lưu để mở đơn tự động; nếu chưa có thì chỉ cần nhập số điện thoại.</>
        : <>Nhập đúng <b>tên người đặt + số điện thoại</b>. Hệ thống chỉ trả về những đơn khớp cả hai thông tin.</>}</p>

      <form className="trackForm" onSubmit={lookup}>
        {!directOrderId && <label><span>Tên người đặt</span><input value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="Ví dụ: Thiên" /></label>}
        <label><span>Số điện thoại</span><input value={phone} onChange={event => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="Số đã dùng khi đặt hàng" /></label>
        <button type="submit" disabled={loading}>{loading ? 'Đang tra cứu…' : directOrderId ? `Mở đơn #${directOrderId}` : 'Tra cứu đơn'}</button>
      </form>
      {directOrderId && <p><a href="/track">Tra cứu đơn khác →</a></p>}
      {error && <div className="trackError">{error}</div>}
    </section>

    <section className="trackResults">
      {searched && !error && orders.length === 0 && <div className="trackEmpty"><b>{directOrderId ? `Không mở được đơn #${directOrderId}.` : 'Chưa thấy đơn phù hợp.'}</b><span>{directOrderId ? 'Kiểm tra đúng số điện thoại đã dùng khi đặt đơn.' : 'Kiểm tra lại đúng tên người đặt và số điện thoại. Nếu vừa đặt xong, thử tải lại sau vài giây.'}</span></div>}
      {orders.length > 0 && <div className="trackResultsHead"><div><small>{directOrderId ? 'Đơn đang theo dõi' : 'Đơn gần đây'}</small><h2 className="serif">{directOrderId ? `Đơn #${directOrderId}` : `Tìm thấy ${orders.length} đơn.`}</h2></div><p>{directOrderId ? 'Trạng thái mới nhất của đơn.' : 'Hiển thị tối đa 5 đơn mới nhất.'}</p></div>}
      <div className="trackCards">{orders.map(order => <OrderCard key={order.id} order={order} />)}</div>
    </section>

    <footer className="trackFooter"><span>Sky's house</span><a href="tel:0786646634">0786 646 634</a><a href="https://zalo.me/0786646634" target="_blank" rel="noreferrer">Zalo</a></footer>
  </main>
}
