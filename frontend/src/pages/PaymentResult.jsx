import { useEffect, useState } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function PaymentResult() {
  const [params]  = useSearchParams()
  const location  = useLocation()
  const isCancel  = location.pathname.includes('cancel')
  const [status, setStatus] = useState(isCancel ? 'cancelled' : 'verifying')

  useEffect(() => {
    if (isCancel) return
    const ref      = params.get('ref') || params.get('reference') || sessionStorage.getItem('btm_payment_ref')
    const provider = params.get('provider') || sessionStorage.getItem('btm_payment_provider') || 'paystack'
    if (!ref) { setStatus('error'); return }

    api.post('/payments/verify', { reference: ref, provider })
      .then(r => {
        setStatus('success')
        sessionStorage.removeItem('btm_payment_ref')
        sessionStorage.removeItem('btm_payment_provider')
        toast.success('Payment verified!')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="card p-10 text-center max-w-md w-full animate-slide-up">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin" />
            <h2 className="text-white font-bold text-xl">Verifying payment...</h2>
            <p className="text-gray-400 mt-2">Please wait while we confirm your payment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-white font-bold text-2xl mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-6">You're now enrolled. Start learning right away!</p>
            <Link to="/dashboard" className="btn-primary w-full py-3 text-base">Go to Dashboard →</Link>
          </>
        )}
        {status === 'cancelled' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-white font-bold text-2xl mb-2">Payment Cancelled</h2>
            <p className="text-gray-400 mb-6">Your payment was cancelled. No charges were made.</p>
            <Link to="/courses" className="btn-outline w-full py-3 text-base">Browse Courses</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-white font-bold text-2xl mb-2">Verification Failed</h2>
            <p className="text-gray-400 mb-6">We could not verify your payment. If you were charged, contact support.</p>
            <Link to="/dashboard" className="btn-secondary w-full py-3 text-base">Go to Dashboard</Link>
          </>
        )}
      </div>
    </div>
  )
}
