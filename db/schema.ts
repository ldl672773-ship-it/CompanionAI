import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// CompanionAI - 简化数据库架构

// 陪伴者(角色)表 - 完全兼容ChatterUI字段命名
export const companions = sqliteTable('companions', {
    id: integer('id', { mode: 'number' }).notNull().primaryKey(),
    name: text('name').notNull().default('Companion'),
    description: text('description').notNull().default(''),
    personality: text('personality').notNull().default(''),
    scenario: text('scenario').notNull().default(''),
    mes_example: text('mes_example').notNull().default(''),
    first_mes: text('first_mes').notNull().default('Hello!'),
    image_id: integer('image_id', { mode: 'number' })
        .notNull()
        .$defaultFn(() => Date.now()),
    background_image: integer('background_image', { mode: 'number' }),
    last_modified: integer('last_modified', { mode: 'number' })
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

// HybridMemory Pro - 记忆条目表
export const memory_entries = sqliteTable(
    'memory_entries',
    {
        id: text('id').notNull().primaryKey(),
        chat_id: integer('chat_id', { mode: 'number' })
            .notNull()
            .references(() => chats.id, { onDelete: 'cascade' }),
        content: text('content').notNull(),
        type: text('type', {
            enum: ['fact', 'event', 'dialogue', 'promise', 'entity', 'emotion', 'insight'],
        }).notNull(),
        importance: integer('importance', { mode: 'number' }).notNull().default(5),
        turn_number: integer('turn_number', { mode: 'number' }).notNull(),
        access_count: integer('access_count', { mode: 'number' }).notNull().default(0),
        emotional_impact: integer('emotional_impact', { mode: 'number' }).notNull().default(0),
        entities: text('entities').notNull().default('[]'),
        relations: text('relations').notNull().default('[]'),
        metadata: text('metadata').notNull().default('{}'),
        created_at: integer('created_at', { mode: 'timestamp' })
            .notNull()
            .$defaultFn(() => new Date()),
        last_access: integer('last_access', { mode: 'timestamp' }),
    },
    (table) => ({
        chatIdIdx: index('memory_entries_chat_id_idx').on(table.chat_id),
        typeIdx: index('memory_entries_type_idx').on(table.type),
        importanceIdx: index('memory_entries_importance_idx').on(table.importance),
        turnNumberIdx: index('memory_entries_turn_number_idx').on(table.turn_number),
    })
)

// HybridMemory Pro - 知识图谱实体表
export const kg_entities = sqliteTable(
    'kg_entities',
    {
        id: text('id').notNull().primaryKey(),
        chat_id: integer('chat_id', { mode: 'number' })
            .notNull()
            .references(() => chats.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        type: text('type', {
            enum: ['person', 'organization', 'location', 'topic', 'object', 'project'],
        }).notNull(),
        attributes: text('attributes').notNull().default('{}'),
        mention_count: integer('mention_count', { mode: 'number' }).notNull().default(1),
        first_mentioned: integer('first_mentioned', { mode: 'timestamp' })
            .notNull()
            .$defaultFn(() => new Date()),
        last_mentioned: integer('last_mentioned', { mode: 'timestamp' })
            .notNull()
            .$defaultFn(() => new Date()),
    },
    (table) => ({
        chatIdIdx: index('kg_entities_chat_id_idx').on(table.chat_id),
        nameIdx: index('kg_entities_name_idx').on(table.name),
        typeIdx: index('kg_entities_type_idx').on(table.type),
    })
)

// HybridMemory Pro - 知识图谱关系表
export const kg_relations = sqliteTable(
    'kg_relations',
    {
        id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
        chat_id: integer('chat_id', { mode: 'number' })
            .notNull()
            .references(() => chats.id, { onDelete: 'cascade' }),
        source_id: text('source_id')
            .notNull()
            .references(() => kg_entities.id, { onDelete: 'cascade' }),
        target_id: text('target_id')
            .notNull()
            .references(() => kg_entities.id, { onDelete: 'cascade' }),
        type: text('type', {
            enum: [
                'knows',
                'works_at',
                'located_in',
                'discussed',
                'participated_in',
                'has_sentiment',
                'related_to',
            ],
        }).notNull(),
        properties: text('properties').notNull().default('{}'),
        strength: integer('strength', { mode: 'number' }).notNull().default(10),
        created_at: integer('created_at', { mode: 'timestamp' })
            .notNull()
            .$defaultFn(() => new Date()),
    },
    (table) => ({
        chatIdIdx: index('kg_relations_chat_id_idx').on(table.chat_id),
        sourceIdIdx: index('kg_relations_source_id_idx').on(table.source_id),
        targetIdIdx: index('kg_relations_target_id_idx').on(table.target_id),
    })
)

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

export const memoryEntriesRelations = relations(memory_entries, ({ one }) => ({
    chat: one(chats, {
        fields: [memory_entries.chat_id],
        references: [chats.id],
    }),
}))

export const kgEntitiesRelations = relations(kg_entities, ({ one, many }) => ({
    chat: one(chats, {
        fields: [kg_entities.chat_id],
        references: [chats.id],
    }),
    outgoing_relations: many(kg_relations, { relationName: 'source' }),
    incoming_relations: many(kg_relations, { relationName: 'target' }),
}))

export const kgRelationsRelations = relations(kg_relations, ({ one }) => ({
    chat: one(chats, {
        fields: [kg_relations.chat_id],
        references: [chats.id],
    }),
    source: one(kg_entities, {
        fields: [kg_relations.source_id],
        references: [kg_entities.id],
        relationName: 'source',
    }),
    target: one(kg_entities, {
        fields: [kg_relations.target_id],
        references: [kg_entities.id],
        relationName: 'target',
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
export type MemoryEntry = typeof memory_entries.$inferSelect
export type InsertMemoryEntry = typeof memory_entries.$inferInsert
export type KgEntity = typeof kg_entities.$inferSelect
export type InsertKgEntity = typeof kg_entities.$inferInsert
export type KgRelation = typeof kg_relations.$inferSelect
export type InsertKgRelation = typeof kg_relations.$inferInsert
