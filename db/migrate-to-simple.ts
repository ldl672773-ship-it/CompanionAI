import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'

// 数据库迁移脚本: ChatterUI -> CompanionAI
// 将复杂的10表结构简化为5表结构

const db = openDatabaseSync('chatterui.db')
const drizzleDb = drizzle(db)

export async function migrateToSimpleSchema() {
    console.log('开始数据迁移: ChatterUI -> CompanionAI')

    // 创建新的简化表结构
    db.execSync(`
        CREATE TABLE IF NOT EXISTS companions_new (
            id INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL DEFAULT 'Companion',
            personality TEXT NOT NULL DEFAULT '',
            first_message TEXT NOT NULL DEFAULT 'Hello!',
            avatar INTEGER NOT NULL,
            created_at INTEGER,
            updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS chats_new (
            id INTEGER PRIMARY KEY NOT NULL,
            companion_id INTEGER NOT NULL REFERENCES companions_new(id) ON DELETE CASCADE,
            name TEXT NOT NULL DEFAULT 'New Chat',
            created_at INTEGER NOT NULL,
            updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS messages_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL REFERENCES chats_new(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL DEFAULT '',
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attachments_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL REFERENCES messages_new(id) ON DELETE CASCADE,
            image_uri TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS prompts_new (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            template TEXT NOT NULL,
            created_at INTEGER
        );
    `)

    // 迁移角色数据: characters -> companions
    console.log('迁移角色数据...')
    db.execSync(`
        INSERT INTO companions_new (id, name, personality, first_message, avatar, created_at, updated_at)
        SELECT
            id,
            name,
            personality,
            first_mes,
            image_id,
            last_modified,
            last_modified
        FROM characters
        WHERE type = 'character';
    `)

    // 迁移聊天会话: chats -> chats_new
    console.log('迁移聊天会话...')
    db.execSync(`
        INSERT INTO chats_new (id, companion_id, name, created_at, updated_at)
        SELECT
            id,
            character_id,
            name,
            create_date,
            last_modified
        FROM chats;
    `)

    // 迁移消息: chat_entries + chat_swipes -> messages
    console.log('迁移消息数据(简化Swipe机制)...')
    db.execSync(`
        INSERT INTO messages_new (chat_id, role, content, created_at)
        SELECT
            ce.chat_id,
            CASE WHEN ce.is_user = 1 THEN 'user' ELSE 'assistant' END,
            cs.swipe,
            cs.send_date
        FROM chat_entries ce
        JOIN chat_swipes cs ON cs.entry_id = ce.id AND cs.id = (
            SELECT MIN(id) FROM chat_swipes WHERE entry_id = ce.id
        )
        ORDER BY ce.chat_id, ce.order;
    `)

    // 迁移图片附件: chat_attachment -> attachments
    console.log('迁移图片附件...')
    db.execSync(`
        INSERT INTO attachments_new (message_id, image_uri, created_at)
        SELECT
            (SELECT id FROM messages_new WHERE chat_id = ce.chat_id ORDER BY id LIMIT 1 OFFSET ce.order),
            ca.uri,
            CURRENT_TIMESTAMP
        FROM chat_attachment ca
        JOIN chat_entries ce ON ce.id = ca.chat_entry_id
        WHERE ca.type = 'image';
    `)

    // 备份旧表并替换为新表
    console.log('替换为新表结构...')
    const oldTables = [
        'characters',
        'character_greetings',
        'tags',
        'character_tags',
        'chats',
        'chat_entries',
        'chat_swipes',
        'chat_attachment',
        'instructs',
        'lorebooks',
        'lorebook_entries',
        'character_lorebooks',
        'model_data',
        'model_mmproj_links',
    ]

    for (const table of oldTables) {
        db.execSync(`DROP TABLE IF EXISTS ${table}_backup;`)
        db.execSync(`ALTER TABLE ${table} RENAME TO ${table}_backup;`)
    }

    db.execSync(`
        ALTER TABLE companions_new RENAME TO companions;
        ALTER TABLE chats_new RENAME TO chats;
        ALTER TABLE messages_new RENAME TO messages;
        ALTER TABLE attachments_new RENAME TO attachments;
        ALTER TABLE prompts_new RENAME TO prompts;
    `)

    console.log('数据迁移完成!')
    console.log('旧表已备份为 *_backup,如需恢复请手动重命名')
}
