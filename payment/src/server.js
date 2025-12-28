import { app } from "./app.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";

app.listen(config.port, () => {
  logger.info(
    { port: config.port, env: config.env },
    "Payment Gateway API rodando."
  );
});
