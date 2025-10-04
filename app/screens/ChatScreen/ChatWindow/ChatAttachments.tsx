import ScaledImage from '@components/views/ScaledImage'
import { Chats } from '@lib/state/Chat'
import React, { useState } from 'react'
import { Pressable } from 'react-native'
import ImageViewer from './ImageViewer'
import { Dimensions, View } from 'react-native'

type ChatAttachmentsProps = {
    index: number
}

const ChatAttachments: React.FC<ChatAttachmentsProps> = ({ index }) => {
    const message = Chats.useEntryData(index)
    const [viewerVisible, setViewerVisible] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string>('')

    if (message.attachments.length < 1) return null
    return (
        <View style={{ rowGap: 8 }}>
            <View
                style={{
                    paddingVertical: 4,
                    rowGap: 8,
                    columnGap: 8,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                }}>
                {message.attachments.map((item) => (
                    <Pressable key={item.image_uri} onPress={() => { setSelectedImage(item.image_uri); setViewerVisible(true) }}>
                        <ScaledImage
                            cachePolicy="none"
                            uri={item.image_uri}
                            style={{ height: Dimensions.get('window').height / 8, borderRadius: 8 }}
                        />
                    </Pressable>
                ))}
            </View>

            <ImageViewer
                visible={viewerVisible}
                imageUri={selectedImage}
                onClose={() => setViewerVisible(false)}
            />
        </View>
    )
}

export default ChatAttachments
