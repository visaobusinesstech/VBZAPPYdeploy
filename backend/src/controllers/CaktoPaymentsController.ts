import { Request, Response } from "express";
import { Op } from "sequelize";
import Company from "../models/Company";
import User from "../models/User";
import Subscriptions from "../models/Subscriptions";
import { SendMailSmart } from "../helpers/SendMail";

function addDays(date: Date, days: number) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function resolveCycleDays(cycle?: string) {
  const c = String(cycle || "").toLowerCase();
  if (c.includes("semes") || c === "semestral") return 180;
  if (c.includes("an") || c === "anual" || c === "annual" || c === "year") return 365;
  return 30;
}

async function findCompanyByEmail(email: string) {
  if (!email) return null;
  const company = await Company.findOne({ where: { email } as any });
  if (company) return company;
  const user = await User.findOne({ where: { email } as any });
  if (!user) return null;
  const comp = await Company.findOne({ where: { id: user.companyId } as any });
  return comp;
}

function parseEventType(payload: any): string | null {
  return payload?.event || payload?.type || payload?.event_id || null;
}

function extractEmail(payload: any): string | null {
  return payload?.customer?.email || payload?.order?.customer?.email || payload?.data?.customer?.email || null;
}

function extractCycle(payload: any): string | null {
  return payload?.subscription_period || payload?.intervalType || payload?.plan?.cycle || payload?.data?.subscription_period || null;
}

function isApproved(type: string) {
  return ["purchase_approved", "subscription_renewed", "subscription_created"].includes(type);
}

function isRefused(type: string) {
  return ["purchase_refused", "subscription_renewal_refused"].includes(type);
}

function isCanceled(type: string) {
  return ["subscription_canceled", "refund", "chargeback"].includes(type);
}

export async function webhook(req: Request, res: Response) {
  try {
    const secret = process.env.CAKTO_WEBHOOK_TOKEN;
    const provided = (req.headers["x-cakto-webhook-token"] as string) || (req.query.token as string) || "";
    if (!secret || !provided || secret !== provided) {
      return res.status(403).json({ detail: "unauthorized" });
    }

    const body: any = req.body;
    const events: any[] = Array.isArray(body?.results)
      ? body.results
      : Array.isArray(body?.events)
      ? body.events
      : body?.event || body?.type
      ? [body]
      : [];

    for (const ev of events) {
      const type = parseEventType(ev);
      if (!type) continue;
      const email = extractEmail(ev);
      const company = await findCompanyByEmail(email || "");
      if (!company) continue;

      const cycle = extractCycle(ev) || company.recurrence || "";
      const days = resolveCycleDays(cycle);
      const now = new Date();
      const base = company.dueDate ? new Date(company.dueDate) : now;
      const nextDue = addDays(base > now ? base : now, days);
      const nextDueStr = nextDue.toISOString().slice(0, 10);

      if (isApproved(type)) {
        await company.update({ dueDate: nextDueStr, status: true } as any);
        let sub = await Subscriptions.findOne({ where: { companyId: company.id } as any });
        if (!sub) {
          sub = await Subscriptions.create({
            companyId: company.id,
            isActive: true,
            expiresAt: nextDue
          } as any);
        } else {
          await sub.update({ isActive: true, expiresAt: nextDue } as any);
        }
        await SendMailSmart({
          to: "visaobusinesstech@gmail.com",
          subject: "Pagamento aprovado",
          text: `Empresa #${company.id} (${company.email}) aprovada. Próximo vencimento: ${nextDueStr}.`
        });
      } else if (isRefused(type)) {
        let sub = await Subscriptions.findOne({ where: { companyId: company.id } as any });
        if (!sub) {
          sub = await Subscriptions.create({
            companyId: company.id,
            isActive: false
          } as any);
        } else {
          await sub.update({ isActive: false } as any);
        }
        await SendMailSmart({
          to: "visaobusinesstech@gmail.com",
          subject: "Pagamento recusado",
          text: `Empresa #${company.id} (${company.email}) teve pagamento recusado.`
        });
      } else if (isCanceled(type)) {
        await company.update({ status: false } as any);
        let sub = await Subscriptions.findOne({ where: { companyId: company.id } as any });
        if (sub) {
          await sub.update({ isActive: false } as any);
        }
        await SendMailSmart({
          to: "visaobusinesstech@gmail.com",
          subject: "Assinatura cancelada/estorno",
          text: `Empresa #${company.id} (${company.email}) cancelada/estornada.`
        });
      }
    }

    return res.status(200).json({ detail: "ok" });
  } catch (e) {
    return res.status(500).json({ detail: "error" });
  }
}
