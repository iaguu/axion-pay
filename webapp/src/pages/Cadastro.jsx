import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL, buildApiHeaders } from '../utils/api.js'
import { t } from '../i18n'
import { getCopy, trackEvent } from '../lib/controlPlane.js'
import './styles/Auth.css'

const INITIAL_FORM = {
  name: '',
  cpf: '',
  whatsapp: '',
  password: '',
}

export default function Cadastro({ controlPayload = {} }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('qa') === 'sandbox') {
      setApiKey('axion_sandbox_sk_live_qa_state_360_mobile')
      setStatus({ type: 'success', message: `${t('auth.signupSuccess')} axion_sandbox_sk_live_qa_state_360_mobile` })
    }
  }, [])

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function copyKey() {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    setStatus(null)
    setIsSubmitting(true)

    try {
      await trackEvent('signup', 'signup_attempt', { cpf: formData.cpf.replace(/\D/g, '').slice(0, 4) })
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: formData.name.trim(),
          cpf: formData.cpf.replace(/\D/g, ''),
          whatsapp: formData.whatsapp.trim(),
          password: formData.password,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || data?.message || t('auth.signupError'))
      }

      const key = data?.api_key || ''
      setApiKey(key)
      setStatus({ type: 'success', message: `${t('auth.signupSuccess')} ${key || 'disponivel no dashboard.'}` })
      await trackEvent('signup', 'signup_success', { hasApiKey: Boolean(key) })
      setFormData(INITIAL_FORM)
    } catch (error) {
      setStatus({ type: 'error', message: error?.message || t('auth.signupError') })
      await trackEvent('signup', 'signup_error', { reason: error?.message || 'unknown' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="authPage">
      <article className="authCard">
        <div className="authInfo">
          <p className="eyebrow">Sandbox imediata</p>
          <h1>{getCopy(controlPayload, 'auth-signup', 'title', t('auth.signupTitle'))}</h1>
          <p>{getCopy(controlPayload, 'auth-signup', 'subtitle', 'Crie um workspace de testes, gere pay-tags e valide seu fluxo de checkout antes do go-live.')}</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            <span>Nome completo</span>
            <input value={formData.name} onChange={handleChange('name')} placeholder="Seu nome" required />
          </label>
          <label>
            <span>CPF</span>
            <input value={formData.cpf} onChange={handleChange('cpf')} inputMode="numeric" placeholder="12345678909" required />
          </label>
          <label>
            <span>WhatsApp</span>
            <input value={formData.whatsapp} onChange={handleChange('whatsapp')} placeholder="5511999999999" required />
          </label>
          <label>
            <span>Senha</span>
            <input type="password" value={formData.password} onChange={handleChange('password')} minLength={8} required />
          </label>
          <button className="authBtn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando sandbox...' : t('header.sandbox')}
          </button>
          {status && <p className={`authStatus ${status.type}`}>{status.message}</p>}

          {apiKey && (
            <div className="apiKeyWrap" role="status" aria-live="polite">
              <p className="apiKeyLabel">{t('auth.signupSuccess')}</p>
              <code className="apiKeyCode">{apiKey}</code>
              <div className="apiKeyActions">
                <button type="button" className="authBtn secondary" onClick={copyKey}>
                  {copied ? t('auth.copied') : t('auth.copy')}
                </button>
                <button type="button" className="authBtn" onClick={() => navigate('/dashboard')}>
                  {t('auth.goDashboard')}
                </button>
              </div>
            </div>
          )}
        </form>
      </article>
    </section>
  )
}
