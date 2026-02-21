import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../i18n'
import { getCopy } from '../lib/controlPlane.js'
import './HomePage.css'

const WHATSAPP_URL =
  'https://wa.me/5511933331462?text=Ola%2C%20Axion%20Pay.%20Quero%20falar%20com%20um%20especialista.'

function IconPix() {
  return (
    <svg viewBox="0 0 24 24" className="iconSvg" aria-hidden="true">
      <path
        d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156"
        fill="currentColor"
      />
    </svg>
  )
}

function IconCard() {
  return (
    <svg viewBox="0 0 24 24" className="iconSvg" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" className="iconSvg" aria-hidden="true">
      <path d="m13 2-7 11h5l-1 9 8-12h-5l0-8Z" fill="currentColor" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="iconSvg" aria-hidden="true">
      <path
        d="M12 3 5 6v6.2c0 4.6 3 7.8 7 9.8 4-2 7-5.2 7-9.8V6l-7-3Zm3.5 7.2-4 4a1 1 0 0 1-1.4 0l-1.6-1.6 1.4-1.4 1 1 3.3-3.3 1.3 1.3Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconCreditCardLarge() {
  return (
    <svg viewBox="0 0 260 160" className="creditCardSvg" aria-hidden="true">
      <defs>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d47d" />
          <stop offset="55%" stopColor="#0d5f3b" />
          <stop offset="100%" stopColor="#052a1b" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="248" height="148" rx="20" fill="url(#cardGrad)" />
      <rect x="22" y="30" width="68" height="44" rx="8" fill="rgba(208,255,232,0.22)" />
      <rect x="22" y="92" width="122" height="12" rx="6" fill="rgba(220,255,238,0.38)" />
      <rect x="22" y="112" width="90" height="10" rx="5" fill="rgba(220,255,238,0.22)" />
      <circle cx="206" cy="110" r="20" fill="rgba(255,220,116,0.72)" />
      <circle cx="186" cy="110" r="20" fill="rgba(255,124,124,0.72)" />
    </svg>
  )
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('isVisible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('isVisible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])
}

const features = [
  {
    icon: <IconPix />,
    title: 'Orquestracao inteligente de pagamentos',
    description: 'PIX, cartao e recorrencia com status unificado para operar com clareza e escala.',
  },
  {
    icon: <IconShield />,
    title: 'Risco e autorizacao em camadas',
    description: 'Camadas antifraude e roteamento inteligente para elevar taxa de aprovacao.',
  },
  {
    icon: <IconBolt />,
    title: 'Checkout orientado a conversao',
    description: 'Jornada fluida para reduzir abandono e concluir o pagamento mais rapido.',
  },
  {
    icon: <IconCard />,
    title: 'Stack pronta para devs',
    description: 'Sandbox imediata, documentacao clara e onboarding tecnico sem atrito.',
  },
  {
    icon: <IconPix />,
    title: 'Operacao financeira visivel',
    description: 'Volume, status e repasses em um unico painel para decisao rapida do time.',
  },
  {
    icon: <IconShield />,
    title: 'Suporte premium de verdade',
    description: 'Atendimento humano para migracao, estabilidade e escalabilidade continua.',
  },
]

const testimonials = [
  {
    name: 'CommerceOps',
    role: 'Head de Pagamentos',
    text: 'A AxionPAY melhorou nossa aprovacao e deixou o operacional muito mais limpo.',
  },
  {
    name: 'Scale Retail',
    role: 'VP de Produto',
    text: 'Integramos rapido, com apoio tecnico forte e visibilidade completa do funil.',
  },
  {
    name: 'SaaS Bridge',
    role: 'CTO',
    text: 'Recorrencia e monitoramento em um unico stack reduziram complexidade do time.',
  },
]

const paymentNotifications = [
  { merchant: 'Loja TechPrime', value: 'R$ 289,90', method: 'Pix aprovado em 2s' },
  { merchant: 'Curso Digital Pro', value: 'R$ 97,00', method: 'Cartao aprovado' },
  { merchant: 'Market Nova Era', value: 'R$ 1.249,00', method: 'Pix confirmado' },
  { merchant: 'DropStore Prime', value: 'R$ 178,40', method: 'Pix aprovado em 1s' },
  { merchant: 'Assinaturas Max', value: 'R$ 59,90', method: 'Cartao aprovado' },
  { merchant: 'Mundo Suplementos', value: 'R$ 412,10', method: 'Pix confirmado' },
  { merchant: 'Academia Next', value: 'R$ 129,00', method: 'Cartao aprovado' },
]

const feeCards = [
  {
    method: 'Pix',
    fee: 'R$ 0,90 + 0,1%',
    detail: 'Taxa por transacao aprovada no Pix.',
  },
  {
    method: 'Cartao',
    fee: 'R$ 1,00 + 5%',
    detail: 'Taxa por transacao aprovada no cartao.',
  },
]

