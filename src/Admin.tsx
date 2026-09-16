import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase'

type ProductRow = {
  id?: number
  name: string
  price: number | null
  unit: string
  category: string
  description: string
  image_url: string
  in_stock: boolean
  visible: boolean
  sort_order: number
}

const emptyProduct: ProductRow = {
  name: '',
  price: null,
  unit: 'kg',
  category: 'Sản phẩm khác',
  description: '',
  image_url: '',
  in_stock: true,
  visible: true,
  sort_order: 0,
}

export default function Admin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [draft, setDraft] = useState<ProductRow>(emptyProduct)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')

  async function loadProducts() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('products')
      .select('id,name,price,unit,category,description,image_url,in_stock,visible,sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
    if (error) {
      setMessage(`Không tải được sản phẩm: ${error.message}`)
      return
    }
    setProducts((data ?? []) as ProductRow[])
  }

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const nextEmail = data.session?.user.email ?? null
      setUserEmail(nextEmail)
      if (nextEmail) loadProducts()
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextEmail = session?.user.email ?? null
      setUserEmail(nextEmail)
      if (nextEmail) loadProducts()
      else setProducts([])
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q))
  }, [products, query])

  async function login(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setMessage(error.message)
  }

  async function logout() {
    if (!supabase) return
    await supabase.auth.signOut()
    setDraft(emptyProduct)
  }

  async function uploadImage(file: File) {
    if (!supabase) return null
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw error
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (!draft.name.trim()) {
      setMessage('Tên sản phẩm đang trống.')
      return
    }
    setBusy(true)
    setMessage('')
    const payload = { ...draft, name: draft.name.trim() }
    const result = draft.id
      ? await supabase.from('products').update(payload).eq('id', draft.id)
      : await supabase.from('products').insert(payload)
    setBusy(false)
    if (result.error) {
      setMessage(result.error.message)
      return
    }
    setMessage(draft.id ? 'Đã lưu thay đổi.' : 'Đã thêm sản phẩm.')
    setDraft(emptyProduct)
    await loadProducts()
  }

  async function removeProduct() {
    if (!supabase || !draft.id) return
    if (!window.confirm(`Xóa “${draft.name}”?`)) return
    setBusy(true)
    const { error } = await supabase.from('products').delete().eq('id', draft.id)
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setDraft(emptyProduct)
    await loadProducts()
  }

  if (!supabaseConfigured) {
    return (
      <main className="adminPage">
        <section className="adminSetup">
          <div className="adminEyebrow">SKY'S HOUSE · ADMIN</div>
          <h1 className="serif">Admin đã sẵn sàng,<br />còn thiếu kết nối Supabase.</h1>
          <p>Source không chứa secret. Khi có Supabase project, chỉ cần thêm hai biến môi trường vào Vercel rồi chạy schema trong thư mục <code>supabase/</code>.</p>
          <div className="adminChecklist">
            <span>1. VITE_SUPABASE_URL</span>
            <span>2. VITE_SUPABASE_ANON_KEY</span>
            <span>3. Chạy supabase/schema.sql</span>
            <span>4. Tạo tài khoản admin trong Supabase Auth</span>
          </div>
          <a className="adminBack" href="/">← Về cửa hàng</a>
        </section>
      </main>
    )
  }

  if (!userEmail) {
    return (
      <main className="adminPage">
        <form className="adminLogin" onSubmit={login}>
          <div className="adminEyebrow">SKY'S HOUSE · ADMIN</div>
          <h1 className="serif">Đăng nhập quản trị.</h1>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Mật khẩu<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
          {message && <p className="adminMessage">{message}</p>}
          <a className="adminBack" href="/">← Về cửa hàng</a>
        </form>
      </main>
    )
  }

  return (
    <main className="adminPage adminDashboard">
      <header className="adminTopbar">
        <div><div className="adminEyebrow">SKY'S HOUSE</div><b>Quản lý sản phẩm</b></div>
        <div className="adminUser"><span>{userEmail}</span><button onClick={logout}>Đăng xuất</button></div>
      </header>

      <section className="adminLayout">
        <aside className="adminList">
          <div className="adminListHead">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm sản phẩm…" />
            <button onClick={() => setDraft(emptyProduct)}>+ Thêm</button>
          </div>
          <div className="adminItems">
            {shown.map((p) => (
              <button key={p.id} className={draft.id === p.id ? 'active' : ''} onClick={() => setDraft(p)}>
                <span>{p.image_url ? <img src={p.image_url} alt="" /> : <i>Ảnh</i>}</span>
                <div><b>{p.name}</b><small>{p.category} · {p.price == null ? 'Liên hệ giá' : `${p.price.toLocaleString('vi-VN')}đ/${p.unit}`}</small></div>
              </button>
            ))}
          </div>
        </aside>

        <form className="adminEditor" onSubmit={saveProduct}>
          <div className="adminEditorTitle"><div><div className="adminEyebrow">{draft.id ? `SẢN PHẨM #${draft.id}` : 'SẢN PHẨM MỚI'}</div><h2 className="serif">{draft.id ? draft.name : 'Thêm sản phẩm'}</h2></div>{draft.id && <button type="button" className="danger" onClick={removeProduct}>Xóa</button>}</div>
          <div className="adminFormGrid">
            <label className="wide">Tên sản phẩm<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <label>Giá<input type="number" min="0" value={draft.price ?? ''} onChange={(e) => setDraft({ ...draft, price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Để trống = Liên hệ giá" /></label>
            <label>Đơn vị<input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="kg / gói 500g / hũ…" /></label>
            <label className="wide">Danh mục<input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></label>
            <label className="wide">Mô tả<textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            <label>Thứ tự<input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></label>
            <label>Ảnh sản phẩm<input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                setBusy(true)
                const url = await uploadImage(file)
                if (url) setDraft((d) => ({ ...d, image_url: url }))
              } catch (err) {
                setMessage(err instanceof Error ? err.message : 'Upload ảnh thất bại')
              } finally {
                setBusy(false)
              }
            }} /></label>
            <label className="wide">URL ảnh<input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} /></label>
          </div>
          {draft.image_url && <img className="adminPreview" src={draft.image_url} alt="Preview" />}
          <div className="adminToggles">
            <label><input type="checkbox" checked={draft.in_stock} onChange={(e) => setDraft({ ...draft, in_stock: e.target.checked })} /> Còn hàng</label>
            <label><input type="checkbox" checked={draft.visible} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} /> Hiển thị trên web</label>
          </div>
          <div className="adminActions"><button disabled={busy}>{busy ? 'Đang xử lý…' : 'Lưu sản phẩm'}</button><button type="button" className="secondary" onClick={() => setDraft(emptyProduct)}>Hủy / tạo mới</button></div>
          {message && <p className="adminMessage">{message}</p>}
        </form>
      </section>
    </main>
  )
}
