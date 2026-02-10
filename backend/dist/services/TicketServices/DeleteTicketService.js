"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const User_1 = __importDefault(require("../../models/User"));
const DeleteTicketService = async (id, userId, companyId, requestUserId) => {
    let requestUser = null;
    if (requestUserId) {
        requestUser = await User_1.default.findByPk(requestUserId);
    }
    const whereCondition = { id };
    if (!requestUser?.super) {
        whereCondition.companyId = companyId;
    }
    const ticket = await Ticket_1.default.findOne({
        where: whereCondition
    });
    if (!ticket) {
        throw new AppError_1.default("ERR_NO_TICKET_FOUND", 404);
    }
    await ticket.destroy();
    return ticket;
};
exports.default = DeleteTicketService;
