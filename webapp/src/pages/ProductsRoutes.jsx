import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import "../pages.css";

const content = {
  pix: {
    title: "PIX, Cartoes e Assinaturas",
    description: "Integre PIX instantaneo, cartoes e planos recorrentes com tokens industriais."
  },
  split: {
    title: "Split e Subcontas",
    description: "Divida receitas, configure repasses e mantenha auditoria atualizada."
  },
  antifraude: {
    title: "Antifraude e Chargebacks",
    description: "Plataformas com score, regras e workflows de disputa 24/7."
  }
};

function ProductPage({ type }) {
  const info = content[type] || content.pix;
  return (
    <section className="page-section">
      <h1>{info.title}</h1>
      <p>{info.description}</p>
      <div className="grid">
        {[1, 2, 3].map((item) => (
          <article key={item} className="card">
            <h3>
              {info.title} - detalhe {item}
            </h3>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ProductsRoutes() {
  return (
    <Routes>
      <Route path="pix" element={<ProductPage type="pix" />} />
      <Route path="split" element={<ProductPage type="split" />} />
      <Route path="antifraude" element={<ProductPage type="antifraude" />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

