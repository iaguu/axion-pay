import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { isValidCpf, maskCnpj, maskCpf } from "../utils/masks";

const BENEFITS = [
  "Sandbox completo com PIX, cartoes e webhooks.",
  "Suporte tecnico dedicado no onboarding.",
  "Colecao Postman e SDKs oficiais.",
  "Checklist de conformidade e KYC."
];

export function AuthSignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    cnpj: "",
    cpf: "",
    volume: "",
    password: "",
    accept: false
  });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });
  const [apiKey, setApiKey] = useState("");
  const [confirmUrl, setConfirmUrl] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    let nextValue = type === "checkbox" ? checked : value;
    if (name === "cnpj") {
      nextValue = maskCnpj(nextValue);
    }
    if (name === "cpf") {
      nextValue = maskCpf(nextValue);
    }
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    setApiKey("");
    setConfirmUrl("");
    if (!isValidCpf(form.cpf)) {
      setStatus({ loading: false, error: "CPF invalido.", success: "" });
      return;
    }
    try {
      const payload = {
        name: form.name,
        email: form.email,
        company: form.company,
        cnpj: form.cnpj,
        cpf: form.cpf,
        volume: form.volume,
        password: form.password
      };
      const response = await apiRequest("/auth/signup", {
        method: "POST",
        body: payload
      });
      setApiKey(response.api_key || "");
      setConfirmUrl(response.confirm_url || "");
      setStatus({
        loading: false,
        error: "",
        success: "Conta criada. Verifique seu email para confirmar."
      });
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message || "Erro ao criar conta.",
        success: ""
      });
    }
  }

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
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Nome completo</span>
              <input
                type="text"
                name="name"
                placeholder="Seu nome"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange}
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
                value={form.email}
                onChange={handleChange}
              />
            </label>
            <label className="form-field">
              <span>Empresa</span>
              <input
                type="text"
                name="company"
                placeholder="Razao social"
                autoComplete="organization"
                required
                value={form.company}
                onChange={handleChange}
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
                  value={form.cnpj}
                  onChange={handleChange}
                />
              </label>
              <label className="form-field">
                <span>Volume mensal</span>
                <select
                  name="volume"
                  required
                  value={form.volume}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  <option value="ate-50k">Ate R$ 50 mil</option>
                  <option value="50k-300k">R$ 50 mil a R$ 300 mil</option>
                  <option value="300k-1m">R$ 300 mil a R$ 1 milhao</option>
                  <option value="acima-1m">Acima de R$ 1 milhao</option>
                </select>
              </label>
            </div>
            <label className="form-field">
              <span>CPF do responsavel</span>
              <input
                type="text"
                name="cpf"
                placeholder="000.000.000-00"
                required
                value={form.cpf}
                onChange={handleChange}
              />
            </label>
            <label className="form-field">
              <span>Senha</span>
              <input
                type="password"
                name="password"
                placeholder="Crie uma senha segura"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
              />
            </label>
            <label className="form-check">
              <input
                type="checkbox"
                name="accept"
                checked={form.accept}
                onChange={handleChange}
                required
              />
              <span>Concordo com os termos de uso e a politica de privacidade.</span>
            </label>
            {status.error ? <div className="alert error">{status.error}</div> : null}
            {status.success ? (
              <div className="alert success">{status.success}</div>
            ) : null}
            {apiKey ? (
              <div className="info-card">
                <div className="info-title">Sua API Key (guarde em local seguro)</div>
                <div className="mono">{apiKey}</div>
              </div>
            ) : null}
            {confirmUrl ? (
              <div className="info-card">
                <div className="info-title">Link de confirmacao</div>
                <div className="mono">{confirmUrl}</div>
              </div>
            ) : null}
            <button className="button primary full" type="submit" disabled={status.loading}>
              {status.loading ? "Criando..." : "Criar conta e acessar o sandbox"}
            </button>
          </form>
          <div className="auth-footer">
            <span>Ja possui conta?</span>
            <Link to="/login">Entrar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
