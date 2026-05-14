import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EMPTY = { title:'', description:'', scheduled_at:'', duration_mins:60, platform:'zoom', meeting_url:'', meeting_id:'', meeting_password:'', max_attendees:'' }

export default function ManageLiveClasses() {
  const [classes, setClasses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [editId, setEditId]     = useState(null)

  const fetchClasses = () => {
    setLoading(true)
    api.get('/admin/live-classes').then(r => setClasses(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(fetchClasses, [])

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit   = (c) => {
    setForm({ title:c.title, description:c.description||'', scheduled_at:c.scheduled_at?.slice(0,16)||'', duration_mins:c.duration_mins, platform:c.platform, meeting_url:c.meeting_url||'', meeting_id:c.meeting_id||'', meeting_password:c.meeting_password||'', max_attendees:c.max_attendees||'' })
    setEditId(c.id); setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) { await api.put(`/admin/live-classes/${editId}`, form); toast.success('Class updated!') }
      else        { await api.post('/admin/live-classes', form);          toast.success('Class created!') }
      setModal(false)
      fetchClasses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this live class?')) return
    try { await api.delete(`/admin/live-classes/${id}`); toast.success('Class cancelled'); fetchClasses() }
    catch { toast.error('Failed') }
  }

  const STATUS_STYLE = { scheduled:'bg-blue-900/50 text-blue-400', live:'bg-red-900/50 text-red-400 animate-pulse', completed:'bg-gray-800 text-gray-400', cancelled:'bg-red-900/30 text-red-600' }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Live Classes</h1>
          <p className="section-subtitle">{classes.length} classes</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">+ Schedule Class</button>
      </div>

      <div className="space-y-3">
        {loading
          ? [...Array(3)].map((_,i)=><div key={i} className="card h-20 animate-pulse" />)
          : classes.map(c => (
              <div key={c.id} className="card p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs ${STATUS_STYLE[c.status]||''}`}>{c.status}</span>
                    <span className="text-gray-400 text-xs capitalize">{c.platform?.replace('_',' ')}</span>
                  </div>
                  <p className="text-white font-semibold">{c.title}</p>
                  <p className="text-gray-400 text-sm">{c.instructor} · {format(new Date(c.scheduled_at), 'MMM d, yyyy h:mm a')} · {c.duration_mins}min</p>
                  <p className="text-gray-500 text-xs mt-0.5">{c.registered_count || 0} registered{c.max_attendees ? ` / ${c.max_attendees}` : ''}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                  {c.status !== 'cancelled' && (
                    <button onClick={() => cancel(c.id)} className="text-xs text-red-400 hover:text-red-300 px-2">Cancel</button>
                  )}
                </div>
              </div>
            ))
        }
        {!loading && classes.length === 0 && (
          <div className="card p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📡</div>
            <p>No live classes scheduled yet</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{editId ? 'Edit' : 'Schedule'} Live Class</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="label">Title</label><input className="input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
              <div><label className="label">Date & Time</label><input className="input" type="datetime-local" required value={form.scheduled_at} onChange={e=>setForm({...form,scheduled_at:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Duration (min)</label><input className="input" type="number" min="15" value={form.duration_mins} onChange={e=>setForm({...form,duration_mins:e.target.value})} /></div>
                <div><label className="label">Max Attendees</label><input className="input" type="number" min="1" value={form.max_attendees} onChange={e=>setForm({...form,max_attendees:e.target.value})} placeholder="Unlimited" /></div>
              </div>
              <div><label className="label">Platform</label>
                <select className="input" value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})}>
                  {['zoom','google_meet','teams','custom'].map(p=><option key={p} value={p}>{p.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="label">Meeting URL</label><input className="input" type="url" value={form.meeting_url} onChange={e=>setForm({...form,meeting_url:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Meeting ID</label><input className="input" value={form.meeting_id} onChange={e=>setForm({...form,meeting_id:e.target.value})} /></div>
                <div><label className="label">Password</label><input className="input" value={form.meeting_password} onChange={e=>setForm({...form,meeting_password:e.target.value})} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
