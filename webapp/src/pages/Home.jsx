import { NavLink } from "react-router-dom";
import "../pages.css";

const features = [
  {
    title: "Playbooks comerciais",
    description: "Equipe guiada, monitoramento diário e investimentos calibrados para squads móveis.",
    icon: "M4 7h16M4 12h16M4 17h16"
  },
  {
    title: "Roteamento inteligente",
    description: "Combine MercadoPago, Woovi, InfinitePay e antifraude em uma API única e resilient.",
    icon: "M5 12h6l2-2 4 4 2-2 4 4"
  },
  {
    title: "Composição financeira",
    description: "Split sob demanda, subcontas e relatórios conformes para auditorias em segundos.",
    icon: "M12 2a10 10 0 1 0 10 10h-5z"
  }
];

const curlExamples = [
  {
    title: "Listar Pay-tags",
    command: `curl https://pay.axionenterprise.cloud/account/pay-tags \\\n  -H "Authorization: Bearer YOUR_TOKEN"`
  },
  {
    title: "Criar pay-tag",
    command: `curl https://pay.axionenterprise.cloud/account/pay-tags \\\n  -X POST \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "name": "infra-deploy", "description": "Pay-tag mobile" }'`
  },
  {
    title: "Alternar status",
    command: `curl https://pay.axionenterprise.cloud/account/pay-tags/{tag_id}/toggle \\\n  -X PATCH \\\n  -H "Authorization: Bearer YOUR_TOKEN"`
  }
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">99,98% SLA • CX com atendimento premium</p>
          <h1>AxionPAY transforma momentos de pagamento em experiências memoráveis.</h1>
          <p>
            Conecte PIX, cartões e assinaturas em minutos com tokens e roteiros inteligentes.
            Pagamentos roteados, autenticações biométricas e pay-tags garantem execução limpa e segura.
          </p>
          <div className="hero-cta">
            <NavLink to="/cadastro" className="primary-btn">
              Criar sandbox
            </NavLink>
            <NavLink to="/login" className="ghost-btn">
              Entrar
            </NavLink>
            <a
              className="ghost-btn support-btn"
              href="https://wa.me/5511933331462?text=Quero%20suporte%20AxionPAY"
              target="_blank"
              rel="noreferrer"
            >
              Suporte 24/7
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <strong>0,8s</strong>
              <span>Tempo médio PIX</span>
            </div>
            <div className="stat-card">
              <strong>99,98%</strong>
              <span>Disponibilidade em 30 dias</span>
            </div>
            <div className="stat-card">
              <strong>&lt;0,2%</strong>
              <span>Chargebacks monitorados</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-terminal">
            <div className="stat-card" style={{ marginBottom: "1rem" }}>
              <strong>Pay-tags ao vivo</strong>
              <span>IDs únicos liberados para cada squad</span>
            </div>
            <code>
              {`curl https://pay.axionenterprise.cloud/payments/pix \\
-H "Content-Type: application/json" \\
-H "x-api-key: YOUR_KEY" \\
-d '{ "amount": 1980, "pay_tag": "infra-deploy" }'`}
            </code>
          </div>
        </div>
      </section>

      <section className="page-section">
        <h2>Operação hi-tech para squads móveis</h2>
        <div className="grid">
          {features.map((feature) => (
            <article key={feature.title} className="card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke={feature.title === "Roteamento inteligente" ? "#f4fff1" : "#ffffff"} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d={feature.icon} />
                </svg>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section curl-section">
        <div>
          <h2>Como clientes usam a API AxionPAY</h2>
          <p>
            Pay-tags, tokens e automações conectam o backend à experiência do cliente em segundos.
            Cada comando aqui funciona com o mesmo header de token e endpoints prontos para produção.
          </p>
        </div>
        {curlExamples.map((example) => (
          <article key={example.title} className="curl-card">
            <h3>{example.title}</h3>
            <pre>{example.command}</pre>
          </article>
        ))}
      </section>

      <section className="page-section">
        <h2>Links rápidos</h2>
        <div className="docs-grid">
          <article className="docs-card">
            <h3>Status da API</h3>
            <p>Monitoramos latência, erros e carga com painéis ao vivo das nossas zonas.</p>
            <NavLink to="/status" className="inline-link">
              Ver status
            </NavLink>
          </article>
          <article className="docs-card">
            <h3>Central de ajuda</h3>
            <p>Playbooks com comandos CURL, processos de chargeback e integrações.</p>
            <NavLink to="/support" className="inline-link">
              Falar com suporte
            </NavLink>
          </article>
          <article className="docs-card">
            <h3>Documentação</h3>
            <p>Endpoints, exemplos de payload e guias para comprar o gateway completo.</p>
            <NavLink to="/docs" className="inline-link">
              Acessar docs
            </NavLink>
          </article>
          <article className="docs-card">
            <h3>Pay-tags</h3>
            <p>Gerencie pay-tags únicas, status e roteamentos com segurança reforçada.</p>
            <NavLink to="/pay-tags" className="inline-link">
              Ver pay-tags
            </NavLink>
          </article>
        </div>
      </section>
    </>
  );
}
