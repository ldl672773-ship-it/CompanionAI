/**
 * HybridMemory Pro - TypeScript移植版
 *
 * 极致体验版AI记忆管理系统
 * 核心特性:
 * 1. 智能信息提取(规则引擎)
 * 2. 知识图谱构建(内存存储)
 * 3. 重要性自动评分
 * 4. 遗忘曲线模拟
 * 5. 混合检索策略
 * 6. 主动记忆管理
 */

import { db } from '@db'
import { memory_entries, kg_entities, kg_relations } from 'db/schema'
import type {
    MemoryEntry,
    InsertMemoryEntry,
    KgEntity,
    InsertKgEntity,
    KgRelation,
    InsertKgRelation,
} from 'db/schema'
import { and, desc, eq, gte, sql } from 'drizzle-orm'
import * as Crypto from 'expo-crypto'

export enum MemoryType {
    FACT = 'fact',
    EVENT = 'event',
    DIALOGUE = 'dialogue',
    PROMISE = 'promise',
    ENTITY = 'entity',
    EMOTION = 'emotion',
    INSIGHT = 'insight',
}

export enum EntityType {
    PERSON = 'person',
    ORGANIZATION = 'organization',
    LOCATION = 'location',
    TOPIC = 'topic',
    OBJECT = 'object',
    PROJECT = 'project',
}

export enum RelationType {
    KNOWS = 'knows',
    WORKS_AT = 'works_at',
    LOCATED_IN = 'located_in',
    DISCUSSED = 'discussed',
    PARTICIPATED_IN = 'participated_in',
    HAS_SENTIMENT = 'has_sentiment',
    RELATED_TO = 'related_to',
}

export enum EmotionType {
    JOY = 'joy',
    SADNESS = 'sadness',
    ANGER = 'anger',
    FEAR = 'fear',
    SURPRISE = 'surprise',
    DISGUST = 'disgust',
    TRUST = 'trust',
    ANTICIPATION = 'anticipation',
    WORRY = 'worry',
    EXCITEMENT = 'excitement',
}

export interface EntityData {
    name: string
    type: string
    attributes?: Record<string, any>
}

export interface RelationData {
    source: string
    target: string
    type: string
    object?: string
}

export interface EmotionData {
    target: string
    emotion: string
    intensity: number
    context: string
}

export interface ExtractedInfo {
    entities: EntityData[]
    relations: RelationData[]
    emotions: EmotionData[]
    summary: string
}

export interface MemoryInsight {
    type: 'repeated_topic' | 'emotion_pattern' | 'social_analysis'
    topic?: string
    count?: number
    emotion?: string
    frequency?: number
    avg_intensity?: number
    description: string
}

export interface HybridMemoryConfig {
    chatId: number
    enableForgettingCurve?: boolean
    enableKnowledgeGraph?: boolean
    enableEmotionAnalysis?: boolean
    enableActiveManagement?: boolean
    decayRate?: number
}

export class InformationExtractor {
    /**
     * 提取结构化信息(规则引擎版)
     */
    static extractStructuredInfo(text: string): ExtractedInfo {
        return {
            entities: this.extractEntities(text),
            relations: this.extractRelations(text),
            emotions: this.extractEmotions(text),
            summary: this.generateSummary(text),
        }
    }

