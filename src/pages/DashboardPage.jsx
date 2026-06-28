import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../utils/api'

const todayStr = new Date().toISOString().slice(0, 10)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatMoney(n) {
  return `NT$ ${Number(n || 0).toLocaleString()}`
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr)
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function groupOrders(orders, period) {
  const map = {}
  orders.forEach((o) => {
    const d = new Date(o.created_at || o.createdAt || o.order_date)
    if (isNaN(d)) return
    let key
    if (period === '日') key = d.toISOString().slice(0, 10)
    else if (period === '週') key = getWeekKey(d.toISOString().slice(0, 10))
    else if (period === '月') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    else key = `${d.getFullYear()}`
    if (!map[key]) map[key] = { label: key, count: 0, revenue: 0 }
    map[key].count++
    map[key].revenue += Number(o.total_price || o.totalPrice || 0)
  })
  return Object.values(map).sort((a, b) => a.label.localeCompare(b.label)).slice(-30)
}

const PERIODS = ['日', '週', '月', '年']
const METRICS = ['訂單數', '營收']

export default function DashboardPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('日')
  const [metric, setMetric] = useState('訂單數')
  const [isOpen, setIsOpen] = useState(false)
  const [reportDate, setReportDate] = useState(todayStr)
  const [reportOpen, setReportOpen] = useState(true)
  const [report, setReport] = useState(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    api.get('/api/store-info').then(res => {
      setIsOpen(res.data.is_open ?? false)
    }).catch(() => {})
  }, [])

  const handleToggleOpen = async () => {
    setToggling(true)
    try {
      await api.patch('/api/admin/open-status', { is_open: !isOpen })
      setIsOpen(!isOpen)
    } catch (err) {
      alert(err.response?.data?.message || '操作失敗')
    } finally {
      setToggling(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    api.get('/api/orders/admin/all?limit=1000')
      .then((res) => {
        const data = res.data?.data || res.data?.orders || res.data || []
        setOrders(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.response?.data?.message || '載入訂單失敗'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get(`/api/admin/daily-report?date=${reportDate}`)
      .then(res => setReport(res.data.data))
      .catch(() => setReport(null))
  }, [reportDate])

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.created_at || o.createdAt || o.order_date)
    return d.toISOString().slice(0, 10) === todayStr && !o.is_cancelled
  })
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_price || o.totalPrice || 0), 0)
  const thisMonth = todayStr.slice(0, 7)
  const monthOrders = orders.filter(o => (o.created_at || '').startsWith(thisMonth) && !o.is_cancelled)
  const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.total_price || o.totalPrice || 0), 0)
  const chartData = groupOrders(orders, period)
  const recentOrders = orders.slice(0, 5)

  const stats = [
    { label: '今日訂單', value: todayOrders.length },
    { label: '今日營收', value: `NT$${todayRevenue.toLocaleString()}` },
    { label: '本月訂單', value: monthOrders.length },
    { label: '本月營收', value: `NT$${monthRevenue.toLocaleString()}` },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">報表總覽</h1>
        <span className="text-sm text-gray-400">{todayStr}</span>
      </div>

      <div className="mb-6">
        <button
          onClick={handleToggleOpen}
          disabled={toggling}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-colors disabled:opacity-50 ${
            isOpen
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {toggling ? '處理中...' : isOpen ? '🟢 營業中（點擊收攤）' : '⚫ 休息中（點擊出攤）'}
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {!loading && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <div className="flex gap-1.5">
                {METRICS.map(m => (
                  <button
                    key={m}
                    className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${metric === m ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setMetric(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${period === p ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setPeriod(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">尚無資料</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d8aa3d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d8aa3d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9e8060' }} tickLine={false} axisLine={{ stroke: '#ede8df' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9e8060' }} tickLine={false} axisLine={false} width={50}
                    tickFormatter={(v) => metric === '營收' ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    formatter={(value) => [metric === '營收' ? `NT$ ${value.toLocaleString()}` : `${value} 筆`, metric]}
                    labelStyle={{ color: '#3c2a08', fontWeight: 600 }}
                    contentStyle={{ border: '1px solid #ede8df', borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey={metric === '訂單數' ? 'count' : 'revenue'} stroke="#d8aa3d" strokeWidth={2} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setReportOpen(o => !o)}>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900">📊 日報表</h2>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => { e.stopPropagation(); setReportDate(e.target.value) }}
                  onClick={e => e.stopPropagation()}
                  className="text-xs border border-gray-200 rounded-md px-2 py-0.5 text-gray-500 focus:outline-none"
                />
              </div>
              <span className="text-xs text-gray-400">{reportOpen ? '▲' : '▼'}</span>
            </div>
            {reportOpen && (
              !report || report.order_count === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">今日尚無訂單</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {report.items.map(item => (
                      <tr key={item.name}>
                        <td className="py-1 text-gray-700">{item.name} x{item.quantity}</td>
                        <td className="py-1 text-right text-gray-700">${item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                    {report.addon_total > 0 && (
                      <tr>
                        <td className="py-1 text-gray-700">加購</td>
                        <td className="py-1 text-right text-gray-700">${report.addon_total.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr><td colSpan={2} className="border-t border-gray-200 pt-1" /></tr>
                    <tr>
                      <td className="font-bold text-gray-900">總計（{report.order_count}筆）</td>
                      <td className="text-right font-bold text-amber-700">${report.grand_total.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              )
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">最近訂單</h2>
              <button onClick={() => navigate('/orders')} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                查看全部 →
              </button>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">尚無訂單</div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((o) => {
                  const paid = o.is_paid || o.isPaid
                  const ship = o.is_ship || o.isShip
                  return (
                    <div
                      key={o.id || o._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors"
                      onClick={() => navigate('/orders')}
                    >
                      <div>
                        <div className="text-sm font-mono font-medium text-gray-900">#{o.display_id || o.displayId}</div>
                        <div className="text-xs text-gray-400">{formatDate(o.created_at || o.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{formatMoney(o.total_price || o.totalPrice)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {paid ? '已確認' : '待確認'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ship ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ship ? '已出貨' : '備餐中'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
