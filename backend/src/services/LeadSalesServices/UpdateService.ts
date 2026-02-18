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
    contactId: parsedContactId ?? record.contactId,
    responsibleId: parsedResponsibleId ?? record.responsibleId,
    date: parsedDate ?? record.date
  } as any);

  return record;
};

export default UpdateService;
