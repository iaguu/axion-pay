import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { API_BASE_URL } from "../utils/api.js";
import { trackEvent } from "../lib/controlPlane.js";
import "../pages.css";

const DEFAULT_PRODUCT = "covid19";
const PRODUCT_LIBRARY = {
  covid19: {
    title: "Plano Premium",
    description: "Assine nossa plataforma completa e receba pagamentos de forma rapida e segura.",
    price: 249,
    currency: "BRL",
    theme: "white",
    template: "classic",
    features: ["Processamento seguro", "Protecao antifraude", "Suporte 24/7"],
    socialProof: [
      {
        name: "Empresa A",
        description: "Aumento de 32% nas conversoes apos implementacao.",
        note: "Mais de R$ 420K em vendas"
      },
      {
        name: "Empresa B",
        description: "Processamento rapido e aprovacao em segundos.",
        note: "98% de taxa de aprovacao"
      }
    ]
  }
};

const TRUST_BADGES = ["Processamento seguro", "Protecao antifraude 24/7", "Recebimento rapido"];

const RECEIPT_WHATSAPP_NUMBER = "5511933331462";
const buildReceiptWhatsAppUrl = (message) =>
  `https://wa.me/${RECEIPT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const CUSTOMER_FIELDS = {
  "Nome completo": { key: "name", label: "Nome completo", type: "text", autoComplete: "name" },
  Email: { key: "email", label: "Email", type: "email", autoComplete: "email" },
  "CPF/CNPJ": { key: "taxId", label: "CPF/CNPJ", type: "text", autoComplete: "off" },
  Telefone: { key: "phone", label: "Telefone", type: "tel", autoComplete: "tel" },
  Empresa: { key: "company", label: "Empresa", type: "text", autoComplete: "organization" }
};

const cleanDigits = (value) => String(value || "").replace(/\D/g, "");

const validateEmail = (value) => /.+@.+\..+/.test(String(value || "").trim());

const validateCardNumber = (number) => {
  const cleaned = cleanDigits(number);
  if (cleaned.length < 13 || cleaned.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i -= 1) {
    let digit = Number(cleaned[i]);
    if (Number.isNaN(digit)) return false;

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

const formatCardNumber = (value) => {
  const cleaned = cleanDigits(value);
  const formatted = cleaned.replace(/(.{4})/g, "$1 ").trim();
  return formatted.slice(0, 19);
};

const formatExpiry = (value) => {
  const cleaned = cleanDigits(value).slice(0, 4);
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

const mergeConfig = (base, overrides) => ({
  ...base,
  ...overrides,
  title: overrides.title || base.title,
  description: overrides.description || base.description,
  price: overrides.price ?? base.price,
  currency: overrides.currency || base.currency,
  theme: overrides.theme === "white" ? "white" : base.theme === "white" ? "white" : "black",
  template: overrides.template || base.template || "classic",
  features: overrides.features?.length ? overrides.features : base.features,
  socialProof: overrides.socialProof?.length ? overrides.socialProof : base.socialProof,
  appearance: overrides.appearance || base.appearance || null,
  paymentConfig: overrides.paymentConfig || base.paymentConfig || null
});

const normalizeOperationMode = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "black" || normalized === "dark") return "black";
  if (normalized === "white" || normalized === "light") return "white";
  return "";
};

const buildSocialProof = (lines) => {
  if (!lines?.length) return [];
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return {
        name: parts[0] || "Cliente satisfeito",
        description: parts[1] || "Experiencia AxionPAY",
        note: parts[2] || ""
      };
    });
};

const buildCheckoutVars = (config) => {
  const ap = config?.appearance || {};
  const vars = {};

  if (ap.primary) {
    vars["--accent"] = ap.primary;
    vars["--ghost-border"] = ap.primary;
    vars["--ghost-hover-bg"] = ap.primary;
    vars["--ghost-hover-border"] = ap.primary;
  }
  if (ap.accent) {
    vars["--accent-2"] = ap.accent;
  }
  if (ap.fontFamily) vars["--checkout-font"] = ap.fontFamily;
  if (Number.isFinite(ap.radius)) vars["--checkout-radius"] = `${ap.radius}px`;
  if (Number.isFinite(ap.buttonRadius)) vars["--btn-radius"] = `${ap.buttonRadius}px`;

  if (ap.background) {
    vars["--checkout-bg"] = `linear-gradient(180deg, ${ap.background}, rgba(8, 15, 40, 0.95))`;
    vars["--checkout-bg-white"] = `linear-gradient(180deg, ${ap.background}, #f8fafc)`;
  }

  if (ap.text) {
    vars["--checkout-text"] = ap.text;
    vars["--checkout-text-white"] = ap.text;
  }

  return vars;
};

