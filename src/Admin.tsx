import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
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
  best_seller: boolean
  signature: boolean
  sort_order: number
}

type UploadedImage = {
  url: string
  path: string
}

type CatalogFilter = 'all' | 'placeholder' | 'no-price' | 'needs-work' | 'best-seller' | 'signature'

const emptyProduct: ProductRow = {
  name: '',
  price: null,
  unit: 'kg',
  category: 'Sản phẩm khác',
  description: '',
  image_url: '',
  in_stock: true,
  visible: true,
  best_seller: false,
  signature: false,
  sort_order: 0,
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const STORAGE_PUBLIC_MARKER = '/storage/v1/object/public/product-images/'

function isPlaceholderName(name: string) {
  return /^Sản phẩm\s+\d+$/i.test(name.trim())
}

function storagePathFromPublicUrl(url: string) {
  const markerIndex = url.indexOf(STORAGE_PUBLIC_MARKER)
  if (markerIndex === -1) return null
  const rawPath = url.slice(markerIndex + STORAGE_PUBLIC_MARKER.length).split('?')[0]
  if (!rawPath) return null
  try {
    return decodeURIComponent(rawPath)
  } catch {
    return rawPath
  }
}

export default function Admin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [draft, setDraft] = useState<ProductRow>({ ...emptyProduct })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('all')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState('')
  const [initialImageUrl, setInitialImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (localPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  async function loadProducts() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('products')
      .select('id,name,price,unit,category,description,image_url,in_stock,visible,best_seller,signature,sort_order')
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

  const catalogCounts = useMemo(() => {
    const placeholder = products.filter((p) => isPlaceholderName(p.name)).length
    const noPrice = products.filter((p) => p.price == null).length
    const needsWork = products.filter((p) => isPlaceholderName(p.name) || p.price == null).length
    const bestSeller = products.filter((p) => p.best_seller).length
    const signature = products.filter((p) => p.signature).length
    return {
      all: products.length,
      placeholder,
      noPrice,
      needsWork,
      bestSeller,
      signature,
    }
  }, [products])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchesFilter =
        catalogFilter === 'all' ||
        (catalogFilter === 'placeholder' && isPlaceholderName(p.name)) ||
        (catalogFilter === 'no-price' && p.price == null) ||
        (catalogFilter === 'needs-work' && (isPlaceholderName(p.name) || p.price == null)) ||
        (catalogFilter === 'best-seller' && p.best_seller) ||
        (catalogFilter === 'signature' && p.signature)

      if (!matchesFilter) return false
      if (!q) return true
      return `${p.name} ${p.category}`.toLowerCase().includes(q)
    })
  }, [products, query, catalogFilter])

  const previewSrc = localPreviewUrl || draft.image_url

  function clearLocalPreview() {
    setSelectedFile(null)
    setLocalPreviewUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function resetEditor() {
    clearLocalPreview()
    setDraft({ ...emptyProduct })
    setInitialImageUrl('')
    setMessage('')
  }

  function selectProduct(product: ProductRow) {
    clearLocalPreview()
    setDraft({ ...product })
    setInitialImageUrl(product.image_url || '')
    setMessage('')
  }

  function chooseImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('File đã chọn không phải hình ảnh.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage('Ảnh lớn hơn 8 MB. Hãy chọn ảnh nhỏ hơn để tải nhanh hơn.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const nextPreview = URL.createObjectURL(file)
    setSelectedFile(file)
    setLocalPreviewUrl(nextPreview)
    setMessage('Ảnh mới đã chọn. Bấm “Lưu sản phẩm” để tải ảnh lên.')
  }

  function changeImageUrl(value: string) {
    clearLocalPreview()
    setDraft((current) => ({ ...current, image_url: value }))
  }

  function clearImage() {
    clearLocalPreview()
    setDraft((current) => ({ ...current, image_url: '' }))
    setMessage('Ảnh sẽ được gỡ khỏi sản phẩm sau khi bấm “Lưu sản phẩm”.')
  }

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
    resetEditor()
  }

  async function uploadImage(file: File): Promise<UploadedImage> {
    if (!supabase) throw new Error('Supabase chưa sẵn sàng.')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
    if (error) throw new Error(error.message)
    const publicUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    return { url: publicUrl, path }
  }

  async function removeStorageImage(url: string) {
    if (!supabase || !url) return
    const path = storagePathFromPublicUrl(url)
    if (!path) return
    const { error } = await supabase.storage.from('product-images').remove([path])
    if (error) console.warn('Không xóa được ảnh cũ:', error.message)
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (!draft.name.trim()) {
      setMessage('Tên sản phẩm đang trống.')
      return
    }

    setBusy(true)
    setMessage(selectedFile ? 'Đang tải ảnh và lưu sản phẩm…' : 'Đang lưu sản phẩm…')
    let uploadedPath: string | null = null

    try {
      let nextImageUrl = draft.image_url.trim()
      if (selectedFile) {
        const uploaded = await uploadImage(selectedFile)
        uploadedPath = uploaded.path
        nextImageUrl = uploaded.url
      }

      const { id, ...rest } = draft
      const payload = {
        ...rest,
        name: draft.name.trim(),
        unit: draft.unit.trim() || 'kg',
        category: draft.category.trim() || 'Sản phẩm khác',
        description: draft.description.trim(),
        image_url: nextImageUrl,
        sort_order: Number.isFinite(draft.sort_order) ? draft.sort_order : 0,
      }

      const result = id
        ? await supabase.from('products').update(payload).eq('id', id)
        : await supabase.from('products').insert(payload)

      if (result.error) throw new Error(result.error.message)

      if (initialImageUrl && initialImageUrl !== nextImageUrl) {
        await removeStorageImage(initialImageUrl)
      }

      setMessage(id ? 'Đã lưu thay đổi.' : 'Đã thêm sản phẩm.')
      resetEditor()
      await loadProducts()
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage.from('product-images').remove([uploadedPath])
      }
      setMessage(err instanceof Error ? err.message : 'Không lưu được sản phẩm.')
    } finally {
      setBusy(false)
    }
  }

  async function removeProduct() {
    if (!supabase || !draft.id) return
    if (!window.confirm(`Xóa “${draft.name}”?`)) return
    setBusy(true)
    setMessage('Đang xóa sản phẩm…')
    const imageToDelete = draft.image_url
    const { error } = await supabase.from('products').delete().eq('id', draft.id)
    if (error) {
      setBusy(false)
      setMessage(error.message)
      return
    }
    await removeStorageImage(imageToDelete)
    resetEditor()
    await loadProducts()
    setBusy(false)
    setMessage('Đã xóa sản phẩm.')
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
            <button onClick={resetEditor}>+ Thêm</button>
          </div>

          <div className="adminCatalogFilters" aria-label="Lọc catalog">
            <button type="button" className={catalogFilter === 'all' ? 'active' : ''} aria-pressed={catalogFilter === 'all'} onClick={() => setCatalogFilter('all')}>
              <span>Tất cả</span><b>{catalogCounts.all}</b>
            </button>
            <button type="button" className={catalogFilter === 'best-seller' ? 'active' : ''} aria-pressed={catalogFilter === 'best-seller'} onClick={() => setCatalogFilter('best-seller')}>
              <span>Best Seller</span><b>{catalogCounts.bestSeller}</b>
            </button>
            <button type="button" className={catalogFilter === 'signature' ? 'active' : ''} aria-pressed={catalogFilter === 'signature'} onClick={() => setCatalogFilter('signature')}>
              <span>Signature</span><b>{catalogCounts.signature}</b>
            </button>
            <button type="button" className={catalogFilter === 'needs-work' ? 'active' : ''} aria-pressed={catalogFilter === 'needs-work'} onClick={() => setCatalogFilter('needs-work')}>
              <span>Cần hoàn thiện</span><b>{catalogCounts.needsWork}</b>
            </button>
            <button type="button" className={catalogFilter === 'placeholder' ? 'active' : ''} aria-pressed={catalogFilter === 'placeholder'} onClick={() => setCatalogFilter('placeholder')}>
              <span>Cần sửa tên</span><b>{catalogCounts.placeholder}</b>
            </button>
            <button type="button" className={catalogFilter === 'no-price' ? 'active' : ''} aria-pressed={catalogFilter === 'no-price'} onClick={() => setCatalogFilter('no-price')}>
              <span>Chưa có giá</span><b>{catalogCounts.noPrice}</b>
            </button>
          </div>

          <div className="adminCatalogSummary">
            Đang hiện <b>{shown.length}</b> / {products.length} sản phẩm
          </div>

          <div className="adminItems">
            {shown.map((p) => (
              <button key={p.id} className={draft.id === p.id ? 'active' : ''} onClick={() => selectProduct(p)}>
                <span>{p.image_url ? <img src={p.image_url} alt="" /> : <i>Ảnh</i>}</span>
                <div>
                  <b>{p.name}</b>
                  <small>{p.category} · {p.price == null ? 'Liên hệ giá' : `${p.price.toLocaleString('vi-VN')}đ/${p.unit}`}</small>
                  {(p.best_seller || p.signature) && <small className="adminItemFlags">{p.best_seller ? '★ Best Seller' : ''}{p.best_seller && p.signature ? ' · ' : ''}{p.signature ? '◆ Signature' : ''}</small>}
                </div>
              </button>
            ))}
            {shown.length === 0 && <div className="adminCatalogEmpty">Không có sản phẩm phù hợp bộ lọc này.</div>}
          </div>
        </aside>

        <form className="adminEditor" onSubmit={saveProduct}>
          <div className="adminEditorTitle">
            <div>
              <div className="adminEyebrow">{draft.id ? `SẢN PHẨM #${draft.id}` : 'SẢN PHẨM MỚI'}</div>
              <h2 className="serif">{draft.id ? draft.name : 'Thêm sản phẩm'}</h2>
            </div>
            {draft.id && <button type="button" className="danger" disabled={busy} onClick={removeProduct}>Xóa</button>}
          </div>

          <div className="adminFormGrid">
            <label className="wide">Tên sản phẩm<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <label>Giá<input type="number" min="0" value={draft.price ?? ''} onChange={(e) => setDraft({ ...draft, price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Để trống = Liên hệ giá" /></label>
            <label>Đơn vị<input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="kg / gói 500g / hũ…" /></label>
            <label className="wide">Danh mục<input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></label>
            <label className="wide">Mô tả<textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            <label>Thứ tự<input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></label>
            <label className="adminFileField">Ảnh sản phẩm
              <input ref={fileInputRef} type="file" accept="image/*" disabled={busy} onChange={(e) => chooseImage(e.target.files?.[0])} />
              <small>JPG, PNG, WEBP · tối đa 8 MB. Ảnh chỉ được tải lên khi bấm Lưu.</small>
            </label>
            <label className="wide">URL ảnh
              <input value={draft.image_url} onChange={(e) => changeImageUrl(e.target.value)} placeholder="Có thể dán URL ảnh trực tiếp" />
            </label>
          </div>

          <section className="adminImagePanel">
            <div className="adminImageMeta">
              <div>
                <b>{selectedFile ? 'Ảnh mới đang chờ lưu' : previewSrc ? 'Ảnh hiện tại' : 'Chưa có ảnh'}</b>
                <small>{selectedFile ? selectedFile.name : previewSrc || 'Chọn ảnh mới hoặc dán URL ảnh.'}</small>
              </div>
              {previewSrc && (
                <div className="adminImageTools">
                  {!localPreviewUrl && <a href={previewSrc} target="_blank" rel="noreferrer">Mở ảnh</a>}
                  <button type="button" className="secondary" disabled={busy} onClick={clearImage}>Bỏ ảnh</button>
                </div>
              )}
            </div>
            {previewSrc ? <img className="adminPreview" src={previewSrc} alt={`Xem trước ${draft.name || 'sản phẩm'}`} /> : <div className="adminEmptyPreview">Chưa có ảnh sản phẩm</div>}
          </section>

          <div className="adminToggles">
            <label className={`adminToggleCard ${draft.in_stock ? 'on' : ''}`}>
              <input type="checkbox" checked={draft.in_stock} onChange={(e) => setDraft({ ...draft, in_stock: e.target.checked })} />
              <span className="adminToggleText"><b>Còn hàng</b><small>{draft.in_stock ? 'Đang nhận đơn sản phẩm này' : 'Đánh dấu tạm hết hàng'}</small></span>
            </label>
            <label className={`adminToggleCard ${draft.visible ? 'on' : ''}`}>
              <input type="checkbox" checked={draft.visible} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} />
              <span className="adminToggleText"><b>Hiển thị trên web</b><small>{draft.visible ? 'Khách hàng đang nhìn thấy' : 'Ẩn khỏi catalog khách hàng'}</small></span>
            </label>
            <label className={`adminToggleCard adminToggleBest ${draft.best_seller ? 'on' : ''}`}>
              <input type="checkbox" checked={draft.best_seller} onChange={(e) => setDraft({ ...draft, best_seller: e.target.checked })} />
              <span className="adminToggleText"><b>★ Best Seller</b><small>{draft.best_seller ? 'Đang nằm trong nhóm bán chạy' : 'Đánh dấu món bán chạy nổi bật'}</small></span>
            </label>
            <label className={`adminToggleCard adminToggleSignature ${draft.signature ? 'on' : ''}`}>
              <input type="checkbox" checked={draft.signature} onChange={(e) => setDraft({ ...draft, signature: e.target.checked })} />
              <span className="adminToggleText"><b>◆ Signature</b><small>{draft.signature ? 'Đang là món đại diện của Sky’s house' : 'Đánh dấu món đặc trưng của shop'}</small></span>
            </label>
          </div>

          <div className="adminActions">
            <button disabled={busy}>{busy ? 'Đang xử lý…' : draft.id ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button>
            <button type="button" className="secondary" disabled={busy} onClick={resetEditor}>{draft.id ? 'Hủy chỉnh sửa' : 'Xóa nội dung'}</button>
          </div>
          {message && <p className="adminMessage">{message}</p>}
        </form>
      </section>
    </main>
  )
}
