import { useEffect, useState } from 'react'
import api from '../utils/api'
import useConfirm from '../hooks/useConfirm'

const todayDate = () => new Date().toISOString().split('T')[0]
const emptyForm = { category: '', amount: '', note: '', expense_date: todayDate() }
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

export default function ExpensesPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterCategory, setFilterCategory] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    api.get('/api/admin/expenses/categories')
      .then(res => setCategories(res.data?.data || res.data || []))
      .catch(() => {})
  }, [])

  const fetchExpenses = () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ limit: 200 })
    if (filterYear) params.set('year', filterYear)
    if (filterMonth) params.set('month', filterMonth)
    if (filterCategory) params.set('category', filterCategory)
    api.get(`/api/admin/expenses?${params}`)
      .then(res => setExpenses(res.data?.data || res.data || []))
      .catch(err => setError('載入失敗：' + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchExpenses() }, [filterYear, filterMonth, filterCategory])

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setShowForm(true) }
  const openEdit = (e) => { setEditingId(e.id); setForm({ category: e.category, amount: e.amount, note: e.note || '', expense_date: e.expense_date }); setFormError(''); setShowForm(true) }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = { category: form.category, amount: Number(form.amount), note: form.note || null, expense_date: form.expense_date }
      if (editingId) {
        await api.patch(`/api/admin/expenses/${editingId}`, payload)
      } else {
        await api.post('/api/admin/expenses', payload)
      }
      setShowForm(false)
      fetchExpenses()
    } catch (err) {
      setFormError(err.response?.data?.message || '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e) => {
    if (!await confirm(`確定刪除「${e.category} NT$${Number(e.amount).toLocaleString()}」？`)) return
    try {
      await api.delete(`/api/admin/expenses/${e.id}`)
      fetchExpenses()
    } catch (err) {
      alert(err.response?.data?.message || '刪除失敗')
    }
  }

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1))

  return (
    <div>
      {ConfirmDialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">支出管理</h1>
        <button className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors" onClick={openAdd}>
          + 新增支出
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select className={`!w-auto ${inputCls}`} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">全部年份</option>
          {years.map(y => <option key={y} value={y}>{y} 年</option>)}
        </select>
        <select className={`!w-auto ${inputCls}`} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">全部月份</option>
          {months.map(m => <option key={m} value={m}>{m} 月</option>)}
        </select>
        <select className={`!w-auto ${inputCls}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">全部類別</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-amber-50 rounded-xl p-4 mb-5 flex items-center justify-between">
        <span className="text-sm text-amber-700">本期合計</span>
        <span className="text-xl font-bold text-amber-800">NT$ {totalAmount.toLocaleString()}</span>
      </div>

      {showForm && (
        <form className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6" onSubmit={handleSubmit}>
          <div className="text-sm font-semibold text-gray-900 mb-4">{editingId ? '編輯支出' : '新增支出'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">類別 *</label>
              <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                <option value="">請選擇類別</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">金額 *</label>
              <input className={inputCls} type="number" min="0" step="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">日期 *</label>
              <input className={inputCls} type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">備註</label>
              <input className={inputCls} placeholder="選填，例：5月電費" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          {formError && <div className="text-red-500 text-xs mb-3">{formError}</div>}
          <div className="flex gap-2">
            <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg" onClick={() => setShowForm(false)}>取消</button>
            <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm rounded-lg disabled:opacity-50" disabled={saving}>
              {saving ? '儲存中...' : editingId ? '更新支出' : '新增支出'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">載入中...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">本期無支出紀錄</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-amber-50 border-b border-amber-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">日期</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">類別</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">金額</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">備註</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">操作</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{e.expense_date}</td>
                  <td className="px-4 py-3">
                    <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">{e.category}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">NT$ {Number(e.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{e.note || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => openEdit(e)}>編輯</button>
                      <button className="text-xs text-red-500 hover:text-red-600 font-medium" onClick={() => handleDelete(e)}>刪除</button>
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
