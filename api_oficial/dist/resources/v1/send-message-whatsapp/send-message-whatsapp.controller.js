"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageWhatsappController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const send_message_whatsapp_service_1 = require("./send-message-whatsapp.service");
const auth_decorator_1 = require("../../../@core/guard/auth.decorator");
let SendMessageWhatsappController = class SendMessageWhatsappController {
    constructor(sendMessageService) {
        this.sendMessageService = sendMessageService;
    }
    mapLegacyFields(data) {
        const mapped = {
            to: data.to?.replace(/^\+/, ''),
            type: data.type,
        };
        if (data.quotedId) {
            mapped.context = { message_id: data.quotedId };
        }
        if (data.body_text)
            mapped.text = data.body_text;
        if (data.body_image)
            mapped.image = data.body_image;
        if (data.body_video)
            mapped.video = data.body_video;
        if (data.body_audio)
            mapped.audio = data.body_audio;
        if (data.body_document)
            mapped.document = data.body_document;
        if (data.body_sticker || data.body_sticket)
            mapped.sticker = data.body_sticker || data.body_sticket;
        if (data.body_location)
            mapped.location = data.body_location;
        if (data.body_contacts) {
            mapped.contacts = Array.isArray(data.body_contacts) ? data.body_contacts : [data.body_contacts];
        }
        if (data.body_interactive)
            mapped.interactive = data.body_interactive;
        if (data.body_template)
            mapped.template = data.body_template;
        if (data.body_reaction)
            mapped.reaction = data.body_reaction;
        if (data.text)
            mapped.text = data.text;
        if (data.image)
            mapped.image = data.image;
        if (data.video)
            mapped.video = data.video;
        if (data.audio)
            mapped.audio = data.audio;
        if (data.document)
            mapped.document = data.document;
        if (data.sticker)
            mapped.sticker = data.sticker;
        if (data.location)
            mapped.location = data.location;
        if (data.contacts)
            mapped.contacts = data.contacts;
        if (data.interactive)
            mapped.interactive = data.interactive;
        if (data.template)
            mapped.template = data.template;
        if (data.reaction)
            mapped.reaction = data.reaction;
        if (data.context)
            mapped.context = data.context;
        return mapped;
    }
    async sendMessage(token, body, file) {
        let sendMessageDto;
        console.log('[SendMessage] Recebido - token:', token.substring(0, 10) + '...');
        console.log('[SendMessage] Body keys:', Object.keys(body || {}));
        console.log('[SendMessage] File:', file ? file.originalname : 'nenhum');
        if (body?.data) {
            try {
                const parsedData = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
                console.log('[SendMessage] Parsed data:', JSON.stringify(parsedData));
                sendMessageDto = this.mapLegacyFields(parsedData);
            }
            catch (error) {
                console.error('[SendMessage] Erro ao parsear campo data:', error.message);
                throw new common_1.BadRequestException('Campo data inválido');
            }
        }
        else {
            sendMessageDto = this.mapLegacyFields(body);
        }
        console.log('[SendMessage] DTO mapeado:', JSON.stringify(sendMessageDto));
        if (file) {
            console.log('[SendMessage] Processando arquivo:', file.originalname, file.mimetype);
            try {
                const uploadResult = await this.sendMessageService.uploadMedia(token, file);
                if (uploadResult?.mediaId) {
                    const mediaPayload = { id: uploadResult.mediaId };
                    if (sendMessageDto.type === 'document') {
                        mediaPayload.filename = file.originalname;
                    }
                    switch (sendMessageDto.type) {
                        case 'image':
                            mediaPayload.caption = sendMessageDto.image?.caption;
                            sendMessageDto.image = mediaPayload;
                            break;
                        case 'video':
                            mediaPayload.caption = sendMessageDto.video?.caption;
                            sendMessageDto.video = mediaPayload;
                            break;
                        case 'audio':
                            sendMessageDto.audio = mediaPayload;
                            break;
                        case 'document':
                            mediaPayload.caption = sendMessageDto.document?.caption;
                            sendMessageDto.document = mediaPayload;
                            break;
                        case 'sticker':
                            sendMessageDto.sticker = mediaPayload;
                            break;
                    }
                    console.log('[SendMessage] Media uploaded, ID:', uploadResult.mediaId);
                }
            }
            catch (uploadError) {
                console.error('[SendMessage] Erro no upload:', uploadError.message);
                throw new common_1.BadRequestException(`Erro no upload: ${uploadError.message}`);
            }
        }
        console.log('[SendMessage] DTO final:', JSON.stringify(sendMessageDto));
        return this.sendMessageService.sendMessage(token, sendMessageDto);
    }
    async uploadMedia(token, file) {
        return this.sendMessageService.uploadMedia(token, file);
    }
    async getMessageStatus(token, messageId) {
        return this.sendMessageService.getMessageStatus(token, messageId);
    }
    async markAsRead(token, messageId) {
        return this.sendMessageService.markAsRead(token, messageId);
    }
};
exports.SendMessageWhatsappController = SendMessageWhatsappController;
__decorate([
    (0, auth_decorator_1.Public)(),
    (0, common_1.Post)(':token'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar mensagem via WhatsApp Oficial' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data', 'application/json'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mensagem enviada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Erro ao enviar mensagem' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conexão não encontrada' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SendMessageWhatsappController.prototype, "sendMessage", null);
__decorate([
    (0, auth_decorator_1.Public)(),
    (0, common_1.Post)(':token/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload de mídia para envio posterior' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Upload realizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Erro no upload' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SendMessageWhatsappController.prototype, "uploadMedia", null);
__decorate([
    (0, auth_decorator_1.Public)(),
    (0, common_1.Get)(':token/status/:messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar status de uma mensagem' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status da mensagem' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SendMessageWhatsappController.prototype, "getMessageStatus", null);
__decorate([
    (0, auth_decorator_1.Public)(),
    (0, common_1.Post)('read-message/:token/:messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar mensagem como lida' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mensagem marcada como lida' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SendMessageWhatsappController.prototype, "markAsRead", null);
exports.SendMessageWhatsappController = SendMessageWhatsappController = __decorate([
    (0, common_1.Controller)('v1/send-message-whatsapp'),
    (0, swagger_1.ApiTags)('Send Message WhatsApp'),
    __metadata("design:paramtypes", [send_message_whatsapp_service_1.SendMessageWhatsappService])
], SendMessageWhatsappController);
//# sourceMappingURL=send-message-whatsapp.controller.js.map