    /**
     * 提取实体
     */
    private static extractEntities(text: string): EntityData[] {
        const entities: EntityData[] = []

        // 中文姓名检测
        const personPatterns = [
            /([张王李赵刘陈杨黄周吴徐孙朱马胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾萧蔡潘田董袁于余叶蒋杜苏魏程吕丁沈任姚卢傅钟姜崔谭廖范汪陆金石戴贾韦夏邱方侯邹熊孟秦白江阎薛尹段雷黎史龙陶贺顾毛郝龚邵万钱严赖覃洪武莫孔汤向常温康施文牛樊葛邢安齐易乔伍庞颜倪庄聂章鲁岳翟殷詹申欧耿关兰焦俞左柳甘祝包宁尚符舒阮柯纪梅童凌毕单季裴霍涂成苗谷盛曲翁冉骆蓝路游辛靳管柴蒙鲍华喻祁蒲房滕屈饶解牟艾尤阳时穆农司卓古吉缪简车项连芦麦褚娄窦戚岑景党宫费卜冷晏席卫米柏宗瞿桂全佟应臧闵苟邬边卡扈燕冀郎邸玄郁][一-龥]{1,2})/g,
        ]

        personPatterns.forEach((pattern) => {
            const matches = text.matchAll(pattern)
            for (const match of matches) {
                entities.push({
                    name: match[1],
                    type: 'PERSON',
                })
            }
        })

        // 地点检测
        const locationKeywords = ['星巴克', '咖啡厅', '办公室', '会议室', '公园', '餐厅', '家', '学校']
        locationKeywords.forEach((keyword) => {
            if (text.includes(keyword)) {
                entities.push({
                    name: keyword,
                    type: 'LOCATION',
                })
            }
        })

        // 项目/主题检测
        const topicPatterns = [/([A-Za-z]+项目)/g, /(项目[A-Za-z0-9]+)/g, /([A-Z][a-z]+计划)/g]
        topicPatterns.forEach((pattern) => {
            const matches = text.matchAll(pattern)
            for (const match of matches) {
                entities.push({
                    name: match[1],
                    type: 'TOPIC',
                })
            }
        })

        return entities
    }

    /**
     * 提取关系
     */
    private static extractRelations(text: string): RelationData[] {
        const relations: RelationData[] = []

        // 讨论关系
        const discussPattern = /和(.+?)讨论(了)?(.+)/g
        const matches = text.matchAll(discussPattern)
        for (const match of matches) {
            relations.push({
                source: '我',
                target: match[1].trim(),
                type: 'DISCUSSED',
                object: match[3]?.trim(),
            })
        }

        return relations
    }

    /**
     * 高级情感分析
     */
    private static extractEmotions(text: string): EmotionData[] {
        const emotions: EmotionData[] = []

        const emotionDict: Record<string, [string, number]> = {
            高兴: ['JOY', 0.8],
            开心: ['JOY', 0.7],
            快乐: ['JOY', 0.8],
            悲伤: ['SADNESS', 0.8],
            难过: ['SADNESS', 0.7],
            伤心: ['SADNESS', 0.8],
            愤怒: ['ANGER', 0.9],
            生气: ['ANGER', 0.8],
            担心: ['WORRY', 0.7],
            焦虑: ['WORRY', 0.8],
            紧张: ['WORRY', 0.6],
            兴奋: ['EXCITEMENT', 0.8],
            期待: ['ANTICIPATION', 0.7],
            失望: ['SADNESS', 0.6],
            满意: ['JOY', 0.6],
        }

        for (const [keyword, [emotion, intensity]] of Object.entries(emotionDict)) {
            if (text.includes(keyword)) {
                let target = 'unknown'
                const targetMatch = text.match(new RegExp(`(.+?)(看起来|显得|很|有点)${keyword}`))
                if (targetMatch) {
                    target = targetMatch[1].trim()
                }

                emotions.push({
                    target,
                    emotion,
                    intensity,
                    context: text,
                })
            }
        }

        return emotions
    }

    /**
     * 生成摘要
     */
    private static generateSummary(text: string, maxLength: number = 50): string {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }
}

export class KnowledgeGraph {
    private entities: Map<string, KgEntity> = new Map()
    private relations: KgRelation[] = []
    private entityIndex: Map<string, Set<string>> = new Map()
    private chatId: number

    constructor(chatId: number) {
        this.chatId = chatId
    }

    /**
     * 从数据库加载知识图谱
     */
    async load(): Promise<void> {
        const entities = await db.query.kg_entities.findMany({
            where: eq(kg_entities.chat_id, this.chatId),
        })

        const relations = await db.query.kg_relations.findMany({
            where: eq(kg_relations.chat_id, this.chatId),
        })

        entities.forEach((entity) => {
            this.entities.set(entity.id, entity)
            if (!this.entityIndex.has(entity.type)) {
                this.entityIndex.set(entity.type, new Set())
            }
            this.entityIndex.get(entity.type)!.add(entity.id)
        })

        this.relations = relations
    }

