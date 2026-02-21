
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL, buildApiHeaders } from '../utils/api.js'
import { t } from '../i18n'
import './styles/DashboardRoutes.css'

const NAV_ITEMS = [
  { id: 'overview', label: 'Visao geral', hint: 'Resumo da operacao', icon: 'home' },
  { id: 'analytics', label: 'Analiticos', hint: 'Volume, metodos e tendencia', icon: 'chart' },
  { id: 'actions', label: 'Acoes', hint: 'Atalhos operacionais', icon: 'bolt' },
  { id: 'payouts', label: 'Saques e PIX', hint: 'Saldo, chave e historico', icon: 'wallet' },
  { id: 'integrations', label: 'Integracoes', hint: 'Servicos externos', icon: 'plug' },
  { id: 'checkout-pro', label: 'CheckoutPRO', hint: 'Editor e preview', icon: 'checkout' },
  { id: 'paytags', label: 'Pay-tags', hint: 'Canais de atribuicao', icon: 'tag' },
  { id: 'products', label: 'Produtos', hint: 'Catalogo de checkout', icon: 'box' },
  { id: 'tokens', label: 'Tokens', hint: 'Acesso API', icon: 'key' },
  { id: 'support', label: 'Suporte', hint: 'Chamados', icon: 'support' },
]

const ICON_PATHS = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  chart: 'M4 19h16M7 15l3-3 3 2 5-6',
  bolt: 'm13 2-8 10h6l-1 10 8-12h-6z',
  wallet: 'M3 7h18v12H3z M15 13h6',
  plug: 'M8 3v6M16 3v6M7 9h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5zM12 17v4',
  checkout: 'M4 6h16v12H4z M8 10h8 M8 14h5',
  tag: 'M4 11V5h6l8 8-6 6z',
  box: 'M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7',
  key: 'M13 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M17 11h4M19 9v4',
  support: 'M4 13a8 8 0 1 1 16 0v5h-4v-5M8 18h8',
}

const initialState = {
  status: 'loading',
  message: '',
  user: null,
  overview: null,
  recentTransactions: [],
  payTags: [],
  products: [],
  apiKeys: [],
  support: [],
  payoutKey: '',
  payoutRequests: [],
  payoutEligible: false,
  clientInsights: [],
  integrations: { services: [], updatedAt: null },
  checkoutPro: null,
}

const initialCheckoutForm = {
  brandName: '',
  heroTitle: '',
  heroSubtitle: '',
  primaryColor: '#2da06d',
  accentColor: '#aef7b5',
  surfaceTone: 'glass',
  highlightPix: true,
  showCountdown: true,
  testimonialText: '',
  footerMessage: '',
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusLabel(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'pending') return 'Pendente'
  if (normalized === 'approved') return 'Aprovado'
  if (normalized === 'paid') return 'Pago'
  if (normalized === 'rejected') return 'Rejeitado'
  if (normalized === 'failed') return 'Falhou'
  return normalized || '-'
}

function Icon({ name }) {
  const d = ICON_PATHS[name] || ICON_PATHS.home
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}

