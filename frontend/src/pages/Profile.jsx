import { useState } from 'react'
import Navbar from '../components/common/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, login } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', password: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setSaving(true)
    const payload = { full_name: form.full_name, phone: form.phone }
    if (form.password) payload.password = form.password
    try {
      await api.put('/students/profile', payload)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-700 flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{user?.full_name}</p>
              <p className="text-primary-400 text-sm font-mono">{user?.student_id}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-dark-600 rounded-lg p-4 text-sm">
            <div><span className="text-gray-400">Role</span><p className="text-white capitalize mt-0.5">{user?.role}</p></div>
            <div><span className="text-gray-400">Member since</span><p className="text-white mt-0.5">{user?.created_at?.split('T')[0]}</p></div>
          </div>
        </div>

        <form onSubmit={handleSave} className="card p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg">Edit Profile</h2>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="border-t border-dark-600 pt-4">
            <h3 className="text-white font-medium mb-3">Change Password <span className="text-gray-500 text-sm font-normal">(leave blank to keep current)</span></h3>
            <div className="space-y-3">
              <div>
                <label className="label">New Password</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={8} />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input className="input" type="password" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} />
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
