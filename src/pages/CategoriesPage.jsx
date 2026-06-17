import { useEffect, useState } from 'react'
import api from '../utils/api'
import useConfirm from '../hooks/useConfirm'

const emptyForm = { name: '', sort_order: '', is_enable: true }

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

export default function CategoriesPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchAll = () => {
    setLoading(true)
    api.get('/api/admin/categories')
      .then((res) => {
        const cats = res.data?.data || res.data || []
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch((err) => setError(err.response?.data?.message || '載入失敗'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditingId(c.id || c._id)
    setForm({ name: c.name || '', sort_order: c.sort_order ?? c.sortOrder ?? '', is_enable: c.is_enable ?? c.isEnable ?? true })
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = { name: form.name, sort_order: Number(form.sort_order) || 0, is_enable: form.is_enable }
      if (editingId) {
        await api.patch(`/api/admin/categories/${editingId}`, payload)
      } else {
        await api.post('/api/admin/categories', payload)
      }
      setShowForm(false)
      fetchAll()
    } catch (err) {
      setFormError(err.response?.data?.message || '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!await confirm(`確定刪除分類「${c.name}」？`)) return
    try {
      await api.delete(`/api/admin/categories/${c.id || c._id}`)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || '刪除失敗')
    }
  }

  return (
    <div>
      {ConfirmDialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">分類管理</h1>
        <button className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors" onClick={openAdd}>
          + 新增分類
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {showForm && (
          <form className="p-5 border-b border-gray-100" onSubmit={handleSubmit}>
            <div className="text-sm font-semibold text-gray-900 mb-4">{editingId ? '編輯分類' : '新增分類'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">分類名稱 *</label>
                <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">排序</label>
                <input className={inputCls} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" id="is_enable" checked={!!form.is_enable} onChange={e => setForm(f => ({ ...f, is_enable: e.target.checked }))} />
              <label htmlFor="is_enable" className="text-sm text-gray-700">上架</label>
            </div>
            {formError && <div className="text-red-500 text-xs mb-3">{formError}</div>}
            <div className="flex gap-2">
              <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors" onClick={() => setShowForm(false)}>取消</button>
              <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50" disabled={saving}>
                {saving ? '儲存中...' : editingId ? '更新' : '新增'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">載入中...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">尚無分類</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-amber-50 border-b border-amber-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">名稱</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">排序</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">上架</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const id = c.id || c._id
                const enabled = c.is_enable ?? c.isEnable
                return (
                  <tr key={id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.sort_order ?? c.sortOrder ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {enabled ? '上架' : '下架'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => openEdit(c)}>編輯</button>
                        <button className="text-xs text-red-500 hover:text-red-600 font-medium" onClick={() => handleDelete(c)}>刪除</button>
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
  )
}
