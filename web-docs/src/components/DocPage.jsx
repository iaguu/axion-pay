import React from "react";

export function DocPage({ title, content }) {
  return (
    <main className="doc-page">
      <article>
        <h2>{title}</h2>
        <div className="doc-content">
          {content.split("\n").map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      </article>
    </main>
  );
}