import { AppSettings } from '@lib/constants/GlobalValues'
import { CharacterCardData, CharacterTokenCache } from '@lib/state/Characters'
import { ChatEntry } from '@lib/state/Chat'
import { ChatHybridMemoryHooks } from '@lib/state/ChatHybridMemoryIntegration'
import { defaultSystemPromptFormat, InstructTokenCache, InstructType } from '@lib/state/Instructs'
import { Logger } from '@lib/state/Logger'
import { replaceMacros } from '@lib/state/Macros'
import { mmkv } from '@lib/storage/MMKV'
import { Macro } from '@lib/utils/Macros'
import { readAsStringAsync } from 'expo-file-system'

import { APIConfiguration, APIValues } from './APIBuilder.types'

export type MessageLoader = {
    retrieve: (limit: number, offset: number) => Promise<ChatEntry[]>
    initialLimit: number
    initialOffset: number
}

export type TokenCache = {
    userCache: CharacterTokenCache
    characterCache: CharacterTokenCache
    instructCache: InstructTokenCache
}

export interface ContextBuilderParams {
    apiConfig: APIConfiguration
    apiValues: APIValues
    messages: ChatEntry[]
    character: CharacterCardData
    instruct: InstructType
    user: CharacterCardData
    tokenizer: (data: string, media_paths?: string[]) => Promise<number> | number
    chatTokenizer: (entry: ChatEntry, index: number) => Promise<number>
    maxLength: number
    cache: TokenCache
    bypassContextLength?: boolean
    messageLoader?: MessageLoader
}

type ContentTypes =
    | { type: 'input_text' | 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
    | { type: 'input_audio'; input_audio: { data: string; format: string } }

export type Message = { role: string; [x: string]: ContentTypes[] | string }

export const buildContext = async (params: ContextBuilderParams) => {
    if (params.apiConfig.request.completionType.type === 'chatCompletions') {
        return await buildChatCompletionContext(params)
    } else {
        return await buildTextCompletionContext(params)
    }
}

/**
 * TODO:
 * Context Builder is not a pure function:
 * - Macros rely on macro state
 */

export const buildChatCompletionContext = async ({
    apiConfig,
    apiValues,
    messages,
    character,
    user,
    cache,
    instruct,
    tokenizer,
    chatTokenizer,
    maxLength,
    bypassContextLength,
    messageLoader,
}: ContextBuilderParams) => {
    const delta = performance.now()

    if (apiConfig.request.completionType.type !== 'chatCompletions') return
    const completionFeats = apiConfig.request.completionType
    const { characterCache, userCache, instructCache } = cache
    const { systemPrompt, systemPromptLength } = getSystemPrompt({
        instruct,
        user,
        character,
        userCache,
        characterCache,
        instructCache,
        usePrefix: false,
    })

    let enhancedContext = ''
    let enhancedContextLength = 0
    try {
        const lastUserMessage = messages.findLast((m) => m.role === 'user')
        if (lastUserMessage?.content) {
            enhancedContext = await ChatHybridMemoryHooks.getEnhancedContext(
                lastUserMessage.content,
                5
            )
            if (enhancedContext) {
                enhancedContextLength = await tokenizer(enhancedContext)
            }
        }
    } catch (error) {
        Logger.debug('HybridMemory context enhancement failed: ' + error)
    }

    const initial = systemPrompt + enhancedContext
    let total_length = systemPromptLength + enhancedContextLength

    const payload: Message[] = [
        {
            role: completionFeats.systemRole,
            [completionFeats.contentName]: replaceMacrosInternal(initial, instruct),
        },
    ]
    let hasImage = false
    const messageBuffer: Message[] = []
    let index = messages.length - 1
    for (const message of messages.reverse()) {
        // 新schema不支持swipes,直接使用message
        const swipe_data = message
        // special case for claude, prefill may be useful!
        const timestamp_string = `[${message.created_at.toString().split(' ')[0]} ${message.created_at.toLocaleTimeString()}]\n`
        const timestamp_length = instruct.timestamp ? await tokenizer(timestamp_string) : 0

        const name_string = message.role === 'user' ? 'User :' : 'Assistant :'
        const name_length = instruct.names ? await tokenizer(name_string) : 0
        const { attachments, hasImageNew } = getValidAttachments(
            message,
            completionFeats,
            instruct,
            hasImage
        )

        const swipe_len = message.id != -1 ? await chatTokenizer(message, index) : 0
        const len = swipe_len + name_length + timestamp_length

        if (total_length + len > maxLength && !bypassContextLength) break
        hasImage = hasImageNew

        const prefill = index === messages.length - 1 ? apiValues.prefill : ''

        if (!message.content && !prefill && index === messages.length - 1) {
            index--
            continue
        }
        const role =
            message.role === 'user' ? completionFeats.userRole : completionFeats.assistantRole

        if (message.attachments.length > 0) {
            Logger.warn('Image output is incomplete')

            const images: ContentTypes[] = await Promise.all(
                attachments.map(async (item) => {
                    const base64data = await readAsStringAsync(item.image_uri, {
                        encoding: 'base64',
                    })
                    const uri = item.image_uri.toLowerCase()
                    let mime_type = 'image/jpeg'
                    if (uri.endsWith('.png')) mime_type = 'image/png'
                    else if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) mime_type = 'image/jpeg'
                    else if (uri.endsWith('.webp')) mime_type = 'image/webp'
                    else if (uri.endsWith('.gif')) mime_type = 'image/gif'
                    return {
                        type: 'image_url',
                        image_url: {
                            url: 'data:' + mime_type + ';base64,' + base64data,
                        },
                    }
                })
            )

            messageBuffer.push({
                role: role,
                [completionFeats.contentName]: [
                    {
                        type: 'text',
                        text: replaceMacrosInternal(prefill + message.content, instruct),
                    },
                    ...images,
                ],
            })
        } else {
            messageBuffer.push({
                role: role,
                [completionFeats.contentName]: replaceMacrosInternal(
                    prefill + message.content,
                    instruct
                ),
            })
        }

        total_length += len
        index--
    }

    if (index >= messages.length - 1 && messages.length !== 0) {
        warnNoMessages()
    }

    if (apiConfig.features.useFirstMessage && apiValues.firstMessage)
        messageBuffer.push({
            role: completionFeats.userRole,
            [completionFeats.contentName]: apiValues.firstMessage,
        })

    const output = [...payload, ...messageBuffer.reverse()]
    Logger.info(`Approximate Context Size: ${total_length} tokens`)
    Logger.info(`${(performance.now() - delta).toFixed(2)}ms taken to build context`)
    if (mmkv.getBoolean(AppSettings.PrintContext)) Logger.info(JSON.stringify(output))

    return output
}

