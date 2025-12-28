import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  apiRequest,
  clearUserToken,
  getUserToken
} from "../services/api";

const STATUS_LABELS = {
  pending: "Em analise",
  approved: "Aprovada",
  rejected: "Rejeitada",
  suspended: "Suspensa"
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [newKey, setNewKey] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState({ loading: true, error: "" });
  const token = getUserToken();

  async function loadData() {
    setStatus({ loading: true, error: "" });
    try {
      const response = await apiRequest("/account/me", { token });
      setUser(response.user);
      setApiKeys(response.api_keys || []);
      setStatus({ loading: false, error: "" });
    } catch (err) {
      if (err.status === 401) {
        clearUserToken();
        navigate("/login");
        return;
      }
      setStatus({ loading: false, error: err.message || "Erro ao carregar painel." });
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadData();
  }, []);

  async function handleCreateKey(event) {
    event.preventDefault();
    setNewKey("");
    try {
      const response = await apiRequest("/account/api-keys", {
        method: "POST",
        token,
        body: label ? { label } : {}
      });
      setNewKey(response.api_key || "");
      setLabel("");
      loadData();
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao gerar chave." });
    }
  }

  async function handleRevoke(id) {
    try {
      await apiRequest(`/account/api-keys/${id}`, {
        method: "DELETE",
        token
      });
      loadData();
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao revogar chave." });
    }
  }

  async function handleSendDocs() {
    try {
      await apiRequest("/account/docs", {
        method: "POST",
        token
      });
      loadData();
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao enviar docs." });
    }
  }

  if (status.loading) {
    return (
      <div className="section">
        <div className="panel-card">Carregando painel...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="section">
        <div className="panel-card">Sessao invalida. <Link to="/login">Entrar</Link></div>
      </div>
    );
  }

  return (
    <div className="section dashboard">
      <div className="section-header">
        <span className="eyebrow">Area do usuario</span>
        <h1>Bem-vindo, {user.name}</h1>
        <p className="lead">Acompanhe o status da conta e gerencie suas chaves.</p>
      </div>
      {status.error ? <div className="alert error">{status.error}</div> : null}
      <div className="stat-grid wide">
        <div className="stat-card">
          <div className="stat-value">
            {STATUS_LABELS[user.status] || user.status}
          </div>
          <div className="stat-label">Status da conta</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.email_verified ? "Confirmado" : "Pendente"}</div>
          <div className="stat-label">Email</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.docs_sent_at ? "Enviado" : "Nao enviado"}</div>
          <div className="stat-label">Documentacao</div>
        </div>
      </div>

      <div className="card-grid dashboard-grid">
        <div className="card">
          <h3>Gerar nova API key</h3>
          <p className="panel-text">
            Use um label para identificar a chave (ex: loja-web, mobile).
          </p>
          <form className="auth-form" onSubmit={handleCreateKey}>
            <label className="form-field">
              <span>Label (opcional)</span>
              <input
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="sandbox"
              />
            </label>
            <button className="button primary" type="submit">
              Gerar chave
            </button>
          </form>
          {newKey ? (
            <div className="info-card">
              <div className="info-title">Nova API key</div>
              <div className="mono">{newKey}</div>
            </div>
          ) : null}
        </div>

        <div className="card">
          <h3>Documentacao e onboarding</h3>
          <p className="panel-text">
            Envie a documentacao para seu email ou consulte a referencia API.
          </p>
          <div className="button-row">
            <button className="button ghost" onClick={handleSendDocs} type="button">
              Enviar docs por email
            </button>
            <Link className="button subtle" to="/api">
              Abrir docs
            </Link>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2>Chaves ativas</h2>
        <p className="lead">Revogue chaves antigas para manter a seguranca.</p>
      </div>
      <div className="card-grid">
        {apiKeys.length === 0 ? (
          <div className="card">Nenhuma chave cadastrada.</div>
        ) : (
          apiKeys.map((key) => (
            <div className="card key-card" key={key.id}>
              <div className="key-header">
                <div>
                  <div className="key-title">{key.label || "Sem label"}</div>
                  <div className="key-meta">
                    {key.key_prefix}...{key.last4}
                  </div>
                </div>
                <span className={`status-pill ${key.revoked_at ? "degraded" : "resolved"}`}>
                  {key.revoked_at ? "Revogada" : "Ativa"}
                </span>
              </div>
              <div className="key-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => handleRevoke(key.id)}
                  disabled={Boolean(key.revoked_at)}
                >
                  Revogar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
