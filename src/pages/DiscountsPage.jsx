import { useEffect, useState } from 'react'
import api from '../utils/api'
import useConfirm from '../hooks/useConfirm'

const emptyForm = { discount_kol: '', discount_percent: '', discount_price: '', expires_at: '', is_enable: true }
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

export default function DiscountsPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchDiscounts = () => {
    setLoading(true)
    api.get('/api/admin/discounts')
      .then((res) => {
        const data = res.data?.data || res.data || []
        setDiscounts(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.response?.data?.message || '載入失敗'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDiscounts() }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (d) => {
    setEditingId(d.id || d._id)
    setForm({
      discount_kol: d.discount_kol || d.discountKol || '',
      discount_percent: d.discount_percent != null ? (d.discount_percent * 100).toFixed(0) : '',
      discount_price: d.discount_price ?? d.discountPrice ?? '',
      expires_at: d.expires_at ? d.expires_at.slice(0, 10) : (d.expiresAt ? d.expiresAt.slice(0, 10) : ''),
      is_enable: d.is_enable ?? d.isEnable ?? true,
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        discount_kol: form.discount_kol,
        discount_percent: form.discount_percent ? Number(form.discount_percent) / 100 : undefined,
        discount_price: form.discount_price ? Number(form.discount_price) : undefined,
        expires_at: form.expires_at || undefined,
        is_enable: form.is_enable,
      }
      if (editingId) {
        await api.patch(`/api/admin/discounts/${editingId}`, payload)
      } else {
        await api.post('/api/admin/discounts', payload)
      }
      setShowForm(false)
      fetchDiscounts()
    } catch (err) {
      setFormError(err.response?.data?.message || '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (d) => {
    if (!await confirm(`確定刪除優惠碼「${d.discount_kol || d.discountKol}」？`)) return
    try {
      await api.delete(`/api/admin/discounts/${d.id || d._id}`)
      fetchDiscounts()
    } catch (err) {
      alert(err.response?.data?.message || '刪除失敗')
    }
  }

  return (
    <div>
      {ConfirmDialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">優惠券管理</h1>
        <button className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors" onClick={openAdd}>
          + 新增優惠碼
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      {showForm && (
        <form className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6" onSubmit={handleSubmit}>
          <div className="text-sm font-semibold text-gray-900 mb-4">{editingId ? '編輯優惠碼' : '新增優惠碼'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">優惠碼 *</label>
              <input className={inputCls} value={form.discount_kol} onChange={e => setForm(f => ({ ...f, discount_kol: e.target.value }))} placeholder="如：KOL2024" required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">折扣百分比 (%)</label>
              <input className={inputCls} type="number" min="0" max="100" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} placeholder="10 = 9折" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">折扣金額 (NT$)</label>
              <input className={inputCls} type="number" min="0" value={form.discount_price} onChange={e => setForm(f => ({ ...f, discount_price: e.target.value }))} placeholder="固定折扣金額" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">到期日</label>
              <input className={inputCls} type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="discount_enable" checked={!!form.is_enable} onChange={e => setForm(f => ({ ...f, is_enable: e.target.checked }))} />
            <label htmlFor="discount_enable" className="text-sm text-gray-700">啟用</label>
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

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">尚無優惠碼</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map((d) => {
            const id = d.id || d._id
            const enabled = d.is_enable ?? d.isEnable
            const percent = d.discount_percent ?? d.discountPercent
            const price = d.discount_price ?? d.discountPrice
            return (
              <div key={id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-gray-900">{d.discount_kol || d.discountKol}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {enabled ? '啟用' : '停用'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                  {percent != null && <div>折扣 {(percent * 100).toFixed(0)}%</div>}
                  {price > 0 && <div>折 NT${Number(price).toLocaleString()}</div>}
                  <div>到期：{formatDate(d.expires_at || d.expiresAt)}</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => openEdit(d)}>編輯</button>
                  <button className="text-xs text-red-500 hover:text-red-600 font-medium" onClick={() => handleDelete(d)}>刪除</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
