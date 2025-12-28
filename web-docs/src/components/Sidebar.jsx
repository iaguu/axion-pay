import React from "react";

export function Sidebar({ currentKey, onSelect, pages }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Gateway Docs</h1>
        <p>PIX first, card ready.</p>
      </div>
      <nav className="sidebar-nav">
        {Object.entries(pages).map(([key, page]) => (
          <button
            key={key}
            className={key === currentKey ? "nav-item active" : "nav-item"}
            onClick={() => onSelect(key)}
          >
            {page.title}
          </button>
        ))}
      </nav>
      <footer className="sidebar-footer">
        <small>v1.0 – Ambiente de testes</small>
      </footer>
    </aside>
  );
}