import { useEffect, useState } from 'react'
import api from '../utils/api'
import useConfirm from '../hooks/useConfirm'

const emptySlot = { date: '', start_time: '', end_time: '', max_orders: 20 }
const emptyBatch = { date_from: '', date_to: '', start_time: '', end_time: '', max_orders: 20 }
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

function groupByDate(slots) {
  const map = {}
  slots.forEach(s => {
    const date = s.date || s.slot_date || ''
    if (!map[date]) map[date] = []
    map[date].push(s)
  })
  return map
}

const getTWNow = () => new Date(Date.now() + 8 * 60 * 60 * 1000)
const getTWToday = () => getTWNow().toISOString().slice(0, 10)

export default function PickupSlotsPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [singleForm, setSingleForm] = useState(emptySlot)
  const [singleSaving, setSingleSaving] = useState(false)
  const [singleError, setSingleError] = useState('')

  const [batchForm, setBatchForm] = useState(emptyBatch)
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchError, setBatchError] = useState('')
  const [batchSuccess, setBatchSuccess] = useState('')

  const [processingId, setProcessingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ start_time: '', end_time: '' })
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const fetchSlots = () => {
    setLoading(true)
    api.get('/api/admin/pickup-slots')
      .then(res => {
        const data = res.data?.data || res.data || []
        setSlots(Array.isArray(data) ? data : [])
      })
      .catch(err => setError(err.response?.data?.message || '載入失敗'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSlots() }, [])

  const handleSingleSubmit = async (e) => {
    e.preventDefault()
    setSingleSaving(true)
    setSingleError('')
    try {
      await api.post('/api/admin/pickup-slots', {
        date: singleForm.date,
        start_time: singleForm.start_time,
        end_time: singleForm.end_time,
        max_orders: Number(singleForm.max_orders),
      })
      setSingleForm(emptySlot)
      fetchSlots()
    } catch (err) {
      setSingleError(err.response?.data?.message || '新增失敗')
    } finally {
      setSingleSaving(false)
    }
  }

  const handleBatchSubmit = async (e) => {
    e.preventDefault()
    setBatchSaving(true)
    setBatchError('')
    setBatchSuccess('')
    try {
      const res = await api.post('/api/admin/pickup-slots/batch', {
        date_from: batchForm.date_from,
        date_to: batchForm.date_to,
        start_time: batchForm.start_time,
        end_time: batchForm.end_time,
        max_orders: Number(batchForm.max_orders),
      })
      const count = res.data?.data?.created || res.data?.created || '?'
      setBatchSuccess(`已建立 ${count} 個時段`)
      setBatchForm(emptyBatch)
      fetchSlots()
    } catch (err) {
      setBatchError(err.response?.data?.message || '批次新增失敗')
    } finally {
      setBatchSaving(false)
    }
  }

  const handleDelete = async (slot) => {
    if (!await confirm(`確定刪除時段 ${slot.date} ${slot.start_time?.slice(0, 5)}-${slot.end_time?.slice(0, 5)}？`)) return
    setProcessingId(slot.id)
    try {
      await api.delete(`/api/admin/pickup-slots/${slot.id}`)
      fetchSlots()
    } catch (err) {
      alert(err.response?.data?.message || '刪除失敗')
    } finally {
      setProcessingId(null)
    }
  }

  const openEdit = (slot) => {
    setEditingId(slot.id)
    setEditForm({ start_time: (slot.start_time || '').slice(0, 5), end_time: (slot.end_time || '').slice(0, 5) })
    setEditError('')
  }

  const saveEdit = async (slot) => {
    if (!editForm.start_time || !editForm.end_time) { setEditError('請填入時間'); return }
    if (editForm.end_time <= editForm.start_time) { setEditError('結束時間必須晚於開始時間'); return }
    setEditSaving(true)
    setEditError('')
    try {
      await api.patch(`/api/admin/pickup-slots/${slot.id}`, { start_time: editForm.start_time, end_time: editForm.end_time })
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, ...editForm } : s))
      setEditingId(null)
    } catch (err) {
      setEditError(err.response?.data?.message || '儲存失敗')
    } finally {
      setEditSaving(false)
    }
  }

  const byDate = groupByDate(slots)
  const sortedDates = Object.keys(byDate).sort()
  const today = getTWToday()
  const futureDates = sortedDates.filter(d => d >= today)

  return (
    <div>
      {ConfirmDialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">取餐時段</h1>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">新增單一時段</div>
          <form onSubmit={handleSingleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">日期 *</label>
              <input className={inputCls} type="date" value={singleForm.date} onChange={e => setSingleForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">開始時間 *</label>
                <input className={inputCls} type="time" value={singleForm.start_time} onChange={e => setSingleForm(f => ({ ...f, start_time: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">結束時間 *</label>
                <input className={inputCls} type="time" value={singleForm.end_time} onChange={e => setSingleForm(f => ({ ...f, end_time: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">最大訂單數</label>
              <input className={inputCls} type="number" min="1" value={singleForm.max_orders} onChange={e => setSingleForm(f => ({ ...f, max_orders: e.target.value }))} />
            </div>
            {singleError && <div className="text-red-500 text-xs">{singleError}</div>}
            <button type="submit" className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50" disabled={singleSaving}>
              {singleSaving ? '新增中...' : '新增時段'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">批次新增時段</div>
          <form onSubmit={handleBatchSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">起始日期 *</label>
                <input className={inputCls} type="date" value={batchForm.date_from} onChange={e => setBatchForm(f => ({ ...f, date_from: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">結束日期 *</label>
                <input className={inputCls} type="date" value={batchForm.date_to} onChange={e => setBatchForm(f => ({ ...f, date_to: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">開始時間 *</label>
                <input className={inputCls} type="time" value={batchForm.start_time} onChange={e => setBatchForm(f => ({ ...f, start_time: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">結束時間 *</label>
                <input className={inputCls} type="time" value={batchForm.end_time} onChange={e => setBatchForm(f => ({ ...f, end_time: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">最大訂單數</label>
              <input className={inputCls} type="number" min="1" value={batchForm.max_orders} onChange={e => setBatchForm(f => ({ ...f, max_orders: e.target.value }))} />
            </div>
            {batchError && <div className="text-red-500 text-xs">{batchError}</div>}
            {batchSuccess && <div className="text-green-600 text-xs">{batchSuccess}</div>}
            <button type="submit" className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50" disabled={batchSaving}>
              {batchSaving ? '批次新增中...' : '批次新增'}
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>
      ) : futureDates.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">尚無時段</div>
      ) : (
        <div className="space-y-4">
          {futureDates.map(date => (
            <div key={date} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                <span className="text-sm font-semibold text-amber-900">{date}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {byDate[date].map(slot => (
                  <div key={slot.id} className="px-4 py-3 flex items-center gap-4">
                    {editingId === slot.id ? (
                      <>
                        <input className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-amber-400" type="time" value={editForm.start_time} onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))} />
                        <span className="text-gray-400 text-xs">-</span>
                        <input className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-amber-400" type="time" value={editForm.end_time} onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))} />
                        {editError && <span className="text-red-500 text-xs">{editError}</span>}
                        <div className="ml-auto flex gap-2">
                          <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => saveEdit(slot)} disabled={editSaving}>{editSaving ? '儲存中...' : '儲存'}</button>
                          <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setEditingId(null)}>取消</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-gray-900">{(slot.start_time || '').slice(0, 5)} – {(slot.end_time || '').slice(0, 5)}</span>
                        <span className="text-xs text-gray-400">最多 {slot.max_orders} 單</span>
                        <div className="ml-auto flex gap-2">
                          <button className="text-xs text-amber-600 hover:text-amber-700 font-medium" onClick={() => openEdit(slot)}>編輯</button>
                          <button className="text-xs text-red-500 hover:text-red-600 font-medium" disabled={processingId === slot.id} onClick={() => handleDelete(slot)}>刪除</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