export default function HomePage({ controlPayload = {} }) {
  const navigate = useNavigate()
  const [liveNotifications, setLiveNotifications] = useState(() =>
    paymentNotifications.slice(0, 3).map((item, idx) => ({ ...item, id: idx + 1 })),
  )
  const notifPointer = useRef(3)
  const notifId = useRef(4)

  useReveal()

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextIndex = notifPointer.current % paymentNotifications.length
      const next = paymentNotifications[nextIndex]
      notifPointer.current += 1

      setLiveNotifications((current) => [{ ...next, id: notifId.current++ }, ...current.slice(0, 2)])
    }, 2600)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="homePage">
      <section className="heroSection" data-reveal>
        <div className="heroBg" aria-hidden="true" />
        <div className="heroGlow heroGlowOne" aria-hidden="true" />
        <div className="heroGlow heroGlowTwo" aria-hidden="true" />
        <div className="heroSplit">
          <div className="heroContent">
            <p className="eyebrow">{getCopy(controlPayload, 'home-hero', 'eyebrow', t('home.eyebrow'))}</p>
            <h1>Receba no Pix e Cartao sem mensalidade.</h1>
            <p className="heroSubtitle">
              Gateway gratuito para vender mais, com checkout rapido e notificacoes em tempo real.
            </p>
            <div className="heroBadges">
              <span className="heroBadge">Sem taxa mensal</span>
              <span className="heroBadge">Sem taxa anual</span>
              <span className="heroBadge">Ativacao imediata</span>
            </div>
            <div className="heroActions">
              <button className="btnModern primary" onClick={() => navigate('/cadastro')}>
                {getCopy(controlPayload, 'home-hero', 'cta_primary_label', t('home.ctaPrimary'))}
              </button>
              <button className="btnModern ghost" onClick={() => navigate('/docs')}>
                {getCopy(controlPayload, 'home-hero', 'cta_secondary_label', t('home.ctaSecondary'))}
              </button>
              <a className="btnModern ghost" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                {getCopy(controlPayload, 'home-hero', 'cta_tertiary_label', t('home.ctaTertiary'))}
              </a>
            </div>
            <div className="quickCards">
              <article className="quickCard">
                <span className="cardIcon">
                  <IconBolt />
                </span>
                <strong>Vendeu, recebeu</strong>
                <p>Confirmacao de pagamento em segundos no seu painel.</p>
              </article>
              <article className="quickCard">
                <span className="cardIcon">
                  <IconCard />
                </span>
                <strong>Checkout otimizado</strong>
                <p>Fluxo simples para reduzir abandono e aumentar conversao.</p>
              </article>
            </div>
          </div>

          <div className="heroVisual" aria-hidden="true">
            <article className="pixLogoCard">
              <div className="pixNeon">
                <img src="/pix-logo-simpleicons.svg" alt="" className="pixLogoAsset" />
              </div>
              <p className="pixTitle">Pix com aprovacao instantanea</p>
              <p className="pixSub">Confirmacao em segundos para acelerar caixa e melhorar a experiencia.</p>
              <div className="pixOrbit pixOrbitOne" />
              <div className="pixOrbit pixOrbitTwo" />
            </article>
            <article className="cardShowcase">
              <IconCreditCardLarge />
              <div className="cardShine" />
              <div className="cardSpark cardSparkOne" />
              <div className="cardSpark cardSparkTwo" />
              <div className="paymentPulseRing" />
              <div className="paymentTrail" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </article>
            <div className="paymentFeed">
              <div className="feedHeader">
                <span className="liveBadge">Pagamentos ao vivo</span>
              </div>
              {liveNotifications.map((item) => (
                <article key={item.id} className="paymentToast liveToast">
                  <p className="paymentStatus">
                    <span className="statusDot" />
                    {item.method}
                  </p>
                  <p className="paymentMerchant">{item.merchant}</p>
                  <p className="paymentValue">{item.value}</p>
                  <span className="paymentProgress" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pricingSection" data-reveal>
        <div className="sectionHead">
          <h2>Taxas claras para crescer sem surpresa</h2>
          <p className="sectionSub">Gateway gratuito: sem mensalidade e sem anuidade. Voce paga so quando vender.</p>
        </div>
        <div className="pricingGrid">
          <article className="pricingCard featured">
            <p className="planBadge">Gateway gratuito</p>
            <p className="planName">Sem mensalidade ou anuidade</p>
            <p className="price">R$ 0,00</p>
            <ul>
              <li>Sem custo de ativacao</li>
              <li>Sem taxa fixa mensal</li>
              <li>Sem taxa anual</li>
            </ul>
          </article>
          {feeCards.map((item) => (
            <article key={item.method} className="pricingCard">
              <span className="cardIcon">{item.method === 'Pix' ? <IconPix /> : <IconCard />}</span>
              <p className="planName">{item.method}</p>
              <p className="price">{item.fee}</p>
              <p className="feeDetail">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="featuresSection">
        <div className="sectionHead" data-reveal>
          <h2>Motivos para migrar seu gateway para a Axion Pay</h2>
          <p className="sectionSub">Tecnologia, design e operacao financeira pensados para vender mais todos os dias.</p>
        </div>
        <div className="featuresGrid">
          {features.map((feature) => (
            <article key={feature.title} className="featureCard" data-reveal>
              <span className="cardIcon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="testimonialsSection">
        <div className="sectionHead" data-reveal>
          <h2>Times que exigiam confiabilidade, velocidade e resultado</h2>
        </div>
        <div className="testimonialsGrid">
          {testimonials.map((item) => (
            <article key={item.name} className="testimonialCard" data-reveal>
              <p className="quote">"{item.text}"</p>
              <div className="author">
                <strong>{item.name}</strong>
                <span className="authorRole">{item.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ctaBottomSection" data-reveal>
        <h2>Ative hoje e cobre via Pix e Cartao em minutos.</h2>
        <div className="heroActions">
          <button className="btnModern primary" onClick={() => navigate('/cadastro')}>
            Criar conta gratuita
          </button>
          <a className="btnModern ghost" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Falar com especialista
          </a>
        </div>
      </section>
    </div>
  )
}
