import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, setAdminToken } from "../services/api";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "admin", password: "123" });
  const [status, setStatus] = useState({ loading: false, error: "" });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });
    try {
      const response = await apiRequest("/admin/login", {
        method: "POST",
        body: form
      });
      setAdminToken(response.token);
      navigate("/admin");
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao entrar." });
    }
  }

  return (
    <div className="auth-page">
      <section className="section auth-grid">
        <div className="auth-copy">
          <span className="eyebrow">Painel Administrativo</span>
          <h1>Gerencie contas e aprovacoes.</h1>
          <p className="lead">
            Use o login admin para revisar contas, liberar acesso e enviar
            documentacao.
          </p>
        </div>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Admin</h2>
            <p>Credenciais padrao: admin/123</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Usuario</span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
              />
            </label>
            <label className="form-field">
              <span>Senha</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </label>
            {status.error ? <div className="alert error">{status.error}</div> : null}
            <button className="button primary full" type="submit" disabled={status.loading}>
              {status.loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