export const buildTextCompletionContext = async ({
    apiConfig,
    apiValues,
    messages,
    character,
    user,
    cache,
    instruct,
    tokenizer,
    chatTokenizer,
    maxLength,
    bypassContextLength,
    messageLoader,
}: ContextBuilderParams) => {
    const delta = performance.now()

    const { characterCache, userCache, instructCache } = cache

    const { systemPrompt, systemPromptLength } = getSystemPrompt({
        instruct,
        user,
        character,
        userCache,
        characterCache,
        instructCache,
        useSuffix: false,
    })

    let enhancedContext = ''
    let enhancedContextLength = 0
    try {
        const lastUserMessage = messages.findLast((m) => m.role === 'user')
        if (lastUserMessage?.content) {
            enhancedContext = await ChatHybridMemoryHooks.getEnhancedContext(
                lastUserMessage.content,
                5
            )
            if (enhancedContext) {
                enhancedContextLength = await tokenizer(enhancedContext)
            }
        }
    } catch (error) {
        Logger.debug('HybridMemory context enhancement failed: ' + error)
    }

    let payload = systemPrompt + enhancedContext
    const payloadLength = systemPromptLength + enhancedContextLength

    // suffix must be delayed for example messages
    let message_acc = ``
    let message_acc_length = 0
    let is_last = true
    let index = messages.length - 1

    const wrap_string = `\n`
    const wrap_length = instruct.wrap ? await tokenizer(wrap_string) : 0

    // we use this to check if the first message is reached
    // this is needed to check if examples should be added
    let first_message_reached = false

    // we require lengths for names if use_names is enabled
    for (const message of messages.reverse()) {
        const swipe_len = await chatTokenizer(message, index)
        // 新schema不支持swipes,直接使用message
        const swipe_data = message

        /** Accumulate total string length
         *  The context builder MUST retain context length below the
         *  context limit, especially for local gens to prevent truncation
         * **/

        let instruct_len =
            message.role === 'user'
                ? instructCache.input_prefix_length
                : is_last
                  ? instructCache.last_output_prefix_length
                  : instructCache.output_suffix_length

        // for last message, we want to skip the end token to allow the LLM to generate

        if (!is_last)
            instruct_len +=
                message.role === 'user'
                    ? instructCache.input_suffix_length
                    : instructCache.output_suffix_length

        const timestamp_string = `[${message.created_at.toString().split(' ')[0]} ${message.created_at.toLocaleTimeString()}]\n`
        const timestamp_length = instruct.timestamp ? await tokenizer(timestamp_string) : 0

        const name_string = message.role === 'user' ? 'User: ' : 'Assistant: '
        const name_length = instruct.names ? await tokenizer(name_string) : 0

        const shard_length = swipe_len + instruct_len + name_length + timestamp_length + wrap_length

        // check if within context window
        if (message_acc_length + payloadLength + shard_length > maxLength && !bypassContextLength) {
            break
        }

        // apply strings

        let message_shard =
            message.role === 'user'
                ? instruct.input_prefix
                : is_last
                  ? instruct.last_output_prefix
                  : instruct.output_prefix

        if (instruct.timestamp) message_shard += timestamp_string

        if (instruct.names) message_shard += name_string

        message_shard += message.content

        if (!is_last) {
            message_shard += `${message.role === 'user' ? instruct.input_suffix : instruct.output_suffix}`
        }

        if (instruct.wrap) {
            message_shard += wrap_string
        }

        first_message_reached = index === 0

        // ensure no more is_last checks after this
        is_last = false
        message_acc_length += shard_length
        message_acc = message_shard + message_acc
        index--
    }

    if (index >= messages.length - 1 && messages.length !== 0) {
        warnNoMessages()
    }

    const examples = character?.mes_example
    if (
        first_message_reached &&
        instruct.examples &&
        examples &&
        message_acc_length + payloadLength + characterCache.examples_length < maxLength
    ) {
        payload += examples
        message_acc_length += characterCache.examples_length
    }

    payload += instruct.system_suffix
    payload = replaceMacrosInternal(payload + message_acc, instruct)

    Logger.info(`Approximate Context Size: ${message_acc_length + payloadLength} tokens`)
    Logger.info(`${(performance.now() - delta).toFixed(2)}ms taken to build context`)

    if (mmkv.getBoolean(AppSettings.PrintContext)) Logger.info(payload)

    return payload
}
const thinkRule = {
    macro: /<think>[\s\S]*?<\/think>/g,
    value: '',
}

