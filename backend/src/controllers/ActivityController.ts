import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import ListService from "../services/ActivityServices/ListService";
import CreateService from "../services/ActivityServices/CreateService";
import UpdateService from "../services/ActivityServices/UpdateService";
import ShowService from "../services/ActivityServices/ShowService";
import DeleteService from "../services/ActivityServices/DeleteService";

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  dateStart?: string;
  dateEnd?: string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam, pageNumber, status, dateStart, dateEnd } =
    req.query as IndexQuery;

  const { activities, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    status,
    dateStart,
    dateEnd,
    companyId
  });

  return res.json({ activities, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const userId = +req.user.id;
  const { title, description, type, status, date, owner } = req.body;

  const record = await CreateService({
    title,
    description,
    type,
    status,
    date,
    owner,
    companyId,
    userId
  });

  const io = getIO();

  io.of(String(companyId)).emit(`company-${companyId}-activity`, {
    action: "create",
    activity: record
  });

  return res.status(201).json(record);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;
  const { title, description, type, status, date, owner } = req.body;

  const record = await UpdateService({
    id,
    title,
    description,
    type,
    status,
    date,
    owner
  });

  const io = getIO();

  io.of(String(companyId)).emit(`company-${companyId}-activity`, {
    action: "update",
    activity: record
  });

  return res.json(record);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowService(id);

  return res.json(record);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;

  await DeleteService(id);

  const io = getIO();

  io.of(String(companyId)).emit(`company-${companyId}-activity`, {
    action: "delete",
    id
  });

  return res.status(200).json({ message: "Activity deleted" });
};
