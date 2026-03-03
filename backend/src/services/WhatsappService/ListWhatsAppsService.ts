import { FindOptions } from "sequelize/types";
import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";
import Prompt from "../../models/Prompt";

interface Request {
  companyId: number;
  session?: number | string;
  isSuper?: boolean;
}

const ListWhatsAppsService = async ({
  session,
  companyId,
  isSuper
}: Request): Promise<Whatsapp[]> => {
  const whereCondition: any = {};

  if (!isSuper) {
    whereCondition.companyId = companyId;
  }

  const baseOptions: FindOptions = {
    where: whereCondition
  };

  // Tenta com includes opcionais; se der erro por tabela/coluna ausente, refaz sem includes
  try {
    const options: FindOptions = {
      ...baseOptions,
      include: [
        {
          model: Queue,
          as: "queues",
          attributes: ["id", "name", "color", "greetingMessage"]
        },
        {
          model: Prompt,
          as: "prompt"
        }
      ]
    };
    if (session !== undefined && session == 0) {
      options.attributes = { exclude: ["session"] };
    }
    return await Whatsapp.findAll(options);
  } catch (_err) {
    const fallbackOptions: FindOptions = { ...baseOptions };
    if (session !== undefined && session == 0) {
      fallbackOptions.attributes = { exclude: ["session"] };
    }
    return await Whatsapp.findAll(fallbackOptions);
  }
};

export default ListWhatsAppsService;


