import LeadSale from "../../models/LeadSale";

interface Request {
  name: string;
  description?: string;
  status?: string;
  value?: number;
  companyName?: string;
  phone?: string;
  site?: string;
  origin?: string;
  document?: string;
  birthDate?: string | Date;
  address?: any;
  tags?: string[];
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
  companyName,
  phone,
  site,
  origin,
  document,
  birthDate,
  address,
  tags,
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
    companyName,
    phone,
    site,
    origin,
    document,
    birthDate: birthDate ? new Date(birthDate as any) : null,
    address,
    tags,
    contactId,
    responsibleId,
    date: date ? new Date(date) : null,
    companyId
  } as any);
  return record;
};

export default CreateService;
