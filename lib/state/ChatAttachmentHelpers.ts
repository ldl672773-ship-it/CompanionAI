import { db as database } from '@db'
import { attachments } from 'db/schema'
import { eq } from 'drizzle-orm'

/**
 * 添加附件到消息
 */
export const addAttachmentsToMessage = async (
    messageId: number,
    attachmentUris: string[]
): Promise<void> => {
    if (attachmentUris.length === 0) return

    await database.insert(attachments).values(
        attachmentUris.map((uri) => ({
            message_id: messageId,
            image_uri: uri,
        }))
    )
}

/**
 * 删除单个附件
 */
export const deleteAttachment = async (attachmentId: number): Promise<void> => {
    await database.delete(attachments).where(eq(attachments.id, attachmentId))
}

/**
 * 获取消息的所有附件
 */
export const getMessageAttachments = async (messageId: number) => {
    return await database.query.attachments.findMany({
        where: eq(attachments.message_id, messageId),
    })
}

/**
 * 删除消息的所有附件
 */
export const deleteMessageAttachments = async (messageId: number): Promise<void> => {
    const messageAttachments = await getMessageAttachments(messageId)
    if (messageAttachments.length > 0) {
        await database
            .delete(attachments)
            .where(eq(attachments.message_id, messageId))
    }
}
