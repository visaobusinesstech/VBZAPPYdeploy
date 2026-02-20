import nodemailer, { Transporter } from "nodemailer";
import SmtpConfig from "../models/SmtpConfig";

type TransportCache = {
  [key: string]: Transporter;
};

const cache: TransportCache = {};

export async function getCompanyTransporter(companyId: number): Promise<Transporter> {
  const key = String(companyId);
  if (cache[key]) return cache[key];

  const config = await SmtpConfig.findOne({ where: { companyId, isDefault: true } });

  if (config) {
    const secure = config.smtpEncryption === "ssl";
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure,
      pool: true,
      auth: config.smtpUsername || config.smtpPassword ? { user: config.smtpUsername, pass: config.smtpPassword } : undefined
    } as any);
    cache[key] = transporter;
    return transporter;
  }

  const fallback = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE || "false").toLowerCase() === "true",
    pool: true,
    auth: process.env.MAIL_USER || process.env.MAIL_PASS ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined
  } as any);
  cache[key] = fallback;
  return fallback;
}

export async function verifyCredentials(params: {
  smtpHost: string;
  smtpPort: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpEncryption?: string;
}) {
  const secure = params.smtpEncryption === "ssl";
  const transporter = nodemailer.createTransport({
    host: params.smtpHost,
    port: params.smtpPort,
    secure,
    pool: true,
    auth: params.smtpUsername || params.smtpPassword ? { user: params.smtpUsername, pass: params.smtpPassword } : undefined
  } as any);
  await transporter.verify();
}