const getMacroRules = (instruct: InstructType) => {
    const data: Macro[] = []
    if (instruct.hide_think_tags) {
        data.push(thinkRule)
    }
    // for expansion
    return data
}

const replaceMacrosInternal = (data: string, instruct: InstructType) => {
    return replaceMacros(data, { extraMacros: getMacroRules(instruct) })
}

const getValidAttachments = (
    entry: ChatEntry,
    config: {
        type: 'chatCompletions'
        userRole: string
        systemRole: string
        assistantRole: string
        contentName: string
        supportsAudio?: boolean
        supportsImages?: boolean
    },
    instruct: InstructType,
    hasImage: boolean
) => {
    let hasImageNew = hasImage
    // 新schema只支持图片附件(image_uri字段),不支持音频
    const audioAttachments: typeof entry.attachments = []

    let imageAttachments: typeof entry.attachments = []
    if (instruct.send_images && config.supportsImages) {
        // 新schema中所有attachments都是图片
        const images = entry.attachments
        if (instruct.last_image_only && images.length > 0) {
            if (!hasImageNew) {
                hasImageNew = true
                imageAttachments = [images[0]]
            }
        } else {
            imageAttachments = images
        }
    }
    const attachments = [...audioAttachments, ...imageAttachments]
    return { hasImageNew, attachments }
}

export const getSystemPrompt = ({
    instruct,
    user,
    character,
    userCache,
    characterCache,
    instructCache,
    usePrefix = true,
    useSuffix = true,
}: {
    instruct: InstructType
    user?: CharacterCardData
    character?: CharacterCardData
    userCache: CharacterTokenCache
    characterCache: CharacterTokenCache
    instructCache: InstructTokenCache
    usePrefix?: boolean
    useSuffix?: boolean
}) => {
    let systemPrompt = instruct.system_prompt_format
    if (systemPrompt === undefined) {
        Logger.warn('System Prompt Format is undefined, falling back to default')
        systemPrompt = defaultSystemPromptFormat
    }
    if (systemPrompt === '') {
        Logger.warn('System Prompt Format is blank')
    }

    let systemPromptLength = 0
    const macros = [
        {
            macro: '{{system_prefix}}',
            value: (usePrefix && instruct.system_prefix) || '',
            length: instructCache.system_prefix_length,
        },
        {
            macro: '{{system_suffix}}',
            value: (useSuffix && instruct.system_suffix) || '',
            length: instructCache.system_suffix_length,
        },
        {
            macro: '{{system_prompt}}',
            value: instruct.system_prompt ?? '',
            length: instructCache.system_suffix_length,
        },
        {
            macro: '{{character_desc}}',
            value: character?.description ?? '',
            length: characterCache.description_length,
        },
        {
            macro: '{{user_desc}}',
            value: user?.description ?? '',
            length: userCache.description_length,
        },
        {
            macro: '{{personality}}',
            value: (instruct.personality && character?.personality) || '',
            length: instruct.personality ? characterCache.personality_length : 0,
        },
        {
            macro: '{{scenario}}',
            value: (instruct.scenario && character?.scenario) || '',
            length: instruct.scenario ? characterCache.scenario_length : 0,
        },
    ]
    macros.forEach((m) => {
        systemPrompt = systemPrompt.replaceAll(m.macro, m.value)
        systemPromptLength += m.length
    })
    return { systemPrompt, systemPromptLength }
}

const warnNoMessages = () => {
    Logger.warnToast('未添加消息。请查看日志。')
    Logger.warn(
        'No messages were added to the context. This can be caused by:\n- Generated Length is too high, lower it in Formatting\n- Your context length is too low\n- Your first message is too long'
    )
}
