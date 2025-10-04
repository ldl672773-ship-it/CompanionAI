import ThemedButton from '@components/buttons/ThemedButton'
import { Chats, useInference } from '@lib/state/Chat'
import { deleteMessagesAfterIndex, regenerateMessage } from '@lib/state/ChatMessageHelpers'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import React from 'react'
import { Alert, View } from 'react-native'
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'

interface ChatMessageActionsProps {
    index: number
    onClose: () => void
}

const ChatMessageActions: React.FC<ChatMessageActionsProps> = ({ index, onClose }) => {
    const { color } = Theme.useTheme()
    const { t } = useTranslation()
    const message = Chats.useEntryData(index)
    const nowGenerating = useInference((state) => state.nowGenerating)

    const handleRollback = () => {
        Alert.alert(t('chat.rollbackTitle'), t('chat.rollbackDescription'), [
            { text: t('common.actions.cancel'), style: 'cancel' },
            {
                text: t('common.actions.confirm'),
                style: 'destructive',
                onPress: async () => {
                    onClose()
                    await deleteMessagesAfterIndex(index)
                    Logger.infoToast(t('chat.rollbackSuccess'))
                },
            },
        ])
    }

    const handleRegenerate = async () => {
        onClose()
        const success = await regenerateMessage(index)
        if (success) {
            Logger.infoToast(t('chat.regenerating'))
        } else {
            Logger.warnToast(t('chat.onlyRegenerateAI'))
        }
    }

    const isAssistant = message?.role === 'assistant'

    return (
        <View style={{ flexDirection: 'row', columnGap: 16 }}>
            <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
                <ThemedButton
                    variant="tertiary"
                    iconName="reload1"
                    iconSize={24}
                    iconStyle={{ color: color.text._500 }}
                    onPress={handleRollback}
                    disabled={nowGenerating}
                />
            </Animated.View>

            {isAssistant && (
                <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
                    <ThemedButton
                        variant="tertiary"
                        iconName="reload"
                        iconSize={24}
                        iconStyle={{ color: color.text._500 }}
                        onPress={handleRegenerate}
                        disabled={nowGenerating}
                    />
                </Animated.View>
            )}
        </View>
    )
}

export default ChatMessageActions
