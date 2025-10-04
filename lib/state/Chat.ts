import { db as database } from '@db'
import { Tokenizer } from '@lib/engine/Tokenizer'
import { replaceMacros } from '@lib/state/Macros'
import { convertToFormatInstruct } from '@lib/utils/TextFormat'
import {
    Message as MessageType,
    messages,
    chats,
    Chat as ChatType,
    attachments,
    Attachment,
} from 'db/schema'
import { and, desc, eq, like, sql } from 'drizzle-orm'
import * as Notifications from 'expo-notifications'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { Characters } from './Characters'
import { Logger } from './Logger'
import { ChatHybridMemoryHooks } from './ChatHybridMemoryIntegration'
import { AppSettings } from '../constants/GlobalValues'
import { mmkv } from '../storage/MMKV'
export type Message = MessageType

export interface MessageWithAttachments extends MessageType {
    attachments: Attachment[]
    token_count?: number
}

// 向后兼容的类型别名(ChatEntry = MessageWithAttachments)
export type ChatEntry = MessageWithAttachments

export interface ChatData extends ChatType {
    messages: MessageWithAttachments[]
    autoScroll?: { cause: 'search' | 'saveScroll'; index: number }
}

interface ChatSearchQueryResult {
    messageId: number
    chatId: number
    chatName: string
    content: string
    createdAt: Date
}

type ChatSearchResult = ChatSearchQueryResult

export interface ChatState {
    data: ChatData | undefined
    buffer: OutputBuffer

    load: (
        chatId: number,
        overrideScrollOffset?: { value: number; type: 'messageId' | 'index' }
    ) => Promise<void>
    delete: (chatId: number) => Promise<void>
    reset: () => void

    addMessage: (role: 'user' | 'assistant', content: string) => Promise<number | void>
    updateMessage: (
        index: number,
        content: string,
        options?: {
            updateFinished?: boolean
            updateStarted?: boolean
        }
    ) => Promise<void>
    deleteMessage: (index: number) => Promise<void>
    renameChat: (chatId: number, name: string) => void

    setBuffer: (data: OutputBuffer) => void
    insertBuffer: (data: string) => void
    updateFromBuffer: (cachedMessageId?: number) => Promise<void>
    insertLastToBuffer: () => void

    getTokenCount: (index: number) => Promise<number>
    stopGenerating: () => void
    startGenerating: (messageId: number) => void

    // 向后兼容方法(已废弃,映射到新API)
    addEntry: (name: string, isUser: boolean, content: string) => Promise<number | void>
    updateEntry: (index: number, content: string, options?: any) => Promise<void>
    resetRegenCache: () => void
    setRegenCache: () => void
    regenerateLastMessage: () => Promise<boolean>
}

type InferenceStateType = {
    abortFunction: () => void | Promise<void>
    nowGenerating: boolean
    currentMessageId?: number
    startGenerating: (messageId: number) => void
    stopGenerating: () => void
    setAbort: (fn: () => void | Promise<void>) => void
}

type OutputBuffer = {
    data: string
    error?: string
}

export const sendGenerateCompleteNotification = async () => {
    const showMessage = mmkv.getBoolean(AppSettings.ShowNotificationText)

    const notificationTitle = showMessage
        ? (Characters.useCharacterStore.getState().card?.name ?? '')
        : 'Response Complete'

    const notificationText = showMessage
        ? Chats.useChatState.getState().buffer?.data?.trim()
        : 'CompanionAI has finished a response.'

    Notifications.scheduleNotificationAsync({
        content: {
            title: notificationTitle,
            body: notificationText,
            sound: mmkv.getBoolean(AppSettings.PlayNotificationSound),
            vibrate: mmkv.getBoolean(AppSettings.VibrateNotification) ? [250, 125, 250] : undefined,
            badge: 0,
            data: {
                chatId: Chats.useChatState.getState().data?.id,
                characterId: Characters.useCharacterStore.getState().id,
            },
        },
        trigger: null,
    })
    Notifications.setBadgeCountAsync(0)
}

export const useInference = create<InferenceStateType>((set, get) => ({
    abortFunction: () => {
        get().stopGenerating()
    },
    nowGenerating: false,
    currentMessageId: undefined,
    startGenerating: (messageId: number) =>
        set((state) => ({ ...state, currentMessageId: messageId, nowGenerating: true })),
    stopGenerating: () => {
        set((state) => ({ ...state, nowGenerating: false, currentMessageId: undefined }))
        if (mmkv.getBoolean(AppSettings.NotifyOnComplete)) sendGenerateCompleteNotification()
    },
    setAbort: (fn) => {
        set((state) => ({
            ...state,
            abortFunction: async () => {
                await fn()
            },
        }))
    },
}))

