import { Chats } from './Chat'
import { addAttachmentsToMessage } from './ChatAttachmentHelpers'

/**
 * 发送带附件的消息
 */
export const sendMessageWithAttachments = async (
    role: 'user' | 'assistant',
    content: string,
    attachmentUris?: string[]
): Promise<number | undefined> => {
    const messageId = await Chats.useChat.getState().addMessage(role, content)

    if (messageId && attachmentUris && attachmentUris.length > 0) {
        await addAttachmentsToMessage(messageId, attachmentUris)

        const messages = Chats.useChat.getState().data?.messages
        if (messages) {
            const message = messages.find(m => m.id === messageId)
            if (message) {
                message.attachments = attachmentUris.map(uri => ({
                    id: 0,
                    message_id: messageId,
                    image_uri: uri,
                    created_at: new Date(),
                }))
            }
        }
    }

    return messageId
}
