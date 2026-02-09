"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Message_1 = __importDefault(require("../../models/Message"));
const socket_1 = require("../../libs/socket");
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const UpdateTicketService_1 = __importDefault(require("../TicketServices/UpdateTicketService"));
const CompaniesSettings_1 = __importDefault(require("../../models/CompaniesSettings"));
const MarkDeleteWhatsAppMessage = async (from, timestamp, msgId, companyId) => {
    // ✅ CORREÇÃO: Verificar se from existe antes de usar replace
    if (from) {
        from = from.replace('@c.us', '').replace('@s.whatsapp.net', '');
    }
    if (msgId) {
        const messages = await Message_1.default.findAll({
            where: {
                wid: msgId,
                companyId
            }
        });
        // ✅ CORREÇÃO: Verificar se encontrou mensagens antes de acessar o array
        if (!messages || messages.length === 0) {
            console.log(`Mensagem não encontrada: ${msgId}`);
            return timestamp;
        }
        try {
            const messageToUpdate = await Message_1.default.findOne({
                where: {
                    wid: messages[0].wid,
                },
                include: [
                    "contact",
                    {
                        model: Message_1.default,
                        as: "quotedMsg",
                        include: ["contact"]
                    }
                ]
            });
            if (messageToUpdate) {
                const settings = await CompaniesSettings_1.default.findOne({
                    where: {
                        companyId: companyId
                    }
                });
                const ticket = await Ticket_1.default.findOne({
                    where: {
                        id: messageToUpdate.ticketId,
                        companyId
                    }
                });
                // ✅ CORREÇÃO: Verificar se settings existe antes de acessar propriedades
                if (settings && settings.lgpdDeleteMessage === "enabled" && settings.enableLGPD === "enabled") {
                    await messageToUpdate.update({ body: "🚫 _Mensagem Apagada_", isDeleted: true });
                }
                else {
                    await messageToUpdate.update({ isDeleted: true });
                }
                // ✅ CORREÇÃO: Verificar se ticket existe antes de acessar id
                if (ticket) {
                    await (0, UpdateTicketService_1.default)({
                        ticketData: { lastMessage: "🚫 _Mensagem Apagada_" },
                        ticketId: ticket.id,
                        companyId
                    });
                }
                const io = (0, socket_1.getIO)();
                io.of(String(companyId))
                    // ✅ CORREÇÃO: Usar ticketId ao invés do objeto messageToUpdate
                    .emit(`appMessage-${messageToUpdate.ticketId}`, {
                    action: "update",
                    message: messageToUpdate
                });
            }
        }
        catch (err) {
            console.log("Erro ao tentar marcar a mensagem como excluída:", err);
        }
        return timestamp;
    }
};
exports.default = MarkDeleteWhatsAppMessage;
