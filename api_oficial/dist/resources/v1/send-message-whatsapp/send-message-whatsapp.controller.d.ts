import { SendMessageWhatsappService } from './send-message-whatsapp.service';
export declare class SendMessageWhatsappController {
    private readonly sendMessageService;
    constructor(sendMessageService: SendMessageWhatsappService);
    private mapLegacyFields;
    sendMessage(token: string, body: any, file?: Express.Multer.File): Promise<{
        success: boolean;
        messageId: string;
        internalId: number;
        idMessageWhatsApp: string[];
    }>;
    uploadMedia(token: string, file: Express.Multer.File): Promise<{
        success: boolean;
        mediaId: string;
    }>;
    getMessageStatus(token: string, messageId: string): Promise<any>;
    markAsRead(token: string, messageId: string): Promise<{
        success: boolean;
    }>;
}
