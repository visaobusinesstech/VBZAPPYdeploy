import { Op } from "sequelize";
import LeadSale from "../../models/LeadSale";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  status?: string;
  responsibleId?: number | string;
  contactId?: number | string;
  dateStart?: string;
  dateEnd?: string;
  companyId: number;
}

interface Response {
  leads: LeadSale[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam = "",
  pageNumber = 1,
  status,
  responsibleId,
  contactId,
  dateStart,
  dateEnd,
  companyId
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const where: any = { companyId };

  if (searchParam) {
    const like = `%${searchParam}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: like } },
      { description: { [Op.iLike]: like } }
    ];
  }
  if (status) where.status = status;
  if (responsibleId) where.responsibleId = responsibleId;
  if (contactId) where.contactId = contactId;
  if (dateStart && dateEnd) {
    where.date = {
      [Op.between]: [new Date(dateStart), new Date(dateEnd)]
    };
  }

  const { count, rows } = await LeadSale.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  return {
    leads: rows,
    count,
    hasMore: count > offset + rows.length
  };
};

export default ListService;
