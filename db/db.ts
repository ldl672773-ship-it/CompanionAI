import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync, deleteDatabaseAsync } from 'expo-sqlite'

// 使用兼容层schema,支持新旧API
import * as schema from './schema-compat'

//deleteDatabaseAsync('db.db')
export const rawdb = openDatabaseSync('db.db', { enableChangeListener: true })
export const db = drizzle(rawdb, { schema })
rawdb.execAsync('PRAGMA foreign_keys = ON;')
