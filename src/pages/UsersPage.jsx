import { useEffect, useState } from 'react'
import api from '../utils/api'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [userOrders, setUserOrders] = useState({})
  const [loadingOrders, setLoadingOrders] = useState({})
  const [processingId, setProcessingId] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchUsers = () => {
    setLoading(true)
    api.get('/api/admin/users')
      .then((res) => {
        const data = res.data?.data || res.data?.users || res.data || []
        setUsers(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.response?.data?.message || '載入失敗'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleExpand = async (user) => {
    const id = user.id || user._id
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!userOrders[id]) {
      setLoadingOrders(prev => ({ ...prev, [id]: true }))
      try {
        const res = await api.get(`/api/admin/users/${id}/orders`)
        const orders = res.data?.data || res.data?.orders || res.data || []
        setUserOrders(prev => ({ ...prev, [id]: Array.isArray(orders) ? orders : [] }))
      } catch {
        setUserOrders(prev => ({ ...prev, [id]: [] }))
      } finally {
        setLoadingOrders(prev => ({ ...prev, [id]: false }))
      }
    }
  }

  const toggleStatus = async (user) => {
    const id = user.id || user._id
    const isActive = user.is_active ?? user.isActive ?? true
    setProcessingId(id)
    try {
      await api.patch(`/api/admin/users/${id}/status`, { status: !isActive })
      setUsers(prev => prev.map(u => (u.id || u._id) === id ? { ...u, is_active: !isActive } : u))
    } catch {
      alert('操作失敗')
    } finally {
      setProcessingId(null)
    }
  }

  const changeRole = async (user, role) => {
    const id = user.id || user._id
    setProcessingId(id)
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role })
      setUsers(prev => prev.map(u => (u.id || u._id) === id ? { ...u, role } : u))
    } catch {
      alert('操作失敗')
    } finally {
      setProcessingId(null)
    }
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setEditForm({ name: user.name || '', email: user.email || '' })
    setEditError('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    const id = editingUser.id || editingUser._id
    setEditSaving(true)
    setEditError('')
    try {
      await api.patch(`/api/admin/users/${id}`, editForm)
      setUsers(prev => prev.map(u => (u.id || u._id) === id ? { ...u, ...editForm } : u))
      setEditingUser(null)
    } catch (err) {
      setEditError(err.response?.data?.message || '儲存失敗')
    } finally {
      setEditSaving(false)
    }
  }

  const groups = [
    { title: '管理者', list: users.filter(u => u.role === 'ADMIN' && (u.is_active ?? u.isActive ?? true)), badge: 'bg-amber-50 text-amber-700' },
    { title: '一般用戶', list: users.filter(u => u.role !== 'ADMIN' && (u.is_active ?? u.isActive ?? true)), badge: 'bg-blue-50 text-blue-700' },
    { title: '黑名單', list: users.filter(u => !(u.is_active ?? u.isActive ?? true)), badge: 'bg-red-50 text-red-600' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">使用者管理</h1>
        <span className="text-sm text-gray-400">共 {users.length} 位</span>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setEditingUser(null)}>
          <form className="bg-white rounded-xl p-6 min-w-[320px] shadow-xl" onClick={e => e.stopPropagation()} onSubmit={handleEditSubmit}>
            <div className="text-base font-bold text-gray-900 mb-4">編輯使用者</div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">姓名</label>
                <input className={inputCls} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">電子信箱</label>
                <input className={inputCls} type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            {editError && <div className="text-red-500 text-xs mb-3">{editError}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg" onClick={() => setEditingUser(null)}>取消</button>
              <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm rounded-lg disabled:opacity-50" disabled={editSaving}>
                {editSaving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">載入中...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">尚無使用者</div>
      ) : (
        <div className="space-y-6">
          {groups.filter(g => g.list.length > 0).map(({ title, list, badge }) => (
            <div key={title}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badge}`}>{title}</span>
                <span className="text-xs text-gray-400">{list.length} 位</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-amber-50 border-b border-amber-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">手機號碼</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">姓名</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">加入日期</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(u => {
                      const id = u.id || u._id
                      const isActive = u.is_active ?? u.isActive ?? true
                      const isAdmin = u.role === 'ADMIN'
                      const isExpanded = expandedId === id
                      const orders = userOrders[id] || []
                      return [
                        <tr key={id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => toggleExpand(u)}>
                          <td className="px-4 py-3 text-gray-900">{u.phone || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{u.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.created_at || u.createdAt)}</td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2 flex-wrap">
                              <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => openEdit(u)}>編輯</button>
                              <button
                                className={`text-xs font-medium ${isActive ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}
                                disabled={processingId === id}
                                onClick={() => toggleStatus(u)}
                              >
                                {isActive ? '加入黑名單' : '解除黑名單'}
                              </button>
                              {isActive && (
                                <button
                                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                  disabled={processingId === id}
                                  onClick={() => changeRole(u, isAdmin ? 'USER' : 'ADMIN')}
                                >
                                  {isAdmin ? '降為用戶' : '升為管理員'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>,
                        isExpanded && (
                          <tr key={`${id}-expand`} className="bg-amber-50/40">
                            <td colSpan={4} className="px-6 py-4">
                              <div className="text-xs text-gray-500 mb-2">{u.email || '無 Email'}</div>
                              <div className="text-xs font-semibold text-gray-700 mb-2">訂單紀錄</div>
                              {loadingOrders[id] ? (
                                <div className="text-xs text-gray-400">載入中...</div>
                              ) : orders.length === 0 ? (
                                <div className="text-xs text-gray-400">尚無訂單</div>
                              ) : (
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr className="text-gray-400">
                                      <th className="text-left pb-1">訂單編號</th>
                                      <th className="text-left pb-1">日期</th>
                                      <th className="text-left pb-1">金額</th>
                                      <th className="text-left pb-1">狀態</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {orders.slice(0, 10).map(o => (
                                      <tr key={o.id || o._id} className="border-b border-gray-100">
                                        <td className="py-1 font-mono">{o.display_id || String(o.id || '').slice(-8)}</td>
                                        <td className="py-1">{formatDate(o.created_at || o.createdAt)}</td>
                                        <td className="py-1">NT$ {Number(o.total_price || 0).toLocaleString()}</td>
                                        <td className="py-1">
                                          <span className={`px-1.5 py-0.5 rounded-full ${(o.is_paid || o.isPaid) ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {(o.is_paid || o.isPaid) ? '已確認' : '待確認'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )
                      ]
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
