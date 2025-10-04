import Alert from '@components/views/Alert'
import PopupMenu, { MenuRef } from '@components/views/PopupMenu'
import { CharInfo, Characters } from '@lib/state/Characters'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

type CharacterEditPopupProps = {
    characterInfo: CharInfo
    nowLoading: boolean
    setNowLoading: (b: boolean) => void
}

const CharacterEditPopup: React.FC<CharacterEditPopupProps> = ({
    characterInfo,
    setNowLoading,
    nowLoading,
}) => {
    const router = useRouter()
    const { t } = useTranslation()

    const setCurrentCard = Characters.useCharacterStore((state) => state.setCard)

    const deleteCard = (menuRef: MenuRef) => {
        Alert.alert({
            title: t('characters.delete'),
            description: t('characters.deleteConfirm', { name: characterInfo.name }),
            buttons: [
                {
                    label: t('common.actions.cancel'),
                },
                {
                    label: t('characters.delete'),
                    onPress: async () => {
                        Characters.db.mutate.deleteCard(characterInfo.id ?? -1)
                    },
                    type: 'warning',
                },
            ],
        })
    }

    const cloneCard = (menuRef: MenuRef) => {
        Alert.alert({
            title: t('characters.clone'),
            description: t('characters.cloneConfirm', { name: characterInfo.name }),
            buttons: [
                {
                    label: t('common.actions.cancel'),
                },
                {
                    label: t('characters.clone'),
                    onPress: async () => {
                        setNowLoading(true)
                        await Characters.db.mutate.duplicateCard(characterInfo.id)
                        menuRef.current?.close()
                        setNowLoading(false)
                    },
                },
            ],
        })
    }

    const editCharacter = async (menuRef: MenuRef) => {
        if (nowLoading) return
        setNowLoading(true)
        await setCurrentCard(characterInfo.id)
        setNowLoading(false)
        menuRef.current?.close()
        router.push('/screens/CharacterEditorScreen')
    }

    return (
        <PopupMenu
            style={{ paddingHorizontal: 8 }}
            disabled={nowLoading}
            icon="edit"
            options={[
                { label: t('common.actions.edit'), icon: 'edit', onPress: editCharacter },
                { label: t('common.actions.copy'), icon: 'copy1', onPress: cloneCard },
                { label: t('common.actions.delete'), icon: 'delete', onPress: deleteCard, warning: true },
            ]}
        />
    )
}

export default CharacterEditPopup
