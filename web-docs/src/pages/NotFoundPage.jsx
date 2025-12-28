import React from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="not-found">
      <section className="section">
        <div className="not-found-card">
          <span className="eyebrow">404</span>
          <h1>Página não encontrada.</h1>
          <p className="lead">
            O endereço acessado não existe ou foi movido. Use os atalhos abaixo
            para voltar ao conteúdo principal.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/">
              Voltar para AxionPAY
            </Link>
            <Link className="button ghost" to="/api">
              Ver API e Integração
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
