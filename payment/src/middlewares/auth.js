import { config } from "../config/env.js";

export function requireApiKey(req, res, next) {
  if (!config.auth.required) {
    return next();
  }

  if (!config.auth.apiKey) {
    return res.status(500).json({
      ok: false,
      error: "API key nao configurada no servidor.",
      code: "auth_misconfigured"
    });
  }

  if (req.method === "OPTIONS") {
    return next();
  }

  const headerKey = req.get("x-api-key");
  const authorization = req.get("authorization");
  const bearer =
    authorization && authorization.toLowerCase().startsWith("bearer ")
      ? authorization.slice(7).trim()
      : null;
  const token = headerKey || bearer;

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "API key obrigatoria.",
      code: "unauthorized"
    });
  }

  if (token !== config.auth.apiKey) {
    return res.status(403).json({
      ok: false,
      error: "API key invalida.",
      code: "forbidden"
    });
  }

  return next();
}