    /**
     * 添加或更新实体
     */
    async addOrUpdateEntity(entityData: EntityData): Promise<string> {
        const entityId = await this.generateId(entityData.name)
        const existing = this.entities.get(entityId)

        if (existing) {
            const updated = await db
                .update(kg_entities)
                .set({
                    mention_count: existing.mention_count + 1,
                    last_mentioned: new Date(),
                })
                .where(eq(kg_entities.id, entityId))
                .returning()

            if (updated[0]) {
                this.entities.set(entityId, updated[0])
            }
        } else {
            const inserted = await db
                .insert(kg_entities)
                .values({
                    id: entityId,
                    chat_id: this.chatId,
                    name: entityData.name,
                    type: entityData.type as any,
                    attributes: JSON.stringify(entityData.attributes || {}),
                })
                .returning()

            if (inserted[0]) {
                this.entities.set(entityId, inserted[0])
                if (!this.entityIndex.has(entityData.type)) {
                    this.entityIndex.set(entityData.type, new Set())
                }
                this.entityIndex.get(entityData.type)!.add(entityId)
            }
        }

        return entityId
    }

    /**
     * 添加关系
     */
    async addRelation(relationData: RelationData): Promise<void> {
        const sourceId = await this.generateId(relationData.source)
        const targetId = await this.generateId(relationData.target)

        const inserted = await db
            .insert(kg_relations)
            .values({
                chat_id: this.chatId,
                source_id: sourceId,
                target_id: targetId,
                type: relationData.type as any,
                properties: JSON.stringify({ object: relationData.object || '' }),
            })
            .returning()

        if (inserted[0]) {
            this.relations.push(inserted[0])
        }
    }

    /**
     * 获取连接的实体(N度关系)
     */
    getConnectedEntities(entityId: string, depth: number = 1): Set<string> {
        const visited = new Set<string>([entityId])
        let currentLayer = new Set<string>([entityId])

        for (let i = 0; i < depth; i++) {
            const nextLayer = new Set<string>()

            currentLayer.forEach((eid) => {
                this.relations.forEach((rel) => {
                    if (rel.source_id === eid && !visited.has(rel.target_id)) {
                        nextLayer.add(rel.target_id)
                        visited.add(rel.target_id)
                    } else if (rel.target_id === eid && !visited.has(rel.source_id)) {
                        nextLayer.add(rel.source_id)
                        visited.add(rel.source_id)
                    }
                })
            })

            currentLayer = nextLayer
        }

        return visited
    }

    /**
     * 查找指定类型的实体
     */
    findEntitiesByType(type: string): KgEntity[] {
        const entityIds = this.entityIndex.get(type) || new Set()
        return Array.from(entityIds)
            .map((id) => this.entities.get(id))
            .filter((e): e is KgEntity => e !== undefined)
    }

    private async generateId(content: string): Promise<string> {
        return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, content)
    }
}

export class HybridMemoryPro {
    private config: Required<HybridMemoryConfig>
    private knowledgeGraph?: KnowledgeGraph
    private turnCounter: number = 0
    private initialized: boolean = false

    constructor(config: HybridMemoryConfig) {
        this.config = {
            chatId: config.chatId,
            enableForgettingCurve: config.enableForgettingCurve ?? true,
            enableKnowledgeGraph: config.enableKnowledgeGraph ?? true,
            enableEmotionAnalysis: config.enableEmotionAnalysis ?? true,
            enableActiveManagement: config.enableActiveManagement ?? true,
            decayRate: config.decayRate ?? 20,
        }

        if (this.config.enableKnowledgeGraph) {
            this.knowledgeGraph = new KnowledgeGraph(this.config.chatId)
        }
    }

    /**
     * 初始化系统
     */
    async initialize(): Promise<void> {
        if (this.initialized) return

        if (this.knowledgeGraph) {
            await this.knowledgeGraph.load()
        }

        const messages = await db.query.messages.findMany({
            where: eq(memory_entries.chat_id, this.config.chatId),
        })
        this.turnCounter = messages.length

        this.initialized = true
    }

    /**
     * 处理消息(自动提取和存储)
     */
    async processMessage(role: 'user' | 'assistant', content: string): Promise<void> {
        this.turnCounter++

        if (role === 'assistant') {
            const extracted = InformationExtractor.extractStructuredInfo(content)
            await this.storeExtractedInfo(content, extracted)

            if (this.config.enableKnowledgeGraph && this.knowledgeGraph) {
                await this.updateKnowledgeGraph(extracted)
            }
        }
    }

