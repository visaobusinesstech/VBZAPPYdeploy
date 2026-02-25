import { Op, fn, col, literal, Sequelize } from "sequelize";
import LeadSale from "../../models/LeadSale";
import Contact from "../../models/Contact";
import User from "../../models/User";

type Request = {
  status?: string;
  responsibleId?: string | number;
  contactId?: string | number;
  dateStart?: string;
  dateEnd?: string;
  companyId: number;
};

type DayAgg = { date: string; revenue: number; leads: number; value: number };
type Ranking = { id: number | null; name: string; leads: number; value: number };
type Origin = { origin: string; won: number };

export type LeadsDashboardResponse = {
  summary: {
    totalLeads: number;
    leadsWon: number;
    leadsLost: number;
    totalSales: number;
    efficiency: number;
  };
  revenuePerDay: DayAgg[];
  clientsValueByDay: DayAgg[];
  rankingResponsibles: Ranking[];
  conversionByOrigin: Origin[];
};

const isWon = (status?: string) =>
  /^(fechado|won|converted|ganho|ganhos)$/i.test(String(status || ""));
const isLost = (status?: string) =>
  /^(perdido|lost|cancelado|rejeitado)$/i.test(String(status || ""));

export default async function DashboardService({
  status,
  responsibleId,
  contactId,
  dateStart,
  dateEnd,
  companyId
}: Request): Promise<LeadsDashboardResponse> {
  const where: any = { companyId };
  if (status) where.status = status;
  if (responsibleId) where.responsibleId = responsibleId;
  if (contactId) where.contactId = contactId;
  if (dateStart && dateEnd) {
    where.createdAt = { [Op.between]: [new Date(dateStart), new Date(dateEnd)] };
  }

  // Summary
  const all = await LeadSale.findAll({
    attributes: ["status", "value"],
    where,
    raw: true
  });
  const totalLeads = all.length;
  const leadsWon = all.filter((r) => isWon(String(r.status))).length;
  const leadsLost = all.filter((r) => isLost(String(r.status))).length;
  const totalSales = all
    .filter((r) => isWon(String(r.status)))
    .reduce((sum, r: any) => sum + (Number(r.value) || 0), 0);
  const efficiency = totalLeads > 0 ? (leadsWon / totalLeads) * 100 : 0;

  // Helpers for date truncation (Postgres)
  const dt = (field: string) => fn("date_trunc", "day", col(field));
  const castDate = (field: string) =>
    Sequelize.cast(fn("to_char", dt(field), literal(`'YYYY-MM-DD'`)), "text");

  // Revenue per day (won only)
  const revenuePerDayRaw = await LeadSale.findAll({
    attributes: [
      [castDate("createdAt"), "date"],
      [fn("sum", col("value")), "revenue"]
    ],
    where: {
      ...where,
      status: { [Op.iLike]: "%fechado%" }
    },
    group: [castDate("createdAt") as any],
    order: [[literal("date"), "ASC"]],
    raw: true
  });

  // Clients x Value per day (all leads)
  const clientsValueRaw = await LeadSale.findAll({
    attributes: [
      [castDate("createdAt"), "date"],
      [fn("count", col("id")), "leads"],
      [fn("sum", col("value")), "value"]
    ],
    where,
    group: [castDate("createdAt") as any],
    order: [[literal("date"), "ASC"]],
    raw: true
  });

  // Ranking de Responsáveis
  const rankingRaw = await LeadSale.findAll({
    attributes: [
      "responsibleId",
      [fn("count", col("LeadSale.id")), "leads"],
      [fn("sum", col("value")), "value"]
    ],
    where,
    include: [{ model: User, attributes: ["id", "name"], required: false }],
    group: ["responsibleId", "User.id"],
    order: [[literal("value"), "DESC"]],
    raw: true
  });

  // Conversão por Origem (canal do contato) - conta ganhos por canal
  const originRaw = await LeadSale.findAll({
    attributes: [
      [literal('"contact"."channel"'), "origin"],
      [fn("count", col("LeadSale.id")), "won"]
    ],
    where: {
      ...where,
      status: { [Op.iLike]: "%fechado%" }
    },
    include: [{ model: Contact, attributes: [], required: false }],
    group: [literal('"contact"."channel"') as any],
    raw: true
  });

  const normalizeDateAgg = (arr: any[], shape: "revenue" | "clientsValue"): DayAgg[] =>
    arr.map((r) => ({
      date: String(r.date),
      revenue: Number((r as any).revenue || 0),
      leads: Number((r as any).leads || 0),
      value: Number((r as any).value || 0)
    }));

  const rankingResponsibles: Ranking[] = rankingRaw.map((r: any) => ({
    id: r.responsibleId ? Number(r.responsibleId) : null,
    name: r["User.name"] || "Não definido",
    leads: Number(r.leads || 0),
    value: Number(r.value || 0)
  }));

  const conversionByOrigin: Origin[] = originRaw.map((r: any) => ({
    origin: r.origin || "indefinido",
    won: Number(r.won || 0)
  }));

  return {
    summary: {
      totalLeads,
      leadsWon,
      leadsLost,
      totalSales,
      efficiency: Number(efficiency.toFixed(2))
    },
    revenuePerDay: normalizeDateAgg(revenuePerDayRaw, "revenue"),
    clientsValueByDay: normalizeDateAgg(clientsValueRaw, "clientsValue"),
    rankingResponsibles,
    conversionByOrigin
  };
}

