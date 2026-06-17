import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, LogOut, X } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: '📊', label: '報表總覽', to: '/' },
  { icon: '📋', label: '訂單管理', to: '/orders' },
  { icon: '🥚', label: '商品管理', to: '/products' },
  { icon: '🏷️', label: '分類管理', to: '/categories' },
  { icon: '👥', label: '使用者管理', to: '/users' },
  { icon: '🎟️', label: '優惠券管理', to: '/discounts' },
  { icon: '💳', label: '付款方式', to: '/payment-methods' },
  { icon: '📅', label: '取餐時段', to: '/pickup-slots' },
  { icon: '💸', label: '支出管理', to: '/expenses' },
  { icon: '💬', label: 'LINE 通知', to: '/line-settings' },
  { icon: '🔍', label: '操作紀錄', to: '/admin-logs' },
]

export default function Layout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 flex flex-col z-30 transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 text-base">秧秧雞蛋糕</div>
              <div className="text-xs text-gray-500 mt-0.5">後台管理系統</div>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5',
                  isActive
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          {user && (
            <div className="text-xs text-gray-500 mb-3 truncate">
              {user.name || user.phone || '管理員'}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={15} />
            <span>登出</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-semibold text-gray-900 text-sm">秧秧雞蛋糕</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
