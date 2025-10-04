/**
 * HybridMemory集成到Chat消息处理流程
 */

import { useHybridMemory } from './HybridMemory'

export namespace ChatHybridMemoryHooks {
    /**
     * 在Chat加载时初始化HybridMemory
     */
    export async function onChatLoad(chatId: number): Promise<void> {
        try {
            await useHybridMemory.getState().initialize(chatId)
        } catch (error) {
            console.error('[HybridMemory] onChatLoad error:', error)
        }
    }

    /**
     * 在Chat重置时重置HybridMemory
     */
    export function onChatReset(): void {
        useHybridMemory.getState().reset()
    }

    /**
     * 在添加消息后处理记忆提取
     */
    export async function onMessageAdded(
        role: 'user' | 'assistant',
        content: string
    ): Promise<void> {
        try {
            await useHybridMemory.getState().processMessage(role, content)
        } catch (error) {
            console.error('[HybridMemory] onMessageAdded error:', error)
        }
    }

    /**
     * 在更新消息后处理记忆提取(仅assistant消息)
     */
    export async function onMessageUpdated(
        role: 'user' | 'assistant',
        content: string,
        isComplete: boolean
    ): Promise<void> {
        if (role === 'assistant' && isComplete) {
            try {
                await useHybridMemory.getState().processMessage(role, content)
            } catch (error) {
                console.error('[HybridMemory] onMessageUpdated error:', error)
            }
        }
    }

    /**
     * 检索增强上下文
     */
    export async function getEnhancedContext(
        query: string,
        nResults: number = 5
    ): Promise<string> {
        try {
            const memories = await useHybridMemory.getState().retrieveMemories(query, nResults)

            if (memories.length === 0) {
                return ''
            }

            const context = memories
                .map((mem) => {
                    const metadata = JSON.parse(mem.metadata)
                    const entities = JSON.parse(mem.entities)
                    return `- [${mem.type}] ${mem.content}${entities.length > 0 ? ` (相关: ${entities.join(', ')})` : ''}`
                })
                .join('\n')

            return `\n# 相关记忆\n${context}\n`
        } catch (error) {
            console.error('[HybridMemory] getEnhancedContext error:', error)
            return ''
        }
    }
}
