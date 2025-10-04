import Alert from '@components/views/Alert'
import { FontAwesome } from '@expo/vector-icons'
import { Theme } from '@lib/theme/ThemeManager'
import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { Logger } from '@lib/state/Logger'

import ThemedButton from './ThemedButton'

const SupportButton = () => {
    const theme = Theme.useTheme()

    const handleSupport = () => {
        Alert.alert({
            title: '赞助支持',
            description: '感谢您的支持！请通过微信扫码赞助。\n\n⚠️ 重要提示：\n• 赞助完全自愿，无任何回报\n• 赞助后无法退款\n• 请理性支持，量力而行',
            buttons: [
                { label: '取消' },
                {
                    label: '复制微信号',
                    onPress: async () => {
                        await Clipboard.setStringAsync('Eriyi7799')
                        Logger.infoToast('微信号已复制，请在微信中添加好友')
                    },
                },
            ],
        })
    }

    return (
        <ThemedButton
            onPress={handleSupport}
            variant="secondary"
            label="自愿赞助支持"
            icon={<FontAwesome name="heart" size={16} color={theme.color.primary._700} />}
        />
    )
}

export default SupportButton
