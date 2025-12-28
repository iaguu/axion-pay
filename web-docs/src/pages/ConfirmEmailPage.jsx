import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export function ConfirmEmailPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const [status, setStatus] = useState({ loading: true, error: "", success: "" });

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setStatus({ loading: false, error: "Token nao informado.", success: "" });
        return;
      }
      try {
        await apiRequest(`/auth/confirm?token=${encodeURIComponent(token)}`);
        setStatus({
          loading: false,
          error: "",
          success: "Email confirmado. Voce ja pode acessar o painel."
        });
      } catch (err) {
        setStatus({
          loading: false,
          error: err.message || "Falha ao confirmar email.",
          success: ""
        });
      }
    }
    confirm();
  }, [token]);

  return (
    <div className="section">
      <div className="panel-card">
        <h2>Confirmacao de email</h2>
        {status.loading ? <p>Confirmando...</p> : null}
        {status.error ? <div className="alert error">{status.error}</div> : null}
        {status.success ? <div className="alert success">{status.success}</div> : null}
        <div className="button-row">
          <Link className="button primary" to="/login">
            Ir para login
          </Link>
        </div>
      </div>
    </div>
  );
}
