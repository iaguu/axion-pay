import { memo } from "react";
import CheckoutPreview from "./CheckoutPreview.jsx";
function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  onReset,
  productForm,
  handleChange,
  setField,
  payTags,
  socialProofDraft,
  onSocialProofDraftChange,
  addSocialProof,
  removeSocialProof,
  submittingLabel = "Salvar produto"
}) {
  if (!isOpen) return null;

  const previewProduct = {
    ...productForm,
    features: productForm.features,
    socialProofs: productForm.socialProofs
  };

  const featuresText = Array.isArray(productForm.features) ? productForm.features.join("\n") : "";
  const appearance = productForm.appearance || {};

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="checkout-modal-backdrop" onMouseDown={handleBackdropClick}>
      <div className="checkout-modal-card">
        <header className="checkout-modal-header">
          <div>
            <p className="modal-eyebrow">Produtos &amp; checkouts</p>
            <h3>{productForm.title ? "Editar checkout" : "Novo checkout configurável"}</h3>
          </div>
          <button type="button" className="modal-close" aria-label="Fechar modal" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="checkout-modal-body">
          <form className="checkout-modal-form" onSubmit={onSubmit}>
            <div className="form-grid">
              <label>
                <span>Slug da URL</span>
                <input
                  type="text"
                  value={productForm.slug}
                  onChange={handleChange("slug")}
                  placeholder="evento-tech"
                  required
                />
              </label>
              <label>
                <span>Título público</span>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={handleChange("title")}
                  placeholder="Checkout premium"
                  required
                />
               </label>
             </div>
            <label>
              <span>Pay-tag</span>
              <select value={productForm.payTagId} onChange={handleChange("payTagId")} required>
                <option value="">Selecione uma pay-tag</option>
                {payTags?.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              {!payTags?.length && (
                <small className="helper-text">Cadastre uma pay-tag antes de configurar um checkout.</small>
              )}
            </label>
             <label>
               <span>Descrição curta</span>
               <textarea
                 value={productForm.description}
                 onChange={handleChange("description")}
                 placeholder="Ofereça PIX e cartões com splits automatizados."
                 required
               />
             </label>
            <div className="form-grid">
              <label>
                <span>Preço (ex: 199)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={handleChange("price")}
                  required
                />
              </label>
              <label>
                <span>Moeda</span>
                <input
                  type="text"
                  value={productForm.currency}
                  onChange={handleChange("currency")}
                  placeholder="BRL"
                />
              </label>
              <label>
                <span>Tema</span>
                <select value={productForm.theme} onChange={handleChange("theme")}>
                  <option value="black">Black</option>
                  <option value="white">White</option>
                </select>
              </label>
            </div>


            <div className="form-grid">
              <label>
                <span>Template do checkout</span>
                <select value={productForm.template || "classic"} onChange={handleChange("template")}>
                  <option value="classic">Classic</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
              <label>
                <span>Nome da marca</span>
                <input
                  type="text"
                  value={appearance.brandName || ""}
                  onChange={(e) => setField?.("appearance.brandName", e.target.value)}
                  placeholder="Sua marca"
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>Logo (URL)</span>
                <input
                  type="url"
                  value={appearance.logoUrl || ""}
                  onChange={(e) => setField?.("appearance.logoUrl", e.target.value)}
                  placeholder="https://.../logo.png"
                />
              </label>
              <label>
                <span>Fonte (CSS font-family)</span>
                <input
                  type="text"
                  value={appearance.fontFamily || ""}
                  onChange={(e) => setField?.("appearance.fontFamily", e.target.value)}
                  placeholder="ui-sans-serif, system-ui, -apple-system"
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>Cor primaria (#hex)</span>
                <input
                  type="text"
                  value={appearance.primary || ""}
                  onChange={(e) => setField?.("appearance.primary", e.target.value)}
                  placeholder="#3b82f6"
                />
              </label>
              <label>
                <span>Cor de destaque (#hex)</span>
                <input
                  type="text"
                  value={appearance.accent || ""}
                  onChange={(e) => setField?.("appearance.accent", e.target.value)}
                  placeholder="#f97316"
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>Radius (0-28)</span>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={Number.isFinite(appearance.radius) ? appearance.radius : 14}
                  onChange={(e) => setField?.("appearance.radius", Number(e.target.value))}
                />
              </label>
              <label>
                <span>Radius botoes (0-28)</span>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={Number.isFinite(appearance.buttonRadius) ? appearance.buttonRadius : 14}
                  onChange={(e) => setField?.("appearance.buttonRadius", Number(e.target.value))}
                />
              </label>
            </div>

            <label>
              <span>Highlights (1 por linha)</span>
              <textarea
                value={featuresText}
                onChange={(e) =>
                  setField?.(
                    "features",
                    String(e.target.value || "")
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .slice(0, 12)
                  )
                }
                placeholder={"Processamento seguro\nProtecao antifraude\nSuporte 24/7"}
              />
            </label>

            <label>
              <span>CSS avancado (opcional)</span>
              <textarea
                value={appearance.customCss || ""}
                onChange={(e) => setField?.("appearance.customCss", e.target.value)}
                placeholder={":root{--checkout-primary:#0ea5e9;}\n.checkout-shell{...}"}
              />
              <small className="helper-text">Use com cuidado: aplicado somente no checkout deste slug.</small>
            </label>
            <div className="social-proof-builder">
              <div className="social-proof-builder-inputs">
                <input
                  type="text"
                  placeholder="Nome"
                  value={socialProofDraft.name}
                  onChange={onSocialProofDraftChange("name")}
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  value={socialProofDraft.description}
                  onChange={onSocialProofDraftChange("description")}
                />
                <input
                  type="text"
                  placeholder="Nota"
                  value={socialProofDraft.note}
                  onChange={onSocialProofDraftChange("note")}
                />
                <button type="button" className="ghost-btn" onClick={addSocialProof}>
                  Adicionar prova social
                </button>
              </div>
              <div className="social-proof-list">
                {productForm.socialProofs.length ? (
                  productForm.socialProofs.map((proof, index) => (
                    <div key={`${proof.name}-${index}`} className="social-proof-card">
                      <div className="social-proof-card-body">
                        {!!proof.avatar && (
                          <img
                            src={proof.avatar}
                            alt={`${proof.name} avatar`}
                            className="social-proof-avatar"
                          />
                        )}
                        <div>
                          <strong>{proof.name}</strong>
                          <p>{proof.description}</p>
                          {proof.note && <small>{proof.note}</small>}
                        </div>
                      </div>
                      <button type="button" className="ghost-btn small" onClick={() => removeSocialProof(index)}>
                        Remover
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="checkout-preview-empty">Sem provas sociais cadastradas.</p>
                )}
              </div>
            </div>
            <div className="form-actions modal-actions">
              <button className="primary-btn" type="submit">
                {submittingLabel}
              </button>
              <button className="ghost-btn" type="button" onClick={onReset}>
                Limpar
              </button>
            </div>
          </form>
          <div className="checkout-modal-preview">
            <CheckoutPreview product={previewProduct} fallbackTitle="Preview instantâneo" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductFormModal);
