import { Ionicons } from '@expo/vector-icons'
import { Theme } from '@lib/theme/ThemeManager'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

const CharSearchEmpty = () => {
    const { color, spacing, fontSize } = Theme.useTheme()
    const { t } = useTranslation()
    return (
        <View
            style={{
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing.m,
                flex: 1,
                alignItems: 'center',
                marginTop: spacing.xl3,
            }}>
            <Ionicons name="search" color={color.text._400} size={60} />
            <Text
                style={{
                    color: color.text._400,
                    marginTop: spacing.xl,
                    fontStyle: 'italic',
                    fontSize: fontSize.l,
                }}>
                {t('characters.searchEmpty')}
            </Text>
        </View>
    )
}

export default CharSearchEmpty
