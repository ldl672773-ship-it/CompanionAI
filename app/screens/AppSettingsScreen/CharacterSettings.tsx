import ThemedButton from '@components/buttons/ThemedButton'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import { Characters } from '@lib/state/Characters'
import React from 'react'
import { View } from 'react-native'

const CharacterSettings = () => {
    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>角色管理</SectionTitle>
            <ThemedButton
                label="重新生成默认卡片"
                variant="secondary"
                onPress={() => {
                    Alert.alert({
                        title: `重新生成默认卡片`,
                        description: `这将在您的角色列表中添加默认的AI机器人卡片`,
                        buttons: [
                            { label: '取消' },
                            {
                                label: '创建默认卡片',
                                onPress: async () => await Characters.createDefaultCard(),
                            },
                        ],
                    })
                }}
            />
        </View>
    )
}

export default CharacterSettings
