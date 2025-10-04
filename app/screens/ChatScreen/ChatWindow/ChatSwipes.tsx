import { AntDesign } from '@expo/vector-icons'
import { continueResponse, regenerateResponse } from '@lib/engine/Inference'
import { Chats, useInference } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

type SwipesProps = {
    nowGenerating: boolean
    isGreeting: boolean
    index: number
}

const ChatSwipes: React.FC<SwipesProps> = ({ nowGenerating, isGreeting, index }) => {
    const styles = useStyles()
    const { color } = Theme.useTheme()

    const message = Chats.useMessageData(index)
    const messageId = message?.id

    if (index === 0 || isGreeting) return null

    return (
        <View style={styles.swipesItem}>
            <TouchableOpacity
                onPress={() => messageId && regenerateResponse(messageId)}
                onLongPress={() => messageId && regenerateResponse(messageId, false)}
                disabled={nowGenerating}
                style={styles.swipeButton}>
                <AntDesign
                    name="retweet"
                    size={20}
                    color={nowGenerating ? color.text._600 : color.text._300}
                />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => messageId && continueResponse(messageId)}
                disabled={nowGenerating}
                style={styles.swipeButton}>
                <AntDesign
                    name="forward"
                    size={20}
                    color={nowGenerating ? color.text._600 : color.text._300}
                />
            </TouchableOpacity>
        </View>
    )
}

export default ChatSwipes

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()
    return StyleSheet.create({
        swipesItem: {
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            flex: 1,
            marginTop: spacing.sm,
            zIndex: 32,
        },

        swipeButton: {
            alignItems: 'center',
            flex: 1,
            paddingVertical: spacing.sm,
        },
    })
}
