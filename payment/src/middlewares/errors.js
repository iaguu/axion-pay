import { isAppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(_req, res) {
  return res.status(404).json({
    ok: false,
    error: "Not Found",
    code: "not_found"
  });
}

export function errorHandler(err, _req, res, _next) {
  if (isAppError(err)) {
    return res.status(err.statusCode || 400).json({
      ok: false,
      error: err.message,
      code: err.code || "bad_request"
    });
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      ok: false,
      error: "Payload muito grande.",
      code: "payload_too_large"
    });
  }

  logger.error({ err }, "Erro inesperado.");
  return res.status(500).json({
    ok: false,
    error: "Erro interno.",
    code: "internal_error"
  });
}
