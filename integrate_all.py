#!/usr/bin/env python3
"""
CompanionAI 功能自动集成脚本
自动集成消息管理和图片发送功能
"""

import os
import sys
import shutil
from pathlib import Path

# 设置 UTF-8 输出
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

CA_DIR = Path("C:/CA")
BACKUP_SUFFIX = ".backup_auto"

def backup_file(filepath):
    """备份文件"""
    backup_path = str(filepath) + BACKUP_SUFFIX
    shutil.copy2(filepath, backup_path)
    print(f"[OK] 备份: {filepath.name}")
    return backup_path

def integrate_chatinput():
    """集成 ChatInput"""
    print("\n[1/3] 集成 ChatInput...")

    filepath = CA_DIR / "app/screens/ChatScreen/ChatInput/index.tsx"
    backup_file(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 添加导入
    import_line = "import { getDocumentAsync } from 'expo-document-picker'"
    if "import { sendMessageWithAttachments }" not in content:
        content = content.replace(
            import_line,
            import_line + "\nimport { sendMessageWithAttachments } from '@lib/state/ChatSendHelpers'"
        )

    chatopt_import = "import ChatOptions from './ChatInputOptions'"
    if "import ImagePickerMenu from './ImagePickerMenu'" not in content:
        content = content.replace(
            chatopt_import,
            chatopt_import + "\nimport ImagePickerMenu from './ImagePickerMenu'"
        )

    # 替换 handleSend
    old_handle = """    const handleSend = async () => {
        if (newMessage.trim() !== '' || attachments.length > 0) await addEntry('user', newMessage)
        const messageId = await addEntry('assistant', '')
        setNewMessage('')
        setAttachments([])
        if (messageId) generateResponse(messageId)
    }"""

    new_handle = """    const handleSend = async () => {
        if (newMessage.trim() !== '' || attachments.length > 0) {
            const attachmentUris = attachments.map((a) => a.uri)
            await sendMessageWithAttachments('user', newMessage, attachmentUris)
        }
        const messageId = await sendMessageWithAttachments('assistant', '', [])
        setNewMessage('')
        setAttachments([])
        if (messageId) generateResponse(messageId)
    }"""

    content = content.replace(old_handle, new_handle)

    # 替换 PopupMenu
    old_popup_start = """                            <PopupMenu
                                icon="paperclip"
                                iconSize={20}
                                options={[
                                    {
                                        label: 'Add Image',
                                        icon: 'picture',
                                        onPress: async (menuRef) => {
                                            menuRef.current?.close()
                                            const result = await getDocumentAsync({
                                                type: 'image/*',
                                                multiple: true,
                                                copyToCacheDirectory: true,
                                            })
                                            if (result.canceled || result.assets.length < 1) return

                                            const newAttachments = result.assets
                                                .map((item) => ({
                                                    uri: item.uri,
                                                    type: 'image',
                                                    name: item.name,
                                                }))
                                                .filter(
                                                    (item) =>
                                                        !attachments.some(
                                                            (a) => a.name === item.name
                                                        )
                                                ) as Attachment[]
                                            setAttachments([...attachments, ...newAttachments])
                                        },
                                    },
                                ]}
                                style={{
                                    color: color.text._400,
                                    padding: 8,
                                    backgroundColor: color.neutral._200,
                                    borderRadius: 16,
                                }}
                                placement="top"
                            />"""

    new_image_picker = """                            <ImagePickerMenu
                                onImagesSelected={(uris) => {
                                    const newAttachments = uris
                                        .map((uri) => ({
                                            uri: uri,
                                            type: 'image' as const,
                                            name: uri.split('/').pop() || 'image.jpg',
                                        }))
                                        .filter((item) => !attachments.some((a) => a.uri === item.uri))
                                    setAttachments([...attachments, ...newAttachments])
                                }}
                            />"""

    content = content.replace(old_popup_start, new_image_picker)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("[OK] ChatInput 集成完成")

def integrate_chatattachments():
    """集成 ChatAttachments"""
    print("\n[2/3] 集成 ChatAttachments...")

    filepath = CA_DIR / "app/screens/ChatScreen/ChatWindow/ChatAttachments.tsx"
    backup_file(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 添加导入
    if "import React, { useState } from 'react'" not in content:
        content = content.replace(
            "import { Chats } from '@lib/state/Chat'",
            "import { Chats } from '@lib/state/Chat'\nimport React, { useState } from 'react'\nimport { Pressable } from 'react-native'\nimport ImageViewer from './ImageViewer'"
        )
        content = content.replace(
            "import { Dimensions, View } from 'react-native'",
            "import { Dimensions, View } from 'react-native'"
        )

    # 添加状态
    content = content.replace(
        "    const message = Chats.useEntryData(index)",
        """    const message = Chats.useEntryData(index)
    const [viewerVisible, setViewerVisible] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string>('')"""
    )

    # 包裹 ScaledImage
    old_image = """                {message.attachments.map((item) => (
                    <ScaledImage
                        cachePolicy="none"
                        key={item.image_uri}
                        uri={item.image_uri}
                        style={{ height: Dimensions.get('window').height / 8, borderRadius: 8 }}
                    />
                ))}"""

    new_image = """                {message.attachments.map((item) => (
                    <Pressable key={item.image_uri} onPress={() => { setSelectedImage(item.image_uri); setViewerVisible(true) }}>
                        <ScaledImage
                            cachePolicy="none"
                            uri={item.image_uri}
                            style={{ height: Dimensions.get('window').height / 8, borderRadius: 8 }}
                        />
                    </Pressable>
                ))}"""

    content = content.replace(old_image, new_image)

    # 添加 ImageViewer
    content = content.replace(
        "            </View>\n        </View>\n    )",
        """            </View>

            <ImageViewer
                visible={viewerVisible}
                imageUri={selectedImage}
                onClose={() => setViewerVisible(false)}
            />
        </View>
    )"""
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("[OK] ChatAttachments 集成完成")

def integrate_chatquickactions():
    """集成 ChatQuickActions"""
    print("\n[3/3] 集成 ChatQuickActions...")

    filepath = CA_DIR / "app/screens/ChatScreen/ChatWindow/ChatQuickActions.tsx"
    backup_file(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 添加导入
    if "import { deleteMessagesAfterIndex" not in content:
        content = content.replace(
            "import { Logger } from '@lib/state/Logger'",
            "import { deleteMessagesAfterIndex, regenerateMessage } from '@lib/state/ChatMessageHelpers'\nimport { Logger } from '@lib/state/Logger'"
        )
        content = content.replace(
            "import { BackHandler, View } from 'react-native'",
            "import { Alert, BackHandler, View } from 'react-native'"
        )

    # 在编辑按钮后添加新按钮
    old_edit_button = """                        <Animated.View
                            entering={ZoomIn.duration(200)}
                            exiting={ZoomOut.duration(200)}>
                            <ThemedButton
                                variant="tertiary"
                                iconName="edit"
                                iconSize={24}
                                iconStyle={{
                                    color: color.text._500,
                                }}
                                onPress={handleEnableEdit}
                            />
                        </Animated.View>"""

    new_buttons = old_edit_button + """

                        <Animated.View
                            entering={ZoomIn.duration(200)}
                            exiting={ZoomOut.duration(200)}>
                            <ThemedButton
                                variant="tertiary"
                                iconName="reload1"
                                iconSize={24}
                                iconStyle={{ color: color.text._500 }}
                                onPress={() => {
                                    Alert.alert('回溯到此消息', '将删除此消息之后的所有内容,确定吗?', [
                                        { text: '取消', style: 'cancel' },
                                        {
                                            text: '确定',
                                            style: 'destructive',
                                            onPress: async () => {
                                                setShowOptions(undefined)
                                                await deleteMessagesAfterIndex(index)
                                                Logger.infoToast('已回溯')
                                            },
                                        },
                                    ])
                                }}
                            />
                        </Animated.View>

                        {swipe?.role === 'assistant' && (
                            <Animated.View
                                entering={ZoomIn.duration(200)}
                                exiting={ZoomOut.duration(200)}>
                                <ThemedButton
                                    variant="tertiary"
                                    iconName="reload"
                                    iconSize={24}
                                    iconStyle={{ color: color.text._500 }}
                                    onPress={async () => {
                                        setShowOptions(undefined)
                                        const success = await regenerateMessage(index)
                                        if (success) Logger.infoToast('正在重新生成...')
                                        else Logger.warnToast('只能重新生成AI回复')
                                    }}
                                />
                            </Animated.View>
                        )}"""

    content = content.replace(old_edit_button, new_buttons)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("[OK] ChatQuickActions 集成完成")

def main():
    print("=" * 50)
    print("CompanionAI 功能自动集成脚本")
    print("=" * 50)

    try:
        integrate_chatinput()
        integrate_chatattachments()
        integrate_chatquickactions()

        print("\n" + "=" * 50)
        print("[DONE] 所有集成完成!")
        print("=" * 50)
        print("\n备份文件后缀: " + BACKUP_SUFFIX)
        print("\n如需回滚,删除修改的文件并将备份文件重命名即可")

    except Exception as e:
        print(f"\n[ERROR] 错误: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
