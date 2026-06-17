import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'
import useAuthStore from '@/store/authStore'
import logo from '@/assets/miumiuLogo.jpg'

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID

function buildLineAuthUrl() {
  const redirectUri = `${window.location.origin}/login`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: redirectUri,
    state: 'admin-line-login',
    scope: 'profile openid',
  })
  return `https://access.line.me/oauth2/v2.1/authorize?${params}`
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, clearAuth } = useAuthStore()

  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [lineLoading, setLineLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const lineCode = params.get('code')
    const state = params.get('state')
    if (!lineCode || state !== 'admin-line-login') return

    window.history.replaceState({}, '', '/login')
    setLineLoading(true)
    setError('')
    api.post('/api/auth/line', {
      code: lineCode,
      redirect_uri: `${window.location.origin}/login`,
    })
      .then(res => {
        const { user, token } = res.data?.data || {}
        if (!user || !token) { setError('登入失敗，請重試'); return }
        if (user.role !== 'ADMIN') { setError('此 LINE 帳號無管理員權限'); return }
        setAuth(user, token)
        navigate('/')
      })
      .catch(err => setError(err.response?.data?.message || 'LINE 登入失敗'))
      .finally(() => setLineLoading(false))
  }, [])

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/send-code', { phone: phone.trim() })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || '發送驗證碼失敗，請確認手機號碼')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/verify-code', {
        phone: phone.trim(),
        code: code.trim(),
      })
      const { user, token } = res.data?.data || res.data || {}
      if (!user || !token) { setError('登入失敗，請重試'); return }
      if (user.role !== 'ADMIN') {
        clearAuth()
        setError('此帳號無管理員權限，請聯繫系統管理員')
        return
      }
      setAuth(user, token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '驗證碼錯誤或已過期')
    } finally {
      setLoading(false)
    }
  }

  if (lineLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <img src={logo} alt="秧秧雞蛋糕" className="w-16 h-16 object-cover mx-auto mb-4 rounded-2xl" />
          <p className="text-gray-500 text-sm">LINE 登入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="秧秧雞蛋糕" className="w-20 h-20 object-cover mx-auto mb-3 rounded-2xl" />
          <h1 className="text-xl font-bold text-gray-900">秧秧雞蛋糕</h1>
          <p className="text-sm text-gray-500 mt-1">後台管理系統</p>
        </div>

        <hr className="border-gray-100 mb-6" />

        {step === 1 ? (
          <>
            <p className="text-sm font-medium text-gray-700 mb-4">輸入手機號碼登入</p>
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手機號碼</label>
                <input
                  type="tel"
                  placeholder="09XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full h-10 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {loading ? '發送中...' : '發送驗證碼'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <hr className="flex-1 border-gray-100" />
              <span className="text-xs text-gray-400">或</span>
              <hr className="flex-1 border-gray-100" />
            </div>
            <a
              href={LINE_CHANNEL_ID ? buildLineAuthUrl() : undefined}
              onClick={!LINE_CHANNEL_ID ? (e) => { e.preventDefault(); alert('請先設定 VITE_LINE_CHANNEL_ID 環境變數') } : undefined}
              className={`flex items-center justify-center gap-2 w-full h-10 bg-[#06C755] text-white font-medium rounded-lg text-sm transition-colors ${LINE_CHANNEL_ID ? 'hover:bg-[#05a847]' : 'opacity-50 cursor-not-allowed'}`}
            >
              <svg width="18" height="18" viewBox="0 0 44 44" fill="none">
                <path d="M22 4C12.059 4 4 11.163 4 20c0 5.408 3.026 10.19 7.687 13.19L10 40l6.863-3.6C18.21 36.785 20.077 37 22 37c9.941 0 18-7.163 18-16S31.941 4 22 4z" fill="white"/>
              </svg>
              以 LINE 帳號登入
            </a>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700 mb-1">輸入驗證碼</p>
            <p className="text-xs text-gray-500 mb-4">驗證碼已發送至 {phone}</p>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6 位數驗證碼</label>
                <input
                  type="text"
                  placeholder="請輸入驗證碼"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  autoFocus
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full h-10 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {loading ? '驗證中...' : '登入'}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setCode(''); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
              >
                ← 重新輸入手機號碼
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
