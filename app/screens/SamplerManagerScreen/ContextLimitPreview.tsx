import { AntDesign, FontAwesome } from '@expo/vector-icons'
import { useContextLimit } from '@lib/hooks/ContextLimit'
import { Theme } from '@lib/theme/ThemeManager'
import React from 'react'
import { View, Text } from 'react-native'

interface ContextLimitPreviewProps {
    generatedLength: number
}

const ContextLimitPreview: React.FC<ContextLimitPreviewProps> = ({ generatedLength }) => {
    const { color } = Theme.useTheme()
    const contextLimit = useContextLimit()
    const leftover = Math.max(0, contextLimit - generatedLength)
    const limit = leftover / contextLimit
    const warning = leftover < Math.min(2048, 0.25 * contextLimit)
    const genLengthColor = warning ? color.error._300 : color.primary._200

    return (
        <View
            style={{
                borderRadius: 8,
                padding: 12,
                marginHorizontal: 4,
                rowGap: 8,
                borderWidth: 2,
                borderColor: color.primary._200,
            }}>
            <Text style={{ color: color.text._100 }}>
                Context Allocation <Text style={{ color: color.text._400 }}>({contextLimit})</Text>
            </Text>
            <View
                style={{
                    height: 12,
                    borderRadius: 12,
                    backgroundColor: genLengthColor,
                    borderWidth: 1,
                    borderColor: color.neutral._300,
                    overflow: 'hidden',
                }}>
                <View
                    style={{
                        height: '100%',
                        width: `${limit * 100}%`,
                        backgroundColor: color.primary._400,
                    }}
                />
            </View>
            <View style={{ flexDirection: 'row', columnGap: 24 }}>
                <Text style={{ color: color.text._400 }}>
                    <FontAwesome
                        name={warning ? 'exclamation-circle' : 'circle'}
                        style={{
                            color: warning ? color.error._300 : color.primary._400,
                        }}
                    />{' '}
                    Chat Context: {leftover}
                </Text>
                <Text style={{ color: color.text._400 }}>
                    <FontAwesome
                        name="circle"
                        style={{
                            color: genLengthColor,
                        }}
                    />{' '}
                    Generated: {generatedLength}
                </Text>
            </View>
            {warning && (
                <Text style={{ color: color.error._300 }}>
                    Low Chat Context will forget messages faster
                </Text>
            )}
        </View>
    )
}

export default ContextLimitPreview
