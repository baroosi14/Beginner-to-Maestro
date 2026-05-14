import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [meta, setMeta]         = useState({})
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [page, setPage]         = useState(1)

  const fetch = () => {
    setLoading(true)
    const p = new URLSearchParams({ page, per_page: 20 })
    if (query) p.set('q', query)
    api.get('/admin/students?' + p).then(r => { setStudents(r.data.data); setMeta(r.data.meta) }).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [page])
  useEffect(() => { setPage(1); fetch() }, [query])

  const toggleActive = async (s) => {
    try {
      await api.patch(`/admin/students/${s.id}`, { is_active: s.is_active ? 0 : 1 })
      toast.success(s.is_active ? 'Student deactivated' : 'Student activated')
      setStudents(ss => ss.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x))
    } catch {
      toast.error('Action failed')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Students</h1>
          <p className="section-subtitle">{meta.total || 0} total students</p>
        </div>
        <input className="input w-64" placeholder="Search students..." value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="bg-dark-600">
              <tr>
                <th className="text-left">Student ID</th>
                <th className="text-left">Name</th>
                <th className="text-left">Email</th>
                <th className="text-left">Phone</th>
                <th className="text-left">Joined</th>
                <th className="text-left">Status</th>
                <th className="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_,i) => (
                    <tr key={i}><td colSpan={7}><div className="h-8 bg-dark-600 animate-pulse rounded" /></td></tr>
                  ))
                : students.map(s => (
                    <tr key={s.id}>
                      <td><span className="font-mono text-primary-400 text-xs">{s.student_id}</span></td>
                      <td className="text-white font-medium">{s.full_name}</td>
                      <td>{s.email}</td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.created_at?.split('T')[0]}</td>
                      <td>
                        <span className={`badge text-xs ${s.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => toggleActive(s)}
                          className={`text-xs px-3 py-1 rounded-lg transition-colors ${s.is_active ? 'text-red-400 hover:bg-red-900/20' : 'text-green-400 hover:bg-green-900/20'}`}>
                          {s.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {meta.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">← Prev</button>
          <span className="flex items-center px-4 text-gray-400 text-sm">Page {page} of {meta.total_pages}</span>
          <button disabled={page===meta.total_pages} onClick={() => setPage(p=>p+1)} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
