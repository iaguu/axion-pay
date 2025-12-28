import React from "react";
import { Link } from "react-router-dom";

const METRICS = [
  { label: "Uptime 30 dias", value: "99,98%" },
  { label: "Latência P95", value: "180 ms" },
  { label: "Confirmação PIX", value: "0,8s" },
  { label: "Incidentes 7 dias", value: "0" }
];

const COMPONENTS = [
  { name: "API de pagamentos", status: "operational" },
  { name: "Processamento PIX", status: "operational" },
  { name: "Cartões e tokenização", status: "operational" },
  { name: "Webhooks", status: "degraded" },
  { name: "Dashboard AxionPAY", status: "operational" },
  { name: "Repasses e conciliação", status: "operational" }
];

const INCIDENTS = [
  {
    title: "Latência elevada em webhooks",
    status: "monitoring",
    time: "Há 35 min",
    description:
      "Mitigação aplicada. Monitorando filas de entrega para estabilidade."
  },
  {
    title: "Oscilação em confirmação PIX",
    status: "resolved",
    time: "Ontem, 21:12",
    description:
      "Falha isolada em provedor externo. Sistema normalizado."
  },
  {
    title: "Fila de conciliação atrasada",
    status: "resolved",
    time: "26/12, 10:04",
    description: "Processamento normalizado. Nenhum repasse afetado."
  }
];

const MAINTENANCE = [
  {
    title: "Atualização do motor antifraude",
    date: "05/01, 02:00 BRT",
    description: "Janela de 25 min sem impacto em PIX."
  },
  {
    title: "Upgrade de certificados",
    date: "11/01, 01:30 BRT",
    description: "Rotação automática com failover regional."
  },
  {
    title: "Aprimoramento de log central",
    date: "18/01, 03:00 BRT",
    description: "Sem impacto previsto em requisições."
  }
];

const STATUS_LABELS = {
  operational: "Operacional",
  degraded: "Degradado",
  monitoring: "Monitorando",
  resolved: "Resolvido",
  investigating: "Investigando"
};

export function StatusPage() {
  return (
    <div className="status-page">
      <section className="section hero compact">
        <div className="hero-copy">
          <span className="eyebrow">Status da API</span>
          <h1>Visibilidade total da operação em tempo real.</h1>
          <p className="lead">
            Consulte disponibilidade, incidentes e janelas de manutenção do
            AxionPAY em um único painel.
          </p>
          <div className="hero-status">
            <span className="status-dot ok" />
            <span className="hero-status-text">Todos os sistemas operacionais</span>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <div className="panel-title">Alertas proativos</div>
            <p className="panel-text">
              Receba notificações por e-mail, Slack ou webhook dedicado.
            </p>
            <Link className="button subtle" to="/cadastro">
              Assinar atualizações
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Indicadores</span>
          <h2>Saúde operacional dos últimos 30 dias.</h2>
        </div>
        <div className="stat-grid wide">
          {METRICS.map((metric) => (
            <div className="stat-card" key={metric.label}>
              <div className="stat-value">{metric.value}</div>
              <div className="stat-label">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Componentes</span>
          <h2>Status por serviço.</h2>
        </div>
        <div className="component-grid">
          {COMPONENTS.map((component) => (
            <div className="component-card" key={component.name}>
              <span className={`status-dot ${component.status}`} />
              <div>
                <div className="component-name">{component.name}</div>
                <div className="component-status">
                  {STATUS_LABELS[component.status]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section accent-section">
        <div className="section-split">
          <div>
            <span className="eyebrow">Incidentes</span>
            <h2>Últimas ocorrências.</h2>
            <p>
              Mantemos um histórico transparente de incidentes e resoluções com
              atualizações detalhadas.
            </p>
          </div>
          <div className="incident-list">
            {INCIDENTS.map((incident) => (
              <article className="incident-card" key={incident.title}>
                <div className="incident-header">
                  <span className={`status-pill ${incident.status}`}>
                    {STATUS_LABELS[incident.status]}
                  </span>
                  <span className="incident-time">{incident.time}</span>
                </div>
                <h3>{incident.title}</h3>
                <p>{incident.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Manutenção programada</span>
          <h2>Transparência antes de qualquer intervenção.</h2>
        </div>
        <div className="maintenance-grid">
          {MAINTENANCE.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p className="maintenance-date">{item.date}</p>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
