import Avatar from '@components/views/Avatar'
import { AppSettings } from '@lib/constants/GlobalValues'
import { useAvatarViewerStore } from '@lib/state/AvatarViewer'
import { Characters } from '@lib/state/Characters'
import { Chats } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'
import { ReactNode } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'

type ChatFrameProps = {
    children?: ReactNode
    index: number
    nowGenerating: boolean
    isLast?: boolean
}

const ChatFrame: React.FC<ChatFrameProps> = ({ children, index, nowGenerating, isLast }) => {
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()
    const [wide, _] = useMMKVBoolean(AppSettings.WideChatMode)
    const [alternate, __] = useMMKVBoolean(AppSettings.AlternatingChatMode)
    const message = Chats.useEntryData(index)
    const setShowViewer = useAvatarViewerStore((state) => state.setShow)
    const charImageId = Characters.useCharacterStore((state) => state.card?.image_id) ?? 0
    const userImageId = Characters.useUserStore((state) => state.card?.image_id) ?? 0

    const isUser = message.role === 'user'
    const timeStamp = message.created_at

    const rowDir = isUser && alternate ? 'row-reverse' : 'row'
    const align = isUser && alternate ? 'flex-end' : 'flex-start'
    if (wide)
        return (
            <View style={{ flex: 1, paddingHorizontal: 8 }}>
                <View
                    style={{
                        flexDirection: rowDir,
                        alignItems: 'center',
                        marginBottom: spacing.l,
                    }}>
                    <TouchableOpacity onPress={() => setShowViewer(true, isUser)}>
                        <Avatar
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: borderRadius.xl,
                                marginRight: isUser && alternate ? 0 : spacing.l,
                                marginLeft: isUser && alternate ? spacing.l : 0,
                            }}
                            targetImage={Characters.getImageDir(isUser ? userImageId : charImageId)}
                        />
                    </TouchableOpacity>
                    <View style={{ alignItems: align }}>
                        <Text
                            style={{
                                fontSize: fontSize.l,
                                color: color.text._100,
                            }}>
                            {isUser
                                ? 'User'
                                : (Characters.useCharacterStore.getState().card?.name ??
                                  'Assistant')}
                        </Text>
                        <View style={{ columnGap: 12, flexDirection: rowDir }}>
                            <Text style={{ fontSize: fontSize.s, color: color.text._400 }}>
                                {timeStamp.toLocaleTimeString()}
                            </Text>
                            <Text style={{ color: color.text._700, fontSize: fontSize.s }}>
                                #{index}
                            </Text>
                        </View>
                    </View>
                </View>
                {children}
            </View>
        )

    return (
        <View style={{ flexDirection: rowDir }}>
            <View
                style={{
                    alignItems: 'center',
                }}>
                <View style={{ rowGap: spacing.m, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setShowViewer(true, isUser)}>
                        <Avatar
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: borderRadius.xl,
                                marginLeft: spacing.sm,
                                marginRight: spacing.m,
                            }}
                            targetImage={Characters.getImageDir(isUser ? userImageId : charImageId)}
                        />
                    </TouchableOpacity>

                    <Text style={{ color: color.text._400 }}>#{index}</Text>
                </View>
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ marginBottom: spacing.m, alignItems: align }}>
                        <Text
                            style={{
                                fontSize: fontSize.l,
                                color: color.text._100,
                                marginRight: spacing.sm,
                            }}>
                            {isUser
                                ? 'User'
                                : (Characters.useCharacterStore.getState().card?.name ??
                                  'Assistant')}
                        </Text>
                        <Text style={{ fontSize: fontSize.s, color: color.text._400 }}>
                            {timeStamp.toLocaleTimeString()}
                        </Text>
                    </View>
                </View>
                {children}
            </View>
        </View>
    )
}

export default ChatFrame
