"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env"
});
try {
    const url = process.env.DATABASE_URL;
    if (url && (!process.env.DB_HOST || !process.env.DB_NAME)) {
        const u = new URL(url);
        process.env.DB_DIALECT = process.env.DB_DIALECT || "postgres";
        process.env.DB_HOST = process.env.DB_HOST || u.hostname;
        process.env.DB_PORT = process.env.DB_PORT || (u.port || "5432");
        process.env.DB_USER = process.env.DB_USER || decodeURIComponent(u.username || "");
        process.env.DB_PASS = process.env.DB_PASS || decodeURIComponent(u.password || "");
        process.env.DB_NAME = process.env.DB_NAME || (u.pathname || "").replace("/", "");
    }
}
catch { }
