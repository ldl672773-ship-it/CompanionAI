import ThemedButton from '@components/buttons/ThemedButton'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'

const localDownload = async (path: string) => {
    console.log('localDownload not implemented:', path)
}

import appConfig from 'app.config'
import { reloadAppAsync } from 'expo'
import { getDocumentAsync } from 'expo-document-picker'
import { copyAsync, deleteAsync, documentDirectory } from 'expo-file-system'
import React from 'react'
import { Text, View } from 'react-native'

const appVersion = appConfig.expo.version

const exportDB = async (notify: boolean = true) => {
    await localDownload(`${documentDirectory}/SQLite/db.db`.replace('file://', ''))
        .then(() => {
            if (notify) Logger.infoToast('下载成功!')
        })
        .catch((e: string) => Logger.errorToast('复制数据库失败: ' + e))
}

const importDB = async (uri: string, name: string) => {
    const copyDB = async () => {
        await exportDB(false)
        await deleteAsync(`${documentDirectory}SQLite/db.db`).catch(() => {
            Logger.debug('Somehow the db is already deleted')
        })
        await copyAsync({
            from: uri,
            to: `${documentDirectory}SQLite/db.db`,
        })
            .then(() => {
                Logger.info('复制成功,正在重启。')
                reloadAppAsync()
            })
            .catch((e) => {
                Logger.errorToast(`导入数据库失败: ${e}`)
            })
    }

    const dbAppVersion = name.split('-')?.[0]
    if (dbAppVersion !== appVersion) {
        Alert.alert({
            title: `警告: 版本不同`,
            description: `导入的数据库文件应用版本 (${dbAppVersion}) 与已安装版本 (${appVersion}) 不同。\n\n导入此数据库可能会破坏或损坏数据库。建议使用相同的应用版本。`,
            buttons: [
                { label: '取消' },
                { label: '仍然导入', onPress: copyDB, type: 'warning' },
            ],
        })
    } else copyDB()
}

const DatabaseSettings = () => {
    const { color, spacing } = Theme.useTheme()
    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>数据库管理</SectionTitle>

            <Text
                style={{
                    color: color.text._500,
                    paddingBottom: spacing.xs,
                    marginBottom: spacing.m,
                }}>
                警告: 仅在确定数据库来自相同版本时导入!
            </Text>
            <ThemedButton
                label="导出数据库"
                variant="secondary"
                onPress={() => {
                    Alert.alert({
                        title: `导出数据库`,
                        description: `确定要导出数据库文件吗?\n\n文件将自动下载到下载目录`,
                        buttons: [
                            { label: '取消' },
                            { label: '导出数据库', onPress: exportDB },
                        ],
                    })
                }}
            />

            <ThemedButton
                label="导入数据库"
                variant="secondary"
                onPress={async () => {
                    getDocumentAsync({ type: ['application/*'] }).then(async (result) => {
                        if (result.canceled) return
                        Alert.alert({
                            title: `导入数据库`,
                            description: `确定要导入此数据库吗? 这可能会破坏当前数据库!\n\n将自动下载备份。\n\n应用将自动重启`,
                            buttons: [
                                { label: '取消' },
                                {
                                    label: '导入',
                                    onPress: () =>
                                        importDB(result.assets[0].uri, result.assets[0].name),
                                    type: 'warning',
                                },
                            ],
                        })
                    })
                }}
            />
        </View>
    )
}

export default DatabaseSettings
