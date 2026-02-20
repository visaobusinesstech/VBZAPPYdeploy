import nodemailer from "nodemailer";
import { REDIS_URI_CONNECTION } from "../config/redis";

export interface MailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function SendMail(mailData: MailData) {
  const options: any = {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  };

  const transporter = nodemailer.createTransport(options);

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: process.env.MAIL_FROM, // sender address
    to: mailData.to, // list of receivers
    subject: mailData.subject, // Subject line
    text: mailData.text, // plain text body
    html: mailData.html || mailData.text // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

// Função alternativa para ambiente local sem Redis
// Esta função pode ser usada diretamente quando o sistema de filas não está disponível
export async function SendMailDirect(mailData: MailData) {
  try {
    // Usa a mesma função principal
    return await SendMail(mailData);
  } catch (error) {
    console.error("Erro no envio direto de email:", error);
    throw error;
  }
}

// Função inteligente que detecta se o Redis está disponível
// Se não estiver, usa envio direto em vez de filas
export async function SendMailSmart(mailData: MailData) {
  // Verifica se o Redis está configurado e disponível
  const isRedisAvailable = REDIS_URI_CONNECTION && REDIS_URI_CONNECTION !== "";
  
  if (isRedisAvailable) {
    // Se Redis estiver disponível, usa o sistema de filas normal
    // Importa dinamicamente para evitar dependência circular
    const { emailSendQueue } = await import("../emailQueues");
    await emailSendQueue.add({ mailData }, { removeOnComplete: true });
    return { success: true, method: "queue" };
  } else {
    // Se Redis não estiver disponível, usa envio direto
    console.log("Redis não disponível, usando envio direto de email");
    try {
      const result = await SendMailDirect(mailData);
      return { success: true, method: "direct" };
    } catch (error) {
      console.error("Falha no envio direto de email:", error);
      return { success: false, method: "direct", error };
    }
  }
}
