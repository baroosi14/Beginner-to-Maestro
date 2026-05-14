import { useEffect, useState } from 'react'
import api from '../../services/api'

const STATUS_STYLE = { success:'bg-green-900/50 text-green-400', pending:'bg-yellow-900/50 text-yellow-400', failed:'bg-red-900/50 text-red-400', refunded:'bg-gray-800 text-gray-400' }

export default function ManagePayments() {
  const [payments, setPayments] = useState([])
  const [meta, setMeta]         = useState({})
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [status, setStatus]     = useState('')

  const fetchPayments = () => {
    setLoading(true)
    const p = new URLSearchParams({ page, per_page: 20 })
    if (status) p.set('status', status)
    api.get('/admin/payments?' + p).then(r => { setPayments(r.data.data || []); setMeta(r.data.meta || {}) }).finally(() => setLoading(false))
  }
  useEffect(fetchPayments, [page, status])

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Payments</h1>
          <p className="section-subtitle">{meta.total || 0} total transactions</p>
        </div>
        <select className="input w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="bg-dark-600">
              <tr>
                <th className="text-left">Reference</th>
                <th className="text-left">Student</th>
                <th className="text-left">Course</th>
                <th className="text-left">Amount</th>
                <th className="text-left">Provider</th>
                <th className="text-left">Status</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_,i)=><tr key={i}><td colSpan={7}><div className="h-8 bg-dark-600 animate-pulse rounded mb-1" /></td></tr>)
                : payments.map(p => (
                    <tr key={p.id}>
                      <td><span className="font-mono text-xs text-gray-400">{p.provider_ref?.slice(0,20)}…</span></td>
                      <td>
                        <p className="text-white text-sm">{p.student_name}</p>
                        <p className="text-gray-500 text-xs">{p.student_id}</p>
                      </td>
                      <td className="text-sm">{p.course_title || '—'}</td>
                      <td className="font-semibold text-white">{p.currency} {parseFloat(p.amount).toFixed(2)}</td>
                      <td className="capitalize">{p.provider}</td>
                      <td><span className={`badge text-xs ${STATUS_STYLE[p.status] || ''}`}>{p.status}</span></td>
                      <td className="text-xs">{p.paid_at?.split('T')[0] || p.created_at?.split('T')[0]}</td>
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
