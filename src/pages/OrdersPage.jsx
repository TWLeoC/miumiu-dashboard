import { useEffect, useState } from 'react'
import api from '../utils/api'
import useConfirm from '../hooks/useConfirm'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const PAGE_SIZE = 20

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterPaid, setFilterPaid] = useState('all')
  const [filterShip, setFilterShip] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [expandedDetails, setExpandedDetails] = useState({})
  const [page, setPage] = useState(1)
  const [shipping, setShipping] = useState({})
  const [confirming, setConfirming] = useState({})
  const [cancelling, setCancelling] = useState({})
  const [reprinting, setReprinting] = useState({})
  const [printerEnabled, setPrinterEnabled] = useState(false)
  const [searchPhone, setSearchPhone] = useState('')
  const [showTest, setShowTest] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    api.get('/api/store-info').then(res => {
      setPrinterEnabled(res.data.printer_enabled ?? false)
    }).catch(() => {})
  }, [])

  const fetchOrders = (includeTest = false) => {
    setLoading(true)
    const url = includeTest ? '/api/orders/admin/all?limit=500&show_test=true' : '/api/orders/admin/all?limit=500'
    api.get(url)
      .then((res) => {
        const data = res.data?.data || res.data?.orders || res.data || []
        setOrders(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.response?.data?.message || '載入失敗'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders(false) }, [])

  const handleToggleTest = (val) => {
    setShowTest(val)
    setPage(1)
    fetchOrders(val)
  }

  const fetchDetail = async (orderId) => {
    if (expandedDetails[orderId]) return
    try {
      const res = await api.get(`/api/orders/admin/${orderId}`)
      setExpandedDetails(prev => ({ ...prev, [orderId]: res.data?.data || res.data }))
    } catch {}
  }

  const toggleExpand = (orderId) => {
    if (expandedId === orderId) {
      setExpandedId(null)
    } else {
      setExpandedId(orderId)
      fetchDetail(orderId)
    }
  }

  const handleConfirm = async (orderId) => {
    setConfirming(prev => ({ ...prev, [orderId]: true }))
    try {
      await api.patch(`/api/orders/admin/${orderId}/confirm`)
      setOrders(prev => prev.map(o => (o.id || o._id) === orderId ? { ...o, is_paid: true, isPaid: true } : o))
    } catch (err) {
      alert(err.response?.data?.message || '操作失敗')
    } finally {
      setConfirming(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleShip = async (orderId) => {
    setShipping(prev => ({ ...prev, [orderId]: true }))
    try {
      await api.patch(`/api/orders/admin/${orderId}/ship`)
      setOrders(prev => prev.map(o => (o.id || o._id) === orderId ? { ...o, is_ship: true, isShip: true } : o))
    } catch (err) {
      alert(err.response?.data?.message || '操作失敗')
    } finally {
      setShipping(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleCancelOrder = async (orderId) => {
    const ok = await confirm('確定要取消此訂單？', '此操作不可復原。')
    if (!ok) return
    setCancelling(prev => ({ ...prev, [orderId]: true }))
    try {
      await api.delete(`/api/orders/admin/${orderId}`)
      setOrders(prev => prev.map(o => (o.id || o._id) === orderId ? { ...o, is_cancelled: true } : o))
    } catch (err) {
      alert(err.response?.data?.message || '取消失敗')
    } finally {
      setCancelling(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleReprint = async (orderId) => {
    setReprinting(prev => ({ ...prev, [orderId]: true }))
    try {
      await api.post(`/api/orders/admin/${orderId}/reprint`)
    } catch (err) {
      alert(err.response?.data?.message || '補印失敗')
    } finally {
      setReprinting(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const filtered = orders.filter((o) => {
    if (showTest && !o.is_test) return false
    if (!showTest && o.is_test) return false
    const paid = o.is_paid ?? o.isPaid
    const ship = o.is_ship ?? o.isShip
    if (filterPaid === '待確認' && paid) return false
    if (filterPaid === '已確認' && !paid) return false
    if (filterShip === '備餐中' && ship) return false
    if (filterShip === '已出貨' && !ship) return false
    if (searchPhone.trim()) {
      const phone = o.user?.phone || ''
      if (!phone.includes(searchPhone.trim())) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      {ConfirmDialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">訂單管理</h1>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="搜尋手機號碼"
          value={searchPhone}
          onChange={e => { setSearchPhone(e.target.value); setPage(1) }}
        />
        <select
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={filterPaid}
          onChange={e => { setFilterPaid(e.target.value); setPage(1) }}
        >
          <option value="all">全部付款狀態</option>
          <option value="待確認">待確認</option>
          <option value="已確認">已確認</option>
        </select>
        <select
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={filterShip}
          onChange={e => { setFilterShip(e.target.value); setPage(1) }}
        >
          <option value="all">全部出貨狀態</option>
          <option value="備餐中">備餐中</option>
          <option value="已出貨">已出貨</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" checked={showTest} onChange={e => handleToggleTest(e.target.checked)} />
          測試訂單
        </label>
        <button
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => fetchOrders(showTest)}
        >
          重新整理
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">尚無訂單</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-amber-50 border-b border-amber-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">訂單編號</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">手機</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">金額</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">取餐時間</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">狀態</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((o) => {
                const id = o.id || o._id
                const paid = o.is_paid ?? o.isPaid
                const ship = o.is_ship ?? o.isShip
                const cancelled = o.is_cancelled
                const isExpanded = expandedId === id
                const detail = expandedDetails[id]
                return [
                  <tr
                    key={id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">#{o.display_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{o.user?.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">NT${Number(o.total_price || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {o.pickup_date ? `${o.pickup_date} ${(o.pickup_time || '').slice(0, 5)}` : (o.pickup_time || '-')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {cancelled ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-500">已取消</span>
                        ) : (
                          <>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                              {paid ? '已確認' : '待確認'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ship ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                              {ship ? '已出貨' : '備餐中'}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5 flex-wrap">
                        {!cancelled && !paid && (
                          <button
                            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            disabled={confirming[id]}
                            onClick={() => handleConfirm(id)}
                          >
                            {confirming[id] ? '...' : '確認'}
                          </button>
                        )}
                        {!cancelled && !ship && (
                          <button
                            className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            disabled={shipping[id]}
                            onClick={() => handleShip(id)}
                          >
                            {shipping[id] ? '...' : '出貨'}
                          </button>
                        )}
                        {printerEnabled && !cancelled && (
                          <button
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            disabled={reprinting[id]}
                            onClick={() => handleReprint(id)}
                          >
                            {reprinting[id] ? '...' : '補印'}
                          </button>
                        )}
                        {!cancelled && !paid && !ship && (
                          <button
                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            disabled={cancelling[id]}
                            onClick={() => handleCancelOrder(id)}
                          >
                            {cancelling[id] ? '...' : '取消'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>,
                  isExpanded && (
                    <tr key={`${id}-detail`} className="bg-amber-50/30">
                      <td colSpan={6} className="px-6 py-4">
                        {!detail ? (
                          <div className="text-xs text-gray-400">載入中...</div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-700 mb-2">訂單明細</div>
                            {detail.order_item?.map(item => (
                              <div key={item.id} className="flex items-start justify-between text-xs text-gray-700">
                                <div>
                                  <span className="font-medium">{item.product_name}</span>
                                  {item.order_item_addon?.map(a => (
                                    <div key={a.addon_id} className="text-gray-400 ml-2">└ {a.addon_name}</div>
                                  ))}
                                  {item.note && <div className="text-gray-400 ml-2">備註：{item.note}</div>}
                                </div>
                                <div className="text-right ml-4">
                                  <span className="text-gray-400">×{item.quantity}</span>
                                  <span className="ml-2 font-medium">NT${item.subtotal}</span>
                                </div>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                              下單時間：{formatDate(detail.created_at)}
                              {detail.payment_method && ` · ${detail.payment_method.payment_method}`}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                ]
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一頁
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  )
}
