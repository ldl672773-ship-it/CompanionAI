import { db as database } from '@db'
import { Tokenizer } from '@lib/engine/Tokenizer'
import { Storage } from '@lib/enums/Storage'
import { saveStringToDownload } from '@lib/utils/File'
import { replaceMacroBase } from '@lib/utils/Macros'
import { companions, chats, messages } from 'db/schema'
import { and, asc, desc, eq, gte, inArray, like, notExists, notInArray, sql } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { Asset } from 'expo-asset'
import { randomUUID } from 'expo-crypto'
import * as DocumentPicker from 'expo-document-picker'
import * as FS from 'expo-file-system'
import { useEffect } from 'react'
import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Logger } from './Logger'
import { createMMKVStorage } from '../storage/MMKV'
import { createPNGWithText, getPngChunkText } from '../utils/PNG'

export type CharInfo = {
    name: string
    id: number
    image_id: number
    last_modified: number
    latestSwipe?: string
    latestName?: string
    latestChat?: number
}

export type CharacterTokenCache = {
    otherName: string
    description_length: number
    examples_length: number
    personality_length: number
    scenario_length: number
}

type CharacterCardState = {
    card?: CharacterCardData
    tokenCache: CharacterTokenCache | undefined
    id: number | undefined
    updateCard: (card: CharacterCardData) => void
    setCard: (id: number) => Promise<string | undefined>
    unloadCard: () => void
    getImage: () => string
    updateImage: (sourceURI: string) => void
    getCache: (otherName: string) => Promise<CharacterTokenCache>
}

export type CharacterCardData = Awaited<ReturnType<typeof Characters.db.query.cardQuery>>

export namespace Characters {
    export const useUserStore = create<CharacterCardState>()(
        persist(
            (set, get) => ({
                id: undefined,
                card: undefined,
                tokenCache: undefined,
                setCard: async (id: number) => {
                    const card = await db.query.card(id)
                    if (card)
                        set((state) => ({ ...state, card: card, id: id, tokenCache: undefined }))
                    return card?.name
                },
                unloadCard: () => {
                    set((state) => ({
                        ...state,
                        id: undefined,
                        card: undefined,
                        tokenCache: undefined,
                    }))
                },
                updateCard: (card: CharacterCardData) => {
                    set((state) => ({ ...state, card: card }))
                },
                getImage: () => {
                    return getImageDir(get().card?.image_id ?? 0)
                },
                updateImage: async (sourceURI: string) => {
                    const id = get().id
                    const oldImageID = get().card?.image_id
                    const card = get().card
                    if (!id || !oldImageID || !card) {
                        Logger.errorToast('无法获取数据,发生严重错误!')
                        return
                    }
                    const imageID = Date.now()
                    await db.mutate.updateCardField('image_id', imageID, id)
                    await deleteImage(oldImageID)
                    await copyImage(sourceURI, imageID)
                    card.image_id = imageID
                    set((state) => ({ ...state, card: card }))
                },
                getCache: async (userName: string) => {
                    const cache = get().tokenCache
                    if (cache && cache?.otherName === userName) return cache

                    const card = get().card
                    if (!card)
                        return {
                            otherName: userName,
                            description_length: 0,
                            examples_length: 0,
                            personality_length: 0,
                            scenario_length: 0,
                        }
                    const description = replaceMacros(card.description)
                    const examples = replaceMacros(card.mes_example)
                    const personality = replaceMacros(card.personality)
                    const scenario = replaceMacros(card.scenario)

                    const getTokenCount = Tokenizer.getTokenizer()

                    const newCache: CharacterTokenCache = {
                        otherName: userName,
                        description_length: await getTokenCount(description),
                        examples_length: await getTokenCount(examples),
                        personality_length: await getTokenCount(personality),
                        scenario_length: await getTokenCount(scenario),
                    }

                    set((state) => ({ ...state, tokenCache: newCache }))
                    return newCache
                },
            }),
            {
                name: Storage.UserCard,
                storage: createMMKVStorage(),
                version: 2,
                partialize: (state) => ({ id: state.id, card: state.card }),
                migrate: async (persistedState: any, version) => {
                    if (version === 1) {
                        // migration from CharacterCardV2 to CharacterCardData
                        Logger.info('Migrating User Store to v2')
                        persistedState.id = undefined
                        persistedState.card = undefined
                    }
                },
            }
        )
    )

