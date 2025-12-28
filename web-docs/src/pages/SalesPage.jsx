import React from "react";
import { Link } from "react-router-dom";

const METRICS = [
  { label: "Disponibilidade 30 dias", value: "99,98%" },
  { label: "Tempo médio PIX", value: "0,8s" },
  { label: "Repasse padrão", value: "D+1" },
  { label: "Chargebacks monitorados", value: "<0,2%" }
];

const HIGHLIGHTS = [
  {
    title: "Pagamentos instantâneos",
    description:
      "PIX com confirmação em segundos, QR dinâmico, expiração inteligente e reconciliação automática."
  },
  {
    title: "Cartões com alta aprovação",
    description:
      "Roteamento por adquirente, tokenização segura, captura parcial e antifraude adaptativo."
  },
  {
    title: "Governança financeira",
    description:
      "Split por regra, subcontas, repasses programados e relatórios auditáveis."
  }
];

const BENEFITS = [
  {
    title: "Onboarding guiado",
    description:
      "Playbooks de integração, checklist de compliance e suporte de engenharia."
  },
  {
    title: "Conciliação transparente",
    description:
      "Extratos por transação, fees detalhados e rastreio de liquidações."
  },
  {
    title: "Operação multicanal",
    description:
      "Links de pagamento, checkout hospedado e API headless para apps mobile."
  },
  {
    title: "Webhooks confiáveis",
    description:
      "Reentrega automática, assinatura HMAC e alertas de falhas por canal."
  },
  {
    title: "Observabilidade nativa",
    description:
      "Dashboards de latência, aprovação e conversão com alertas inteligentes."
  },
  {
    title: "Compliance e segurança",
    description:
      "PCI DSS, LGPD, criptografia ponta a ponta e segregação de ambientes."
  }
];

const INTEGRATION_STEPS = [
  {
    step: "01",
    title: "Crie suas chaves",
    description:
      "Ative o sandbox, gere credenciais e configure ambientes de teste e produção."
  },
  {
    step: "02",
    title: "Emita cobranças",
    description:
      "Envie valor, cliente e referência. Receba QR code e status instantâneo."
  },
  {
    step: "03",
    title: "Sincronize via webhooks",
    description:
      "Assine eventos e atualize pedidos com segurança e idempotência."
  },
  {
    step: "04",
    title: "Ajuste limites",
    description:
      "Valide KYC, configure split e habilite o go-live com suporte dedicado."
  }
];

const PLATFORM_MODULES = [
  {
    title: "Links e checkout",
    description: "Página premium, recuperação de carrinho e pagamento recorrente."
  },
  {
    title: "Assinaturas e recorrência",
    description: "Ciclos flexíveis, prorrata e gestão de upgrades."
  },
  {
    title: "Split e subcontas",
    description: "Regras avançadas para marketplaces e parceiros financeiros."
  },
  {
    title: "KYC e compliance",
    description: "Verificação automatizada e monitoramento de risco contínuo."
  },
  {
    title: "Chargebacks e disputas",
    description: "Fluxos de contestação com evidências centralizadas."
  },
  {
    title: "Relatórios financeiros",
    description: "Exportações contábeis, conciliação e auditoria completa."
  }
];

const TRUST_POINTS = [
  "PCI DSS nível 1 e tokenização end-to-end.",
  "Criptografia AES-256, rotação de chaves e controle de acesso granular.",
  "SLA corporativo e suporte 24/7 com engenharia dedicada."
];

export function SalesPage() {
  return (
    <div className="sales-page">
      <section className="section hero">
        <div className="hero-copy">
          <span className="eyebrow">AxionPAY Gateway</span>
          <h1>Pagamentos premium para operações que não podem falhar.</h1>
          <p className="lead">
            AxionPAY unifica PIX, cartões e conciliação em uma plataforma única
            com governança, compliance e experiência premium para o cliente final.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/api">
              Ver integração
            </Link>
            <Link className="button ghost" to="/status">
              Status da API
            </Link>
          </div>
          <div className="stat-grid">
            {METRICS.map((metric) => (
              <div className="stat-card" key={metric.label}>
                <div className="stat-value">{metric.value}</div>
                <div className="stat-label">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <div className="panel-title">Monitoramento em tempo real</div>
            <p className="panel-text">
              Acompanhe pagamentos, repasses e chargebacks com visão financeira e
              técnica em um painel unificado.
            </p>
            <div className="panel-status">
              <span className="status-dot ok" />
              <span className="panel-status-text">API operacional</span>
            </div>
          </div>
          <div className="panel-card">
            <div className="panel-title">Integração em poucas horas</div>
            <p className="panel-text">
              SDKs, coleção Postman, webhooks testáveis e acompanhamento do time
              AxionPAY desde o primeiro deploy.
            </p>
            <Link className="button subtle" to="/api">
              Abrir manual rápido
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Destaques</span>
          <h2>Velocidade, confiança e controle operacional.</h2>
          <p>
            Cada camada do gateway foi desenhada para reduzir falhas, elevar a
            aprovação e manter governança financeira do início ao fim.
          </p>
        </div>
        <div className="card-grid">
          {HIGHLIGHTS.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section accent-section">
        <div className="section-split">
          <div>
            <span className="eyebrow">Benefícios</span>
            <h2>Experiência premium para negócio, dev e financeiro.</h2>
            <p>
              AxionPAY entrega previsibilidade, rapidez de integração e uma
              operação financeiramente saudável desde o primeiro dia.
            </p>
            <ul className="bullet-list">
              {TRUST_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="feature-grid">
            {BENEFITS.map((benefit) => (
              <article className="feature-card" key={benefit.title}>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Facilidade de integração</span>
          <h2>Do sandbox ao go-live em poucas horas.</h2>
          <p>
            Estrutura pensada para desenvolvedores com documentação objetiva,
            eventos padronizados e ferramentas prontas.
          </p>
        </div>
        <div className="step-grid">
          {INTEGRATION_STEPS.map((item) => (
            <article className="step-card" key={item.title}>
              <span className="step-index">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Gateway completo</span>
          <h2>Módulos para crescer com segurança.</h2>
          <p>
            Além do processamento, oferecemos recursos críticos para escalar sua
            operação financeira com governança e compliance.
          </p>
        </div>
        <div className="card-grid">
          {PLATFORM_MODULES.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta-section">
        <div className="cta-card">
          <div>
            <span className="eyebrow">Próximo passo</span>
            <h2>Pronto para ativar seu gateway premium?</h2>
            <p>
              Fale com nosso time para habilitar limites, definir taxas e colocar
              o AxionPAY em produção com segurança.
            </p>
          </div>
          <div className="cta-actions">
            <Link className="button primary" to="/cadastro">
              Falar com especialistas
            </Link>
            <button className="button ghost" type="button">
              Baixar proposta
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
