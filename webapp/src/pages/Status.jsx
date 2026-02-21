import "../pages.css";

export default function Status() {
  return (
    <section className="page-section">
      <h1>Status da API</h1>
      <p>Monitoramento 24/7 com latência, throughput e alertas.</p>
      <div className="grid">
        <article className="card">
          <h3>Pagamentos</h3>
          <p>99,98% de uptime • média 58ms</p>
        </article>
        <article className="card">
          <h3>Webhooks</h3>
          <p>Retries configurados e HMAC verificado</p>
        </article>
        <article className="card">
          <h3>Infra</h3>
          <p>Failover global + chaos engineering contínuo</p>
        </article>
      </div>
    </section>
  );
}
