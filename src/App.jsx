import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import useInactivityLogout from './hooks/useInactivityLogout'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import UsersPage from './pages/UsersPage'
import DiscountsPage from './pages/DiscountsPage'
import PaymentMethodsPage from './pages/PaymentMethodsPage'
import PickupSlotsPage from './pages/PickupSlotsPage'
import ExpensesPage from './pages/ExpensesPage'
import LineSettingsPage from './pages/LineSettingsPage'
import AdminLogsPage from './pages/AdminLogsPage'

function RequireAdmin({ children }) {
  const { user, token } = useAuthStore()
  useInactivityLogout()
  if (!token || !user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <Layout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="payment-methods" element={<PaymentMethodsPage />} />
        <Route path="pickup-slots" element={<PickupSlotsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="line-settings" element={<LineSettingsPage />} />
        <Route path="admin-logs" element={<AdminLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
