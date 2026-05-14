import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const PROVIDERS = [
  { id: 'paystack',    name: 'Paystack',    flag: '🇳🇬', desc: 'Cards, Bank Transfer' },
  { id: 'flutterwave', name: 'Flutterwave', flag: '🌍', desc: 'Cards, Mobile Money' },
  { id: 'stripe',      name: 'Stripe',      flag: '💳', desc: 'Credit / Debit Cards' },
  { id: 'paypal',      name: 'PayPal',      flag: '🅿️', desc: 'PayPal Account' },
]

export default function PaymentModal({ course, onClose, onSuccess }) {
  const [provider, setProvider] = useState('paystack')
  const [loading, setLoading]   = useState(false)

  const handlePay = async () => {
    setLoading(true)
    try {
      const res = await api.post('/payments/initiate', {
        provider,
        type: 'course',
        item_id: course.id,
        callback_url: `${window.location.origin}/payment/success`,
      })
      const { authorization_url, reference } = res.data.data
      sessionStorage.setItem('btm_payment_ref', reference)
      sessionStorage.setItem('btm_payment_provider', provider)
      window.location.href = authorization_url
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="p-6 border-b border-dark-600 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Complete Purchase</h2>
            <p className="text-gray-400 text-sm mt-0.5">{course.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-dark-600 rounded-lg p-4">
            <span className="text-gray-300 text-sm">Course Price</span>
            <span className="text-white font-bold text-xl">
              {course.currency || 'USD'} {parseFloat(course.price).toFixed(2)}
            </span>
          </div>

          <p className="text-gray-400 text-sm font-medium">Select payment method</p>
          <div className="grid grid-cols-2 gap-3">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  provider === p.id
                    ? 'border-primary-500 bg-primary-900/30'
                    : 'border-dark-500 bg-dark-600 hover:border-dark-400'
                }`}
              >
                <div className="text-lg mb-1">{p.flag}</div>
                <div className="text-white text-sm font-semibold">{p.name}</div>
                <div className="text-gray-400 text-xs">{p.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Redirecting...' : `Pay with ${PROVIDERS.find(p => p.id === provider)?.name}`}
          </button>
          <p className="text-center text-gray-500 text-xs">
            You will be redirected to complete payment securely
          </p>
        </div>
      </div>
    </div>
  )
}
