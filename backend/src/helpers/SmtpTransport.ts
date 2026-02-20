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

  if (!config) {
    throw new Error(`SMTP_NOT_CONFIGURED: Empresa ${companyId} não possui configuração SMTP. Configure em Configurações > Email.`);
  }

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

