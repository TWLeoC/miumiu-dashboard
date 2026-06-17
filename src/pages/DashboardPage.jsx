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

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.created_at || o.createdAt || o.order_date)
    return d.toISOString().slice(0, 10) === todayStr
  })
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_price || o.totalPrice || 0), 0)
  const thisMonth = todayStr.slice(0, 7)
  const monthOrders = orders.filter(o => (o.created_at || '').startsWith(thisMonth))
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
