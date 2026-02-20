import { Request, Response } from "express";
import EmailTemplate from "../models/EmailTemplate";
import AppError from "../errors/AppError";
import EmailTemplateAttachment from "../models/EmailTemplateAttachment";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { pageNumber, searchParam } = req.query as any;
  const page = parseInt(pageNumber || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const where: any = { companyId };
  if (searchParam) where.name = { $like: `%${searchParam}%` } as any;

  const { rows, count } = await EmailTemplate.findAndCountAll({
    where,
    limit,
    offset,
    order: [["updatedAt", "DESC"]]
  });

  const hasMore = count > offset + rows.length;
  return res.json({ templates: rows, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { name, subject, contentHtml, contentText, isActive, description, fontSize } = req.body;
  if (!name || !subject) throw new AppError("INVALID_TEMPLATE", 400);
  const template = await EmailTemplate.create({
    companyId,
    name,
    subject,
    contentHtml,
    contentText,
    description,
    fontSize,
    createdBy: userId,
    isActive: isActive !== undefined ? isActive : true
  } as any);
  return res.status(201).json(template);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params as any;
  const template = await EmailTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("TEMPLATE_NOT_FOUND", 404);
  const { name, subject, contentHtml, contentText, isActive, description, fontSize, signatureImagePath } = req.body;
  await template.update({ name, subject, contentHtml, contentText, isActive, description, fontSize, signatureImagePath });
  return res.json(template);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params as any;
  const template = await EmailTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("TEMPLATE_NOT_FOUND", 404);
  await template.destroy();
  return res.status(204).send();
};

export const listAttachments = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params as any;
  const template = await EmailTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("TEMPLATE_NOT_FOUND", 404);
  const attachments = await EmailTemplateAttachment.findAll({ where: { companyId, templateId: id } });
  return res.json({ attachments });
};

export const uploadAttachments = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params as any;
  const files = req.files as Express.Multer.File[];
  const template = await EmailTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("TEMPLATE_NOT_FOUND", 404);
  if (!files || files.length === 0) throw new AppError("NO_FILES_UPLOADED", 400);
  const maxSize = 50 * 1024 * 1024;
  for (const f of files) {
    if (f.size > maxSize) throw new AppError("FILE_TOO_LARGE", 413);
  }
  const rows = files.map(f => ({
    companyId,
    templateId: Number(id),
    filename: f.originalname,
    path: `/public/company${companyId}/emailTemplates/${id}/${f.filename.replace('/', '-')}`,
    size: f.size,
    mimetype: f.mimetype
  }));
  const created = await EmailTemplateAttachment.bulkCreate(rows as any);
  return res.status(201).json({ attachments: created });
};

export const uploadSignatureImage = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params as any;
  const files = req.files as Express.Multer.File[];
  const file = files?.[0];
  const template = await EmailTemplate.findOne({ where: { id, companyId } });
  if (!template) throw new AppError("TEMPLATE_NOT_FOUND", 404);
  if (!file) throw new AppError("NO_FILES_UPLOADED", 400);
  if (!file.mimetype.startsWith("image/")) throw new AppError("INVALID_IMAGE", 415);
  if (file.size > 50 * 1024 * 1024) throw new AppError("FILE_TOO_LARGE", 413);
  const path = `/public/company${companyId}/emailTemplates/${id}/${file.filename.replace('/', '-')}`;
  await template.update({ signatureImagePath: path });
  return res.json({ signatureImagePath: path });
};