    /**
     * 存储提取的信息
     */
    private async storeExtractedInfo(content: string, extracted: ExtractedInfo): Promise<void> {
        const promises: Promise<any>[] = []

        if (extracted.entities.length > 0 || extracted.relations.length > 0) {
            const entryId = await this.generateId(content)
            promises.push(
                db.insert(memory_entries).values({
                    id: entryId,
                    chat_id: this.config.chatId,
                    content,
                    type: MemoryType.DIALOGUE,
                    importance: 7,
                    turn_number: this.turnCounter,
                    entities: JSON.stringify(extracted.entities.map((e) => e.name)),
                    relations: JSON.stringify(extracted.relations),
                    metadata: JSON.stringify({ summary: extracted.summary }),
                })
            )
        }

        if (this.config.enableEmotionAnalysis && extracted.emotions.length > 0) {
            extracted.emotions.forEach((emotion) => {
                const entryId = this.generateId(content + emotion.emotion)
                promises.push(
                    db.insert(memory_entries).values({
                        id: entryId,
                        chat_id: this.config.chatId,
                        content,
                        type: MemoryType.EMOTION,
                        importance: 7,
                        turn_number: this.turnCounter,
                        emotional_impact: Math.round(emotion.intensity * 10),
                        metadata: JSON.stringify(emotion),
                    })
                )
            })
        }

        await Promise.all(promises)
    }

    /**
     * 更新知识图谱
     */
    private async updateKnowledgeGraph(extracted: ExtractedInfo): Promise<void> {
        if (!this.knowledgeGraph) return

        for (const entity of extracted.entities) {
            await this.knowledgeGraph.addOrUpdateEntity(entity)
        }

        for (const relation of extracted.relations) {
            await this.knowledgeGraph.addRelation(relation)
        }
    }

    /**
     * 计算记忆重要性
     */
    calculateImportance(
        entry: MemoryEntry,
        queryRelevance: number,
        currentTurn: number
    ): number {
        const baseImportance = entry.importance

        let recencyFactor = 1.0
        if (this.config.enableForgettingCurve) {
            const age = currentTurn - entry.turn_number
            recencyFactor = Math.exp(-age / this.config.decayRate)
        }

        const accessBoost = Math.min(entry.access_count * 0.1, 2.0)
        const emotionalBoost = Math.abs(entry.emotional_impact / 10) * 0.5

        const score =
            0.4 * queryRelevance * 10 +
            0.3 * baseImportance * recencyFactor +
            0.2 * emotionalBoost * 10 +
            0.1 * accessBoost * 10

        return Math.min(score, 10.0)
    }

    /**
     * 混合检索
     */
    async retrieveMemories(query: string, nResults: number = 5): Promise<MemoryEntry[]> {
        const allMemories = await db.query.memory_entries.findMany({
            where: eq(memory_entries.chat_id, this.config.chatId),
        })

        const queryWords = new Set(query.toLowerCase().split(/\s+/))
        const scoredResults: Array<{ entry: MemoryEntry; score: number }> = []

        for (const entry of allMemories) {
            const contentWords = new Set(entry.content.toLowerCase().split(/\s+/))
            const intersection = new Set([...queryWords].filter((x) => contentWords.has(x)))
            const relevance = intersection.size / Math.max(queryWords.size, 1)

            if (relevance > 0) {
                const finalScore = this.calculateImportance(entry, relevance, this.turnCounter)

                if (finalScore >= 5.0) {
                    scoredResults.push({ entry, score: finalScore })

                    await db
                        .update(memory_entries)
                        .set({
                            access_count: entry.access_count + 1,
                            last_access: new Date(),
                        })
                        .where(eq(memory_entries.id, entry.id))
                }
            }
        }

        scoredResults.sort((a, b) => b.score - a.score)
        return scoredResults.slice(0, nResults).map((r) => r.entry)
    }