export default function Checkout() {
  const { product } = useParams();
  const location = useLocation();
  const [serverConfig, setServerConfig] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [selectedMethod, setSelectedMethod] = useState("pix");
  const [activeStep, setActiveStep] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    taxId: "",
    phone: "",
    company: ""
  });

  const [pixPayload, setPixPayload] = useState("");
  const [pixQrDataUrl, setPixQrDataUrl] = useState("");
  const [pixQrBase64, setPixQrBase64] = useState("");
  const [pixTicketUrl, setPixTicketUrl] = useState("");
  const [pixModalOpen, setPixModalOpen] = useState(false);

  const [cardData, setCardData] = useState({
    number: "",
    holderName: "",
    expiry: "",
    cvv: ""
  });

  const slug = product || DEFAULT_PRODUCT;
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const operationMode = useMemo(() => {
    return normalizeOperationMode(queryParams.get("mode") || queryParams.get("operation"));
  }, [queryParams]);
  const overrides = useMemo(() => {
    const priceParam = queryParams.get("price");
    const socialEntries = queryParams.getAll("socialProof");
    return {
      title: queryParams.get("title"),
      description: queryParams.get("description"),
      price: priceParam ? Number(priceParam) : undefined,
      currency: queryParams.get("currency"),
      theme: queryParams.get("theme"),
      template: queryParams.get("template"),
      socialProof: buildSocialProof(socialEntries)
    };
  }, [queryParams]);
  const affiliateRef = useMemo(() => {
    const ref = queryParams.get("ref") || queryParams.get("aff") || queryParams.get("affiliate");
    const normalized = String(ref || "").trim();
    return normalized.length ? normalized.slice(0, 120) : "";
  }, [queryParams]);

  useEffect(() => {
    let active = true;
    const apiBase = (API_BASE_URL || "").replace(/\/$/, "");
    const endpoint = `${apiBase || ""}/checkout/products/${slug}`;
    setLoadingConfig(true);
    setFetchError(null);

    (async function loadConfig() {
      try {
        const response = await fetch(endpoint);
        if (!active) return;
        if (!response.ok) {
          if (response.status !== 404) {
            setFetchError("Nao foi possivel carregar o checkout configurado.");
          }
          setServerConfig(null);
          return;
        }
        const payload = await response.json();
        setServerConfig(payload.product || null);
      } catch {
        if (!active) return;
        setServerConfig(null);
        setFetchError("Nao foi possivel conectar ao AxionPAY.");
      } finally {
        if (active) {
          setLoadingConfig(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  const baseConfig = serverConfig || PRODUCT_LIBRARY[slug] || PRODUCT_LIBRARY[DEFAULT_PRODUCT];
  const config = useMemo(() => mergeConfig(baseConfig, overrides), [baseConfig, overrides]);
  const themeClass = config.theme === "white" ? "white" : "black";

  const paymentConfig = config.paymentConfig || {};
  const requiredFields = Array.isArray(paymentConfig.requiredFields) ? paymentConfig.requiredFields : [];
  const allowedMethods = Array.isArray(paymentConfig.allowedMethods) && paymentConfig.allowedMethods.length
    ? paymentConfig.allowedMethods
    : ["pix", "card"];
  const configuredCustomerFields = useMemo(
    () => requiredFields.filter((field) => CUSTOMER_FIELDS[field]),
    [requiredFields]
  );
  const checkoutSteps = useMemo(
    () => [
      { id: 1, label: "Dados basicos" },
      { id: 2, label: "Pagamento" },
      { id: 3, label: "Confirmacao" }
    ],
    []
  );

  useEffect(() => {
    if (!allowedMethods.includes(selectedMethod)) {
      setSelectedMethod(allowedMethods[0] || "pix");
    }
  }, [allowedMethods, selectedMethod]);

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: config.currency
  }).format(config.price);

  const checkoutVars = useMemo(() => buildCheckoutVars(config), [config]);

  const updateCustomer = (field) => (event) => {
    const value = event.target.value;
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const validateCustomer = () => {
    const required = Array.from(new Set(["Nome completo", "Email", "Telefone", ...configuredCustomerFields]));
    for (const label of required) {
      const { key } = CUSTOMER_FIELDS[label];
      const value = String(customer[key] || "").trim();
      if (!value) return `Preencha: ${label}.`;
      if (key === "email" && !validateEmail(value)) return "Informe um email valido.";
      if (key === "taxId") {
        const digits = cleanDigits(value);
        if (!(digits.length === 11 || digits.length === 14)) return "Informe um CPF/CNPJ valido.";
      }
      if (key === "phone") {
        const digits = cleanDigits(value);
        if (digits.length < 10) return "Informe um telefone valido.";
      }
    }
    return "";
  };

  const processPayment = async (method) => {
    if (!allowedMethods.includes(method)) return;

    // Public checkout payments require a server-configured product (so we have a pay-tag bound to the seller).
    if (!serverConfig?.id) {
      setPaymentStatus({
        error: true,
        status: "Checkout ainda nao esta configurado no servidor. Crie o produto no dashboard antes de cobrar."
      });
      return;
    }

    const validationError = validateCustomer();
    if (validationError) {
      setPaymentStatus({ error: true, status: validationError });
      setActiveStep(1);
      return;
    }

    setPaymentStatus({ busy: true, status: "Processando pagamento..." });
    setPixPayload("");
    setPixQrDataUrl("");
    setPixQrBase64("");
    setPixTicketUrl("");
    await trackEvent('purchase', 'purchase_attempt', {
      method,
      slug,
      amount: Number(config.price) || 0,
      currency: config.currency
    });

    const endpoint = `/checkout/products/${slug}/payments/${method === "pix" ? "pix" : "card"}`;

    const baseBody = {
      amount: Math.round(Number(config.price) * 100) / 100,
      currency: config.currency,
      method,
      customer: {
        name: customer.name || undefined,
        email: customer.email || undefined,
        taxId: customer.taxId || undefined,
        phone: customer.phone || undefined,
        company: customer.company || undefined
      },
      metadata: {
        checkout_slug: slug,
        checkout_product_id: config.id || undefined,
        ...(operationMode ? { operation_mode: operationMode } : {}),
        ...(affiliateRef ? { affiliate_ref: affiliateRef } : {})
      }
    };

    let body = baseBody;

    if (method === "card") {
      const expiryDigits = cleanDigits(cardData.expiry);
      const expMonth = expiryDigits.slice(0, 2);
      const expYear = expiryDigits.slice(2, 4);

      if (!validateCardNumber(cardData.number)) {
        setPaymentStatus({ error: true, status: "Numero de cartao invalido." });
        return;
      }
      if (!String(cardData.holderName || "").trim()) {
        setPaymentStatus({ error: true, status: "Informe o nome no cartao." });
        return;
      }
      if (expMonth.length !== 2 || expYear.length !== 2) {
        setPaymentStatus({ error: true, status: "Informe a validade no formato MM/AA." });
        return;
      }

      const monthNumber = Number(expMonth);
      const yearNumber = Number(expYear);
      if (!monthNumber || monthNumber < 1 || monthNumber > 12 || !yearNumber) {
        setPaymentStatus({ error: true, status: "Validade invalida." });
        return;
      }
      if (cleanDigits(cardData.cvv).length < 3) {
        setPaymentStatus({ error: true, status: "CVV invalido." });
        return;
      }

      const fullYear = 2000 + yearNumber;
      body = {
        ...baseBody,
        card: {
          number: cleanDigits(cardData.number),
          exp_month: String(monthNumber).padStart(2, "0"),
          exp_year: String(fullYear),
          cvv: cleanDigits(cardData.cvv),
          holder_name: String(cardData.holderName).trim()
        }
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `${slug}-${method}-${Date.now()}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPaymentStatus({ error: true, status: data?.error || "Nao foi possivel processar o pagamento." });
        await trackEvent('purchase', 'purchase_error', {
          method,
          slug,
          status: response.status,
          reason: data?.error || 'payment_failed'
        });
        return;
      }

      if (method === "pix") {
        const payload = data?.pix_payload || "";
        const base64 = data?.pix_qr_code_base64 || "";
        const ticketUrl = data?.pix_ticket_url || "";
        if (payload) setPixPayload(payload);
        if (base64) setPixQrBase64(base64);
        if (ticketUrl) setPixTicketUrl(ticketUrl);

        if (payload) {
          try {
            const url = await QRCode.toDataURL(payload, { width: 260, margin: 1 });
            setPixQrDataUrl(url);
          } catch {
            setPixQrDataUrl("");
          }
        } else if (base64) {
          setPixQrDataUrl(`data:image/png;base64,${base64}`);
        }
      }

      setPaymentStatus({
        success: true,
        status: method === "pix" ? "PIX gerado. Escaneie o QR Code ou copie e cole." : "Pagamento criado. Acompanhe o status no dashboard.",
        details: data?.transaction || null
      });
      setActiveStep(3);
      await trackEvent('purchase', 'purchase_success', {
        method,
        slug,
        transactionId: data?.transaction?.id || data?.id || '',
        status: data?.transaction?.status || 'success'
      });
    } catch {
      setPaymentStatus({ error: true, status: "Falha de rede ao enviar o pagamento." });
      await trackEvent('purchase', 'purchase_error', { method, slug, reason: 'network_error' });
    }
  };
  const baseDataValidationMessage = validateCustomer();
  const canContinueToPayment = !baseDataValidationMessage;

  const copyCheckoutLink = async () => {
    if (!window?.navigator || !slug) return;
    const target = `${window.location.origin}/checkout/${slug}`;
    try {
      await navigator.clipboard.writeText(target);
      setCopyStatus("Link copiado!");
      window.setTimeout(() => setCopyStatus(""), 1600);
    } catch {
      setCopyStatus("Nao foi possivel copiar.");
    }
  };

  const copyPixPayload = async () => {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      setPaymentStatus({ success: true, status: "PIX copia e cola copiado." });
    } catch {
      setPaymentStatus({ error: true, status: "Nao foi possivel copiar o PIX." });
    }
  };

  const downloadPixQr = () => {
    if (!pixQrDataUrl) return;
    try {
      const a = document.createElement("a");
      a.href = pixQrDataUrl;
      a.download = `pix-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // ignore
    }
  };

  const appearance = config.appearance || {};
  const receiptTransactionId =
    paymentStatus?.details?.id ||
    paymentStatus?.details?.transactionId ||
    paymentStatus?.details?.providerReference ||
    "";
  const receiptMessage = receiptTransactionId
    ? `Comprovante AxionPAY | Transacao ${receiptTransactionId}`
    : "Comprovante AxionPAY";
  const receiptUrl = buildReceiptWhatsAppUrl(receiptMessage);

  return (
    <section className={`checkout-shell ${themeClass === "white" ? "white" : ""}`} style={checkoutVars} data-checkout-slug={slug}>
      {appearance.customCss ? <style>{appearance.customCss}</style> : null}

      <div className="hero-block">
        <div className="hero-copy">
          {(appearance.logoUrl || appearance.brandName) && (
            <div className="checkout-brand">
              {appearance.logoUrl && (
                <img className="checkout-brand-logo" src={appearance.logoUrl} alt={appearance.brandName || "Logo"} />
              )}
              <span className="checkout-brand-name">{appearance.brandName || "AxionPAY"}</span>
            </div>
          )}
          <p className="hero-eyebrow">Checkout Seguro</p>
          <h1>{config.title}</h1>
          <p className="checkout-description">{config.description}</p>
          <div className="checkout-hero-meta">
            <span className="pill is-outline">{config.currency}</span>
          </div>
          <div className="checkout-hero-actions">
            <button className="primary-btn" type="button" onClick={() => setActiveStep(1)}>
              Iniciar checkout
            </button>
            <button className="ghost-btn" type="button" onClick={copyCheckoutLink}>
              {copyStatus || "Compartilhar link"}
            </button>
          </div>
          <div className="trust-badges">
            {TRUST_BADGES.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
        <div className="hero-preview">
          <p>Revise o resumo e finalize com o metodo de pagamento escolhido.</p>
          <div className="hero-value">
            <strong>{formattedPrice}</strong>
            <small>Preco total</small>
          </div>
        </div>
      </div>

      <article className="checkout-stepper" aria-label="Etapas do checkout">
        {checkoutSteps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={`step-chip ${activeStep === step.id ? "active" : ""} ${activeStep > step.id ? "done" : ""}`}
            onClick={() => {
              if (step.id === 3 && !paymentStatus?.status) return;
              if (step.id === 2 && !canContinueToPayment) return;
              setActiveStep(step.id);
            }}
          >
            <span>{step.id}</span>
            <strong>{step.label}</strong>
          </button>
        ))}
      </article>

      <div className="checkout-panels">
        <div className="payment-shell">
          <section className="payment-card">
            <header>
              <div>
                <p className="hero-eyebrow">Pagamento</p>
                <h3>
                  {activeStep === 1 && "Coleta de dados"}
                  {activeStep === 2 && "Metodo de pagamento"}
                  {activeStep === 3 && "Confirmacao"}
                </h3>
              </div>
              <p>Fluxo em etapas para acelerar a aprovacao e reduzir erros no preenchimento.</p>
            </header>

            {activeStep === 1 && (
              <div className="checkout-stage">
                <div className="token-row checkout-fields-grid">
                  {Array.from(new Set(["Nome completo", "Email", "Telefone", ...configuredCustomerFields])).map((field) => {
                    const schema = CUSTOMER_FIELDS[field];
                    if (!schema) return null;
                    return (
                      <label key={schema.key} className="checkout-field">
                        <span>{schema.label}</span>
                        <input
                          className="input"
                          type={schema.type}
                          value={customer[schema.key]}
                          onChange={updateCustomer(schema.key)}
                          autoComplete={schema.autoComplete}
                          placeholder={schema.label}
                        />
                      </label>
                    );
                  })}
                </div>
                {!!baseDataValidationMessage && <p className="simulation-status info">{baseDataValidationMessage}</p>}
                <div className="checkout-stage-actions">
                  <button className="primary-btn large" type="button" disabled={!canContinueToPayment} onClick={() => setActiveStep(2)}>
                    Continuar para pagamento
                  </button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="checkout-stage">
                <div className="payment-method-grid">
                  {allowedMethods.includes("pix") && (
                    <button
                      type="button"
                      className={selectedMethod === "pix" ? "method-pill active" : "method-pill"}
                      onClick={() => setSelectedMethod("pix")}
                    >
                      PIX
                    </button>
                  )}
                  {allowedMethods.includes("card") && (
                    <button
                      type="button"
                      className={selectedMethod === "card" ? "method-pill active" : "method-pill"}
                      onClick={() => setSelectedMethod("card")}
                    >
                      Cartao
                    </button>
                  )}
                </div>

                {selectedMethod === "card" && (
                  <div className="token-row checkout-fields-grid">
                    <label className="checkout-field">
                      <span>Numero do cartao</span>
                      <input
                        className="input"
                        type="text"
                        value={cardData.number}
                        onChange={(e) => setCardData((prev) => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                        placeholder="0000 0000 0000 0000"
                        autoComplete="cc-number"
                      />
                    </label>
                    <label className="checkout-field">
                      <span>Nome no cartao</span>
                      <input
                        className="input"
                        type="text"
                        value={cardData.holderName}
                        onChange={(e) => setCardData((prev) => ({ ...prev, holderName: e.target.value }))}
                        placeholder="NOME COMO ESTA NO CARTAO"
                        autoComplete="cc-name"
                      />
                    </label>
                    <label className="checkout-field">
                      <span>Validade</span>
                      <input
                        className="input"
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => setCardData((prev) => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                        placeholder="MM/AA"
                        autoComplete="cc-exp"
                      />
                    </label>
                    <label className="checkout-field">
                      <span>CVV</span>
                      <input
                        className="input"
                        type="text"
                        value={cardData.cvv}
                        onChange={(e) => setCardData((prev) => ({ ...prev, cvv: cleanDigits(e.target.value).slice(0, 4) }))}
                        placeholder="123"
                        autoComplete="cc-csc"
                      />
                    </label>
                  </div>
                )}

                <div className="checkout-stage-actions">
                  <button className="ghost-btn" type="button" onClick={() => setActiveStep(1)}>
                    Voltar
                  </button>
                  <button className="primary-btn large" type="button" onClick={() => processPayment(selectedMethod)}>
                    {selectedMethod === "pix" ? "Gerar PIX" : "Pagar com cartao"}
                  </button>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="checkout-stage">
                {selectedMethod === "pix" && pixQrDataUrl && (
                  <div className="pix-payment" style={{ justifyItems: "center" }}>
                    <button
                      type="button"
                      className="qr-preview"
                      onClick={() => setPixModalOpen(true)}
                      aria-label="Abrir visualizador do QR Code"
                      title="Clique para ampliar"
                    >
                      <img src={pixQrDataUrl} alt="QR Code PIX" style={{ width: 260, height: 260, borderRadius: 16 }} />
                    </button>
                    <div style={{ display: "grid", gap: 8, width: "100%" }}>
                      <button className="ghost-btn" type="button" onClick={copyPixPayload}>
                        Copiar PIX copia e cola
                      </button>
                      {pixTicketUrl && (
                        <a className="ghost-btn" href={pixTicketUrl} target="_blank" rel="noreferrer">
                          Abrir link do provedor
                        </a>
                      )}
                      <button className="ghost-btn" type="button" onClick={downloadPixQr}>
                        Baixar QR Code
                      </button>
                      <a className="ghost-btn" href={receiptUrl} target="_blank" rel="noreferrer">
                        Enviar comprovante no WhatsApp
                      </a>
                      <textarea readOnly value={pixPayload} style={{ minHeight: 96, width: "100%" }} />
                    </div>
                  </div>
                )}

                {selectedMethod === "card" && (
                  <div className="checkout-stage-actions confirmation-actions">
                    {paymentStatus?.details?.metadata?.providerRaw?.url && (
                      <a
                        className="ghost-btn"
                        href={paymentStatus.details.metadata.providerRaw.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Continuar no checkout do provedor
                      </a>
                    )}
                    <a className="ghost-btn" href={receiptUrl} target="_blank" rel="noreferrer">
                      Enviar comprovante no WhatsApp
                    </a>
                  </div>
                )}

                <div className="confirmation-box">
                  <h4>Pagamento processado</h4>
                  <p>{paymentStatus?.status || "Revise os detalhes antes de finalizar."}</p>
                  {receiptTransactionId && <code>ID da transacao: {receiptTransactionId}</code>}
                </div>

                <div className="checkout-stage-actions">
                  <button className="ghost-btn" type="button" onClick={() => setActiveStep(2)}>
                    Ajustar pagamento
                  </button>
                </div>
              </div>
            )}

            {paymentStatus?.status && (
              <p
                className={`simulation-status ${
                  paymentStatus.success ? "success" : paymentStatus.error ? "error" : "info"
                }`}
              >
                {paymentStatus.status}
              </p>
            )}

            <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, opacity: 0.8 }}>
              Powered by <a href="/" style={{ color: "inherit", fontWeight: 800, textDecoration: "none" }}>AxionPAY</a>
            </div>
          </section>
        </div>
        <aside className="preview-shell checkout-summary">
          <h3>Resumo do pedido</h3>
          <div className="summary-line">
            <span>Produto</span>
            <strong>{config.title}</strong>
          </div>
          <div className="summary-line">
            <span>Valor</span>
            <strong>{formattedPrice}</strong>
          </div>
          <div className="summary-line">
            <span>Metodo</span>
            <strong>{selectedMethod === "pix" ? "PIX" : "Cartao"}</strong>
          </div>
          <div className="summary-divider" />
          <div className="summary-line total">
            <span>Total</span>
            <strong>{formattedPrice}</strong>
          </div>
          <div className="summary-hints">
            <p>Pagamento em ambiente criptografado</p>
            <p>Aprovacao imediata para PIX</p>
          </div>
          {loadingConfig && <p className="panel-hint">Carregando checkout...</p>}
          {fetchError && <p className="panel-error">{fetchError}</p>}
        </aside>
      </div>

      {pixModalOpen && pixQrDataUrl && (
        <div className="checkout-modal-backdrop" role="dialog" aria-modal="true" aria-label="QR Code PIX">
          <div className="checkout-modal-card" style={{ width: "min(720px, 100%)" }}>
            <header className="checkout-modal-header">
              <div>
                <p className="modal-eyebrow">PIX</p>
                <h3>Escaneie ou copie e cole</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setPixModalOpen(false)} aria-label="Fechar">
                x
              </button>
            </header>
            <div className="checkout-modal-body" style={{ gridTemplateColumns: "1fr", justifyItems: "center" }}>
              <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 520 }}>
                <img
                  src={pixQrDataUrl}
                  alt="QR Code PIX ampliado"
                  style={{ width: "100%", maxWidth: 420, aspectRatio: "1 / 1", borderRadius: 20, justifySelf: "center" }}
                />
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="primary-btn" type="button" onClick={copyPixPayload}>
                    Copiar PIX
                  </button>
                  <button className="ghost-btn" type="button" onClick={downloadPixQr}>
                    Baixar QR
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => setPixModalOpen(false)}>
                    Voltar
                  </button>
                </div>
                <textarea readOnly value={pixPayload} style={{ minHeight: 112, width: "100%" }} />
                <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.5 }}>
                  Dica: se o app do banco nao ler o QR, use a opcao "PIX copia e cola".
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
