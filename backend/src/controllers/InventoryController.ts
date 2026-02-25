import { Request, Response } from "express";
import { Op } from "sequelize";
import Inventory from "../models/Inventory";

type IndexQuery = {
  searchParam?: string;
  pageNumber?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const where: any = { companyId };
  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` };
  }

  const limit = 20;
  const page = +(pageNumber || 1);
  const offset = limit * (page - 1);

  const { rows, count } = await Inventory.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + rows.length;
  return res.json({ inventory: rows, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const record = await Inventory.findByPk(id);
  return res.json(record);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { name, price, quantity, status } = req.body;

  const qty = quantity ?? 0;
  let computedStatus = status;
  if (!computedStatus) {
    if (qty <= 0) computedStatus = "out_of_stock";
    else if (qty > 0 && qty <= 5) computedStatus = "low_stock";
    else computedStatus = "in_stock";
  }

  const record = await Inventory.create({
    name,
    price,
    quantity: qty,
    status: computedStatus,
    companyId
  });

  return res.status(201).json(record);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const data = req.body;
  const record = await Inventory.findByPk(id);
  if (!record) {
    return res.status(404).json({ error: "Not found" });
  }
  await record.update(data);
  return res.json(record);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  await Inventory.destroy({ where: { id } });
  return res.status(200).json({ message: "Inventory deleted" });
};