    export const useCharacterStore = create<CharacterCardState>()((set, get) => ({
        id: undefined,
        card: undefined,
        tokenCache: undefined,
        setCard: async (id: number) => {
            const card = await db.query.card(id)
            set((state) => ({ ...state, card: card, id: id, tokenCache: undefined }))
            return card?.name
        },
        updateCard: (card: CharacterCardData) => {
            set((state) => ({ ...state, card: card }))
        },
        unloadCard: () => {
            set((state) => ({
                ...state,
                id: undefined,
                card: undefined,
                tokenCache: undefined,
            }))
        },
        getImage: () => {
            return getImageDir(get().card?.image_id ?? 0)
        },
        updateImage: async (sourceURI: string) => {
            const id = get().id
            const oldImageID = get().card?.image_id
            const card = get().card
            if (!id || !oldImageID || !card) {
                Logger.errorToast('无法获取数据,发生严重错误!')
                return
            }
            const imageID = Date.now()
            await db.mutate.updateCardField('image_id', imageID, id)
            await deleteImage(oldImageID)
            await copyImage(sourceURI, imageID)
            card.image_id = imageID
            set((state) => ({ ...state, card: card }))
        },
        getCache: async (charName: string) => {
            const cache = get().tokenCache
            const card = get().card
            if (cache?.otherName && cache.otherName === useUserStore.getState().card?.name)
                return cache

            if (!card)
                return {
                    otherName: charName,
                    description_length: 0,
                    examples_length: 0,
                    personality_length: 0,
                    scenario_length: 0,
                }
            const description = replaceMacros(card.description)
            const examples = replaceMacros(card.mes_example)
            const personality = replaceMacros(card.personality)
            const scenario = replaceMacros(card.scenario)

            const getTokenCount = Tokenizer.getTokenizer()

            const newCache = {
                otherName: charName,
                description_length: await getTokenCount(description),
                examples_length: await getTokenCount(examples),
                personality_length: await getTokenCount(personality),
                scenario_length: await getTokenCount(scenario),
            }
            set((state) => ({ ...state, tokenCache: newCache }))
            return newCache
        },
    }))

    export namespace db {
        export namespace query {
            export const cardQuery = (charId: number) => {
                return database.query.companions.findFirst({
                    where: eq(companions.id, charId),
                })
            }

            export const card = async (charId: number): Promise<CharacterCardData | undefined> => {
                const data = await cardQuery(charId)
                return data
            }

            export const cardList = async (
                type: 'character' | 'user',
                orderBy: 'id' | 'modified' = 'id'
            ) => {
                const query = await database.query.companions.findMany({
                    columns: {
                        id: true,
                        name: true,
                        image_id: true,
                        last_modified: true,
                    },
                    with: {
                        chats: {
                            columns: {
                                id: true,
                                name: true,
                            },
                            limit: 1,
                            orderBy: desc(chats.updated_at),
                            with: {
                                messages: {
                                    columns: {
                                        id: true,
                                        content: true,
                                    },
                                    limit: 1,
                                    orderBy: desc(messages.id),
                                },
                            },
                        },
                    },
                    orderBy: orderBy === 'id' ? companions.id : desc(companions.last_modified),
                })

                return query.map((item) => ({
                    ...item,
                    latestChat: item.chats[0]?.id,
                    latestSwipe: item.chats[0]?.messages[0]?.content,
                    latestName: item.chats[0]?.name,
                    last_modified: item.last_modified ?? 0,
                }))
            }

            export const cardListQuery = (
                type: 'character' | 'user',
                orderBy: 'id' | 'modified' = 'id'
            ) => {
                return database.query.companions.findMany({
                    columns: {
                        id: true,
                        name: true,
                        image_id: true,
                        last_modified: true,
                    },
                    with: {
                        chats: {
                            columns: {
                                id: true,
                                name: true,
                            },
                            limit: 1,
                            orderBy: desc(chats.updated_at),
                            with: {
                                messages: {
                                    columns: {
                                        id: true,
                                        content: true,
                                    },
                                    limit: 1,
                                    orderBy: desc(messages.id),
                                },
                            },
                        },
                    },
                    orderBy: orderBy === 'id' ? companions.id : desc(companions.last_modified),
                })
            }