function getCurrentTab(pathname) {
  const parts = String(pathname || '').split('/').filter(Boolean)
  return parts[1] || 'overview'
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: buildApiHeaders({
      ...(options.headers || {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    }),
  })
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

export default function DashboardRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentTab = getCurrentTab(location.pathname)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [data, setData] = useState(initialState)

  const [payTagForm, setPayTagForm] = useState({ name: '', description: '' })
  const [productForm, setProductForm] = useState({
    slug: '',
    title: '',
    description: '',
    price: '',
    theme: 'black',
    template: 'classic',
    payTagId: '',
  })
  const [editingProductId, setEditingProductId] = useState('')
  const [supportForm, setSupportForm] = useState('')
  const [payoutKeyForm, setPayoutKeyForm] = useState('')
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'pix', notes: '' })
  const [checkoutProForm, setCheckoutProForm] = useState(initialCheckoutForm)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/overview', { replace: true })
      return
    }
    if (!NAV_ITEMS.some((item) => item.id === currentTab)) {
      navigate('/dashboard/overview', { replace: true })
    }
  }, [currentTab, location.pathname, navigate])

  async function loadDashboard() {
    setData((prev) => ({ ...prev, status: 'loading', message: '' }))

    try {
      const me = await apiFetch('/account/me')
      if (!me.ok) {
        navigate('/login', { replace: true })
        return
      }

      const [overview, payTags, products, tokens, support, payoutKey, payouts, clients, integrations, checkoutPro] = await Promise.all([
        apiFetch('/api/dashboard/overview'),
        apiFetch('/api/dashboard/pay-tags'),
        apiFetch('/api/dashboard/products'),
        apiFetch('/api/dashboard/tokens'),
        apiFetch('/api/dashboard/support-chat'),
        apiFetch('/account/payout-key'),
        apiFetch('/api/dashboard/payouts'),
        apiFetch('/api/dashboard/clients'),
        apiFetch('/api/dashboard/integrations'),
        apiFetch('/api/dashboard/checkout-pro'),
      ])

      if (!overview.ok) {
        throw new Error(overview.data?.error || t('dashboard.error'))
      }

      const next = {
        status: 'success',
        message: '',
        user: me.data?.user || null,
        overview: overview.data?.overview || null,
        recentTransactions: overview.data?.recentTransactions || [],
        payTags: payTags.ok ? payTags.data?.pay_tags || payTags.data?.payTags || [] : [],
        products: products.ok ? products.data?.products || [] : [],
        apiKeys: tokens.ok ? tokens.data?.api_keys || [] : [],
        support: support.ok ? support.data?.chats || support.data?.requests || [] : [],
        payoutKey: payoutKey.ok ? payoutKey.data?.destination || '' : '',
        payoutRequests: payouts.ok ? payouts.data?.requests || [] : [],
        payoutEligible: payouts.ok ? Boolean(payouts.data?.eligible) : false,
        clientInsights: clients.ok ? clients.data?.clients || [] : [],
        integrations: integrations.ok ? integrations.data?.integrations || { services: [], updatedAt: null } : { services: [], updatedAt: null },
        checkoutPro: checkoutPro.ok ? checkoutPro.data?.config || null : null,
      }

      next.status = next.overview ? 'success' : 'empty'
      setData(next)
      setPayoutKeyForm(next.payoutKey || '')
      setCheckoutProForm(next.checkoutPro || initialCheckoutForm)
      setProductForm((prev) => ({ ...prev, payTagId: prev.payTagId || next.payTags?.[0]?.id || '' }))
    } catch (error) {
      setData((prev) => ({ ...prev, status: 'error', message: error?.message || t('dashboard.error') }))
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (!flash) return
    const id = window.setTimeout(() => setFlash(''), 2600)
    return () => window.clearTimeout(id)
  }, [flash])

  const statusBreakdown = useMemo(() => data.overview?.statusBreakdown || [], [data.overview])
  const pendingPayoutTotal = useMemo(
    () =>
      (data.payoutRequests || [])
        .filter((entry) => String(entry.status || '').toLowerCase() === 'pending')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    [data.payoutRequests],
  )

  const methodBreakdown = useMemo(() => {
    const rows = new Map()
    for (const tx of data.recentTransactions || []) {
      const method = String(tx.method || 'outros').toLowerCase()
      const curr = rows.get(method) || { method, count: 0, volume: 0 }
      curr.count += 1
      curr.volume += Number(tx.amount || 0)
      rows.set(method, curr)
    }
    return Array.from(rows.values()).sort((a, b) => b.volume - a.volume)
  }, [data.recentTransactions])

  const approvalRate = useMemo(() => {
    const approved = statusBreakdown
      .filter((entry) => ['approved', 'paid'].includes(String(entry.status || '').toLowerCase()))
      .reduce((sum, entry) => sum + Number(entry.count || 0), 0)
    const total = statusBreakdown.reduce((sum, entry) => sum + Number(entry.count || 0), 0)
    if (!total) return 0
    return Math.round((approved / total) * 100)
  }, [statusBreakdown])

  const activeIntegrations = useMemo(
    () => (data.integrations?.services || []).filter((service) => service.enabled).length,
    [data.integrations],
  )

  const openSupportCount = useMemo(
    () => (data.support || []).filter((item) => !['closed', 'done', 'resolved'].includes(String(item.status || '').toLowerCase())).length,
    [data.support],
  )

  const operationalAlerts = useMemo(() => {
    const alerts = []
    if (!data.payoutKey) alerts.push('Configure a chave PIX para liberar saques automaticos.')
    if (!activeIntegrations) alerts.push('Nenhuma integracao ativa. Conecte ao menos um servico externo.')
    if (openSupportCount > 0) alerts.push(`${openSupportCount} chamado(s) de suporte aguardando retorno.`)
    if (!data.products.length) alerts.push('Cadastre um produto para gerar links de checkout.')
    return alerts
  }, [data.payoutKey, activeIntegrations, openSupportCount, data.products.length])

  async function submitPayTag(event) {
    event.preventDefault()
    try {
      const result = await apiFetch('/api/dashboard/pay-tags', {
        method: 'POST',
        body: JSON.stringify(payTagForm),
      })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel criar pay-tag.')
      setPayTagForm({ name: '', description: '' })
      setFlash('Pay-tag criada com sucesso.')
      await loadDashboard()
    } catch (error) {
      setFlash(error.message)
    }
  }

  function resetProductForm() {
    setProductForm({
      slug: '',
      title: '',
      description: '',
      price: '',
      theme: 'black',
      template: 'classic',
      payTagId: data.payTags?.[0]?.id || '',
    })
    setEditingProductId('')
  }

  async function submitProduct(event) {
    event.preventDefault()
    try {
      const payload = {
        slug: String(productForm.slug || '').trim(),
        title: String(productForm.title || '').trim(),
        description: String(productForm.description || '').trim(),
        price: Number(productForm.price || 0),
        currency: 'BRL',
        theme: productForm.theme === 'white' ? 'white' : 'black',
        template: productForm.template === 'premium' ? 'premium' : 'classic',
        payTagId: String(productForm.payTagId || '').trim(),
      }
      const url = editingProductId ? `/api/dashboard/products/${editingProductId}` : '/api/dashboard/products'
      const method = editingProductId ? 'PATCH' : 'POST'
      const result = await apiFetch(url, { method, body: JSON.stringify(payload) })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel salvar o produto.')
      setFlash(editingProductId ? 'Produto atualizado.' : 'Produto criado.')
      resetProductForm()
      await loadDashboard()
    } catch (error) {
      setFlash(error.message)
    }
  }

  async function deleteProduct(productId) {
    if (!productId) return
    const ok = window.confirm('Excluir este produto? Isso remove o link de checkout.')
    if (!ok) return
    try {
      const result = await apiFetch(`/api/dashboard/products/${productId}`, { method: 'DELETE' })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel excluir o produto.')
      setFlash('Produto excluido.')
      await loadDashboard()
    } catch (error) {
      setFlash(error.message)
    }
  }

  async function submitSupport(event) {
    event.preventDefault()
    try {
      const result = await apiFetch('/api/dashboard/support-chat', {
        method: 'POST',
        body: JSON.stringify({ message: supportForm }),
      })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel enviar ao suporte.')
      setSupportForm('')
      setFlash('Mensagem enviada ao suporte.')
      await loadDashboard()
    } catch (error) {
      setFlash(error.message)
    }
  }

  async function submitPayoutKey(event) {
    event.preventDefault()
    try {
      const result = await apiFetch('/account/payout-key', {
        method: 'POST',
        body: JSON.stringify({ destination: String(payoutKeyForm || '').trim() }),
      })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel salvar chave PIX.')
      setFlash('Chave PIX atualizada com sucesso.')
      await loadDashboard()
    } catch (error) {
      setFlash(error.message)
    }
  }

  async function submitPayoutRequest(event) {
    event.preventDefault()
    try {
      const result = await apiFetch('/api/dashboard/payouts', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(payoutForm.amount || 0),
          method: payoutForm.method || 'pix',
          notes: String(payoutForm.notes || '').trim(),
        }),
      })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel solicitar saque.')
      setPayoutForm({ amount: '', method: 'pix', notes: '' })
      setFlash('Saque solicitado com sucesso.')
      await loadDashboard()
    } catch (error) {
      setFlash(error.message)
    }
  }

  async function createApiToken() {
    try {
      const result = await apiFetch('/api/dashboard/tokens', {
        method: 'POST',
        body: JSON.stringify({ label: `token-${Date.now()}` }),
      })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel criar token.')
      setFlash('Token gerado com sucesso.')
      await loadDashboard()
    } catch (error) {
      setFlash(error.message)
    }
  }

  function updateIntegrationField(serviceId, field, value) {
    setData((prev) => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        services: (prev.integrations?.services || []).map((service) =>
          service.id === serviceId
            ? {
                ...service,
                [field]: value,
              }
            : service,
        ),
      },
    }))
  }

  async function submitIntegrations(event) {
    event.preventDefault()
    try {
      const result = await apiFetch('/api/dashboard/integrations', {
        method: 'PUT',
        body: JSON.stringify({ services: data.integrations?.services || [] }),
      })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel salvar integracoes.')
      setData((prev) => ({ ...prev, integrations: result.data?.integrations || prev.integrations }))
      setFlash('Integracoes atualizadas com sucesso.')
    } catch (error) {
      setFlash(error.message)
    }
  }

  async function submitCheckoutPro(event) {
    event.preventDefault()
    try {
      const result = await apiFetch('/api/dashboard/checkout-pro', {
        method: 'PUT',
        body: JSON.stringify(checkoutProForm),
      })
      if (!result.ok) throw new Error(result.data?.error || 'Nao foi possivel salvar configuracao do CheckoutPRO.')
      setCheckoutProForm(result.data?.config || checkoutProForm)
      setFlash('CheckoutPRO atualizado com sucesso.')
    } catch (error) {
      setFlash(error.message)
    }
  }

  async function copyCheckoutLink(slug) {
    if (!slug || !window?.navigator?.clipboard) return
    try {
      await window.navigator.clipboard.writeText(`${window.location.origin}/checkout/${slug}`)
      setFlash('Link copiado para a area de transferencia.')
    } catch {
      setFlash('Nao foi possivel copiar o link.')
    }
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' })
    navigate('/login', { replace: true })
  }

  function goto(tabId) {
    navigate(`/dashboard/${tabId}`)
    setDrawerOpen(false)
  }

  function renderOverview() {
    return (
      <div className="dashboardSection">
        <section className="cardsGrid">
          <article className="dashCard"><h3><Icon name="wallet" /> Volume total</h3><p>{money(data.overview?.totalVolume || 0)}</p></article>
          <article className="dashCard"><h3><Icon name="wallet" /> Saldo disponivel</h3><p>{money(data.overview?.availableBalance || 0)}</p></article>
          <article className="dashCard"><h3><Icon name="chart" /> Transacoes</h3><p>{data.overview?.transactionCount || 0}</p></article>
          <article className="dashCard"><h3><Icon name="bolt" /> Aprovacao</h3><p>{approvalRate}%</p></article>
        </section>

        <section className="dashPanel">
          <div className="panelHeader">
            <h2>Alertas operacionais</h2>
            <button className="softBtn" type="button" onClick={() => goto('actions')}>Abrir central de acoes</button>
          </div>
          {operationalAlerts.length ? (
            <ul className="alertList">
              {operationalAlerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Tudo certo no operacional. Sem alertas no momento.</p>
          )}
        </section>

        <section className="dashPanel">
          <div className="panelHeader">
            <h2>Status de pagamentos</h2>
            <button className="softBtn" type="button" onClick={() => goto('payouts')}>Ir para saques</button>
          </div>
          {statusBreakdown.length ? (
            <ul className="statusList">
              {statusBreakdown.map((row) => (
                <li key={row.status}>
                  <span>{statusLabel(row.status)}</span>
                  <strong>{row.count}</strong>
                  <em>{money(row.volume)}</em>
                </li>
              ))}
            </ul>
          ) : <p className="muted">Sem status para exibir.</p>}
        </section>

        <section className="dashPanel">
          <div className="panelHeader">
            <h2>Top clientes recentes</h2>
            <button className="softBtn" type="button" onClick={() => goto('analytics')}>Ver analiticos</button>
          </div>
          <ul className="simpleList">
            {data.clientInsights.length ? (
              data.clientInsights.slice(0, 4).map((client) => (
                <li key={client.id || client.email || client.name}>
                  <strong>{client.name || client.email || client.id || 'Cliente'}</strong>
                  <span>
                    {client.transactionCount || 0} transacoes • {money(client.totalVolume || 0)}
                  </span>
                </li>
              ))
            ) : (
              <li>Sem clientes suficientes para exibir ranking.</li>
            )}
          </ul>
        </section>
      </div>
    )
  }

  function renderAnalytics() {
    const maxVolume = Math.max(...methodBreakdown.map((entry) => entry.volume), 1)
    return (
      <div className="dashboardSection">
        <section className="cardsGrid compact">
          <article className="dashCard"><h3>Saques pendentes</h3><p>{money(pendingPayoutTotal)}</p></article>
          <article className="dashCard"><h3>Metodos ativos</h3><p>{methodBreakdown.length}</p></article>
        </section>
        <section className="dashPanel">
          <h2>Volume por metodo</h2>
          {methodBreakdown.length ? (
            <ul className="metricList">
              {methodBreakdown.map((entry) => (
                <li key={entry.method}>
                  <div className="metricHead"><strong>{entry.method.toUpperCase()}</strong><span>{money(entry.volume)} · {entry.count} transacoes</span></div>
                  <div className="metricBar"><span style={{ width: `${Math.max(12, Math.round((entry.volume / maxVolume) * 100))}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="muted">Sem dados para analise.</p>}
        </section>
        <section className="dashPanel">
          <h2>Transacoes recentes</h2>
          <div className="tableWrap">
            <table>
              <thead><tr><th>ID</th><th>Metodo</th><th>Status</th><th>Valor</th><th>Data</th></tr></thead>
              <tbody>
                {data.recentTransactions.length ? data.recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.id}</td><td>{tx.method || '-'}</td>
                    <td><span className={`statusPill status-${String(tx.status || '').toLowerCase()}`}>{statusLabel(tx.status)}</span></td>
                    <td>{money(tx.amount || 0)}</td><td>{formatDate(tx.createdAt || tx.created_at)}</td>
                  </tr>
                )) : <tr><td colSpan="5">Sem transacoes recentes.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  function renderActions() {
    return (
      <div className="dashboardSection">
        <section className="dashPanel">
          <h2>Central de acoes</h2>
          <div className="actionGrid">
            <button type="button" className="actionCard" onClick={loadDashboard}><strong><Icon name="chart" /> Atualizar dashboard</strong><span>Sincroniza metricas agora.</span></button>
            <button type="button" className="actionCard" onClick={createApiToken}><strong><Icon name="key" /> Gerar token API</strong><span>Cria credencial imediata.</span></button>
            <button type="button" className="actionCard" onClick={() => goto('integrations')}><strong><Icon name="plug" /> Configurar integracoes</strong><span>Conecte WhatsApp, GA e gateways.</span></button>
            <button type="button" className="actionCard" onClick={() => goto('checkout-pro')}><strong><Icon name="checkout" /> Editar CheckoutPRO</strong><span>Atualize copy, cores e preview.</span></button>
            <button type="button" className="actionCard" onClick={() => goto('payouts')}><strong><Icon name="wallet" /> Solicitar saque</strong><span>Acesse saque e chave PIX em um clique.</span></button>
            <button type="button" className="actionCard" onClick={() => goto('support')}><strong><Icon name="support" /> Abrir suporte</strong><span>Registre problema e acompanhe resposta.</span></button>
          </div>
        </section>

        <section className="dashPanel">
          <h2>Atalhos de produtividade</h2>
          <div className="shortcutGrid">
            <button type="button" className="softBtn" onClick={() => goto('products')}>Novo produto</button>
            <button type="button" className="softBtn" onClick={() => goto('paytags')}>Nova pay-tag</button>
            <button type="button" className="softBtn" onClick={() => goto('tokens')}>Gerenciar tokens</button>
            <button type="button" className="softBtn" onClick={() => goto('overview')}>Voltar ao resumo</button>
          </div>
        </section>
      </div>
    )
  }

  function renderPayouts() {
    return (
      <div className="dashboardSection">
        <section className="dashPanel">
          <h2>Configurar chave PIX</h2>
          <form className="inlineForm" onSubmit={submitPayoutKey}>
            <input value={payoutKeyForm} onChange={(event) => setPayoutKeyForm(event.target.value)} placeholder="Sua chave PIX" required />
            <button type="submit">Salvar chave PIX</button>
          </form>
          <div className="payoutInfo"><strong>Chave atual:</strong> <span>{data.payoutKey || 'Nao configurada'}</span></div>
        </section>
        <section className="dashPanel">
          <h2>Solicitar saque</h2>
          <form className="inlineForm" onSubmit={submitPayoutRequest}>
            <div className="formRow">
              <input value={payoutForm.amount} onChange={(event) => setPayoutForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Valor" type="number" min="0" step="0.01" required />
              <select value={payoutForm.method} onChange={(event) => setPayoutForm((prev) => ({ ...prev, method: event.target.value }))}>
                <option value="pix">PIX</option>
                <option value="card">Cartao</option>
              </select>
            </div>
            <textarea rows={2} value={payoutForm.notes} onChange={(event) => setPayoutForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Observacoes" />
            <button type="submit" disabled={!data.payoutEligible}>Solicitar saque</button>
          </form>
          {!data.payoutEligible && <p className="muted">Saque liberado apos janela de seguranca.</p>}
        </section>
        <section className="dashPanel">
          <h2>Historico de saques</h2>
          <div className="tableWrap">
            <table>
              <thead><tr><th>ID</th><th>Status</th><th>Metodo</th><th>Valor</th><th>Taxa</th><th>Liquido</th><th>Data</th></tr></thead>
              <tbody>
                {data.payoutRequests.length ? data.payoutRequests.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.id}</td>
                    <td><span className={`statusPill status-${String(entry.status || '').toLowerCase()}`}>{statusLabel(entry.status)}</span></td>
                    <td>{String(entry.method || '-').toUpperCase()}</td>
                    <td>{money(entry.amount || 0)}</td><td>{money(entry.feeTotal || 0)}</td><td>{money(entry.netAmount || 0)}</td><td>{formatDate(entry.createdAt || entry.created_at)}</td>
                  </tr>
                )) : <tr><td colSpan="7">Sem solicitacoes de saque.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  function renderIntegrations() {
    const services = data.integrations?.services || []
    return (
      <section className="dashPanel">
        <h2>Painel de integracoes externas</h2>
        <form className="inlineForm" onSubmit={submitIntegrations}>
          <div className="integrationGrid">
            {services.map((service) => (
              <article key={service.id} className="integrationCard">
                <div className="integrationHead">
                  <strong>{service.name || service.id}</strong>
                  <label className="toggleLine">
                    <input type="checkbox" checked={Boolean(service.enabled)} onChange={(event) => updateIntegrationField(service.id, 'enabled', event.target.checked)} />
                    <span>{service.enabled ? 'Ativo' : 'Inativo'}</span>
                  </label>
                </div>
                <div className="integrationFields">
                  <input value={service.endpoint || ''} onChange={(event) => updateIntegrationField(service.id, 'endpoint', event.target.value)} placeholder="Endpoint" />
                  <input value={service.apiKey || ''} onChange={(event) => updateIntegrationField(service.id, 'apiKey', event.target.value)} placeholder="API key" />
                  <select value={service.status || 'disconnected'} onChange={(event) => updateIntegrationField(service.id, 'status', event.target.value)}>
                    <option value="connected">connected</option>
                    <option value="warning">warning</option>
                    <option value="disconnected">disconnected</option>
                  </select>
                  <textarea rows={2} value={service.notes || ''} onChange={(event) => updateIntegrationField(service.id, 'notes', event.target.value)} placeholder="Notas" />
                </div>
              </article>
            ))}
          </div>
          <button type="submit">Salvar integracoes</button>
        </form>
      </section>
    )
  }

  function renderCheckoutPro() {
    return (
      <div className="dashboardSection checkoutEditorWrap">
        <section className="dashPanel">
          <h2>Editor CheckoutPRO</h2>
          <form className="inlineForm" onSubmit={submitCheckoutPro}>
            <input value={checkoutProForm.brandName} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, brandName: event.target.value }))} placeholder="Nome da marca" required />
            <input value={checkoutProForm.heroTitle} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, heroTitle: event.target.value }))} placeholder="Titulo" required />
            <textarea rows={2} value={checkoutProForm.heroSubtitle} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, heroSubtitle: event.target.value }))} placeholder="Subtitulo" required />
            <div className="formRow">
              <label className="fieldLabel"><span>Cor primaria</span><input type="color" value={checkoutProForm.primaryColor} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, primaryColor: event.target.value }))} /></label>
              <label className="fieldLabel"><span>Cor destaque</span><input type="color" value={checkoutProForm.accentColor} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, accentColor: event.target.value }))} /></label>
            </div>
            <div className="formRow">
              <label className="toggleLine"><input type="checkbox" checked={Boolean(checkoutProForm.highlightPix)} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, highlightPix: event.target.checked }))} /><span>Destaque PIX</span></label>
              <label className="toggleLine"><input type="checkbox" checked={Boolean(checkoutProForm.showCountdown)} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, showCountdown: event.target.checked }))} /><span>Mostrar contador</span></label>
            </div>
            <textarea rows={2} value={checkoutProForm.testimonialText} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, testimonialText: event.target.value }))} placeholder="Prova social" />
            <textarea rows={2} value={checkoutProForm.footerMessage} onChange={(event) => setCheckoutProForm((prev) => ({ ...prev, footerMessage: event.target.value }))} placeholder="Mensagem final" />
            <button type="submit">Salvar CheckoutPRO</button>
          </form>
        </section>
        <section className="dashPanel">
          <h2>Preview</h2>
          <article className={`checkoutPreview ${checkoutProForm.surfaceTone || 'glass'}`} style={{ '--checkout-primary': checkoutProForm.primaryColor, '--checkout-accent': checkoutProForm.accentColor }}>
            <div className="previewBadge">{checkoutProForm.brandName || 'Minha marca'}</div>
            <h3>{checkoutProForm.heroTitle || 'Receba com seguranca'}</h3>
            <p>{checkoutProForm.heroSubtitle || 'Checkout com aprovacao instantanea e notificacao em tempo real.'}</p>
            <div className="previewSignals">
              <span className={checkoutProForm.highlightPix ? 'on' : ''}>PIX instantaneo</span>
              <span className={checkoutProForm.showCountdown ? 'on' : ''}>Contador ativo</span>
            </div>
            <div className="previewPaymentRow">
              <button type="button">Pagar agora</button>
              <small>{checkoutProForm.testimonialText || 'Checkout rapido para aumentar conversao.'}</small>
            </div>
            <footer>{checkoutProForm.footerMessage || 'Ambiente criptografado.'}</footer>
          </article>
        </section>
      </div>
    )
  }

  function renderPaytags() {
    return (
      <div className="dashboardSection">
        <section className="dashPanel">
          <h2>Nova pay-tag</h2>
          <form className="inlineForm" onSubmit={submitPayTag}>
            <input value={payTagForm.name} onChange={(event) => setPayTagForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nome da pay-tag" required />
            <input value={payTagForm.description} onChange={(event) => setPayTagForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Descricao" />
            <button type="submit">Criar</button>
          </form>
        </section>
        <section className="dashPanel">
          <h2>Pay-tags cadastradas</h2>
          <ul className="simpleList">{data.payTags.length ? data.payTags.map((tag) => <li key={tag.id || tag.name}><strong>{tag.name}</strong><span>{tag.description || '-'}</span></li>) : <li>Sem pay-tags cadastradas.</li>}</ul>
        </section>
      </div>
    )
  }

  function renderProducts() {
    return (
      <div className="dashboardSection">
        <section className="dashPanel">
          <h2>{editingProductId ? 'Editar produto' : 'Novo produto'}</h2>
          <form className="inlineForm" onSubmit={submitProduct}>
            <input value={productForm.slug} onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="Slug" required disabled={Boolean(editingProductId)} />
            <input value={productForm.title} onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titulo" required />
            <textarea rows={2} value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Descricao" required />
            <input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="Preco" required />
            <select value={productForm.payTagId} onChange={(event) => setProductForm((prev) => ({ ...prev, payTagId: event.target.value }))} required>
              <option value="" disabled>Selecione uma pay-tag</option>
              {data.payTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
            </select>
            <div className="formRow">
              <select value={productForm.theme} onChange={(event) => setProductForm((prev) => ({ ...prev, theme: event.target.value }))}><option value="black">black</option><option value="white">white</option></select>
              <select value={productForm.template} onChange={(event) => setProductForm((prev) => ({ ...prev, template: event.target.value }))}><option value="classic">classic</option><option value="premium">premium</option></select>
            </div>
            <div className="formActions">
              <button type="submit">{editingProductId ? 'Salvar' : 'Criar'}</button>
              {editingProductId && <button type="button" onClick={resetProductForm}>Cancelar</button>}
            </div>
          </form>
        </section>
        <section className="dashPanel">
          <h2>Produtos</h2>
          <ul className="simpleList">
            {data.products.length ? data.products.map((product) => (
              <li key={product.id || product.slug} className="productRow">
                <div className="productMeta"><strong>{product.title}</strong><span className="muted">{product.slug} · {money(product.price || 0)} · {product.template || '-'}</span></div>
                <div className="rowActions">
                  <button type="button" onClick={() => copyCheckoutLink(product.slug)}>Copiar link</button>
                  <button type="button" onClick={() => { setEditingProductId(product.id); setProductForm({ slug: product.slug || '', title: product.title || '', description: product.description || '', price: String(product.price ?? ''), theme: product.theme === 'white' ? 'white' : 'black', template: product.template === 'premium' ? 'premium' : 'classic', payTagId: product.payTagId || product.pay_tag_id || product.payTag?.id || product.pay_tag?.id || '', }) }}>Editar</button>
                  <button type="button" onClick={() => deleteProduct(product.id)}>Excluir</button>
                </div>
              </li>
            )) : <li>Sem produtos cadastrados.</li>}
          </ul>
        </section>
      </div>
    )
  }

  function renderTokens() {
    return <section className="dashPanel"><div className="panelHeader"><h2>Tokens API</h2><button type="button" className="softBtn" onClick={createApiToken}>Gerar token</button></div><ul className="simpleList">{data.apiKeys.length ? data.apiKeys.map((token) => <li key={token.id || token.label}><strong>{token.label || 'token'}</strong><code>{token.prefix || token.id || '-'}</code></li>) : <li>Sem tokens cadastrados.</li>}</ul></section>
  }

  function renderSupport() {
    return (
      <div className="dashboardSection">
        <section className="dashPanel">
          <h2>Abrir chamado</h2>
          <form className="inlineForm" onSubmit={submitSupport}><textarea rows={3} value={supportForm} onChange={(event) => setSupportForm(event.target.value)} placeholder="Descreva o problema" required /><button type="submit">Enviar</button></form>
        </section>
        <section className="dashPanel">
          <h2>Historico</h2>
          <ul className="simpleList">{data.support.length ? data.support.map((item) => <li key={item.id || item.createdAt}><strong>{item.status || 'aberto'}</strong><span>{item.message || '-'}</span></li>) : <li>Sem chamados registrados.</li>}</ul>
        </section>
      </div>
    )
  }

  function renderTab() {
    if (currentTab === 'overview') return renderOverview()
    if (currentTab === 'analytics') return renderAnalytics()
    if (currentTab === 'actions') return renderActions()
    if (currentTab === 'payouts') return renderPayouts()
    if (currentTab === 'integrations') return renderIntegrations()
    if (currentTab === 'checkout-pro') return renderCheckoutPro()
    if (currentTab === 'paytags') return renderPaytags()
    if (currentTab === 'products') return renderProducts()
    if (currentTab === 'tokens') return renderTokens()
    if (currentTab === 'support') return renderSupport()
    return renderOverview()
  }

  const currentNav = NAV_ITEMS.find((item) => item.id === currentTab) || NAV_ITEMS[0]

  return (
    <section className="dashboardPage">
      <div className="dashboardTopbar">
        <button className="drawerBtn" type="button" onClick={() => setDrawerOpen(true)}>Menu</button>
        <div className="dashboardTopbarTitle"><h1>{t('dashboard.title')}</h1><p>{currentNav.hint}</p></div>
        <button className="logoutBtn" type="button" onClick={logout}>{t('dashboard.logout')}</button>
      </div>

      <div className={`drawerBackdrop ${drawerOpen ? 'visible' : ''}`} onClick={() => setDrawerOpen(false)} />

      <div className="dashboardLayout">
        <aside className={`dashboardSidebar ${drawerOpen ? 'open' : ''}`}>
          <button className="drawerClose" type="button" onClick={() => setDrawerOpen(false)}>Fechar</button>
          <nav>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.id} to={`/dashboard/${item.id}`} className={({ isActive }) => isActive ? 'navItem active' : 'navItem'} onClick={() => setDrawerOpen(false)}>
                <strong><span className="navItemIcon"><Icon name={item.icon} /></span>{item.label}</strong>
                <span>{item.hint}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="dashboardMain">
          {flash && <p className="flash">{flash}</p>}
          {data.status === 'loading' && <div className="stateBox">{t('dashboard.loading')}</div>}
          {data.status === 'error' && <div className="stateBox error"><p>{data.message || t('dashboard.error')}</p><button className="retryBtn" type="button" onClick={loadDashboard}>{t('dashboard.retry')}</button></div>}
          {data.status === 'empty' && <div className="stateBox">{t('dashboard.empty')}</div>}
          {data.status === 'success' && renderTab()}
        </main>
      </div>
    </section>
  )
}
