import axios from "axios";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import { isNil } from "lodash";
import { sendMessageWhatsAppOficial } from "../../libs/whatsAppOficial/whatsAppOficial.service";
import { IMetaMessageTemplate, IMetaMessageinteractive, IReturnMessageMeta, ISendMessageOficial } from "../../libs/whatsAppOficial/IWhatsAppOficial.interfaces";
import CreateMessageService from "../MessageServices/CreateMessageService";
import formatBody from "../../helpers/Mustache";

interface Request {
  body: string;
  ticket: Ticket;
  type: 'text' | 'reaction' | 'audio' | 'document' | 'image' | 'sticker' | 'video' | 'location' | 'contacts' | 'interactive' | 'template',
  quotedMsg?: Message;
  msdelay?: number;
  media?: Express.Multer.File,
  vCard?: Contact;
  template?: IMetaMessageTemplate,
  interative?: IMetaMessageinteractive,
  bodyToSave?: string
}

const getTypeMessage = (type: string): 'text' | 'reaction' | 'audio' | 'document' | 'image' | 'sticker' | 'video' | 'location' | 'contacts' | 'interactive' | 'template' => {
  console.log("type", type);
  switch (type) {
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'image':
      return 'image'
    case 'application':
      return 'document'
    case 'document':
      return 'document'
    case 'text':
      return 'text'
    case 'interactive':
      return 'interactive'
    case 'contacts':
      return 'contacts'
    case 'location':
      return 'location'
    case 'template':
      return 'template'
    case 'reaction':
      return 'reaction'
    default:
      return null
  }
}

