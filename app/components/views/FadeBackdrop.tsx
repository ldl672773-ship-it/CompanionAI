import { ReactNode } from 'react'
import { GestureResponderEvent, Pressable, StyleSheet } from 'react-native'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'

type FadeScreenProps = {
    handleOverlayClick?: (e: GestureResponderEvent) => void
    children?: ReactNode
}

const FadeBackrop: React.FC<FadeScreenProps> = ({ handleOverlayClick, children }) => {
    const onBackdropPress = (e: GestureResponderEvent) => {
        if (handleOverlayClick && e.target === e.currentTarget) handleOverlayClick(e)
    }
    return (
        <Animated.View
            entering={FadeIn.duration(200).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
            exiting={FadeOut.duration(150).easing(Easing.bezier(0.4, 0.0, 0.2, 1))}
            style={styles.absolute}>
            <Pressable onPress={onBackdropPress} style={styles.absolute}>
                {children}
            </Pressable>
        </Animated.View>
    )
}

export default FadeBackrop

const styles = StyleSheet.create({
    absolute: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
})
