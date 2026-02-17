import LeadSale from "../../models/LeadSale";

interface Request {
  name: string;
  description?: string;
  status?: string;
  value?: number;
  contactId?: number;
  responsibleId?: number;
  date?: string | Date;
  companyId: number;
}

const CreateService = async ({
  name,
  description,
  status = "novo",
  value = 0,
  contactId,
  responsibleId,
  date,
  companyId
}: Request): Promise<LeadSale> => {
  const record = await LeadSale.create({
    name,
    description,
    status,
    value,
    contactId,
    responsibleId,
    date: date ? new Date(date) : null,
    companyId
  } as any);
  return record;
};

export default CreateService;

