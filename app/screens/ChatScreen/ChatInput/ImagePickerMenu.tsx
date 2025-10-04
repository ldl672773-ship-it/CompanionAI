import PopupMenu from '@components/views/PopupMenu'
import { Theme } from '@lib/theme/ThemeManager'
import { Logger } from '@lib/state/Logger'
import { pickImageFromCamera, pickImageFromLibrary, saveImageToAttachments } from '@lib/utils/ImageStorage'
import { getDocumentAsync } from 'expo-document-picker'
import React from 'react'
import { Attachment } from './index'

interface ImagePickerMenuProps {
    onImagesSelected: (uris: string[]) => void
}

const ImagePickerMenu: React.FC<ImagePickerMenuProps> = ({ onImagesSelected }) => {
    const { color } = Theme.useTheme()

    const handleCamera = async (menuRef: any) => {
        menuRef.current?.close()
        const uri = await pickImageFromCamera()
        if (uri) {
            try {
                const savedUri = await saveImageToAttachments(uri)
                onImagesSelected([savedUri])
            } catch (error) {
                Logger.errorToast('保存图片失败')
            }
        }
    }

    const handleLibrary = async (menuRef: any) => {
        menuRef.current?.close()
        const uri = await pickImageFromLibrary()
        if (uri) {
            try {
                const savedUri = await saveImageToAttachments(uri)
                onImagesSelected([savedUri])
            } catch (error) {
                Logger.errorToast('保存图片失败')
            }
        }
    }

    const handleFilePicker = async (menuRef: any) => {
        menuRef.current?.close()
        const result = await getDocumentAsync({
            type: 'image/*',
            multiple: true,
            copyToCacheDirectory: true,
        })
        if (result.canceled || result.assets.length < 1) return

        const uris = result.assets.map((asset) => asset.uri)
        onImagesSelected(uris)
    }

    return (
        <PopupMenu
            icon="paperclip"
            iconSize={20}
            options={[
                {
                    label: '拍照',
                    icon: 'camera',
                    onPress: handleCamera,
                },
                {
                    label: '相册',
                    icon: 'picture',
                    onPress: handleLibrary,
                },
                {
                    label: '文件',
                    icon: 'folder',
                    onPress: handleFilePicker,
                },
            ]}
            style={{
                color: color.text._400,
                padding: 8,
                backgroundColor: color.neutral._200,
                borderRadius: 16,
            }}
            placement="top"
        />
    )
}

export default ImagePickerMenu
