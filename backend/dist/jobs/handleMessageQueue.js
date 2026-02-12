"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wbot_1 = require("../libs/wbot");
const wbotMessageListener_1 = require("../services/WbotServices/wbotMessageListener");
exports.default = {
    key: `${process.env.DB_NAME}-handleMessage`,
    async handle({ data }) {
        // console.log(`[DEBUG 2026] handleMessageQueue: Job iniciado para msg ID: ${data?.message?.key?.id}`);
        try {
            const { message, wbot, companyId } = data;
            if (message === undefined || wbot === undefined || companyId === undefined) {
                // console.log("message, wbot, companyId", message, wbot, companyId)
            }
            const w = await (0, wbot_1.getWbot)(wbot);
            if (!w) {
                console.error(`[DEBUG 2026] wbot not found for ID: ${wbot}. Abortando job.`);
                return;
            }
            try {
                await (0, wbotMessageListener_1.handleMessage)(message, w, companyId);
                // console.log(`[DEBUG 2026] handleMessageQueue: Job finalizado com sucesso para msg ID: ${data?.message?.key?.id}`);
            }
            catch (error) {
                console.error(`[DEBUG 2026] Erro ao processar handleMessage para msg ID: ${data?.message?.key?.id}:`, error);
            }
        }
        catch (error) {
            console.log("error", error);
        }
    },
};
