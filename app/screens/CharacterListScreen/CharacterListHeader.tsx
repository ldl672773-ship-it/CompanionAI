import ThemedButton from '@components/buttons/ThemedButton'
import StringArrayEditor from '@components/input/StringArrayEditor'
import ThemedTextInput from '@components/input/ThemedTextInput'
import { db } from '@db'
import { AppSettings } from '@lib/constants/GlobalValues'
import { CharacterSorter } from '@lib/state/CharacterSorter'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import { count, eq, notInArray } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { BackHandler, Text, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated'

import SortButton from './SortButton'

type CharacterListHeaderProps = {
    resultLength: number
}

const CharacterListHeader: React.FC<CharacterListHeaderProps> = ({ resultLength }) => {
    const { showSearch, setShowSearch, textFilter, setTextFilter, tagFilter, setTagFilter } =
        CharacterSorter.useSorter()

    const { color } = Theme.useTheme()

    useFocusEffect(
        useCallback(() => {
            if (!showSearch) return
            const handler = BackHandler.addEventListener('hardwareBackPress', () => {
                setTextFilter('')
                setShowSearch(false)
                return true
            })
            return () => handler.remove()
        }, [showSearch])
    )

    return (
        <>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingLeft: 16,
                    paddingRight: 8,
                    paddingBottom: 12,
                }}>
                <View
                    style={{
                        columnGap: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <Text
                        style={{
                            color: color.text._400,
                            fontSize: 16,
                        }}>
                        排序方式
                    </Text>
                    <SortButton type="modified" label="最近" />
                    <SortButton type="name" label="名称" />
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        columnGap: 12,
                    }}>
                    <ThemedButton
                        variant="tertiary"
                        iconName={showSearch ? 'close' : 'search1'}
                        onPress={() => {
                            setShowSearch(!showSearch)
                        }}
                        iconSize={24}
                    />
                </View>
            </View>

            <Animated.View layout={LinearTransition}>
                {showSearch && (
                    <Animated.View
                        entering={FadeInUp}
                        exiting={FadeOutUp}
                        style={{ paddingHorizontal: 12, paddingBottom: 8, rowGap: 8 }}>
                        <ThemedTextInput
                            containerStyle={{ flex: 0 }}
                            value={textFilter}
                            onChangeText={setTextFilter}
                            style={{
                                color: resultLength === 0 ? color.text._700 : color.text._100,
                            }}
                            placeholder="搜索名称..."
                        />
                        {textFilter && (
                            <Text
                                style={{
                                    marginTop: 8,
                                    color: color.text._400,
                                }}>
                                结果: {resultLength}
                            </Text>
                        )}
                    </Animated.View>
                )}
            </Animated.View>
        </>
    )
}

export default CharacterListHeader
