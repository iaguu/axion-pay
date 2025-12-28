import React from "react";
import { Link } from "react-router-dom";

const BENEFITS = [
  "Sandbox completo com PIX, cartões e webhooks.",
  "Suporte técnico dedicado no onboarding.",
  "Coleção Postman e SDKs oficiais.",
  "Checklist de conformidade e KYC."
];

export function AuthSignupPage() {
  return (
    <div className="auth-page">
      <section className="section auth-grid">
        <div className="auth-copy">
          <span className="eyebrow">Comece agora</span>
          <h1>Crie sua conta AxionPAY e habilite o sandbox.</h1>
          <p className="lead">
            Cadastre sua empresa para acessar chaves de API, ambiente de testes e
            acompanhamento do time de sucesso do cliente.
          </p>
          <ul className="bullet-list">
            {BENEFITS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Criar conta</h2>
            <p>Preencha seus dados corporativos para ativar o sandbox.</p>
          </div>
          <form className="auth-form">
            <label className="form-field">
              <span>Nome completo</span>
              <input
                type="text"
                name="name"
                placeholder="Seu nome"
                autoComplete="name"
                required
              />
            </label>
            <label className="form-field">
              <span>E-mail corporativo</span>
              <input
                type="email"
                name="email"
                placeholder="nome@empresa.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="form-field">
              <span>Empresa</span>
              <input
                type="text"
                name="company"
                placeholder="Razão social"
                autoComplete="organization"
                required
              />
            </label>
            <div className="form-columns">
              <label className="form-field">
                <span>CNPJ</span>
                <input
                  type="text"
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </label>
              <label className="form-field">
                <span>Volume mensal</span>
                <select name="volume" required>
                  <option value="">Selecione</option>
                  <option value="ate-50k">Até R$ 50 mil</option>
                  <option value="50k-300k">R$ 50 mil a R$ 300 mil</option>
                  <option value="300k-1m">R$ 300 mil a R$ 1 milhão</option>
                  <option value="acima-1m">Acima de R$ 1 milhão</option>
                </select>
              </label>
            </div>
            <label className="form-field">
              <span>Senha</span>
              <input
                type="password"
                name="password"
                placeholder="Crie uma senha segura"
                autoComplete="new-password"
                required
              />
            </label>
            <label className="form-check">
              <input type="checkbox" required />
              <span>
                Concordo com os termos de uso e a política de privacidade.
              </span>
            </label>
            <button className="button primary full" type="submit">
              Criar conta e acessar o sandbox
            </button>
          </form>
          <div className="auth-footer">
            <span>Já possui conta?</span>
            <Link to="/login">Entrar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
