/** 
 * @TercioSantos-0 |
 * serviço/todas as configurações de 1 empresa |
 * @param:companyId
 */
import sequelize from "../../database";

type Params = {
  companyId: any;
  column:string
};

const FindCompanySettingOneService = async ({companyId, column}:Params): Promise<any> => {
  try {
    const safeCompanyId = Number(companyId);
    if (!Number.isFinite(safeCompanyId)) return [];
    const [results] = await sequelize.query(
      `SELECT "${column}" FROM "CompaniesSettings" WHERE "companyId"=${safeCompanyId}`
    );
    return results;
  } catch (err) {
    // Coluna pode não existir em bancos desatualizados; retornar vazio para fallback padrão
    return [];
  }
};

export default FindCompanySettingOneService;
