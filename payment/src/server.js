import { app } from "./app.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";

app.listen(config.port, () => {
  logger.info(`Payment Gateway API rodando na porta ${config.port} (${config.env})`);
});
