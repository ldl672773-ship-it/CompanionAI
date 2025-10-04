#!/bin/bash

# CompanionAI 功能集成脚本
# 自动集成消息管理和图片发送功能

set -e

echo "========================================="
echo "CompanionAI 功能自动集成脚本"
echo "========================================="

# 备份原始文件
echo ""
echo "[1/4] 备份原始文件..."
cp C:/CA/app/screens/ChatScreen/ChatInput/index.tsx C:/CA/app/screens/ChatScreen/ChatInput/index.tsx.backup
cp C:/CA/app/screens/ChatScreen/ChatWindow/ChatAttachments.tsx C:/CA/app/screens/ChatScreen/ChatWindow/ChatAttachments.tsx.backup
cp C:/CA/app/screens/ChatScreen/ChatWindow/ChatQuickActions.tsx C:/CA/app/screens/ChatScreen/ChatWindow/ChatQuickActions.tsx.backup
echo "✅ 备份完成"

# 集成 ChatInput
echo ""
echo "[2/4] 集成 ChatInput..."

# 读取原文件
CHATINPUT_FILE="C:/CA/app/screens/ChatScreen/ChatInput/index.tsx"

# 使用 sed 添加导入
sed -i '13 a import { sendMessageWithAttachments } from '"'"'@lib/state/ChatSendHelpers'"'"'' "$CHATINPUT_FILE"
sed -i '29 a import ImagePickerMenu from '"'"'./ImagePickerMenu'"'"'' "$CHATINPUT_FILE"

# 替换 handleSend 函数
sed -i '/const handleSend = async/,/^    }/c\
    const handleSend = async () => {\
        if (newMessage.trim() !== '"'"''"'"' || attachments.length > 0) {\
            const attachmentUris = attachments.map((a) => a.uri)\
            await sendMessageWithAttachments('"'"'user'"'"', newMessage, attachmentUris)\
        }\
        const messageId = await sendMessageWithAttachments('"'"'assistant'"'"', '"'"''"'"', [])\
        setNewMessage('"'"''"'"')\
        setAttachments([])\
        if (messageId) generateResponse(messageId)\
    }' "$CHATINPUT_FILE"

# 替换 PopupMenu 为 ImagePickerMenu
sed -i '/<PopupMenu/,/\/>/c\
                            <ImagePickerMenu\
                                onImagesSelected={(uris) => {\
                                    const newAttachments = uris\
                                        .map((uri) => ({\
                                            uri: uri,\
                                            type: '"'"'image'"'"' as const,\
                                            name: uri.split('"'"'/'"'"').pop() || '"'"'image.jpg'"'"',\
                                        }))\
                                        .filter(\
                                            (item) =>\
                                                !attachments.some(\
                                                    (a) => a.uri === item.uri\
                                                )\
                                        )\
                                    setAttachments([...attachments, ...newAttachments])\
                                }}\
                            />' "$CHATINPUT_FILE"

echo "✅ ChatInput 集成完成"

# 集成 ChatAttachments
echo ""
echo "[3/4] 集成 ChatAttachments..."

CHATATTACH_FILE="C:/CA/app/screens/ChatScreen/ChatWindow/ChatAttachments.tsx"

# 添加导入
sed -i '2 a import React, { useState } from '"'"'react'"'"'' "$CHATATTACH_FILE"
sed -i '3 a import { Pressable } from '"'"'react-native'"'"'' "$CHATATTACH_FILE"
sed -i '4 a import ImageViewer from '"'"'./ImageViewer'"'"'' "$CHATATTACH_FILE"

# 在组件内添加状态
sed -i '/const message = Chats.useEntryData(index)/a\
    const [viewerVisible, setViewerVisible] = useState(false)\
    const [selectedImage, setSelectedImage] = useState<string>('"'"''"'"')' "$CHATATTACH_FILE"

# 包裹 ScaledImage
sed -i '/<ScaledImage/i\                    <Pressable key={item.image_uri} onPress={() => { setSelectedImage(item.image_uri); setViewerVisible(true) }}>' "$CHATATTACH_FILE"
sed -i '/<ScaledImage/,/\/>/a\                    </Pressable>' "$CHATATTACH_FILE"

# 添加 ImageViewer
sed -i '/<\/View>/i\            <ImageViewer\
                visible={viewerVisible}\
                imageUri={selectedImage}\
                onClose={() => setViewerVisible(false)}\
            />' "$CHATATTACH_FILE"

echo "✅ ChatAttachments 集成完成"

# 集成 ChatQuickActions
echo ""
echo "[4/4] 集成 ChatQuickActions..."

QUICKACTIONS_FILE="C:/CA/app/screens/ChatScreen/ChatWindow/ChatQuickActions.tsx"

# 添加导入
sed -i '5 a import { deleteMessagesAfterIndex, regenerateMessage } from '"'"'@lib/state/ChatMessageHelpers'"'"'' "$QUICKACTIONS_FILE"
sed -i '11 a import { Alert } from '"'"'react-native'"'"'' "$QUICKACTIONS_FILE"

# 在编辑按钮后添加新按钮(第174行后)
sed -i '/iconName="edit"/,/\/>/a\
                        </Animated.View>\
\
                        <Animated.View\
                            entering={ZoomIn.duration(200)}\
                            exiting={ZoomOut.duration(200)}>\
                            <ThemedButton\
                                variant="tertiary"\
                                iconName="reload1"\
                                iconSize={24}\
                                iconStyle={{ color: color.text._500 }}\
                                onPress={() => {\
                                    Alert.alert('"'"'回溯到此消息'"'"', '"'"'将删除此消息之后的所有内容,确定吗?'"'"', [\
                                        { text: '"'"'取消'"'"', style: '"'"'cancel'"'"' },\
                                        {\
                                            text: '"'"'确定'"'"',\
                                            style: '"'"'destructive'"'"',\
                                            onPress: async () => {\
                                                setShowOptions(undefined)\
                                                await deleteMessagesAfterIndex(index)\
                                                Logger.infoToast('"'"'已回溯'"'"')\
                                            },\
                                        },\
                                    ])\
                                }}\
                            />\
                        </Animated.View>\
\
                        {swipe?.role === '"'"'assistant'"'"' && (\
                            <Animated.View\
                                entering={ZoomIn.duration(200)}\
                                exiting={ZoomOut.duration(200)}>\
                                <ThemedButton\
                                    variant="tertiary"\
                                    iconName="reload"\
                                    iconSize={24}\
                                    iconStyle={{ color: color.text._500 }}\
                                    onPress={async () => {\
                                        setShowOptions(undefined)\
                                        const success = await regenerateMessage(index)\
                                        if (success) Logger.infoToast('"'"'正在重新生成...'"'"')\
                                        else Logger.warnToast('"'"'只能重新生成AI回复'"'"')\
                                    }}\
                                />\
                            </Animated.View>\
                        )}\
\
                        <Animated.View' "$QUICKACTIONS_FILE"

echo "✅ ChatQuickActions 集成完成"

echo ""
echo "========================================="
echo "✅ 所有集成完成!"
echo "========================================="
echo ""
echo "备份文件位置:"
echo "  - ChatInput/index.tsx.backup"
echo "  - ChatAttachments.tsx.backup"
echo "  - ChatQuickActions.tsx.backup"
echo ""
echo "如需回滚,运行:"
echo "  bash C:/CA/rollback_features.sh"
echo ""
