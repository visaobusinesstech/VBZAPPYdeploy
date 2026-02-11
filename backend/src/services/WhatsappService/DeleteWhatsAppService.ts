import Whatsapp from "../../models/Whatsapp";
import WhatsappQueue from "../../models/WhatsappQueue";
import AppError from "../../errors/AppError";

const DeleteWhatsAppService = async (id: string): Promise<void> => {
  const whatsapp = await Whatsapp.findOne({
    where: { id }
  });

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  await WhatsappQueue.destroy({
    where: { whatsappId: id }
  });

  await whatsapp.destroy();
};

export default DeleteWhatsAppService;
