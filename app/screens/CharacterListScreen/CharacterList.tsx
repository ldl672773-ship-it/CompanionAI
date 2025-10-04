import Drawer from '@components/views/Drawer'
import HeaderButton from '@components/views/HeaderButton'
import HeaderTitle from '@components/views/HeaderTitle'
import { CharacterSorter } from '@lib/state/CharacterSorter'
import { Characters, CharInfo } from '@lib/state/Characters'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useState } from 'react'
import { View } from 'react-native'
import { FlashList } from '@shopify/flash-list'

import CharacterListHeader from './CharacterListHeader'
import CharacterListing from './CharacterListing'
import CharacterNewMenu from './CharacterNewMenu'
import CharactersEmpty from './CharactersEmpty'
import CharactersSearchEmpty from './CharactersSearchEmpty'

const PAGE_SIZE = 30

const CharacterList: React.FC = () => {
    const [nowLoading, setNowLoading] = useState(false)
    const { showSearch, searchType, searchOrder, tagFilter, textFilter } =
        CharacterSorter.useSorter()
    const [pages, setPages] = useState(3)
    const [previousLength, setPreviousLength] = useState(0)
    const { data, updatedAt } = useLiveQuery(
        Characters.db.query.cardListQueryWindow(
            'character',
            searchType,
            searchOrder,
            PAGE_SIZE * pages,
            0,
            textFilter,
            tagFilter,
            []
        ),
        [searchType, searchOrder, textFilter, tagFilter, pages]
    )
    const characterList: CharInfo[] =
        data?.map((item) => ({
            ...item,
            latestChat: item.chats?.[0]?.id,
            latestSwipe: item.chats?.[0]?.messages?.[0]?.content,
            latestName: item.chats?.[0]?.name,
            last_modified: item.last_modified ?? 0,
        })) ?? []

    return (
        <View style={{ paddingTop: 16, paddingHorizontal: 8, flex: 1 }}>
            <HeaderTitle />
            <HeaderButton
                headerLeft={() => <Drawer.Button drawerID={Drawer.ID.SETTINGS} />}
                headerRight={() => (
                    <CharacterNewMenu nowLoading={nowLoading} setNowLoading={setNowLoading} />
                )}
            />

            <View style={{ flex: 1 }}>
                {(characterList.length > 0 || showSearch) && (
                    <CharacterListHeader resultLength={characterList.length} />
                )}

                <FlashList
                    estimatedItemSize={80}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 4 }}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    data={characterList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <CharacterListing
                            character={item}
                            nowLoading={nowLoading}
                            setNowLoading={setNowLoading}
                        />
                    )}
                    onEndReachedThreshold={1}
                    onEndReached={() => {
                        if (previousLength === data.length) {
                            return
                        }
                        setPreviousLength(data.length)
                        setPages(pages + 1)
                    }}
                    drawDistance={500}
                    removeClippedSubviews={true}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={30}
                    ListEmptyComponent={() =>
                        data.length === 0 && !showSearch && updatedAt && <CharactersEmpty />
                    }
                />
            </View>

            {characterList.length === 0 && data.length !== 0 && updatedAt && (
                <CharactersSearchEmpty />
            )}
        </View>
    )
}

export default CharacterList
