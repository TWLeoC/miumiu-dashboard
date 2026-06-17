import { useEffect, useState } from 'react'
import api from '../utils/api'

const ACTION_LABELS = {
  login_success: '登入成功',
  confirm_payment: '確認付款',
  ship_order: '標記出貨',
  reprint_order: '補印',
  create_product: '新增商品',
  update_product: '更新商品',
  enable_product: '上架商品',
  disable_product: '下架商品',
  delete_product: '刪除商品',
  create_discount: '新增折扣碼',
  delete_discount: '刪除折扣碼',
}

const ACTION_COLORS = {
  login_success: 'bg-blue-50 text-blue-700',
  confirm_payment: 'bg-green-50 text-green-700',
  ship_order: 'bg-green-50 text-green-700',
  reprint_order: 'bg-gray-100 text-gray-500',
  create_product: 'bg-green-50 text-green-700',
  enable_product: 'bg-green-50 text-green-700',
  disable_product: 'bg-amber-50 text-amber-700',
  delete_product: 'bg-red-50 text-red-600',
  update_product: 'bg-gray-100 text-gray-500',
  create_discount: 'bg-green-50 text-green-700',
  delete_discount: 'bg-red-50 text-red-600',
}

function formatDate(str) {
  if (!str) return '-'
  const d = new Date(str)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [limit, setLimit] = useState(100)

  const fetchLogs = () => {
    setLoading(true)
    const params = new URLSearchParams({ limit })
    if (filterAction) params.set('action', filterAction)
    api.get(`/api/admin/admin-logs?${params}`)
      .then(res => setLogs(res.data?.data || res.data || []))
      .catch(err => setError(err.response?.data?.message || '載入失敗'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [filterAction, limit])

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">操作紀錄</h1>
        <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors" onClick={fetchLogs}>
          重新整理
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      <div className="flex gap-2 mb-4 flex-wrap">
        <select className={inputCls} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">全部動作</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className={inputCls} value={limit} onChange={e => setLimit(Number(e.target.value))}>
          <option value={50}>最近 50 筆</option>
          <option value={100}>最近 100 筆</option>
          <option value={300}>最近 300 筆</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">載入中...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">尚無操作紀錄</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-amber-50 border-b border-amber-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">時間</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">動作</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">對象</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">管理員</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-amber-900">詳情</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-500'}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {log.target_type && <span>{log.target_type}</span>}
                    {log.target_id && <span className="ml-1 font-mono">#{log.target_id.slice(-8)}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{log.admin_phone || '-'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ip || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">
                    {log.detail ? JSON.stringify(log.detail).slice(0, 80) : '-'}
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
