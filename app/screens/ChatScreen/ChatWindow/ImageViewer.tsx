import { Theme } from '@lib/theme/ThemeManager'
import { Image } from 'expo-image'
import React, { useState } from 'react'
import { Dimensions, Modal, Pressable, View, StyleSheet } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ThemedButton from '@components/buttons/ThemedButton'

interface ImageViewerProps {
    visible: boolean
    imageUri: string
    onClose: () => void
}

const ImageViewer: React.FC<ImageViewerProps> = ({ visible, imageUri, onClose }) => {
    const { color } = Theme.useTheme()
    const insets = useSafeAreaInsets()
    const { width, height } = Dimensions.get('window')

    const scale = useSharedValue(1)
    const savedScale = useSharedValue(1)
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale
        })
        .onEnd(() => {
            savedScale.value = scale.value
            if (scale.value < 1) {
                scale.value = withSpring(1)
                savedScale.value = 1
            }
        })

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX
            translateY.value = e.translationY
        })
        .onEnd(() => {
            translateX.value = withSpring(0)
            translateY.value = withSpring(0)
        })

    const composed = Gesture.Simultaneous(pinchGesture, panGesture)

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }))

    const handleClose = () => {
        scale.value = 1
        savedScale.value = 1
        translateX.value = 0
        translateY.value = 0
        onClose()
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleClose}>
            <Pressable style={styles.backdrop} onPress={handleClose}>
                <View style={[styles.container, { paddingTop: insets.top }]}>
                    <View style={styles.header}>
                        <ThemedButton
                            iconName="close"
                            iconSize={24}
                            onPress={handleClose}
                            buttonStyle={{
                                backgroundColor: color.neutral._800 + 'cc',
                                padding: 8,
                                borderRadius: 20,
                            }}
                            iconStyle={{ color: color.neutral._100 }}
                        />
                    </View>

                    <GestureDetector gesture={composed}>
                        <Animated.View style={[styles.imageContainer, animatedStyle]}>
                            <Image
                                source={{ uri: imageUri }}
                                style={{
                                    width: width,
                                    height: height * 0.8,
                                }}
                                contentFit="contain"
                            />
                        </Animated.View>
                    </GestureDetector>
                </View>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})

export default ImageViewer
