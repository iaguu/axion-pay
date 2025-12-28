import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, setUserToken } from "../services/api";

export function AuthLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [status, setStatus] = useState({ loading: false, error: "" });

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: { email: form.email, password: form.password }
      });
      setUserToken(response.token);
      navigate("/painel");
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message || "Erro ao entrar."
      });
    }
  }

  return (
    <div className="auth-page">
      <section className="section auth-grid">
        <div className="auth-copy">
          <span className="eyebrow">Portal AxionPAY</span>
          <h1>Entre para acompanhar sua operacao em tempo real.</h1>
          <p className="lead">
            Acesse dashboard, conciliacao, webhooks, relatorios financeiros e
            monitoramento de risco em um unico painel.
          </p>
          <ul className="bullet-list">
            <li>Visao diaria de saldo, repasses e taxas.</li>
            <li>Gestao de chaves, ambientes e permissoes.</li>
            <li>Alertas proativos para falhas e chargebacks.</li>
          </ul>
        </div>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Acessar conta</h2>
            <p>Use seu e-mail corporativo cadastrado.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>E-mail</span>
              <input
                type="email"
                name="email"
                placeholder="nome@empresa.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
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
                value={form.password}
                onChange={handleChange}
              />
            </label>
            <div className="form-row">
              <label className="form-check">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                />
                <span>Manter conectado</span>
              </label>
              <a className="link" href="mailto:suporte@axionpay.com">
                Esqueceu sua senha?
              </a>
            </div>
            {status.error ? <div className="alert error">{status.error}</div> : null}
            <button className="button primary full" type="submit" disabled={status.loading}>
              {status.loading ? "Entrando..." : "Entrar"}
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
