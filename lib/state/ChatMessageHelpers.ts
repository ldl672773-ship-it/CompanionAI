import { Chats } from './Chat'

/**
 * 删除指定索引之后的所有消息(回溯功能)
 */
export const deleteMessagesAfterIndex = async (index: number) => {
    const messages = Chats.useChat.getState().data?.messages
    if (!messages || index >= messages.length - 1) return

    const messagesToDelete = messages.slice(index + 1)
    for (const message of messagesToDelete) {
        if (message.id) {
            await Chats.db.mutate.deleteMessage(message.id)
        }
    }

    Chats.useChat.setState((state) => {
        if (!state.data) return state
        return {
            ...state,
            data: {
                ...state.data,
                messages: messages.slice(0, index + 1),
            },
        }
    })
}

/**
 * 重新生成指定消息
 */
export const regenerateMessage = async (index: number) => {
    const messages = Chats.useChat.getState().data?.messages
    if (!messages || index >= messages.length) return

    const message = messages[index]
    if (message.role !== 'assistant') {
        return false
    }

    await Chats.useChat.getState().updateMessage(index, '', {
        updateFinished: false,
        updateStarted: true,
    })

    return true
}
