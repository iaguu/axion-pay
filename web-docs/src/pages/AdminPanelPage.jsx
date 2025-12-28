import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  apiRequest,
  clearAdminToken,
  getAdminToken
} from "../services/api";

const STATUS_LABELS = {
  pending: "Em analise",
  approved: "Aprovada",
  rejected: "Rejeitada",
  suspended: "Suspensa"
};

export function AdminPanelPage() {
  const navigate = useNavigate();
  const token = getAdminToken();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [keysByUser, setKeysByUser] = useState({});
  const [newKeys, setNewKeys] = useState({});

  async function loadUsers() {
    setStatus({ loading: true, error: "" });
    try {
      const response = await apiRequest("/admin/users", { adminToken: token });
      setUsers(response.users || []);
      setStatus({ loading: false, error: "" });
    } catch (err) {
      if (err.status === 401) {
        clearAdminToken();
        navigate("/admin/login");
        return;
      }
      setStatus({ loading: false, error: err.message || "Erro ao carregar usuarios." });
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    loadUsers();
  }, []);

  async function handleApprove(userId) {
    try {
      await apiRequest(`/admin/users/${userId}/approve`, {
        method: "PATCH",
        adminToken: token,
        body: { sendDocs: true }
      });
      loadUsers();
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao aprovar." });
    }
  }

  async function handleReject(userId) {
    try {
      await apiRequest(`/admin/users/${userId}/reject`, {
        method: "PATCH",
        adminToken: token,
        body: { notes: "Reprovado na analise" }
      });
      loadUsers();
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao rejeitar." });
    }
  }

  async function handleSendDocs(userId) {
    try {
      await apiRequest(`/admin/users/${userId}/send-docs`, {
        method: "POST",
        adminToken: token
      });
      loadUsers();
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao enviar docs." });
    }
  }

  async function handleGenerateKey(userId) {
    try {
      const response = await apiRequest(`/admin/users/${userId}/api-keys`, {
        method: "POST",
        adminToken: token
      });
      setNewKeys((prev) => ({ ...prev, [userId]: response.api_key }));
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao gerar chave." });
    }
  }

  async function handleLoadKeys(userId) {
    try {
      const response = await apiRequest(`/admin/users/${userId}/api-keys`, {
        adminToken: token
      });
      setKeysByUser((prev) => ({ ...prev, [userId]: response.api_keys || [] }));
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Erro ao carregar chaves." });
    }
  }

  return (
    <div className="section">
      <div className="section-header">
        <span className="eyebrow">Admin</span>
        <h1>Painel administrativo</h1>
        <p className="lead">Aprove contas, envie docs e gere chaves.</p>
      </div>

      {status.error ? <div className="alert error">{status.error}</div> : null}
      {status.loading ? <div className="panel-card">Carregando usuarios...</div> : null}

      <div className="card-grid">
        {users.map((user) => (
          <div className="card admin-card" key={user.id}>
            <div className="admin-header">
              <div>
                <div className="key-title">{user.name}</div>
                <div className="key-meta">{user.email}</div>
              </div>
              <span className={`status-pill ${user.status === "approved" ? "resolved" : "degraded"}`}>
                {STATUS_LABELS[user.status] || user.status}
              </span>
            </div>
            <div className="admin-meta">
              <span>Empresa: {user.company || "N/A"}</span>
              <span>Docs: {user.docs_sent_at ? "Enviado" : "Nao enviado"}</span>
              <span>Email: {user.email_verified ? "OK" : "Pendente"}</span>
            </div>
            <div className="button-row">
              <button className="button primary" type="button" onClick={() => handleApprove(user.id)}>
                Aprovar
              </button>
              <button className="button ghost" type="button" onClick={() => handleReject(user.id)}>
                Rejeitar
              </button>
              <button className="button subtle" type="button" onClick={() => handleSendDocs(user.id)}>
                Enviar docs
              </button>
            </div>
            <div className="button-row">
              <button className="button ghost" type="button" onClick={() => handleGenerateKey(user.id)}>
                Gerar chave
              </button>
              <button className="button ghost" type="button" onClick={() => handleLoadKeys(user.id)}>
                Ver chaves
              </button>
            </div>
            {newKeys[user.id] ? (
              <div className="info-card">
                <div className="info-title">Nova chave</div>
                <div className="mono">{newKeys[user.id]}</div>
              </div>
            ) : null}
            {keysByUser[user.id] ? (
              <div className="key-list">
                {keysByUser[user.id].map((key) => (
                  <div className="key-list-item" key={key.id}>
                    <span>{key.label || "Sem label"}</span>
                    <span>
                      {key.key_prefix}...{key.last4}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="section-header">
        <Link className="button ghost" to="/admin/login">
          Trocar login admin
        </Link>
      </div>
    </div>
  );
}
