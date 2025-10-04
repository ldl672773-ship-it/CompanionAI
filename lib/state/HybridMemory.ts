/**
 * HybridMemory State Management
 * 集成HybridMemory Pro到Zustand状态管理
 */

import { HybridMemoryPro } from '@lib/memory/HybridMemoryPro'
import type { MemoryEntry, MemoryInsight } from '@lib/memory/HybridMemoryPro'
import { mmkv } from '@lib/storage/MMKV'
import { create } from 'zustand'

interface HybridMemoryState {
    instance?: HybridMemoryPro
    enabled: boolean
    currentChatId?: number

    enableKnowledgeGraph: boolean
    enableEmotionAnalysis: boolean
    enableActiveManagement: boolean
    enableForgettingCurve: boolean

    initialize: (chatId: number) => Promise<void>
    processMessage: (role: 'user' | 'assistant', content: string) => Promise<void>
    retrieveMemories: (query: string, nResults?: number) => Promise<MemoryEntry[]>
    consolidate: () => Promise<{ insights: MemoryInsight[] }>
    getStatistics: () => Promise<any>
    reset: () => void

    setEnabled: (enabled: boolean) => void
    setKnowledgeGraph: (enabled: boolean) => void
    setEmotionAnalysis: (enabled: boolean) => void
    setActiveManagement: (enabled: boolean) => void
    setForgettingCurve: (enabled: boolean) => void
}

const MMKV_KEYS = {
    ENABLED: 'hybridmemory.enabled',
    KNOWLEDGE_GRAPH: 'hybridmemory.knowledgeGraph',
    EMOTION_ANALYSIS: 'hybridmemory.emotionAnalysis',
    ACTIVE_MANAGEMENT: 'hybridmemory.activeManagement',
    FORGETTING_CURVE: 'hybridmemory.forgettingCurve',
}

export const useHybridMemory = create<HybridMemoryState>((set, get) => ({
    instance: undefined,
    enabled: mmkv.getBoolean(MMKV_KEYS.ENABLED) ?? true,
    currentChatId: undefined,

    enableKnowledgeGraph: mmkv.getBoolean(MMKV_KEYS.KNOWLEDGE_GRAPH) ?? true,
    enableEmotionAnalysis: mmkv.getBoolean(MMKV_KEYS.EMOTION_ANALYSIS) ?? true,
    enableActiveManagement: mmkv.getBoolean(MMKV_KEYS.ACTIVE_MANAGEMENT) ?? true,
    enableForgettingCurve: mmkv.getBoolean(MMKV_KEYS.FORGETTING_CURVE) ?? true,

    initialize: async (chatId: number) => {
        const state = get()

        if (state.currentChatId === chatId && state.instance) {
            return
        }

        const instance = new HybridMemoryPro({
            chatId,
            enableKnowledgeGraph: state.enableKnowledgeGraph,
            enableEmotionAnalysis: state.enableEmotionAnalysis,
            enableActiveManagement: state.enableActiveManagement,
            enableForgettingCurve: state.enableForgettingCurve,
        })

        await instance.initialize()

        set({
            instance,
            currentChatId: chatId,
        })
    },

    processMessage: async (role: 'user' | 'assistant', content: string) => {
        const { instance, enabled } = get()
        if (!enabled || !instance) return

        try {
            await instance.processMessage(role, content)
        } catch (error) {
            console.error('[HybridMemory] processMessage error:', error)
        }
    },

    retrieveMemories: async (query: string, nResults: number = 5) => {
        const { instance, enabled } = get()
        if (!enabled || !instance) return []

        try {
            return await instance.hybridRetrieve(query, nResults)
        } catch (error) {
            console.error('[HybridMemory] retrieveMemories error:', error)
            return []
        }
    },

    consolidate: async () => {
        const { instance, enabled } = get()
        if (!enabled || !instance) return { insights: [] }

        try {
            return await instance.consolidateMemories()
        } catch (error) {
            console.error('[HybridMemory] consolidate error:', error)
            return { insights: [] }
        }
    },

    getStatistics: async () => {
        const { instance } = get()
        if (!instance) return null

        try {
            return await instance.getStatistics()
        } catch (error) {
            console.error('[HybridMemory] getStatistics error:', error)
            return null
        }
    },

    reset: () => {
        set({
            instance: undefined,
            currentChatId: undefined,
        })
    },

    setEnabled: (enabled: boolean) => {
        mmkv.set(MMKV_KEYS.ENABLED, enabled)
        set({ enabled })
    },

    setKnowledgeGraph: (enabled: boolean) => {
        mmkv.set(MMKV_KEYS.KNOWLEDGE_GRAPH, enabled)
        set({ enableKnowledgeGraph: enabled })
        get().reset()
    },

    setEmotionAnalysis: (enabled: boolean) => {
        mmkv.set(MMKV_KEYS.EMOTION_ANALYSIS, enabled)
        set({ enableEmotionAnalysis: enabled })
        get().reset()
    },

    setActiveManagement: (enabled: boolean) => {
        mmkv.set(MMKV_KEYS.ACTIVE_MANAGEMENT, enabled)
        set({ enableActiveManagement: enabled })
        get().reset()
    },

    setForgettingCurve: (enabled: boolean) => {
        mmkv.set(MMKV_KEYS.FORGETTING_CURVE, enabled)
        set({ enableForgettingCurve: enabled })
        get().reset()
    },
}))
