import LeadSale from "../../models/LeadSale";

const ShowService = async (id: number | string): Promise<LeadSale> => {
  const record = await LeadSale.findByPk(id as any);
  if (!record) {
    throw new Error("Lead sale not found");
  }
  return record;
};

export default ShowService;

