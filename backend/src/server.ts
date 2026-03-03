import "dotenv/config";
import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import logger from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import BullQueue from "./libs/queue";
import { startQueueProcess } from "./queues";
import { startLidSyncJob } from "./jobs/LidSyncJob";
import { REDIS_URI_MSG_CONN } from "./config/redis";
import { ensureDatabase } from "./utils/ensureDatabase";
import "./emailQueues";

const preferredPort = Number(process.env.PORT) || 8080;

function startServer(portToUse: number) {
  const server = app.listen(portToUse, async () => {
    const skipBootstrap = String(process.env.SKIP_DB_BOOTSTRAP || "").toLowerCase() === "true";
    if (!skipBootstrap) {
      await ensureDatabase();
      const companies = await Company.findAll({
        where: { status: true },
        attributes: ["id"],
      });
  
      const allPromises: Promise<any>[] = companies.map(c =>
        StartAllWhatsAppsSessions(c.id).catch(err => {
          logger.error({ msg: "Erro ao iniciar sessão WhatsApp", companyId: c.id, error: String(err?.message || err) });
        })
      );
      await Promise.allSettled(allPromises);
      logger.info("Fila de processamento: inicializando");
      await startQueueProcess();
  
      if (REDIS_URI_MSG_CONN && REDIS_URI_MSG_CONN !== "") {
        BullQueue.process();
      }
  
      startLidSyncJob();
    } else {
      logger.warn("SKIP_DB_BOOTSTRAP=true: pulando acesso ao banco e inicialização de filas.");
    }
    logger.info(`Servidor iniciado na porta ${portToUse}`);
    initIO(server);
    gracefulShutdown(server);
  });

  server.on("error", (err: any) => {
    if (err?.code === "EADDRINUSE") {
      const fallback = 8080;
      if (portToUse !== fallback) {
        logger.warn(`Porta ${portToUse} em uso. Tentando porta ${fallback}...`);
        try {
          server.close(() => startServer(fallback));
        } catch {
          startServer(fallback);
        }
      } else {
        const alt = 0; // aleatória
        logger.warn(`Porta ${portToUse} em uso. Tentando porta aleatória...`);
        try {
          server.close(() => startServer(alt));
        } catch {
          startServer(alt);
        }
      }
    } else {
      logger.error({ msg: "Erro ao iniciar o servidor", error: err?.message || String(err) });
      process.exit(1);
    }
  });
}

startServer(preferredPort);

process.on("uncaughtException", err => {
  logger.error({ msg: "uncaughtException", error: err.message, stack: err.stack?.split("\n")[0] });
  process.exit(1);
});

process.on("unhandledRejection", (reason: any, p: any) => {
  logger.error({ msg: "unhandledRejection", reason: String(reason), promise: String(p) });
  process.exit(1);
});
