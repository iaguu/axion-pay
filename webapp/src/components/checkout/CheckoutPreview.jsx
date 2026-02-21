import { memo } from "react";
import "./CheckoutPreview.css";

const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "Hipercard"];
const DEFAULT_FEATURES = ["Processamento seguro", "Proteção antifraude", "Suporte 24/7"];

const getAvatar = (index) => `https://i.pravatar.cc/52?img=${12 + (index % 70)}`;

const formatCurrency = (value, currency = "BRL") => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(amount);
};

function CheckoutPreview({ product = {}, fallbackTitle = "Checkout preview" }) {
  const theme = product.theme === "white" ? "white" : "dark";
  const features = Array.isArray(product.features) && product.features.length ? product.features : DEFAULT_FEATURES;
  const proofsSource = Array.isArray(product.socialProof) ? product.socialProof : Array.isArray(product.socialProofs) ? product.socialProofs : [];
  const proofs = proofsSource;
  const socialCards = proofs.length
    ? proofs.map((entry, index) => ({
        name: entry.name || entry.label || entry.value || "Cliente AxionPAY",
        description: entry.description || entry.value || "Experiência validada",
        note: entry.note || entry.caption || "",
        avatar: entry.avatar || getAvatar(index)
      }))
    : [];
  return (
    <article className={`checkout-preview-card ${theme}`}>
      <div className="preview-header">
        <span className="preview-tag">{product.slug ? `/checkout/${product.slug}` : "/checkout/demo"}</span>
        <h4>{product.title || fallbackTitle}</h4>
        <p>{product.description || "Experimente uma jornada rápida e segura para receber pagamentos."}</p>
      </div>
      <div className="preview-price">
        <strong>{formatCurrency(product.price, product.currency)}</strong>
        <small>Preço total</small>
      </div>
      <div className="preview-features">
        {features.map((feature) => (
          <span key={feature}>{feature}</span>
        ))}
      </div>
      <div className="preview-methods">
        <div className="preview-brands">
          {CARD_BRANDS.map((brand) => (
            <span key={brand}>{brand}</span>
          ))}
        </div>
        <div className="preview-pix">
          <strong>PIX</strong>
          <span>Recomendado • 5% OFF</span>
        </div>
      </div>
      <div className="preview-social">
        {socialCards.length ? (
          socialCards.map((proof) => (
            <article key={`${proof.name}-${proof.description}`} className="preview-social-card">
              <img src={proof.avatar} alt={proof.name} />
              <div>
                <strong>{proof.name}</strong>
                <p>{proof.description}</p>
                {proof.note && <small>{proof.note}</small>}
              </div>
            </article>
          ))
        ) : (
          <p className="preview-empty">Adicione provas sociais para aumentar a confiança.</p>
        )}
      </div>
      <div className="preview-powered">Processado por sistema seguro</div>
    </article>
  );
}

export default memo(CheckoutPreview);
