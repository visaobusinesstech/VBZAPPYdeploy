"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendRefreshToken = void 0;
const SendRefreshToken = (res, token) => {
    res.cookie("jrt", token, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000 * 30 }); // 30 days
};
exports.SendRefreshToken = SendRefreshToken;