            export const cardListQueryWindow = (
                type: 'character' | 'user',
                orderBy: 'name' | 'modified' = 'modified',
                direction: 'desc' | 'asc' = 'desc',
                limit = 20,
                offset = 0,
                searchFilter: string = '',
                searchTags: string[] = [],
                hiddenTags: string[] = []
            ) => {
                const dir = direction === 'asc' ? asc : desc
                return database.query.companions.findMany({
                    columns: {
                        id: true,
                        name: true,
                        image_id: true,
                        last_modified: true,
                    },
                    where: (companions) => {
                        const search = searchFilter
                            ? like(companions.name, `%${searchFilter.trim().toLocaleLowerCase()}%`)
                            : undefined
                        return search ? and(search) : undefined
                    },
                    with: {
                        chats: {
                            columns: {
                                id: true,
                                name: true,
                            },
                            limit: 1,
                            orderBy: desc(chats.updated_at),
                            with: {
                                messages: {
                                    columns: {
                                        id: true,
                                        content: true,
                                    },
                                    limit: 1,
                                    orderBy: desc(messages.id),
                                },
                            },
                        },
                    },
                    orderBy:
                        orderBy === 'name' ? dir(companions.name) : dir(companions.last_modified),
                    limit: limit,
                    offset: offset,
                })
            }

            export const cardExists = async (charId: number) => {
                return await database.query.companions.findFirst({
                    where: eq(companions.id, charId),
                })
            }

            export const backgroundImageQuery = (charId: number) => {
                return database.query.companions.findFirst({
                    where: eq(companions.id, charId),
                    columns: { background_image: true },
                })
            }
        }

        export namespace mutate {
            export const createCard = async (
                name: string,
                type: 'user' | 'character' = 'character'
            ) => {
                const { data } = createBlankV2Card(name)

                const [{ id }, ..._] = await database
                    .insert(companions)
                    .values({ ...data })
                    .returning({ id: companions.id })
                return id
            }

            export const updateCard = async (card: CharacterCardData, cardID: number) => {
                if (!card) return

                try {
                    await database
                        .update(companions)
                        .set({
                            description: card.description,
                            first_mes: card.first_mes,
                            name: card.name,
                            personality: card.personality,
                            scenario: card.scenario,
                            mes_example: card.mes_example,
                        })
                        .where(eq(companions.id, cardID))
                } catch (e) {
                    Logger.warn(`${e}`)
                }
            }

            export const updateCardField = async (
                field: keyof NonNullable<CharacterCardData>,
                data: any,
                charId: number
            ) => {
                await database
                    .update(companions)
                    .set({ [field]: data })
                    .where(eq(companions.id, charId))
            }

            export const deleteCard = async (charID: number) => {
                const data = await database.query.companions.findFirst({
                    where: eq(companions.id, charID),
                    columns: { image_id: true, background_image: true },
                })
                if (data?.image_id) deleteImage(data.image_id)
                if (data?.background_image) deleteImage(data.background_image)

                await database.delete(companions).where(eq(companions.id, charID))
            }

            export const updateModified = async (charID: number) => {
                await database
                    .update(companions)
                    .set({ last_modified: Date.now() })
                    .where(eq(companions.id, charID))
            }

            export const createCharacter = async (card: CharacterCardV2, imageuri: string = '') => {
                const { data } = card
                const image_id = await database.transaction(async (tx) => {
                    try {
                        const [{ id, image_id }, ..._] = await tx
                            .insert(companions)
                            .values({
                                ...data,
                            })
                            .returning({ id: companions.id, image_id: companions.image_id })

                        return image_id
                    } catch (error) {
                        Logger.errorToast(`Rolling back due to error: ` + error)
                        tx.rollback()
                        return undefined
                    }
                })
                if (image_id && imageuri) await copyImage(imageuri, image_id)
            }

            export const duplicateCard = async (charId: number) => {
                const card = await db.query.card(charId)

                if (!card) {
                    Logger.errorToast('复制角色卡失败:卡片不存在')
                    return
                }

                const imageInfo = await FS.getInfoAsync(getImageDir(card.image_id))
                const cacheLoc = imageInfo.exists ? `${FS.cacheDirectory}${card.image_id}` : ''

                if (imageInfo.exists)
                    await FS.copyAsync({
                        from: getImageDir(card.image_id),
                        to: cacheLoc,
                    })

                const now = Date.now()
                card.last_modified = now
                card.image_id = now
                if (card.background_image) {
                    const backgroundId = Date.now()
                    await FS.copyAsync({
                        from: getImageDir(card.background_image),
                        to: getImageDir(backgroundId),
                    })
                    card.background_image = backgroundId
                }
                const cv2 = convertDBDataToCV2(card)
                if (!cv2) {
                    Logger.errorToast('复制角色卡失败')
                    return
                }
                await createCharacter(cv2, cacheLoc)
                    .then(() => Logger.info(`Card cloned: ${card.name}`))
                    .catch((e) => Logger.info(`Failed to clone card: ${e}`))
            }

