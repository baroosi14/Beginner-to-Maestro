import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Home          from './pages/Home'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Dashboard     from './pages/Dashboard'
import Courses       from './pages/Courses'
import CourseDetail  from './pages/CourseDetail'
import VideoPlayer   from './pages/VideoPlayer'
import LiveClasses   from './pages/LiveClasses'
import Profile       from './pages/Profile'
import PaymentResult from './pages/PaymentResult'

// Admin
import AdminLayout      from './pages/admin/AdminLayout'
import AdminDashboard   from './pages/admin/AdminDashboard'
import ManageStudents   from './pages/admin/ManageStudents'
import ManageCourses    from './pages/admin/ManageCourses'
import ManagePayments   from './pages/admin/ManagePayments'
import ManageLiveClasses from './pages/admin/ManageLiveClasses'
import Analytics        from './pages/admin/Analytics'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><Spinner /></div>
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function Spinner() {
  return (
    <div className="w-10 h-10 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin" />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />
        <Route path="/courses"      element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/payment/success" element={<PaymentResult />} />
        <Route path="/payment/cancel"  element={<PaymentResult />} />

        <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/learn/:slug/:lessonId" element={<PrivateRoute><VideoPlayer /></PrivateRoute>} />
        <Route path="/live-classes" element={<PrivateRoute><LiveClasses /></PrivateRoute>} />
        <Route path="/profile"      element={<PrivateRoute><Profile /></PrivateRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index                element={<AdminDashboard />} />
          <Route path="students"      element={<ManageStudents />} />
          <Route path="courses"       element={<ManageCourses />} />
          <Route path="payments"      element={<ManagePayments />} />
          <Route path="live-classes"  element={<ManageLiveClasses />} />
          <Route path="analytics"     element={<Analytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
