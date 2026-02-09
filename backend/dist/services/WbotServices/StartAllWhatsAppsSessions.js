"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartAllWhatsAppsSessions = void 0;
const ListWhatsAppsService_1 = __importDefault(require("../WhatsappService/ListWhatsAppsService"));
const StartWhatsAppSession_1 = require("./StartWhatsAppSession");
const Sentry = __importStar(require("@sentry/node"));
const logger_1 = __importDefault(require("../../utils/logger"));
const StartAllWhatsAppsSessions = async (companyId) => {
    try {
        const whatsapps = await (0, ListWhatsAppsService_1.default)({ companyId });
        // ✅ CORREÇÃO: Verificar se whatsapps existe e é um array
        if (!whatsapps || !Array.isArray(whatsapps) || whatsapps.length === 0) {
            logger_1.default.info(`[StartAllWhatsAppsSessions] Nenhuma conexão WhatsApp encontrada para companyId ${companyId}`);
            return;
        }
        logger_1.default.info(`[StartAllWhatsAppsSessions] Iniciando ${whatsapps.length} sessões para companyId ${companyId}`);
        const promises = whatsapps.map(async (whatsapp) => {
            // ✅ CORREÇÃO: Verificar se whatsapp existe antes de acessar propriedades
            if (!whatsapp) {
                return;
            }
            if (whatsapp.channel === "whatsapp" && whatsapp.status !== "DISCONNECTED") {
                try {
                    return await (0, StartWhatsAppSession_1.StartWhatsAppSession)(whatsapp, companyId);
                }
                catch (sessionErr) {
                    // ✅ CORREÇÃO: Logar erro individual sem interromper outras sessões
                    logger_1.default.error(`[StartAllWhatsAppsSessions] Erro ao iniciar sessão ${whatsapp.id}: ${sessionErr}`);
                    Sentry.captureException(sessionErr);
                }
            }
        });
        // Aguardar a resolução de todas as promessas
        await Promise.all(promises);
        logger_1.default.info(`[StartAllWhatsAppsSessions] Sessões iniciadas para companyId ${companyId}`);
    }
    catch (e) {
        // ✅ CORREÇÃO: Logar erro para facilitar debugging
        logger_1.default.error(`[StartAllWhatsAppsSessions] Erro geral para companyId ${companyId}: ${e}`);
        Sentry.captureException(e);
    }
};
exports.StartAllWhatsAppsSessions = StartAllWhatsAppsSessions;