            export const updateBackground = async (charId: number, imageURI: number) => {
                await database
                    .update(companions)
                    .set({ background_image: imageURI })
                    .where(eq(companions.id, charId))
            }

            export const deleteBackground = async (charId: number) => {
                await database
                    .update(companions)
                    .set({ background_image: null })
                    .where(eq(companions.id, charId))
            }
        }
    }

    export const importBackground = async (charId: number, oldBackground?: number | null) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                type: ['image/*', 'application/json'],
            })
            if (result.canceled) return
            const dir = result.assets[0].uri
            if (!dir) return
            const imageId = Date.now()
            if (oldBackground) {
                await deleteImage(oldBackground)
            }
            await copyImage(dir, imageId)
            await db.mutate.updateBackground(charId, imageId)
        } catch (e) {
            Logger.error(`Failed to import background`)
        }
    }

    export const deleteBackground = async (charId: number, imageId: number) => {
        try {
            await db.mutate.deleteBackground(charId)
            await deleteImage(imageId)
            Logger.info(`Deleted image with id: ` + imageId)
        } catch (e) {
            Logger.errorToast(`删除背景失败`)
            Logger.error(`Error: ` + e)
        }
    }

    export const deleteImage = async (imageID: number) => {
        await FS.deleteAsync(getImageDir(imageID), { idempotent: true })
    }

    export const copyImage = async (uri: string, imageID: number) => {
        await FS.copyAsync({
            from: uri,
            to: getImageDir(imageID),
        })
    }

    export const convertDBDataToCV2 = (data: NonNullable<CharacterCardData>): CharacterCardV2 => {
        const { id, ...rest } = data
        return {
            spec: 'chara_card_v2',
            spec_version: '2.0',
            data: {
                ...rest,
                tags: [],
                alternate_greetings: [],
                creator_notes: '',
                system_prompt: '',
                post_history_instructions: '',
                creator: '',
                character_version: '',
            },
        }
    }

    export const createCharacterFromImage = async (uri: string) => {
        const file = await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 })
        if (!file) {
            Logger.errorToast(`创建卡片失败 - 无法获取图片`)
            return
        }

        const card = getPngChunkText(file)

        if (card === undefined) {
            Logger.errorToast('未找到角色。')
            return
        }

        await createCharacterFromV2JSON(card, uri)
    }

    const createCharacterFromV1JSON = async (data: any, uri: string | undefined = undefined) => {
        const result = characterCardV1Schema.safeParse(data)
        if (result.error) {
            Logger.errorToast('无效的角色卡')
            return
        }
        const converted = createBlankV2Card(result.data.name, result.data)

        Logger.info(`Creating new character: ${result.data.name}`)
        return db.mutate.createCharacter(converted, uri)
    }

    const createCharacterFromV2JSON = async (data: any, uri: string | undefined = undefined) => {
        // check JSON def
        const result = characterCardV2Schema.safeParse(data)
        if (result.error) {
            Logger.warnToast('V2 解析失败,回退到 V1')
            return await createCharacterFromV1JSON(data, uri)
        }

        Logger.info(`Creating new character: ${result.data.data.name}`)
        return await db.mutate.createCharacter(result.data, uri)
    }

    export const importCharacter = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            type: ['image/*', 'application/json'],
            multiple: true,
        })
        if (result.canceled) return
        result.assets.map(async (item) => {
            const isPNG = item.mimeType?.includes('image/')
            const isJSON = item.mimeType?.includes('application/json')
            try {
                if (isJSON) {
                    const data = await FS.readAsStringAsync(item.uri)
                    await createCharacterFromV2JSON(JSON.parse(data))
                }

                if (isPNG) await createCharacterFromImage(item.uri)
            } catch (e) {
                Logger.error(`Failed to create card from '${item.name}': ${e}`)
            }
        })
    }

    export const exportCharacter = async (id: number) => {
        const dbcard = await db.query.card(id)
        if (!dbcard) {
            Logger.error('Exported card does not exist!')
            return
        }
        const imagePath = getImageDir(dbcard.image_id)
        // name can be empty string, should at least have something
        const exportedFileName = (dbcard.name ?? 'Character') + '.png'
        const cardString = JSON.stringify(convertDBDataToCV2(dbcard))
        const fileData = await FS.readAsStringAsync(imagePath, {
            encoding: FS.EncodingType.Base64,
        }).catch((e) => {
            Logger.error('Could not get file data for export: ' + JSON.stringify(e))
        })
        if (!fileData) return
        const exportData = createPNGWithText(cardString, fileData)
        await saveStringToDownload(exportData, exportedFileName, 'base64')
    }

    export const getImageDir = (imageId: number) => {
        return `${FS.documentDirectory}characters/${imageId}.png`
    }

    export const createDefaultCard = async () => {
        const filename = 'aibot'
        const pngName = filename + '.png'
        const cardDefaultDir = `${FS.documentDirectory}appAssets/${pngName}`

        try {
            const fileinfo = await FS.getInfoAsync(cardDefaultDir)
            if (!fileinfo.exists) {
                Logger.info('Importing default card.')
                const [asset] = await Asset.loadAsync(require('./../../assets/models/aibot.raw'))
                if (asset.localUri) await FS.copyAsync({ from: asset.localUri, to: cardDefaultDir })
            }
            await createCharacterFromImage(cardDefaultDir)
        } catch (e) {
            Logger.errorToast('创建默认角色失败')
            Logger.error('Error: ' + e)
        }
    }

    export const useCharacterUpdater = () => {
        const { id, updateCard } = useCharacterStore((state) => ({
            id: state.id,
            updateCard: state.updateCard,
        }))

        const { data } = useLiveQuery(db.query.cardQuery(id ?? -1))

        useEffect(() => {
            if (id && id === data?.id) {
                if (data) updateCard(data)
            }
        }, [data])
    }
}

