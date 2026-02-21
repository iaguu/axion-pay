import "../pages.css";

export default function PayTags() {
  return (
    <section className="page-section">
      <h1>Pay-tags ao vivo</h1>
      <p>Tokens exclusivos por canal com roteamento inteligente e protecao contra uso simultaneo.</p>
      <div className="grid">
        <article className="card">
          <h3>Crie Pay-tags</h3>
          <p>Use POST /account/pay-tags com splits e descricoes customizadas.</p>
        </article>
        <article className="card">
          <h3>Gerencie status</h3>
          <p>Ative/desative via PATCH e garanta que apenas uma esteja ativa.</p>
        </article>
      </div>
    </section>
  );
}
