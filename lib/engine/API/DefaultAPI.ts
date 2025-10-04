import { SamplerID } from '@lib/constants/SamplerData'

import { APIConfiguration } from './APIBuilder.types'

export const defaultTemplates: APIConfiguration[] = [
    // OpenAI Compatible
    {
        version: 1,
        name: 'OpenAI',

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
]
