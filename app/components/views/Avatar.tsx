import { Image, ImageProps } from 'expo-image'

interface FallbackImageProps extends Omit<ImageProps, 'source' | 'onError'> {
    targetImage: string
}

const Avatar: React.FC<FallbackImageProps> = ({ targetImage, ...rest }) => {
    return (
        <Image
            {...rest}
            source={{ uri: targetImage }}
            placeholder={require('@assets/user.png')}
            cachePolicy="memory-disk"
            placeholderContentFit="contain"
            contentFit="cover"
            transition={150}
            recyclingKey={targetImage}
            priority="high"
        />
    )
}

export default Avatar
