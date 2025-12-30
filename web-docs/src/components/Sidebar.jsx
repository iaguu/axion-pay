import React from "react";

export function Sidebar({ currentKey, onSelect, pages }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 style={{color: '#0f766e', letterSpacing: '-1px'}}>AxionPAY</h1>
        <p style={{color: '#c6a157', fontWeight: 600}}>Fintech moderna, API real.</p>
        <p style={{color: '#4b515c', fontSize: '0.95em', marginTop: 4}}>PIX instantâneo, cartões, conciliação e webhooks.</p>
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
        <small style={{color: '#0f766e'}}>v1.0 – Sandbox para desenvolvedores</small>
      </footer>
    </aside>
  );
}