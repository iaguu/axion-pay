export class AppError extends Error {
  constructor(message, statusCode = 400, code = "bad_request") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isAppError(err) {
  return err instanceof AppError;
}
