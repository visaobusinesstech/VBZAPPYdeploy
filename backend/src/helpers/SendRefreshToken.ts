import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  const isProd =
    String(process.env.NODE_ENV).toLowerCase() === "production" ||
    String(process.env.COOKIE_SECURE).toLowerCase() === "true";

  const cookieOptions: any = {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 * 30, // 30 days
    path: "/"
  };

  if (isProd) {
    cookieOptions.sameSite = "none";
    cookieOptions.secure = true;
  } else {
    // Ambiente local: permitir cookie sem HTTPS e tratar como same-site
    cookieOptions.sameSite = "lax";
    cookieOptions.secure = false;
  }

  res.cookie("jrt", token, cookieOptions);
};
