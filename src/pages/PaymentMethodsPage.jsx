import { useEffect, useState } from 'react'
import api from '../utils/api'
import useConfirm from '../hooks/useConfirm'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

export default function PaymentMethodsPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchMethods = () => {
    setLoading(true)
    api.get('/api/admin/payment-methods')
      .then((res) => {
        const data = res.data?.data || res.data || []
        setMethods(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.response?.data?.message || '載入失敗'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMethods() }, [])

  const openAdd = () => {
    setEditingId(null)
    setFormName('')
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (m) => {
    setEditingId(m.id || m._id)
    setFormName(m.payment_method || m.paymentMethod || m.name || '')
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = { payment_method: formName }
      if (editingId) {
        await api.patch(`/api/admin/payment-methods/${editingId}`, payload)
      } else {
        await api.post('/api/admin/payment-methods', payload)
      }
      setShowForm(false)
      fetchMethods()
    } catch (err) {
      setFormError(err.response?.data?.message || '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (m) => {
    const name = m.payment_method || m.paymentMethod || m.name
    if (!await confirm(`確定刪除付款方式「${name}」？`)) return
    try {
      await api.delete(`/api/admin/payment-methods/${m.id || m._id}`)
      fetchMethods()
    } catch {
      alert('刪除失敗')
    }
  }

  return (
    <div>
      {ConfirmDialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">付款方式</h1>
        <button className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors" onClick={openAdd}>
          + 新增付款方式
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      {showForm && (
        <form className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6" onSubmit={handleSubmit}>
          <div className="text-sm font-semibold text-gray-900 mb-4">{editingId ? '編輯付款方式' : '新增付款方式'}</div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">付款方式名稱 *</label>
            <input className={inputCls} value={formName} onChange={e => setFormName(e.target.value)} placeholder="如：現金、Line Pay" required />
          </div>
          {formError && <div className="text-red-500 text-xs mb-3">{formError}</div>}
          <div className="flex gap-2">
            <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg" onClick={() => setShowForm(false)}>取消</button>
            <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm rounded-lg disabled:opacity-50" disabled={saving}>
              {saving ? '儲存中...' : editingId ? '更新' : '新增'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">載入中...</div>
        ) : methods.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">尚無付款方式</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-amber-50 border-b border-amber-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">付款方式</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">操作</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m, idx) => (
                <tr key={m.id || m._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.payment_method || m.paymentMethod || m.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => openEdit(m)}>編輯</button>
                      <button className="text-xs text-red-500 hover:text-red-600 font-medium" onClick={() => handleDelete(m)}>刪除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
