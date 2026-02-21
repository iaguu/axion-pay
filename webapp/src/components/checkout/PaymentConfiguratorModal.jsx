import { memo } from "react";
import "./CheckoutPreview.css";

const AVAILABLE_FIELDS = ["Nome completo", "Email", "CPF/CNPJ", "Telefone", "Empresa"];
const AVAILABLE_METHODS = [
  { id: "pix", label: "PIX" },
  { id: "card", label: "Cart?o" }
];

function PaymentConfiguratorModal({
  isOpen,
  onClose,
  onSubmit,
  onReset,
  configForm,
  handleChange,
  toggleRequiredField,
  toggleFlag,
  toggleAllowedMethod
}) {
  if (!isOpen) return null;

  const {
    requiredFields = [],
    allowedMethods = ["pix", "card"],
    allowSplit,
    allowPartialRefund,
    enableThreeDS,
    maxInstallments,
    callbackUrl,
    internalNotes,
    riskLevel = "medium"
  } = configForm;

  const summaryItems = [
    `Campos obrigatórios: ${requiredFields.join(", ") || "Nenhum"}`,
    `Split automático: ${allowSplit ? "Ligado" : "Desligado"}`,
    `Reembolso parcial: ${allowPartialRefund ? "Permitido" : "Bloqueado"}`,
    `3DS: ${enableThreeDS ? "Ativado" : "Desativado"}`,
    `Parcelas até: ${maxInstallments}x`,
    `Risco: ${riskLevel}`,
    internalNotes ? `Notas internas: ${internalNotes}` : "Notas internas: sem observações"
  ];

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
            <p className="modal-eyebrow">Configurator</p>
            <div className="config-header">
              <h3>Configurações de pagamento</h3>
              <span className="config-badge">Premium</span>
            </div>
            <p className="helper-text">
              Determine como os clientes pagam, quais dados você exige e quais funções internas devem rodar.
            </p>
          </div>
          <button type="button" className="modal-close" aria-label="Fechar modal" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="checkout-modal-body">
          <form className="checkout-modal-form" onSubmit={onSubmit}>
            <section className="configurator-section">
              <h4>M?todos aceitos</h4>
              <div className="config-field-grid">
                {AVAILABLE_METHODS.map((method) => (
                  <label key={method.id} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={allowedMethods.includes(method.id)}
                      onChange={() => toggleAllowedMethod?.(method.id)}
                    />
                    <span>{method.label}</span>
                  </label>
                ))}
              </div>
            </section>
            
            <section className="configurator-section">
              <h4>Dados exigidos</h4>
              <div className="config-field-grid">
                {AVAILABLE_FIELDS.map((field) => (
                  <label key={field} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={requiredFields.includes(field)}
                      onChange={() => toggleRequiredField(field)}
                    />
                    <span>{field}</span>
                  </label>
                ))}
              </div>
            </section>
            <section className="configurator-section">
              <h4>Funções internas</h4>
              <div className="config-toggle-grid">
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={allowSplit}
                    onChange={() => toggleFlag("allowSplit")}
                  />
                  <span>Split automático</span>
                </label>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={allowPartialRefund}
                    onChange={() => toggleFlag("allowPartialRefund")}
                  />
                  <span>Reembolso parcial</span>
                </label>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={enableThreeDS}
                    onChange={() => toggleFlag("enableThreeDS")}
                  />
                  <span>3DS obrigatório</span>
                </label>
              </div>
              <div className="form-grid">
                <label>
                  <span>Máximo de parcelas</span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={maxInstallments}
                    onChange={handleChange("maxInstallments")}
                  />
                </label>
                <label>
                  <span>Callback URL</span>
                  <input type="url" value={callbackUrl} onChange={handleChange("callbackUrl")} placeholder="https://..." />
                </label>
              </div>
              <label>
                <span>Nível de risco</span>
                <select value={riskLevel} onChange={handleChange("riskLevel")}>
                  <option value="low">Baixo</option>
                  <option value="medium">Médio</option>
                  <option value="high">Alto</option>
                  <option value="strict">Strict</option>
                </select>
              </label>
            </section>
            <label>
              <span>Notas internas</span>
              <textarea
                value={internalNotes}
                onChange={handleChange("internalNotes")}
                placeholder="Defina regras especiais, restrições operacionais ou observações."
              />
            </label>
            <div className="form-actions modal-actions">
              <button className="primary-btn" type="submit">
                Salvar configurador
              </button>
              <button className="ghost-btn" type="button" onClick={onReset}>
                Limpar
              </button>
            </div>
          </form>
          <aside className="config-summary-card">
            <h4>Resumo rápido</h4>
            <ul>
              {summaryItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default memo(PaymentConfiguratorModal);
