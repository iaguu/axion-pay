import { useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Support from './pages/Support'
import Status from './pages/Status'
import Docs from './pages/Docs'
import Checkout from './pages/Checkout'
import PremiumCheckout from './pages/PremiumCheckout'
import PayTags from './pages/PayTags'
import DashboardRoutes from './pages/DashboardRoutes'
import ProductsRoutes from './pages/ProductsRoutes'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import SeoManager from './seo/SeoManager.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { t } from './i18n'
import { loadPublicConfig, setupGlobalTracking, trackEvent } from './lib/controlPlane.js'
import './App.css'

const logo = '/axionpay_logo.transparent.png'
const STORAGE_KEY = 'axion-pay-theme'

const HEADER_LINKS = [
  { label: t('header.docs'), path: '/docs', variant: 'ghost' },
  { label: t('header.login'), path: '/login', variant: 'ghost' },
  { label: t('header.signup'), path: '/cadastro', variant: 'primary' },
]

const MENU_LINKS = [
  ...HEADER_LINKS,
  { label: t('header.sandbox'), path: '/cadastro', variant: 'ghost' },
  { label: 'Status API', path: '/status', variant: 'ghost' },
  { label: 'Suporte', path: '/support', variant: 'ghost' },
  { label: 'Pay-tags', path: '/pay-tags', variant: 'ghost' },
]

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="themeToggle" onClick={onToggle} type="button" aria-label="Alternar tema">
      <span className={theme === 'dark' ? 'dot on' : 'dot'}>{t('header.black')}</span>
      <span className={theme === 'light' ? 'dot on' : 'dot'}>{t('header.white')}</span>
    </button>
  )
}

export default function App() {
  const location = useLocation()
  const isCheckoutRoute = location.pathname.startsWith('/checkout') || location.pathname.startsWith('/premium')
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/products')
  const hideMarketingChrome = isCheckoutRoute || isDashboardRoute
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage?.getItem(STORAGE_KEY) || 'dark'
  })
  const [controlPayload, setControlPayload] = useState({})

  useEffect(() => {
    const teardown = setupGlobalTracking()
    return teardown
  }, [])

  useEffect(() => {
    loadPublicConfig().then((payload) => setControlPayload(payload || {}))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.body.dataset.theme = theme
    window.localStorage?.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (menuOpen) setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    trackEvent('page_view', 'page_view', { path: location.pathname })
  }, [location.pathname])

  const menuPanelClass = useMemo(() => (menuOpen ? 'menuPanel open' : 'menuPanel'), [menuOpen])

  return (
    <div className={`appShell ${theme}-theme ${isCheckoutRoute ? 'checkoutShell' : ''}`}>
      <a href="#main-content" className="skipLink">
        {t('app.skipToContent')}
      </a>

      {!hideMarketingChrome && (
        <>
          <div className={`menuBackdrop ${menuOpen ? 'visible' : ''}`} onClick={() => setMenuOpen(false)} />
          <nav className={menuPanelClass} aria-label={t('header.menuLabel')} aria-hidden={!menuOpen}>
            <div className="menuPanelInner">
              <header className="menuPanelHeader">
                <div className="brandMark">
                  <img src={logo} alt={t('app.brand')} className="logo" />
                  <div className="brandTextWrap">
                    <p className="brandTitle">{t('app.brand')}</p>
                    <p className="brandSubtitle">{t('app.subtitle')}</p>
                  </div>
                </div>
                <button type="button" className="menuClose" onClick={() => setMenuOpen(false)} aria-label={t('header.closeMenu')}>
                  ×
                </button>
              </header>
              <p className="menuPanelLabel">Navegacao principal</p>

              <div className="menuLinks">
                {MENU_LINKS.map((link) => (
                  <NavLink
                    key={`${link.path}-${link.label}`}
                    to={link.path}
                    className={({ isActive }) => `headerLink ${link.variant}${isActive ? ' isActive' : ''}`}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
        </>
      )}

      <div className={`content ${isCheckoutRoute ? 'checkoutMode' : ''}`}>
        {!hideMarketingChrome && (
          <header className="globalHeader">
            <div className="headerLeft">
              <button
                type="button"
                className={`menuTrigger ${menuOpen ? 'isOpen' : ''}`}
                aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span />
                <span />
                <span />
              </button>
              <img src={logo} alt={t('app.brand')} className="logo" />
            </div>

            <div className="headerCenter">
              <NavLink to="/" className="brandBlock">
                <p className="brandTitle">{t('app.brand')}</p>
                <p className="brandSubtitle">{t('app.subtitle')}</p>
              </NavLink>
            </div>

            <div className="headerRight">
              <div className="headerLinks">
                {HEADER_LINKS.map((link) => (
                  <NavLink
                    key={`${link.path}-${link.label}`}
                    to={link.path}
                    className={({ isActive }) => `headerLink ${link.variant}${isActive ? ' isActive' : ''}`}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
              <ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
            </div>
          </header>
        )}

        <SeoManager />
        <main id="main-content">
          <div className={hideMarketingChrome ? 'pageFrame plain' : 'pageFrame'}>
            <ErrorBoundary resetKey={location.pathname} onRetry={() => window.location.reload()}>
              <Routes>
                <Route path="/" element={<HomePage controlPayload={controlPayload} />} />
                <Route path="/support" element={<Support />} />
                <Route path="/status" element={<Status />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/pay-tags" element={<PayTags />} />
                <Route path="/dashboard/*" element={<DashboardRoutes />} />
                <Route path="/products/*" element={<ProductsRoutes />} />
                <Route path="/checkout/:product?" element={<Checkout />} />
                <Route path="/premium/:product?" element={<PremiumCheckout />} />
                <Route path="/login" element={<Login controlPayload={controlPayload} />} />
                <Route path="/cadastro" element={<Cadastro controlPayload={controlPayload} />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
