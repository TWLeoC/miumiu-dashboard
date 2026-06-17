import { useEffect, useState } from 'react'
import api from '../utils/api'
import useConfirm from '../hooks/useConfirm'

const emptyProduct = { product_code: '', name: '', description: '', price: '', origin_price: '', cost: '', stock: '', unlimited_stock: false, category_id: '' }
const emptyAddon = { name: '', price: '', type: 'option' }
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

export default function ProductsPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [products, setProducts] = useState([])
  const [addons, setAddons] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [productSaving, setProductSaving] = useState(false)
  const [productError, setProductError] = useState('')

  const [expandedCats, setExpandedCats] = useState({})
  const toggleCat = (catId) => setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }))

  const [addonPanelProductId, setAddonPanelProductId] = useState(null)
  const [panelAddonIds, setPanelAddonIds] = useState([])
  const [panelSaving, setPanelSaving] = useState(false)

  const [showAddonForm, setShowAddonForm] = useState(false)
  const [editingAddon, setEditingAddon] = useState(null)
  const [addonForm, setAddonForm] = useState(emptyAddon)
  const [addonSaving, setAddonSaving] = useState(false)
  const [addonError, setAddonError] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, aRes, cRes] = await Promise.all([
        api.get('/api/products?limit=200'),
        api.get('/api/admin/addons'),
        api.get('/api/admin/categories'),
      ])
      setProducts(Array.isArray(pRes.data?.data || pRes.data) ? (pRes.data?.data || pRes.data) : [])
      setAddons(Array.isArray(aRes.data?.data || aRes.data) ? (aRes.data?.data || aRes.data) : [])
      setCategories(Array.isArray(cRes.data?.data || cRes.data) ? (cRes.data?.data || cRes.data) : [])
    } catch (err) {
      setError('載入失敗：' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openAddProduct = () => { setEditingProduct(null); setProductForm(emptyProduct); setProductError(''); setShowProductForm(true) }
  const openEditProduct = (p) => {
    setEditingProduct(p)
    setProductForm({
      product_code: p.product_code || '', name: p.name || '', description: p.description || '',
      price: p.price || '', origin_price: p.origin_price || '', cost: p.cost ?? '',
      stock: p.stock ?? '', unlimited_stock: p.stock === null, category_id: p.category_id || '',
    })
    setProductError('')
    setShowProductForm(true)
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setProductSaving(true)
    setProductError('')
    try {
      const payload = {
        product_code: productForm.product_code || undefined,
        name: productForm.name,
        description: productForm.description || null,
        price: Number(productForm.price),
        origin_price: productForm.origin_price !== '' ? Number(productForm.origin_price) : undefined,
        cost: productForm.cost !== '' ? Number(productForm.cost) : null,
        unlimited_stock: productForm.unlimited_stock,
        stock: productForm.unlimited_stock ? undefined : (productForm.stock !== '' ? Number(productForm.stock) : 0),
        category_id: productForm.category_id || undefined,
      }
      if (editingProduct) {
        await api.patch(`/api/products/${editingProduct.id || editingProduct._id}`, payload)
      } else {
        await api.post('/api/products', payload)
      }
      setShowProductForm(false)
      fetchAll()
    } catch (err) {
      setProductError(err.response?.data?.message || '儲存失敗')
    } finally {
      setProductSaving(false)
    }
  }

  const toggleProductEnable = async (p) => {
    const id = p.id || p._id
    try {
      await api.patch(`/api/products/${id}`, { is_enable: !(p.is_enable ?? p.isEnable) })
      fetchAll()
    } catch {
      alert('操作失敗')
    }
  }

  const deleteProduct = async (p) => {
    if (!await confirm(`確定刪除商品「${p.name}」？`, '有訂單紀錄的商品無法刪除（可改為下架）。')) return
    try {
      await api.delete(`/api/products/${p.id || p._id}`)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || '刪除失敗')
    }
  }

  const openAddonPanel = async (p) => {
    const id = p.id || p._id
    if (addonPanelProductId === id) { setAddonPanelProductId(null); return }
    setAddonPanelProductId(id)
    try {
      const res = await api.get(`/api/admin/products/${id}/addons`)
      setPanelAddonIds((res.data?.data || res.data || []).map(a => a.id || a._id))
    } catch { setPanelAddonIds([]) }
  }

  const saveAddonPanel = async () => {
    if (!addonPanelProductId) return
    setPanelSaving(true)
    try {
      await api.put(`/api/admin/products/${addonPanelProductId}/addons`, { addon_ids: panelAddonIds })
      setAddonPanelProductId(null)
    } catch (err) {
      alert(err.response?.data?.message || '儲存失敗')
    } finally {
      setPanelSaving(false)
    }
  }

  const handleAddonSubmit = async (e) => {
    e.preventDefault()
    setAddonSaving(true)
    setAddonError('')
    try {
      const payload = { name: addonForm.name, price: Number(addonForm.price), type: addonForm.type || 'option' }
      if (editingAddon) {
        await api.patch(`/api/addons/${editingAddon.id || editingAddon._id}`, payload)
      } else {
        await api.post('/api/addons', payload)
      }
      setShowAddonForm(false)
      fetchAll()
    } catch (err) {
      setAddonError(err.response?.data?.message || '儲存失敗')
    } finally {
      setAddonSaving(false)
    }
  }

  const deleteAddon = async (a) => {
    if (!await confirm(`確定刪除附加選項「${a.name}」？`)) return
    try {
      await api.delete(`/api/addons/${a.id || a._id}`)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || '刪除失敗')
    }
  }

  const toggleAddonEnable = async (a) => {
    try {
      await api.patch(`/api/addons/${a.id || a._id}`, { is_enable: !(a.is_enable ?? a.isEnable) })
      fetchAll()
    } catch { alert('操作失敗') }
  }

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">載入中...</div>

  // Build category groups
  const catMap = {}
  const uncategorized = []
  products.forEach(p => {
    const catId = p.category_id || '__none__'
    if (catId === '__none__') { uncategorized.push(p); return }
    if (!catMap[catId]) catMap[catId] = []
    catMap[catId].push(p)
  })
  const catGroups = categories.filter(c => catMap[c.id || c._id]).map(c => ({ id: c.id || c._id, name: c.name, items: catMap[c.id || c._id] }))
  if (uncategorized.length > 0) catGroups.push({ id: '__none__', name: '未分類', items: uncategorized })

  return (
    <div className="space-y-6">
      {ConfirmDialog}

      {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{error}</div>}

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">商品管理</h1>
          <button className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors" onClick={openAddProduct}>
            + 新增商品
          </button>
        </div>

        {showProductForm && (
          <form className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4" onSubmit={handleProductSubmit}>
            <div className="text-sm font-semibold text-gray-900 mb-4">{editingProduct ? '編輯商品' : '新增商品'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">商品名稱 *</label>
                <input className={inputCls} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">商品編號 (SKU)</label>
                <input className={inputCls} placeholder="例：C001" value={productForm.product_code} onChange={e => setProductForm(p => ({ ...p, product_code: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">商品描述</label>
                <textarea className={inputCls} rows={2} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">售價 *</label>
                <input className={inputCls} type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">成本（選填）</label>
                <input className={inputCls} type="number" min="0" value={productForm.cost} onChange={e => setProductForm(p => ({ ...p, cost: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">分類</label>
                <select className={inputCls} value={productForm.category_id} onChange={e => setProductForm(p => ({ ...p, category_id: e.target.value }))}>
                  <option value="">請選擇分類</option>
                  {categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={productForm.unlimited_stock} onChange={e => setProductForm(p => ({ ...p, unlimited_stock: e.target.checked }))} />
                  不限庫存
                </label>
                {!productForm.unlimited_stock && (
                  <input className={`${inputCls} w-28`} type="number" min="0" placeholder="庫存數量" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} />
                )}
              </div>
            </div>
            {productError && <div className="text-red-500 text-xs mb-3">{productError}</div>}
            <div className="flex gap-2">
              <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg" onClick={() => setShowProductForm(false)}>取消</button>
              <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm rounded-lg disabled:opacity-50" disabled={productSaving}>
                {productSaving ? '儲存中...' : editingProduct ? '更新商品' : '新增商品'}
              </button>
            </div>
          </form>
        )}

        {catGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">尚無商品</div>
        ) : (
          <div className="space-y-3">
            {catGroups.map(({ id: catId, name: catName, items }) => {
              const isExpanded = !!expandedCats[catId]
              return (
                <div key={catId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50/50 transition-colors text-left"
                    onClick={() => toggleCat(catId)}
                  >
                    <span className="text-sm font-semibold text-gray-900 flex-1">{catName}</span>
                    <span className="text-xs text-gray-400">{items.length} 項</span>
                    <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {items.map(p => {
                        const id = p.id || p._id
                        const enabled = p.is_enable ?? p.isEnable
                        return (
                          <div key={id} className={`p-4 ${!enabled ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{p.name}</div>
                                {p.product_code && <div className="text-xs text-gray-400 mt-0.5">SKU: {p.product_code}</div>}
                                {p.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.description}</div>}
                              </div>
                              <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">NT$ {Number(p.price || 0).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 mb-2">
                              <span>庫存：{p.stock === null ? '不限' : (p.stock ?? '-')}</span>
                              {p.cost != null && <span>成本：NT${Number(p.cost).toLocaleString()}</span>}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={!!enabled} onChange={() => toggleProductEnable(p)} className="accent-amber-400 w-4 h-4" />
                                <span className="text-xs text-gray-600">{enabled ? '上架' : '下架'}</span>
                              </label>
                              <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => openEditProduct(p)}>編輯</button>
                              <button
                                className={`text-xs font-medium ${addonPanelProductId === id ? 'text-white bg-amber-400 px-2 py-0.5 rounded' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => openAddonPanel(p)}
                              >
                                加購選項
                              </button>
                              <button className="text-xs text-red-500 hover:text-red-600 font-medium" onClick={() => deleteProduct(p)}>刪除</button>
                            </div>

                            {addonPanelProductId === id && (
                              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="text-xs font-semibold text-amber-900 mb-2">加購選項設定</div>
                                {addons.length === 0 ? (
                                  <div className="text-xs text-gray-400">尚無加購選項，請先於下方新增</div>
                                ) : (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {addons.map(a => {
                                      const aid = a.id || a._id
                                      return (
                                        <label key={aid} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                                          <input type="checkbox" checked={panelAddonIds.includes(aid)} onChange={() => setPanelAddonIds(prev => prev.includes(aid) ? prev.filter(x => x !== aid) : [...prev, aid])} className="accent-amber-400" />
                                          {a.name}{a.price > 0 ? ` (+NT$${a.price})` : ''}
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <button className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-white text-xs rounded-lg disabled:opacity-50" disabled={panelSaving} onClick={saveAddonPanel}>
                                    {panelSaving ? '儲存中...' : '儲存'}
                                  </button>
                                  <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg" onClick={() => setAddonPanelProductId(null)}>取消</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Addons Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">附加選項管理</h2>
            <p className="text-xs text-gray-400 mt-0.5">建立選項後，至各商品的「加購選項」開啟綁定</p>
          </div>
          <button className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors" onClick={() => { setEditingAddon(null); setAddonForm(emptyAddon); setAddonError(''); setShowAddonForm(true) }}>
            + 新增選項
          </button>
        </div>

        {showAddonForm && (
          <form className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4" onSubmit={handleAddonSubmit}>
            <div className="text-sm font-semibold text-gray-900 mb-4">{editingAddon ? '編輯選項' : '新增選項'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">選項名稱 *</label>
                <input className={inputCls} value={addonForm.name} onChange={e => setAddonForm(a => ({ ...a, name: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">加價</label>
                <input className={inputCls} type="number" value={addonForm.price} onChange={e => setAddonForm(a => ({ ...a, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">類型</label>
                <input className={inputCls} value={addonForm.type} onChange={e => setAddonForm(a => ({ ...a, type: e.target.value }))} />
              </div>
            </div>
            {addonError && <div className="text-red-500 text-xs mb-3">{addonError}</div>}
            <div className="flex gap-2">
              <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg" onClick={() => setShowAddonForm(false)}>取消</button>
              <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm rounded-lg disabled:opacity-50" disabled={addonSaving}>
                {addonSaving ? '儲存中...' : editingAddon ? '更新選項' : '新增選項'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {addons.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">尚無附加選項</div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">名稱</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">加價</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">類型</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">上架</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">操作</th>
                </tr>
              </thead>
              <tbody>
                {addons.map(a => {
                  const id = a.id || a._id
                  const enabled = a.is_enable ?? a.isEnable
                  return (
                    <tr key={id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                      <td className="px-4 py-3 text-gray-600">NT$ {Number(a.price || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{a.type || 'option'}</td>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={!!enabled} onChange={() => toggleAddonEnable(a)} className="accent-amber-400 w-4 h-4" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => { setEditingAddon(a); setAddonForm({ name: a.name || '', price: a.price || '', type: a.type || 'option' }); setAddonError(''); setShowAddonForm(true) }}>編輯</button>
                          <button className="text-xs text-red-500 hover:text-red-600 font-medium" onClick={() => deleteAddon(a)}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
