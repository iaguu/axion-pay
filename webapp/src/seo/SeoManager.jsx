import { useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePageMetadata } from "./usePageMetadata.js";

const ROUTE_META = [
  {
    match: (path) => path === "/",
    meta: {
      title: "AxionPAY | Pagamentos instantâneos",
      description: "Plataforma brasileira para receber PIX, cartões e assinaturas com pay-tags inteligentes e relatórios em tempo real.",
      keywords: "pagamentos, pix, cartão, assinaturas, dashboard, pay-tags"
    }
  },
  {
    match: (path) => path.startsWith("/products"),
    meta: {
      title: "AxionPAY | Produtos e APIs avançadas",
      description: "Integracoes modernas de split, antifraude e recorrencia para squads que precisam de controle total sobre o fluxo de recebimentos."
    }
  },
  {
    match: (path) => path.startsWith("/dashboard"),
    meta: {
      title: "AxionPAY | Painel do cliente",
      description: "Painel operacional com acesso a pay-tags, repasses e suporte, conspirando com o banco central em tempo real."
    }
  },
  {
    match: (path) => path === "/support",
    meta: {
      title: "AxionPAY | Suporte e documentação",
      description: "Central de atendimento AxionPAY, com chat, WhatsApp e tickets para squads que precisam manter a operação no ar."
    }
  },
  {
    match: (path) => path === "/status",
    meta: {
      title: "AxionPAY | Status da API",
      description: "Relatório vivo do banco de pagamentos, latência e disponibilidade dos serviços AxionPAY."
    }
  },
  {
    match: (path) => path === "/pay-tags",
    meta: {
      title: "AxionPAY | Pay-tags inteligentes",
      description: "Crie e monitore canais dedicados com pay-tags exclusivas, roteamento seguro e tracking granular de recebimentos."
    }
  },
  {
    match: (path) => path === "/docs",
    meta: {
      title: "AxionPAY | Documentação oficial",
      description:
        "Guias, contratos OpenAPI e exemplos prontos para integrar PIX, cartões e antifraude através do AxionPAY.",
      keywords: "documentação, API, pay-tags, PIX, cartão, antifraude"
    }
  },
  {
    match: (path) => path.startsWith("/checkout"),
    meta: {
      title: "AxionPAY | Checkout configurável",
      description:
        "Monte páginas /checkout/{slug} com temas black/white, provas sociais e métodos aceitos para vender em qualquer canal.",
      keywords: "checkout, pagamentos, PIX, cartão, provas sociais"
    }
  }
];

const DEFAULT_SITE_URL = "https://pay.axionenterprise.cloud";
const resolvedOrigin = typeof window !== "undefined" ? window.location.origin : DEFAULT_SITE_URL;
const canonicalOrigin =
  resolvedOrigin && resolvedOrigin.includes("localhost") ? DEFAULT_SITE_URL : resolvedOrigin;
const baseUrl = canonicalOrigin || DEFAULT_SITE_URL;
const baseLogo = `${baseUrl}/axionpay_logo.transparent.png`;
const baseOgImage = `${baseUrl}/og/og-image-1200x630.png`;

export default function SeoManager() {
  const location = useLocation();
  const routeMeta = useMemo(() => {
    const matcher = ROUTE_META.find((entry) => entry.match(location.pathname));
    return matcher ? matcher.meta : {};
  }, [location.pathname]);

  const canonicalUrl = `${baseUrl}${location.pathname}`;
  const schemaDescription =
    routeMeta.description || "Receba, monitore e reconcilie pagamentos instantâneos com o AxionPAY, o gateway brasileiro focado em PIX, cartões e antifraude.";
  const schemaData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AxionPAY",
      url: canonicalUrl,
      logo: baseLogo,
      description: schemaDescription,
      sameAs: ["https://pay.axionenterprise.cloud", "https://docs.axionenterprise.cloud"]
    }),
    [canonicalUrl, schemaDescription]
  );

  useEffect(() => {
    const scriptId = "axionpay-schema";
    let schemaScript = document.head.querySelector(`#${scriptId}`);
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = scriptId;
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schemaData);
  }, [schemaData]);

  usePageMetadata({
    title: routeMeta.title,
    description: routeMeta.description,
    keywords: routeMeta.keywords,
    url: canonicalUrl,
    image: baseOgImage
  });

  return null;
}
