import { useEffect } from "react";

const defaultDescription = "Receba, monitore e reconcilie pagamentos instantâneos com o AxionPAY, o gateway brasileiro focado em PIX, cartões e defesa antifraude.";
const defaultTitle = "AxionPAY - Gateway integrado";
const defaultKeywords = "pagamentos, gateway, pix, cartões, antifraude, fintech, pay-tags";

function upsertMeta(attrKey, attrValue, content) {
  if (!content) return;
  let selector = `meta[${attrKey}="${attrValue}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attrKey, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function ensureLink(rel, hrefValue) {
  if (!hrefValue) return;
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", hrefValue);
}

export function usePageMetadata({ title, description, keywords, url, image }) {
  useEffect(() => {
    document.title = `${title || defaultTitle}`.replace(/\s+$/, "");
    const finalDescription = description || defaultDescription;
    const finalTitle = title || defaultTitle;
    const keywordList = keywords || defaultKeywords;
    const canonicalUrl = url || window.location.href;
    upsertMeta("name", "description", finalDescription);
    upsertMeta("name", "keywords", keywordList);
    upsertMeta("name", "robots", "index, follow");
    upsertMeta("property", "og:title", finalTitle);
    upsertMeta("property", "og:description", finalDescription);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", image || "/og/og-image-1200x630.png");
    upsertMeta("property", "og:site_name", "AxionPAY");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", "pt_BR");
    upsertMeta("name", "twitter:title", finalTitle);
    upsertMeta("name", "twitter:description", finalDescription);
    upsertMeta("name", "twitter:image", image || "/og/og-image-1200x630.png");
    upsertMeta("name", "twitter:card", "summary_large_image");
    ensureLink("canonical", canonicalUrl);
  }, [title, description, keywords, url, image]);
}
