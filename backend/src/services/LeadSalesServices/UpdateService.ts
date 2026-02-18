import LeadSale from "../../models/LeadSale";

interface Request {
  id: number | string;
  name?: string;
  description?: string;
  status?: string;
  value?: number;
  companyName?: string;
  phone?: string;
  tags?: string[];
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
  companyName,
  phone,
  tags,
  contactId,
  responsibleId,
  date
}: Request): Promise<LeadSale> => {
  const record = await LeadSale.findByPk(id as any);
  if (!record) {
    throw new Error("Lead sale not found");
  }

  const parsedValue =
    (typeof value === "string" ? Number(value) : value);
  const parsedResponsibleId =
    (responsibleId as any) === "" ? undefined : responsibleId;
  const parsedContactId =
    (contactId as any) === "" ? undefined : contactId;
  const parsedDate =
    typeof date === "string"
      ? (date.trim() ? new Date(date) : undefined)
      : date;

  await record.update({
    name: name ?? record.name,
    description: description ?? record.description,
    status: status ?? record.status,
    value: parsedValue ?? record.value,
    companyName: companyName ?? record.companyName,
    phone: phone ?? record.phone,
    tags: tags ?? record.tags,
    contactId: parsedContactId ?? record.contactId,
    responsibleId: parsedResponsibleId ?? record.responsibleId,
    date: parsedDate ?? record.date
  } as any);

  return record;
};

export default UpdateService;
