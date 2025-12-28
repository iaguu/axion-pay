import React from "react";
import { NavLink, Link, Routes, Route } from "react-router-dom";
import { SalesPage } from "./pages/SalesPage";
import { ApiReferencePage } from "./pages/ApiReferencePage";
import { ApiDetailsPage } from "./pages/ApiDetailsPage";
import { StatusPage } from "./pages/StatusPage";
import { AuthLoginPage } from "./pages/AuthLoginPage";
import { AuthSignupPage } from "./pages/AuthSignupPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const NAV_ITEMS = [
  { path: "/", label: "AxionPAY" },
  { path: "/api", label: "API e Integração" },
  { path: "/api/reference", label: "API Reference" },
  { path: "/status", label: "Status da API" }
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">AxionPAY</span>
          <span className="brand-caption">Gateway premium de pagamentos</span>
        </Link>
        <nav className="topnav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-actions">
          <Link className="button ghost" to="/login">
            Entrar
          </Link>
          <Link className="button primary" to="/cadastro">
            Criar sandbox
          </Link>
        </div>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<SalesPage />} />
          <Route path="/api" element={<ApiReferencePage />} />
          <Route path="/api/reference" element={<ApiDetailsPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/login" element={<AuthLoginPage />} />
          <Route path="/cadastro" element={<AuthSignupPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <div className="brand-mark">AxionPAY</div>
            <p>
              Gateway de pagamentos com performance, segurança e governança para
              operações digitais.
            </p>
          </div>
          <div>
            <div className="footer-title">Produto</div>
            <ul>
              <li>PIX, cartões e assinaturas</li>
              <li>Split e subcontas</li>
              <li>Antifraude e chargebacks</li>
            </ul>
          </div>
          <div>
            <div className="footer-title">Desenvolvedores</div>
            <ul>
              <li>
                <Link to="/api/reference">API Reference</Link>
              </li>
              <li>Webhooks</li>
              <li>Postman e SDKs</li>
            </ul>
          </div>
          <div>
            <div className="footer-title">Suporte</div>
            <ul>
              <li>
                <Link to="/status">Status da API</Link>
              </li>
              <li>Central de ajuda</li>
              <li>SLA e segurança</li>
            </ul>
          </div>
        </div>
        <div className="footer-meta">
          <span>AxionPAY 2025. Todos os direitos reservados.</span>
          <span>Ambiente de demonstração.</span>
        </div>
      </footer>
    </div>
  );
}
