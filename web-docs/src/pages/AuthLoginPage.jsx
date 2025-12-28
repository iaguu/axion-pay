import React from "react";
import { Link } from "react-router-dom";

export function AuthLoginPage() {
  return (
    <div className="auth-page">
      <section className="section auth-grid">
        <div className="auth-copy">
          <span className="eyebrow">Portal AxionPAY</span>
          <h1>Entre para acompanhar sua operação em tempo real.</h1>
          <p className="lead">
            Acesse dashboard, conciliação, webhooks, relatórios financeiros e
            monitoramento de risco em um único painel.
          </p>
          <ul className="bullet-list">
            <li>Visão diária de saldo, repasses e taxas.</li>
            <li>Gestão de chaves, ambientes e permissões.</li>
            <li>Alertas proativos para falhas e chargebacks.</li>
          </ul>
        </div>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Acessar conta</h2>
            <p>Use seu e-mail corporativo cadastrado.</p>
          </div>
          <form className="auth-form">
            <label className="form-field">
              <span>E-mail</span>
              <input
                type="email"
                name="email"
                placeholder="nome@empresa.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="form-field">
              <span>Senha</span>
              <input
                type="password"
                name="password"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
            </label>
            <div className="form-row">
              <label className="form-check">
                <input type="checkbox" name="remember" />
                <span>Manter conectado</span>
              </label>
              <a className="link" href="mailto:suporte@axionpay.com">
                Esqueceu sua senha?
              </a>
            </div>
            <button className="button primary full" type="submit">
              Entrar
            </button>
          </form>
          <div className="auth-footer">
            <span>Primeira vez por aqui?</span>
            <Link to="/cadastro">Criar conta</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
