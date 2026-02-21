import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL, buildApiHeaders } from '../utils/api.js'
import { t } from '../i18n'
import { getCopy, trackEvent } from '../lib/controlPlane.js'
import './styles/Auth.css'

const INITIAL_FORM = { identifier: '', password: '' }

export default function Login({ controlPayload = {} }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    setStatus(null)
    setIsSubmitting(true)

    try {
      await trackEvent('login', 'login_attempt', { identifier: formData.identifier.trim() })
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || data?.message || t('auth.loginError'))
      }

      setStatus({ type: 'success', message: t('auth.loginSuccess') })
      await trackEvent('login', 'login_success', { identifier: formData.identifier.trim() })
      window.setTimeout(() => navigate('/dashboard'), 600)
    } catch (error) {
      setStatus({ type: 'error', message: error?.message || t('auth.loginError') })
      await trackEvent('login', 'login_error', { reason: error?.message || 'unknown' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="authPage">
      <article className="authCard">
        <div className="authInfo">
          <p className="eyebrow">Acesso seguro</p>
          <h1>{getCopy(controlPayload, 'auth-login', 'title', t('auth.loginTitle'))}</h1>
          <p>{getCopy(controlPayload, 'auth-login', 'subtitle', 'Entre para acompanhar transacoes, status de risco, pay-tags e configuracoes de operacao.')}</p>
        </div>
        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            <span>E-mail ou WhatsApp</span>
            <input
              type="text"
              autoComplete="username"
              value={formData.identifier}
              onChange={handleChange('identifier')}
              placeholder="voce@empresa.com"
              required
            />
          </label>
          <label>
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange('password')}
              placeholder="Digite sua senha"
              minLength={8}
              required
            />
          </label>
          <button className="authBtn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : t('header.login')}
          </button>
          {status && <p className={`authStatus ${status.type}`}>{status.message}</p>}
          <button type="button" className="authLinkBtn" onClick={() => navigate('/cadastro')}>
            {t('header.signup')}
          </button>
        </form>
      </article>
    </section>
  )
}
