"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Baileys_1 = __importDefault(require("../../models/Baileys"));
const DeleteBaileysService = async (id) => {
    await Baileys_1.default.destroy({
        where: {
            whatsappId: id
        }
    });
};
exports.default = DeleteBaileysService;
