import SupportButton from '@components/buttons/SupportButton'
import ThemedButton from '@components/buttons/ThemedButton'
import HeaderTitle from '@components/views/HeaderTitle'
import { AppSettings } from '@lib/constants/GlobalValues'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import appConfig from 'app.config'
import React, { useState } from 'react'
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'

const AboutScreen = () => {
    const styles = useStyles()
    const { spacing } = Theme.useTheme()
    const [counter, setCounter] = useState<number>(0)
    const [devMode, setDevMode] = useMMKVBoolean(AppSettings.DevMode)

    const updateCounter = () => {
        if (devMode) return
        if (counter === 6) {
            Logger.infoToast(`已启用开发者模式`)
            setDevMode(true)
        }
        setCounter(counter + 1)
    }

    const version = 'v' + appConfig.expo.version
    return (
        <View style={styles.container}>
            <HeaderTitle title="关于" />
            <TouchableOpacity activeOpacity={0.8} onPress={updateCounter}>
                <Image source={require('../../assets/images/icon.png')} style={styles.icon} />
            </TouchableOpacity>

            <Text style={styles.titleText}>AI伴聊</Text>
            <Text style={styles.subtitleText}>
                版本 {version} {devMode && '[开发者模式]'}
            </Text>
            <Text style={{ ...styles.subtitleText, marginTop: 4 }}>CompanionAI</Text>
            {devMode && (
                <ThemedButton
                    label="禁用开发者模式"
                    variant="critical"
                    buttonStyle={{
                        marginTop: spacing.xl,
                    }}
                    onPress={() => {
                        setCounter(0)
                        setDevMode(false)
                        Logger.info('已禁用开发者模式')
                    }}
                />
            )}

            <Text style={styles.body}>
                AI伴聊由LDL开发，基于ChatterUI（Vali-98）
            </Text>
            <Text style={{ ...styles.body, fontSize: 12, marginTop: spacing.s }}>
                开源协议：AGPL-3.0
            </Text>
            <Text style={{ marginBottom: spacing.xl2, marginTop: spacing.xl, ...styles.body }}>
                本应用完全免费且开源。如果您喜欢这个应用，可以自愿赞助支持开发！
            </Text>
            <Text style={{ ...styles.body, marginBottom: spacing.s, fontSize: 12, color: '#FF6B6B' }}>
                ⚠️ 赞助说明（重要）
            </Text>
            <Text style={{ ...styles.body, marginBottom: spacing.m, fontSize: 11 }}>
                • 赞助完全自愿，无任何回报承诺{'\n'}
                • 不影响应用使用，无特权或功能解锁{'\n'}
                • 通过个人微信收款，无法提供发票{'\n'}
                • 赞助后无法退款，请理性支持
            </Text>

            <SupportButton />

            <Text style={styles.body}>遇到问题?在此报告:</Text>
            <Text style={styles.subtitleText}>(别忘了添加您的日志!)</Text>

            <View style={{ flexDirection: 'row', gap: spacing.m, marginTop: spacing.m }}>
                <ThemedButton
                    variant="secondary"
                    label="Github仓库"
                    iconName="github"
                    iconSize={20}
                    onPress={() => {
                        Linking.openURL('https://github.com/LDL672773-发货/CompanionAI')
                    }}
                />
                <ThemedButton
                    variant="tertiary"
                    label="原项目"
                    iconName="link"
                    iconSize={18}
                    onPress={() => {
                        Linking.openURL('https://github.com/Vali-98/ChatterUI')
                    }}
                />
            </View>
            <ThemedButton
                buttonStyle={{ marginTop: spacing.xl }}
                variant="secondary"
                label="用户协议与免责声明"
                iconName="filetext1"
                iconSize={18}
                onPress={() => {
                    Linking.openURL('https://github.com/LDL672773-发货/CompanionAI/blob/main/LEGAL_DOCS.md')
                }}
            />
        </View>
    )
}

export default AboutScreen

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()

    return StyleSheet.create({
        container: {
            paddingHorizontal: spacing.xl3,
            paddingBottom: spacing.xl2,
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
        },
        titleText: { color: color.text._100, fontSize: 32, marginTop: 16 },
        subtitleText: { color: color.text._400 },
        body: { color: color.text._100, marginTop: spacing.l, textAlign: 'center' },
        icon: {
            width: 120,
            height: 120,
            backgroundColor: 'black',
            // eslint-disable-next-line internal/enforce-spacing-values
            borderRadius: 60,
        },
    })
}