const characterCardV1Schema = z.object({
    name: z.string(),
    description: z.string(),
    personality: z.string().catch(''),
    scenario: z.string().catch(''),
    first_mes: z.string().catch(''),
    mes_example: z.string().catch(''),
})

const characterCardV2DataSchema = z.object({
    name: z.string(),
    description: z.string().catch(''),
    personality: z.string().catch(''),
    scenario: z.string().catch(''),
    first_mes: z.string().catch(''),
    mes_example: z.string().catch(''),

    creator_notes: z.string().catch(''),
    system_prompt: z.string().catch(''),
    post_history_instructions: z.string().catch(''),
    creator: z.string().catch(''),
    character_version: z.string().catch(''),
    alternate_greetings: z.string().array().catch([]),
    tags: z.string().array().catch([]),
})

const characterCardV2Schema = z.object({
    spec: z.literal('chara_card_v2'),
    spec_version: z.literal('2.0'),
    data: characterCardV2DataSchema,
})

type CharaterCardV1 = z.infer<typeof characterCardV1Schema>

type CharacterCardV2Data = z.infer<typeof characterCardV2DataSchema>

type CharacterCardV2 = z.infer<typeof characterCardV2Schema>

const createBlankV2Card = (
    name: string,
    options: {
        description: string
        personality: string
        scenario: string
        first_mes: string
        mes_example: string
    } = { description: '', personality: '', scenario: '', first_mes: '', mes_example: '' }
): CharacterCardV2 => {
    return {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
            name: name,
            description: options.description,
            personality: options.personality,
            scenario: options.scenario,
            first_mes: options.first_mes,
            mes_example: options.mes_example,

            // New fields start here
            creator_notes: '',
            system_prompt: '',
            post_history_instructions: '',
            alternate_greetings: [],

            // May 8th additions
            tags: [],
            creator: '',
            character_version: '',
        },
    }
}

type Macro = {
    macro: string
    value: string
}

export const replaceMacros = (text: string) => {
    if (text === undefined) return ''
    let newText: string = text
    const charName = Characters.useCharacterStore.getState().card?.name ?? ''
    const userName = Characters.useUserStore.getState().card?.name ?? ''
    const rules: Macro[] = [
        { macro: '{{user}}', value: userName },
        { macro: '{{char}}', value: charName },
    ]
    for (const rule of rules) newText = replaceMacroBase(newText, { extraMacros: rules })
    return newText
}
