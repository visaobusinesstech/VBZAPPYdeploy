import LeadSale from "../../models/LeadSale";

interface Request {
  id: number | string;
  name?: string;
  description?: string;
  status?: string;
  value?: number;
  contactId?: number;
  responsibleId?: number;
  date?: string | Date | null;
}

const UpdateService = async ({
  id,
  name,
  description,
  status,
  value,
  contactId,
  responsibleId,
  date
}: Request): Promise<LeadSale> => {
  const record = await LeadSale.findByPk(id as any);
  if (!record) {
    throw new Error("Lead sale not found");
  }

  await record.update({
    name: name ?? record.name,
    description: description ?? record.description,
    status: status ?? record.status,
    value: value ?? record.value,
    contactId: contactId ?? record.contactId,
    responsibleId: responsibleId ?? record.responsibleId,
    date: typeof date === "string" ? new Date(date) : (date ?? record.date)
  } as any);

  return record;
};

export default UpdateService;

