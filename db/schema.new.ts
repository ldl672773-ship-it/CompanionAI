import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// CompanionAI - 简化数据库架构

// 陪伴者(角色)表
export const companions = sqliteTable('companions', {
    id: integer('id', { mode: 'number' }).notNull().primaryKey(),
    name: text('name').notNull().default('Companion'),
    personality: text('personality').notNull().default(''),
    first_message: text('first_message').notNull().default('Hello!'),
    avatar: integer('avatar', { mode: 'number' })
        .notNull()
        .$defaultFn(() => Date.now()),
    created_at: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
    updated_at: integer('updated_at', { mode: 'number' })
        .$defaultFn(() => Date.now())
        .$onUpdateFn(() => Date.now()),
})

// 聊天会话表
export const chats = sqliteTable('chats', {
    id: integer('id', { mode: 'number' }).primaryKey().notNull(),
    companion_id: integer('companion_id', { mode: 'number' })
        .notNull()
        .references(() => companions.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('New Chat'),
    created_at: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    updated_at: integer('updated_at', { mode: 'number' })
        .$defaultFn(() => Date.now())
        .$onUpdateFn(() => Date.now()),
})

// 消息表(简化,移除Swipe机制)
export const messages = sqliteTable('messages', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    chat_id: integer('chat_id', { mode: 'number' })
        .notNull()
        .references(() => chats.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull().default(''),
    created_at: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
})

// 附件表(仅支持图片)
export const attachments = sqliteTable('attachments', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    message_id: integer('message_id', { mode: 'number' })
        .notNull()
        .references(() => messages.id, { onDelete: 'cascade' }),
    image_uri: text('image_uri').notNull(),
    created_at: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
})

// 提示词模板表(保留核心格式化功能)
export const prompts = sqliteTable('prompts', {
    id: integer('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
    template: text('template').notNull(),
    created_at: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
})

// 关系定义
export const companionsRelations = relations(companions, ({ many }) => ({
    chats: many(chats),
}))

export const chatsRelations = relations(chats, ({ many, one }) => ({
    messages: many(messages),
    companion: one(companions, {
        fields: [chats.companion_id],
        references: [companions.id],
    }),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
    chat: one(chats, {
        fields: [messages.chat_id],
        references: [chats.id],
    }),
    attachments: many(attachments),
}))

export const attachmentsRelations = relations(attachments, ({ one }) => ({
    message: one(messages, {
        fields: [attachments.message_id],
        references: [messages.id],
    }),
}))

// 类型导出
export type Companion = typeof companions.$inferSelect
export type InsertCompanion = typeof companions.$inferInsert
export type Chat = typeof chats.$inferSelect
export type InsertChat = typeof chats.$inferInsert
export type Message = typeof messages.$inferSelect
export type InsertMessage = typeof messages.$inferInsert
export type Attachment = typeof attachments.$inferSelect
export type InsertAttachment = typeof attachments.$inferInsert
export type Prompt = typeof prompts.$inferSelect
export type InsertPrompt = typeof prompts.$inferInsert
