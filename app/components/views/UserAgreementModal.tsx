import { AppSettings } from '@lib/constants/GlobalValues'
import { mmkv } from '@lib/storage/MMKV'
import Alert from '@components/views/Alert'
import { useEffect, useState } from 'react'
import { BackHandler } from 'react-native'

export const useUserAgreement = () => {
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (checked) return

        const agreed = mmkv.getBoolean(AppSettings.UserAgreementAccepted)
        if (!agreed) {
            Alert.alert({
                title: '用户协议与免责声明',
                description:
                    '欢迎使用CompanionAI！\n\n使用前请仔细阅读并同意《用户服务协议》和《免责声明》。\n\n• 本应用仅供学习娱乐\n• 禁止用于违法用途\n• AI内容不代表开发者立场\n• 18岁以下请在监护人陪同下使用\n\n完整协议请查看"关于"页面',
                buttons: [
                    {
                        label: '拒绝并退出',
                        onPress: () => {
                            BackHandler.exitApp()
                        },
                        type: 'warning',
                    },
                    {
                        label: '同意并继续',
                        onPress: () => {
                            mmkv.set(AppSettings.UserAgreementAccepted, true)
                            setChecked(true)
                        },
                    },
                ],
            })
        } else {
            setChecked(true)
        }
    }, [checked])
}