const SendWhatsAppOficialMessage = async ({
  body,
  ticket,
  media,
  type,
  vCard,
  template,
  interative,
  quotedMsg,
  bodyToSave
}: Request): Promise<IReturnMessageMeta> => {

  console.error(`Chegou SendWhatsAppOficialMessage - ticketId: ${ticket.id} - contactId: ${ticket.contactId}`);

  const pathMedia = !!media ? media.path : null;
  let options: ISendMessageOficial = {} as ISendMessageOficial;
  const typeMessage = !!media ? media.mimetype.split("/")[0] : null;
  let bodyTicket = "";
  let mediaType: string;

  const bodyMsg = body ? formatBody(body, ticket) : null;

  type = !type ? getTypeMessage(typeMessage) : type;

  switch (type) {
    case 'video':
      options.body_video = { caption: bodyMsg };
      options.type = 'video';
      options.fileName = media.originalname.replace('/', '-');
      bodyTicket = "🎥 Arquivo de vídeo";
      mediaType = 'video';
      break;
    case 'audio':
      options.type = 'audio';
      options.fileName = media.originalname.replace('/', '-');
      bodyTicket = "🎵 Arquivo de áudio";
      mediaType = 'audio';
      break;
    case 'document':
      options.type = 'document';
      options.body_document = { caption: bodyMsg };
      options.fileName = media.originalname.replace('/', '-');
      bodyTicket = "📂 Arquivo de Documento";
      mediaType = 'document';
      break;
    case 'image':
      options.body_image = { caption: bodyMsg };
      options.fileName = media.originalname.replace('/', '-');
      bodyTicket = "📷 Arquivo de Imagem";
      mediaType = 'image';
      break;
    case 'text':
      options.body_text = { body: bodyMsg };
      mediaType = 'conversation';
      break;
    case 'interactive':
      mediaType = interative.type == 'button' ? 'interative' : 'listMessage';
      options.body_interactive = interative;
      break;
    case 'contacts':
      mediaType = 'contactMessage';
      const first_name = vCard?.name?.split(' ')[0];
      const last_name = String(vCard?.name).replace(vCard?.name?.split(' ')[0], '');
      options.body_contacts = {
        name: { first_name: first_name, last_name: last_name, formatted_name: `${first_name} ${last_name}`.trim() },
        phones: [{ phone: `+${vCard?.number}`, wa_id: +vCard?.number, type: 'CELL' }],
        emails: [{ email: vCard?.email }]
      }
      break;
    case 'location':
      throw new Error(`Tipo ${type} não configurado para enviar mensagem a Meta`);
    case 'template':
      // Para templates, o body já vem formatado do storeTemplate com texto + botões
      // Formato: "texto do template||||[botões em JSON]"
      bodyTicket = bodyMsg || `📋 Template: ${template?.name || 'Mensagem'}`;
      options.body_template = template;
      mediaType = 'template';
      break;
    case 'reaction':
      throw new Error(`Tipo ${type} não configurado para enviar mensagem a Meta`)
    default:
      throw new Error(`Tipo ${type} não configurado para enviar mensagem a Meta`);
  }

  const contact = await Contact.findByPk(ticket.contactId)

  let vcard;

  if (!isNil(vCard)) {
    console.log(vCard)
    const numberContact = vCard.number;
    const firstName = vCard.name.split(' ')[0];
    const lastName = String(vCard.name).replace(vCard.name.split(' ')[0], '')
    vcard = `BEGIN:VCARD\n`
      + `VERSION:3.0\n`
      + `N:${lastName};${firstName};;;\n`
      + `FN:${vCard.name}\n`
      + `TEL;type=CELL;waid=${numberContact}:+${numberContact}\n`
      + `END:VCARD`;
    console.log(vcard)
  }

  options.to = `+${contact.number}`;
  options.type = type;
  options.quotedId = quotedMsg?.wid;

  try {
    const wapp = await Whatsapp.findByPk(ticket.whatsappId);
    if (!wapp) {
      throw new AppError("ERR_NO_WAPP_FOUND");
    }

    let sendMessage;

    // Se tiver URL da API externa, usa o fluxo legado
    if (process.env.URL_API_OFICIAL) {
      sendMessage = await sendMessageWhatsAppOficial(
        pathMedia,
        wapp.token,
        options
      );
    } else {
      // Fluxo DIRETO (Cloud API da Meta)
      const { phone_number_id, token } = wapp;
      
      if (!phone_number_id || !token) {
        throw new Error("Phone Number ID or Token missing for Cloud API");
      }

      // ✅ CORREÇÃO BRASIL: Verifica se o número é brasileiro (55), tem 12 dígitos (sem o 9) e é móvel
      let finalNumber = contact.number;
      if (finalNumber.startsWith("55") && finalNumber.length === 12) {
        const ddd = finalNumber.substring(2, 4);
        const numberPart = finalNumber.substring(4);
        // Se o número começar com 7, 8 ou 9, assume-se que é móvel e adiciona o 9
        if (["7", "8", "9"].includes(numberPart[0])) {
           finalNumber = `55${ddd}9${numberPart}`;
           console.log(`[SendWhatsAppOficialMessage] ⚠️ Corrigindo número BR sem 9º dígito: ${contact.number} -> ${finalNumber}`);
        }
      }

      const url = `https://graph.facebook.com/v21.0/${phone_number_id}/messages`;
      
      let payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalNumber,
      };

      if (type === "text") {
        payload.type = "text";
        payload.text = { body: bodyMsg };
      } else if (type === "template") {
        payload.type = "template";
        payload.template = template;
      }
      // TODO: Adicionar suporte a mídia direto se necessário

      console.log(`[SendWhatsAppOficialMessage] Enviando para URL: ${url}`);
      console.log(`[SendWhatsAppOficialMessage] Payload:`, JSON.stringify(payload, null, 2));

      try {
        const response = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log(`[SendWhatsAppOficialMessage] Resposta Meta:`, response.data);
        sendMessage = { idMessageWhatsApp: [response.data.messages[0].id] };
      } catch (err: any) {
        console.error(`[SendWhatsAppOficialMessage] Erro Axios:`, err.response?.data || err.message);
        throw new Error(JSON.stringify(err.response?.data?.error || err.message));
      }
    }

    await ticket.update({ lastMessage: !bodyMsg && (!!media || type === 'template') ? bodyTicket : bodyMsg, imported: null, unreadMessages: 0 });

    const wid: any = sendMessage

    const bodyMessage = !isNil(vCard) ? vcard : !bodyMsg ? '' : bodyMsg;
    const messageData = {
      wid: wid?.idMessageWhatsApp[0],
      ticketId: ticket.id,
      contactId: contact.id,
      body: type === 'interactive' ? bodyToSave : (type === 'template' ? bodyTicket : bodyMessage),
      fromMe: true,
      mediaType: mediaType,
      mediaUrl: !!media ? media.filename : null,
      read: true,
      quotedMsgId: quotedMsg?.id || null,
      ack: 2,
      channel: 'whatsapp_oficial',
      remoteJid: `${contact.number}@s.whatsapp.net`,
      participant: null,
      dataJson: JSON.stringify(body),
      ticketTrakingId: null,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      ticketImported: ticket.imported,
      isForwarded: false,
      originalName: !!media ? media.filename : null
    };

    await CreateMessageService({ messageData, companyId: ticket.companyId });

    return sendMessage;
  } catch (err: any) {
    console.log(`[SendWhatsAppOficialMessage] Erro Catch Principal:`, err);

    // Tenta extrair o erro da resposta da Meta
    if (err.response && err.response.data && err.response.data.error) {
        const metaError = err.response.data.error;
        const errorMessage = metaError.message || JSON.stringify(metaError);
        const errorDetails = metaError.error_data ? JSON.stringify(metaError.error_data) : '';
        
        console.error(`[SendWhatsAppOficialMessage] Erro Meta Detalhado: ${errorMessage} ${errorDetails}`);
        
        // Retorna o erro exato da Meta para o frontend
        throw new AppError(`Erro Meta: ${errorMessage} ${errorDetails}`, 400);
    }

    // Se for erro de rede ou outro sem response
    if (err.message) {
        throw new AppError(`Erro Envio: ${err.message}`, 400);
    }
    
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }

}

export default SendWhatsAppOficialMessage;