    /**
     * Graph检索增强
     */
    async hybridRetrieve(query: string, nResults: number = 5): Promise<MemoryEntry[]> {
        if (!this.config.enableKnowledgeGraph || !this.knowledgeGraph) {
            return this.retrieveMemories(query, nResults)
        }

        const extracted = InformationExtractor.extractStructuredInfo(query)
        const connectedEntityIds = new Set<string>()

        for (const entity of extracted.entities) {
            const entityId = await this.generateId(entity.name)
            const connected = this.knowledgeGraph.getConnectedEntities(entityId, 2)
            connected.forEach((id) => connectedEntityIds.add(id))
        }

        const allMemories = await db.query.memory_entries.findMany({
            where: eq(memory_entries.chat_id, this.config.chatId),
        })

        const graphBoostedResults: Array<{ entry: MemoryEntry; score: number }> = []

        for (const entry of allMemories) {
            const entities = JSON.parse(entry.entities) as string[]
            const entityIds = await Promise.all(entities.map((name) => this.generateId(name)))

            let graphBoost = 0
            entityIds.forEach((id) => {
                if (connectedEntityIds.has(id)) graphBoost += 2.0
            })

            const queryWords = new Set(query.toLowerCase().split(/\s+/))
            const contentWords = new Set(entry.content.toLowerCase().split(/\s+/))
            const intersection = new Set([...queryWords].filter((x) => contentWords.has(x)))
            const relevance = intersection.size / Math.max(queryWords.size, 1)

            const baseScore = this.calculateImportance(entry, relevance, this.turnCounter)
            const finalScore = Math.min(baseScore + graphBoost, 10.0)

            if (finalScore >= 5.0) {
                graphBoostedResults.push({ entry, score: finalScore })
            }
        }

        graphBoostedResults.sort((a, b) => b.score - a.score)
        return graphBoostedResults.slice(0, nResults).map((r) => r.entry)
    }

    /**
     * 主动记忆巩固
     */
    async consolidateMemories(): Promise<{ insights: MemoryInsight[] }> {
        if (!this.config.enableActiveManagement) {
            return { insights: [] }
        }

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentMemories = await db.query.memory_entries.findMany({
            where: and(
                eq(memory_entries.chat_id, this.config.chatId),
                gte(memory_entries.created_at, sevenDaysAgo)
            ),
        })

        const insights = this.discoverPatterns(recentMemories)

        for (const insight of insights) {
            const insightId = await this.generateId(insight.description + Date.now())
            await db.insert(memory_entries).values({
                id: insightId,
                chat_id: this.config.chatId,
                content: insight.description,
                type: MemoryType.INSIGHT,
                importance: 8,
                turn_number: this.turnCounter,
                metadata: JSON.stringify(insight),
            })
        }

        return { insights }
    }

    /**
     * 发现记忆模式
     */
    private discoverPatterns(memories: MemoryEntry[]): MemoryInsight[] {
        const insights: MemoryInsight[] = []

        const topicMentions = new Map<string, number>()
        memories.forEach((mem) => {
            const entities = JSON.parse(mem.entities) as string[]
            entities.forEach((entity) => {
                topicMentions.set(entity, (topicMentions.get(entity) || 0) + 1)
            })
        })

        topicMentions.forEach((count, topic) => {
            if (count >= 3) {
                insights.push({
                    type: 'repeated_topic',
                    topic,
                    count,
                    description: `最近7天内提到'${topic}' ${count}次`,
                })
            }
        })

        const emotionPatterns = new Map<string, number>()
        memories
            .filter((m) => m.type === MemoryType.EMOTION)
            .forEach((mem) => {
                const emotion = JSON.parse(mem.metadata).emotion
                emotionPatterns.set(emotion, (emotionPatterns.get(emotion) || 0) + 1)
            })

        emotionPatterns.forEach((frequency, emotion) => {
            if (frequency >= 3) {
                insights.push({
                    type: 'emotion_pattern',
                    emotion,
                    frequency,
                    description: `检测到持续的${emotion}情绪模式`,
                })
            }
        })

        return insights
    }

    /**
     * 获取统计信息
     */
    async getStatistics(): Promise<{
        totalMemories: number
        knowledgeGraph?: { entities: number; relations: number }
    }> {
        const memories = await db.query.memory_entries.findMany({
            where: eq(memory_entries.chat_id, this.config.chatId),
        })

        const stats: any = {
            totalMemories: memories.length,
        }

        if (this.config.enableKnowledgeGraph) {
            const entities = await db.query.kg_entities.findMany({
                where: eq(kg_entities.chat_id, this.config.chatId),
            })
            const relations = await db.query.kg_relations.findMany({
                where: eq(kg_relations.chat_id, this.config.chatId),
            })

            stats.knowledgeGraph = {
                entities: entities.length,
                relations: relations.length,
            }
        }

        return stats
    }

    private async generateId(content: string): Promise<string> {
        const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.MD5,
            content
        )
        return hash.substring(0, 16)
    }
}
