import { SamplerID } from '@lib/constants/SamplerData'

import { APIConfiguration } from './APIBuilder.types'

export const defaultTemplates: APIConfiguration[] = [
    // Chat Completions (Vision/Audio)
    {
        version: 1,
        name: 'OpenAI (聊天补全/图像/音频)',

        defaultValues: {
            endpoint: 'https://api.openai.com/v1/chat/completions',
            modelEndpoint: 'https://api.openai.com/v1/models',
            prefill: '',
            firstMessage: '',
            key: '',
            model: undefined,
        },

        features: {
            usePrefill: false,
            useFirstMessage: false,
            useKey: true,
            useModel: true,
            multipleModels: false,
        },

        request: {
            requestType: 'stream',
            samplerFields: [
                { externalName: 'max_context_length', samplerID: SamplerID.CONTEXT_LENGTH },
                { externalName: 'max_tokens', samplerID: SamplerID.GENERATED_LENGTH },
                { externalName: 'stream', samplerID: SamplerID.STREAMING },
                { externalName: 'temperature', samplerID: SamplerID.TEMPERATURE },
                { externalName: 'top_p', samplerID: SamplerID.TOP_P },
                { externalName: 'presence_penalty', samplerID: SamplerID.PRESENCE_PENALTY },
                { externalName: 'frequency_penalty', samplerID: SamplerID.FREQUENCY_PENALTY },
                { externalName: 'seed', samplerID: SamplerID.SEED },
            ],
            completionType: {
                type: 'chatCompletions',
                userRole: 'user',
                systemRole: 'system',
                assistantRole: 'assistant',
                contentName: 'content',
                supportsAudio: true,
                supportsImages: true,
            },
            authHeader: 'Authorization',
            authPrefix: 'Bearer ',
            responseParsePattern: 'choices.0.delta.content',
            useStop: true,
            stopKey: 'stop',
            promptKey: 'messages',
            removeLength: true,
        },

        payload: {
            type: 'openai',
        },

        model: {
            useModelContextLength: false,
            nameParser: 'id',
            contextSizeParser: '',
            modelListParser: 'data',
        },

        ui: {
            editableCompletionPath: true,
            editableModelPath: true,
            selectableModel: true,
        },
    },

    // Chat Completions
    {
        version: 1,
        name: 'OpenAI (聊天补全)',

        defaultValues: {
            endpoint: 'https://api.openai.com/v1/chat/completions',
            modelEndpoint: 'https://api.openai.com/v1/models',
            prefill: '',
            firstMessage: '',
            key: '',
            model: undefined,
        },

        features: {
            usePrefill: false,
            useFirstMessage: false,
            useKey: true,
            useModel: true,
            multipleModels: false,
        },

        request: {
            requestType: 'stream',
            samplerFields: [
                { externalName: 'max_context_length', samplerID: SamplerID.CONTEXT_LENGTH },
                { externalName: 'max_tokens', samplerID: SamplerID.GENERATED_LENGTH },
                { externalName: 'stream', samplerID: SamplerID.STREAMING },
                { externalName: 'temperature', samplerID: SamplerID.TEMPERATURE },
                { externalName: 'top_p', samplerID: SamplerID.TOP_P },
                { externalName: 'presence_penalty', samplerID: SamplerID.PRESENCE_PENALTY },
                { externalName: 'frequency_penalty', samplerID: SamplerID.FREQUENCY_PENALTY },
                { externalName: 'seed', samplerID: SamplerID.SEED },
            ],
            completionType: {
                type: 'chatCompletions',
                userRole: 'user',
                systemRole: 'system',
                assistantRole: 'assistant',
                contentName: 'content',
            },
            authHeader: 'Authorization',
            authPrefix: 'Bearer ',
            responseParsePattern: 'choices.0.delta.content',
            useStop: true,
            stopKey: 'stop',
            promptKey: 'messages',
            removeLength: true,
        },

        payload: {
            type: 'openai',
        },

        model: {
            useModelContextLength: false,
            nameParser: 'id',
            contextSizeParser: '',
            modelListParser: 'data',
        },

        ui: {
            editableCompletionPath: true,
            editableModelPath: true,
            selectableModel: true,
        },
    },

    // Text Completions
    {
        version: 1,
        name: 'OpenAI (文本补全)',

        defaultValues: {
            endpoint: 'https://openai.com/chatgpt/api/chat',
            modelEndpoint: 'https://openai.com/chatgpt/api/models',
            prefill: '',
            firstMessage: '',
            key: '',
            model: undefined,
        },

        features: {
            usePrefill: false,
            useFirstMessage: false,
            useKey: true,
            useModel: false,
            multipleModels: false,
        },

        request: {
            requestType: 'stream',
            samplerFields: [
                { externalName: 'max_context_length', samplerID: SamplerID.CONTEXT_LENGTH },
                { externalName: 'max_tokens', samplerID: SamplerID.GENERATED_LENGTH },
                { externalName: 'stream', samplerID: SamplerID.STREAMING },
                { externalName: 'temperature', samplerID: SamplerID.TEMPERATURE },
                { externalName: 'min_p', samplerID: SamplerID.MIN_P },
                { externalName: 'top_a', samplerID: SamplerID.TOP_A },
                { externalName: 'top_p', samplerID: SamplerID.TOP_P },
                { externalName: 'top_k', samplerID: SamplerID.TOP_K },
                { externalName: 'smoothing_factor', samplerID: SamplerID.SMOOTHING_FACTOR },

                { externalName: 'tfs', samplerID: SamplerID.TAIL_FREE_SAMPLING },
                { externalName: 'seed', samplerID: SamplerID.SEED },
                { externalName: 'typical', samplerID: SamplerID.TYPICAL },
                { externalName: 'repetition_penalty', samplerID: SamplerID.REPETITION_PENALTY },
                {
                    externalName: 'repetition_penalty_range',
                    samplerID: SamplerID.REPETITION_PENALTY_RANGE,
                },
                { externalName: 'mirostat', samplerID: SamplerID.MIROSTAT_MODE },
                { externalName: 'mirostat_tau', samplerID: SamplerID.MIROSTAT_TAU },
                { externalName: 'mirostat_eta', samplerID: SamplerID.MIROSTAT_ETA },
                { externalName: 'grammar', samplerID: SamplerID.GRAMMAR_STRING },
                { externalName: 'ignore_eos', samplerID: SamplerID.BAN_EOS_TOKEN },
                { externalName: 'dynatemp_range', samplerID: SamplerID.DYNATEMP_RANGE },

                { externalName: 'frequency_penalty', samplerID: SamplerID.FREQUENCY_PENALTY },
                { externalName: 'presence_penalty', samplerID: SamplerID.PRESENCE_PENALTY },
                { externalName: 'skip_special_tokens', samplerID: SamplerID.SKIP_SPECIAL_TOKENS },
            ],
            completionType: {
                type: 'textCompletions',
            },
            authHeader: 'Authorization',
            authPrefix: 'Bearer ',
            responseParsePattern: 'choices.0.text',
            useStop: true,
            stopKey: 'stop',
            promptKey: 'prompt',
            removeLength: true,
        },

        payload: {
            type: 'openai',
        },

        model: {
            useModelContextLength: false,
            nameParser: 'id',
            contextSizeParser: '',
            modelListParser: 'data',
        },

        ui: {
            editableCompletionPath: true,
            editableModelPath: false,
            selectableModel: false,
        },
    },
]
