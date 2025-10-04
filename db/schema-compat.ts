// 临时兼容层: 将新schema的表名映射到旧的导出名
// 这允许现有代码继续编译,同时我们逐步迁移

import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

import * as newSchema from './schema'

// 新schema表
export const companions = newSchema.companions
export const chats = newSchema.chats
export const messages = newSchema.messages
export const attachments = newSchema.attachments
export const prompts = newSchema.prompts

// 向后兼容的别名(旧名称 → 新表)
export const characters = newSchema.companions

// instructs虚拟表定义(保留完整字段用于兼容性,实际不会创建)
export const instructs = sqliteTable('instructs_virtual', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    system_prompt: text('system_prompt').notNull().default(''),
    system_prefix: text('system_prefix').notNull().default(''),
    system_suffix: text('system_suffix').notNull().default(''),
    input_prefix: text('input_prefix').notNull().default(''),
    input_suffix: text('input_suffix').notNull().default(''),
    output_prefix: text('output_prefix').notNull().default(''),
    last_output_prefix: text('last_output_prefix').notNull().default(''),
    output_suffix: text('output_suffix').notNull().default(''),
    stop_sequence: text('stop_sequence').notNull().default(''),
    user_alignment_message: text('user_alignment_message').notNull().default(''),
    activation_regex: text('activation_regex').notNull().default(''),
    wrap: integer('wrap', { mode: 'boolean' }).notNull().default(false),
    macro: integer('macro', { mode: 'boolean' }).notNull().default(false),
    names: integer('names', { mode: 'boolean' }).notNull().default(false),
    names_force_groups: integer('names_force_groups', { mode: 'boolean' }).notNull().default(false),
    timestamp: integer('timestamp', { mode: 'boolean' }).notNull().default(false),
    examples: integer('examples', { mode: 'boolean' }).notNull().default(true),
    format_type: integer('format_type').notNull().default(0),
    scenario: integer('scenario', { mode: 'boolean' }).notNull().default(true),
    personality: integer('personality', { mode: 'boolean' }).notNull().default(true),
    hide_think_tags: integer('hide_think_tags', { mode: 'boolean' }).notNull().default(true),
    use_common_stop: integer('use_common_stop', { mode: 'boolean' }).notNull().default(true),
    send_images: integer('send_images', { mode: 'boolean' }).notNull().default(true),
    send_audio: integer('send_audio', { mode: 'boolean' }).notNull().default(true),
    send_documents: integer('send_documents', { mode: 'boolean' }).notNull().default(true),
    last_image_only: integer('last_image_only', { mode: 'boolean' }).notNull().default(true),
    system_prompt_format: text('system_prompt_format').notNull().default(''),
})

// 创建虚拟表定义用于兼容(这些表不会实际存在,仅用于类型检查)
export const characterGreetings = sqliteTable('character_greetings_deprecated', {
    id: integer('id').primaryKey(),
    character_id: integer('character_id'),
    greeting: text('greeting'),
    order: integer('order'),
})

export const characterTags = sqliteTable('character_tags_deprecated', {
    character_id: integer('character_id'),
    tag_id: integer('tag_id'),
})

export const tags = sqliteTable('tags_deprecated', {
    id: integer('id').primaryKey(),
    name: text('name'),
})

export const chatEntries = sqliteTable('chat_entries_deprecated', {
    id: integer('id').primaryKey(),
    chat_id: integer('chat_id'),
    name: text('name'),
    is_user: integer('is_user', { mode: 'boolean' }),
    order: integer('order'),
    swipe_id: integer('swipe_id'),
})

export const chatSwipes = sqliteTable('chat_swipes_deprecated', {
    id: integer('id').primaryKey(),
    entry_id: integer('entry_id'),
    swipe: text('swipe'),
    send_date: integer('send_date', { mode: 'number' }),
    gen_started: integer('gen_started', { mode: 'number' }),
    gen_finished: integer('gen_finished', { mode: 'number' }),
})

export const chatAttachment = sqliteTable('chat_attachment_deprecated', {
    id: integer('id').primaryKey(),
    chat_entry_id: integer('chat_entry_id'),
    type: text('type'),
    uri: text('uri'),
})

// 导出关系
export const companionsRelations = newSchema.companionsRelations
export const chatsRelations = newSchema.chatsRelations
export const messagesRelations = newSchema.messagesRelations
export const attachmentsRelations = newSchema.attachmentsRelations

// 导出类型
export type Companion = newSchema.Companion
export type InsertCompanion = newSchema.InsertCompanion
export type Chat = newSchema.Chat
export type InsertChat = newSchema.InsertChat
export type Message = newSchema.Message
export type InsertMessage = newSchema.InsertMessage
export type Attachment = newSchema.Attachment
export type InsertAttachment = newSchema.InsertAttachment
export type Prompt = newSchema.Prompt
export type InsertPrompt = newSchema.InsertPrompt

// 向后兼容的类型别名
export type Character = Companion
export type InsertCharacter = InsertCompanion
export type Instruct = Prompt
export type InsertInstruct = InsertPrompt

// Chat相关兼容类型 (已废弃,使用新的Message结构)
export type ChatType = typeof chats.$inferSelect
export type ChatEntryType = typeof chatEntries.$inferSelect
export type ChatSwipe = typeof chatSwipes.$inferSelect
export type ChatAttachmentType = typeof chatAttachment.$inferSelect
export type CompletionTimings = any // 已移除

// Chat相关类型导出 (从Chat.ts导入,避免循环依赖)
export type { MessageWithAttachments, ChatData } from '@lib/state/Chat'
