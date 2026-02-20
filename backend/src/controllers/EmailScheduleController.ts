import { Request, Response } from "express";
import { Op } from "sequelize";
import EmailSchedule from "../models/EmailSchedule";
import EmailCampaign from "../models/EmailCampaign";
import EmailContact from "../models/EmailContact";
import EmailTemplate from "../models/EmailTemplate";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { pageNumber, status, searchParam } = req.query as any;
  const page = parseInt(pageNumber || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const where: any = { companyId };
  if (status) where.status = status;

  const include = [
    { model: EmailCampaign, as: "campaign", include: [{ model: EmailTemplate, as: "template" }] },
    { model: EmailContact, as: "contact" }
  ];

  if (searchParam) {
    // Busca por email do contato ou nome da campanha/template
    (include as any)[1].where = {
      ...(include as any)[1].where,
      email: { [Op.iLike]: `%${searchParam}%` }
    };
  }

  const { rows, count } = await EmailSchedule.findAndCountAll({
    where,
    include: include as any,
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  const items = rows.map((s: any) => ({
    id: s.id,
    status: s.status,
    scheduledAt: s.scheduledAt,
    sentAt: s.sentAt,
    errorMessage: s.errorMessage,
    contactEmail: s.contact?.email || "",
    contactName: s.contact?.name || "",
    campaignId: s.campaignId,
    campaignName: s.campaign?.name || "",
    subject: s.campaign?.subject || s.campaign?.template?.subject || "",
  }));

  const hasMore = count > offset + rows.length;
  return res.json({ items, count, hasMore });
};

export default { index };
