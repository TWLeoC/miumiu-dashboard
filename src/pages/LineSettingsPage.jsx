import { useEffect, useState } from 'react'
import api from '../utils/api'
import useConfirm from '../hooks/useConfirm'

export default function LineSettingsPage() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  const [form, setForm] = useState({
    line_bot_enabled: false,
    line_notify_target: '',
    webhook_token: '',
    line_bot_basic_id: '',
  })

  useEffect(() => {
    api.get('/api/admin/line-settings')
      .then(res => setForm(res.data.data))
      .catch(() => setErr('載入失敗'))
      .finally(() => setLoading(false))
  }, [])

  const addFriendUrl = form.line_bot_basic_id ? `https://line.me/R/ti/p/${form.line_bot_basic_id}` : null

  const handleCopyCode = () => {
    if (!form.webhook_token) return
    navigator.clipboard.writeText(form.webhook_token)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    setErr('')
    try {
      await api.patch('/api/admin/line-settings', { line_bot_enabled: form.line_bot_enabled })
      setMsg('設定已儲存')
    } catch (e) {
      setErr(e.response?.data?.message || '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleResetTarget = async () => {
    if (!await confirm('確定要重置通知對象？', '重置後需重新傳送設定碼才能再次連線。')) return
    try {
      await api.patch('/api/admin/line-settings', { line_notify_target: '' })
      setForm(f => ({ ...f, line_notify_target: '' }))
      setMsg('已重置，請重新傳送設定碼')
    } catch {
      setErr('重置失敗')
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">載入中...</div>

  const isConnected = !!form.line_notify_target

  return (
    <div>
      {ConfirmDialog}
      <h1 className="text-xl font-bold text-gray-900 mb-2">LINE 通知設定</h1>
      <p className="text-sm text-gray-500 mb-6">設定完成後，每當有新訂單，系統會透過 LINE 推播通知給您。</p>

      <form className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-900">啟用 LINE 通知</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" name="line_bot_enabled" checked={form.line_bot_enabled} onChange={handleChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-checked:bg-amber-400 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-amber-300" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        <div className="py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">連線狀態</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isConnected ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              {isConnected ? '已連線' : '未連線'}
            </span>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 mt-2">
              <code className="text-xs bg-gray-50 px-2 py-1 rounded font-mono text-gray-600">{form.line_notify_target}</code>
              <button type="button" className="text-xs text-red-500 hover:text-red-600 font-medium" onClick={handleResetTarget}>重置</button>
            </div>
          )}
        </div>

        {msg && <div className="text-green-600 text-sm my-3">{msg}</div>}
        {err && <div className="text-red-500 text-sm my-3">{err}</div>}

        <button className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50" type="submit" disabled={saving}>
          {saving ? '儲存中...' : '儲存設定'}
        </button>
      </form>

      {!isConnected && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">如何連線？</h2>
          <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
            <li>
              {addFriendUrl
                ? <><a href={addFriendUrl} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-700 underline">點此將官方 Bot 加為好友</a>（或掃 QR Code）</>
                : '將官方 LINE Bot 加為好友（請向平台取得 QR Code）'
              }
            </li>
            <li>
              加好友後，傳送以下<strong>設定碼</strong>給 Bot：
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg font-mono text-sm text-gray-800 border border-gray-200">{form.webhook_token}</code>
                <button type="button" onClick={handleCopyCode} className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-white text-xs rounded-lg transition-colors whitespace-nowrap">
                  {copiedCode ? '已複製' : '複製'}
                </button>
              </div>
            </li>
            <li>傳送後重新整理此頁面，連線狀態變為「已連線」即完成。</li>
          </ol>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 opacity-60">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">自訂 LINE Bot（進階）</span>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">待開通</span>
        </div>
        <div className="text-sm text-gray-500 text-center py-4">🔒 此功能尚未開放，如需使用請聯繫平台</div>
      </div>
    </div>
  )
}
