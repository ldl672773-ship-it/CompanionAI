import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { Logger } from '@lib/state/Logger'

const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}attachments/`

/**
 * 确保附件目录存在
 */
const ensureDirectoryExists = async (): Promise<void> => {
    const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR)
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true })
    }
}

/**
 * 从相册选择图片
 */
export const pickImageFromLibrary = async (): Promise<string | null> => {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            Logger.warnToast('需要相册访问权限')
            return null
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
            allowsMultipleSelection: false,
        })

        if (result.canceled || result.assets.length === 0) {
            return null
        }

        return result.assets[0].uri
    } catch (error) {
        Logger.errorToast('选择图片失败')
        console.error('pickImageFromLibrary error:', error)
        return null
    }
}

/**
 * 从相机拍照
 */
export const pickImageFromCamera = async (): Promise<string | null> => {
    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            Logger.warnToast('需要相机访问权限')
            return null
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
        })

        if (result.canceled || result.assets.length === 0) {
            return null
        }

        return result.assets[0].uri
    } catch (error) {
        Logger.errorToast('拍照失败')
        console.error('pickImageFromCamera error:', error)
        return null
    }
}

/**
 * 保存图片到本地附件目录
 */
export const saveImageToAttachments = async (sourceUri: string): Promise<string> => {
    try {
        await ensureDirectoryExists()

        const timestamp = Date.now()
        const filename = `${timestamp}.jpg`
        const destinationUri = `${ATTACHMENTS_DIR}${filename}`

        await FileSystem.copyAsync({
            from: sourceUri,
            to: destinationUri,
        })

        return destinationUri
    } catch (error) {
        Logger.errorToast('保存图片失败')
        console.error('saveImageToAttachments error:', error)
        throw error
    }
}

/**
 * 删除附件图片
 */
export const deleteAttachmentImage = async (imageUri: string): Promise<void> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri)
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(imageUri)
        }
    } catch (error) {
        console.error('deleteAttachmentImage error:', error)
    }
}

/**
 * 清理所有附件图片
 */
export const clearAllAttachments = async (): Promise<void> => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR)
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(ATTACHMENTS_DIR, { idempotent: true })
            await ensureDirectoryExists()
        }
    } catch (error) {
        console.error('clearAllAttachments error:', error)
    }
}

/**
 * 获取图片尺寸信息
 */
export const getImageDimensions = async (
    imageUri: string
): Promise<{ width: number; height: number } | null> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri)
        if (!fileInfo.exists) {
            return null
        }

        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                resolve({ width: img.width, height: img.height })
            }
            img.onerror = () => {
                resolve(null)
            }
            img.src = imageUri
        })
    } catch (error) {
        console.error('getImageDimensions error:', error)
        return null
    }
}