export namespace Chats {
    export const useChatState = create<ChatState>((set, get: () => ChatState) => ({
        data: undefined,
        buffer: { data: '' },
        startGenerating: (messageId: number) => {
            useInference.getState().startGenerating(messageId)
        },
        stopGenerating: async () => {
            const cachedMessageId = useInference.getState().currentMessageId
            Logger.info(`Saving Chat`)
            await get().updateFromBuffer(cachedMessageId)
            useInference.getState().stopGenerating()
            get().setBuffer({ data: '' })
        },
        load: async (chatId, overrideScrollOffset) => {
            const data = (await db.query.chat(chatId)) as ChatData | undefined

            if (data) {
                if (overrideScrollOffset !== undefined) {
                    if (overrideScrollOffset.type === 'index') {
                        const messageIndex = Math.max(
                            0,
                            data.messages.length - overrideScrollOffset.value
                        )
                        data.autoScroll = { cause: 'search', index: messageIndex }
                    }
                    if (overrideScrollOffset.type === 'messageId') {
                        const messageIndex = data.messages.findIndex(
                            (item) => item.id === overrideScrollOffset.value
                        )
                        if (messageIndex !== -1) {
                            data.autoScroll = {
                                cause: 'search',
                                index: data.messages.length - messageIndex - 1,
                            }
                        }
                    }
                } else {
                    data.autoScroll = { cause: 'saveScroll', index: 0 }
                }

                if (data.autoScroll?.index && data.autoScroll.index > data.messages.length) {
                    data.autoScroll.index = data.messages.length - 1
                }
            }

            set({
                data: data,
            })

            if (data) {
                await ChatHybridMemoryHooks.onChatLoad(chatId)
            }
        },

        delete: async (chatId: number) => {
            await db.mutate.deleteChat(chatId)
            if (get().data?.id === chatId) get().reset()
        },

        reset: () => {
            ChatHybridMemoryHooks.onChatReset()
            set((state: ChatState) => ({
                ...state,
                data: undefined,
            }))
        },

        addMessage: async (role: 'user' | 'assistant', content: string) => {
            const messages = get().data?.messages
            const chatId = get().data?.id
            if (!messages || !chatId) return
            const message = await db.mutate.createMessage(chatId, role, content)
            if (message) messages.push(message)
            set((state) => ({
                ...state,
                data: state?.data ? { ...state.data, messages: [...messages] } : state.data,
            }))

            await ChatHybridMemoryHooks.onMessageAdded(role, content)

            return message?.id
        },
        deleteMessage: async (index: number) => {
            const messages = get().data?.messages
            if (!messages) return
            const messageId = messages[index].id
            if (!messageId) return

            await db.mutate.deleteMessage(messageId)

            set((state) => {
                if (!state.data) return state
                return {
                    ...state,
                    data: {
                        ...state.data,
                        messages: messages.filter((item, ind) => ind !== index),
                    },
                }
            })
        },

        updateMessage: async (index: number, content: string, options = {}) => {
            const { updateFinished, updateStarted } = options
            const messages = get()?.data?.messages
            if (!messages) return

            const messageId = messages[index]?.id
            if (!messageId) return

            await db.mutate.updateMessage(messageId, content)

            const message = messages[index]
            message.content = content
            message.token_count = undefined
            messages[index] = message

            set((state) => ({
                ...state,
                data: state?.data ? { ...state.data, messages: messages } : state.data,
            }))

            if (updateFinished) {
                await ChatHybridMemoryHooks.onMessageUpdated(message.role, content, true)
            }
        },

        getTokenCount: async (index: number) => {
            const messages = get()?.data?.messages
            if (!messages) return 0

            const { token_count } = messages[index]
            if (token_count) return token_count
            const getTokenCount = Tokenizer.getTokenizer()

            const new_token_count = await getTokenCount(
                messages[index].content,
                messages[index].attachments.map((item) => item.image_uri)
            )

            messages[index].token_count = new_token_count
            set((state: ChatState) => ({
                ...state,
                data: state?.data ? { ...state.data, messages: messages } : state.data,
            }))
            return new_token_count
        },
        setBuffer: (newBuffer: OutputBuffer) =>
            set((state: ChatState) => ({ ...state, buffer: newBuffer })),

        insertBuffer: (data: string) =>
            set((state: ChatState) => ({
                ...state,
                buffer: { ...state.buffer, data: state.buffer.data + data },
            })),

        updateFromBuffer: async (cachedMessageId) => {
            const NO_VALID_MESSAGE = -1
            const index = get().data?.messages?.length
            const buffer = get().buffer
            const messageId = index ?? cachedMessageId ?? NO_VALID_MESSAGE
            if (messageId === NO_VALID_MESSAGE) {
                Logger.error('Attempted to insert to buffer, but no valid message was found!')
                return
            }
            if (!index) {
                await db.mutate.updateMessage(messageId, buffer.data)
            } else
                await get().updateMessage(index - 1, get().buffer.data, {
                    updateFinished: true,
                })
        },
        insertLastToBuffer: () => {
            const message = get()?.data?.messages?.at(-1)
            if (!message) return
            const content = message.content

            set((state: ChatState) => ({ ...state, buffer: { ...state.buffer, data: content } }))
        },
        renameChat: (chatId: number, name: string) => {
            const data = get().data
            if (!data) return
            if (data.id === chatId)
                set({
                    data: { ...data, name: name },
                })
            db.mutate.renameChat(chatId, name)
        },

        // 向后兼容方法实现(映射到新API)
        addEntry: async (name: string, isUser: boolean, content: string) => {
            const role = isUser ? 'user' : 'assistant'
            return await get().addMessage(role, content)
        },
        updateEntry: async (index: number, content: string, options?: any) => {
            return await get().updateMessage(index, content, options)
        },
        resetRegenCache: () => {
            // 新schema不支持regen cache,此方法保留为空操作以保持兼容性
        },
        setRegenCache: () => {
            // 新schema不支持regen cache,此方法保留为空操作以保持兼容性
        },
        regenerateLastMessage: async () => {
            const messages = get().data?.messages ?? []
            if (messages.length === 0) {
                Logger.warn('No messages to regenerate')
                return false
            }

            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role !== 'assistant') {
                Logger.warn('Last message is not from assistant, cannot regenerate')
                return false
            }

            await get().updateMessage(messages.length - 1, '', {
                updateFinished: false,
                updateStarted: true,
            })

            Logger.info('Last message cleared for regeneration')
            return true
        },
    }))

    export namespace db {
        export namespace query {
            export const chat = async (chatId: number) => {
                const chat = await database.query.chats.findFirst({
                    where: eq(chats.id, chatId),
                    with: {
                        messages: {
                            orderBy: messages.created_at,
                            with: {
                                attachments: true,
                            },
                        },
                    },
                })
                if (chat) return { ...chat }
            }

            export const chatNewestId = async (
                companionId: number
            ): Promise<number | undefined> => {
                const result = await database.query.chats.findFirst({
                    orderBy: desc(chats.updated_at),
                    where: eq(chats.companion_id, companionId),
                })
                return result?.id
            }

            export const chatNewest = async () => {
                const result = await database.query.chats.findFirst({
                    orderBy: desc(chats.updated_at),
                })
                return result
            }

            export const chatList = async (companionId: number) => {
                const result = await database.query.chats.findMany({
                    where: eq(chats.companion_id, companionId),
                    orderBy: desc(chats.updated_at),
                })
                return result
            }

            export const chatListQuery = (companionId: number) => {
                return database.query.chats.findMany({
                    where: eq(chats.companion_id, companionId),
                    orderBy: desc(chats.updated_at),
                })
            }

            export const chatExists = async (chatId: number) => {
                return await database.query.chats.findFirst({ where: eq(chats.id, chatId) })
            }

            export const searchChat = async (
                query: string,
                companionId: number
            ): Promise<ChatSearchResult[]> => {
                const result = await database
                    .select({
                        messageId: messages.id,
                        chatId: messages.chat_id,
                        chatName: chats.name,
                        content: messages.content,
                        createdAt: messages.created_at,
                    })
                    .from(messages)
                    .innerJoin(chats, eq(messages.chat_id, chats.id))
                    .where(
                        and(
                            like(messages.content, `%${query}%`),
                            eq(chats.companion_id, companionId)
                        )
                    )
                    .orderBy(messages.created_at)
                    .limit(100)

                return result
            }
        }
        export namespace mutate {
            export const createChat = async (companionId: number) => {
                const card = await Characters.db.query.card(companionId)
                if (!card) {
                    Logger.error('Character does not exist!')
                    return
                }
                const companionName = card.name
                return await database.transaction(async (tx) => {
                    if (!card || !companionName) return
                    const [{ chatId }] = await tx
                        .insert(chats)
                        .values({
                            companion_id: companionId,
                        })
                        .returning({ chatId: chats.id })

                    if (!mmkv.getBoolean(AppSettings.CreateFirstMes)) return chatId
                    const greeting = card.first_mes ?? ''

                    if (greeting) {
                        await tx.insert(messages).values({
                            chat_id: chatId,
                            role: 'assistant',
                            content: convertToFormatInstruct(replaceMacros(greeting)),
                        })
                    }

                    await Characters.db.mutate.updateModified(companionId)
                    return chatId
                })
            }

            export const updateChatModified = async (chatID: number) => {
                const chat = await database.query.chats.findFirst({ where: eq(chats.id, chatID) })
                if (chat?.companion_id) {
                    await Characters.db.mutate.updateModified(chat.companion_id)
                }
                await database
                    .update(chats)
                    .set({ updated_at: Date.now() })
                    .where(eq(chats.id, chatID))
            }

            export const createMessage = async (
                chatId: number,
                role: 'user' | 'assistant',
                content: string
            ) => {
                const [message] = await database
                    .insert(messages)
                    .values({
                        chat_id: chatId,
                        role: role,
                        content: replaceMacros(content),
                    })
                    .returning()

                const messageWithAttachments = await database.query.messages.findFirst({
                    where: eq(messages.id, message.id),
                    with: { attachments: true },
                })

                await updateChatModified(chatId)
                return messageWithAttachments
            }

            export const updateMessage = async (messageId: number, content: string) => {
                const message = await database.query.messages.findFirst({
                    where: eq(messages.id, messageId),
                })
                if (message?.chat_id) {
                    await updateChatModified(message.chat_id)
                }
                await database
                    .update(messages)
                    .set({ content: replaceMacros(content) })
                    .where(eq(messages.id, messageId))
            }

            export const deleteChat = async (chatId: number) => {
                await updateChatModified(chatId)
                await database.delete(chats).where(eq(chats.id, chatId))
            }

            export const deleteMessage = async (messageId: number) => {
                const message = await database.query.messages.findFirst({
                    where: eq(messages.id, messageId),
                })
                if (message?.chat_id) {
                    await updateChatModified(message.chat_id)
                }
                await database.delete(messages).where(eq(messages.id, messageId))
            }

            export const cloneChat = async (chatId: number, limit?: number) => {
                const result = await database.query.chats.findFirst({
                    where: eq(chats.id, chatId),
                    columns: { id: false },
                    with: {
                        messages: {
                            columns: { id: false },
                            orderBy: messages.created_at,
                            ...(limit && { limit: limit }),
                        },
                    },
                })
                if (!result) return

                result.updated_at = Date.now()

                const [{ newChatId }] = await database
                    .insert(chats)
                    .values(result)
                    .returning({ newChatId: chats.id })

                result.messages.forEach((item) => {
                    item.chat_id = newChatId
                })

                await database.insert(messages).values(result.messages)
            }

            export const renameChat = async (chatId: number, name: string) => {
                await database.update(chats).set({ name: name }).where(eq(chats.id, chatId))
            }

            export const updateUser = async (chatId: number, userId: number) => {
                // user_id字段已从新schema移除,此方法保留为空操作以保持兼容性
            }

            export const updateScrollOffset = async (chatId: number, offset: number) => {
                // 新schema不存储滚动偏移,此方法保留为空操作以保持兼容性
            }
        }
    }

    export const useMessageData = (index: number) => {
        const message = useChatState((state) => state?.data?.messages?.[index])
        return message ?? dummyMessage
    }

    // 向后兼容别名
    export const useEntryData = useMessageData

    // useSwipeData 兼容层（新架构无swipe概念，返回简化数据）
    export const useSwipeData = (index: number) => {
        const message = useMessageData(index)
        return {
            swipeId: message.id,
            swipe: message,
            swipeText: message.content,
            swipeIndex: 0,
            swipesLength: 1,
        }
    }

    export const useChat = () => {
        const { loadChat, unloadChat, chat, chatId, deleteChat, chatLength } = Chats.useChatState(
            useShallow((state) => ({
                loadChat: state.load,
                unloadChat: state.reset,
                chat: state.data,
                chatId: state.data?.id,
                deleteChat: state.delete,
                chatLength: state.data?.messages.length,
            }))
        )
        return { chat, loadChat, unloadChat, deleteChat, chatId, chatLength }
    }

    export const useMessage = () => {
        const { addMessage, deleteMessage, updateMessage } = Chats.useChatState(
            useShallow((state) => ({
                addMessage: state.addMessage,
                deleteMessage: state.deleteMessage,
                updateMessage: state.updateMessage,
            }))
        )
        return { addMessage, deleteMessage, updateMessage }
    }

    // 向后兼容别名（字段名映射）
    export const useEntry = () => {
        const { addMessage, deleteMessage, updateMessage } = useMessage()
        return {
            addEntry: addMessage,
            deleteEntry: deleteMessage,
            updateEntry: updateMessage,
        }
    }

    export const useBuffer = () => {
        const { buffer } = Chats.useChatState(
            useShallow((state) => ({
                buffer: state.buffer,
            }))
        )
        return { buffer }
    }

    export const dummyMessage: MessageWithAttachments = {
        id: 0,
        chat_id: -1,
        role: 'assistant',
        content: '',
        created_at: new Date(),
        attachments: [],
    }
}
