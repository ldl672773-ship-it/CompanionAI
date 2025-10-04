import ThemedButton from '@components/buttons/ThemedButton'
import DropdownSheet from '@components/input/DropdownSheet'
import StringArrayEditor from '@components/input/StringArrayEditor'
import ThemedCheckbox from '@components/input/ThemedCheckbox'
import ThemedSwitch from '@components/input/ThemedSwitch'
import ThemedTextInput from '@components/input/ThemedTextInput'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import HeaderButton from '@components/views/HeaderButton'
import HeaderTitle from '@components/views/HeaderTitle'
import PopupMenu from '@components/views/PopupMenu'
import TextBoxModal from '@components/views/TextBoxModal'
import { AppSettings } from '@lib/constants/GlobalValues'
import useAutosave from '@lib/hooks/AutoSave'
import { useTextFilterStore } from '@lib/hooks/TextFilter'
import { MarkdownStyle } from '@lib/markdown/Markdown'
import { Instructs } from '@lib/state/Instructs'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import { saveStringToDownload } from '@lib/utils/File'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Markdown from 'react-native-markdown-display'
import { useMMKVBoolean } from 'react-native-mmkv'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useShallow } from 'zustand/react/shallow'

const autoformatterData = [
    { label: '禁用', example: '*<无格式化>*' },
    { label: '普通动作,引号对话', example: 'Some action, "Some speech"' },
    { label: '星号动作,普通对话', example: '*Some action* Some speech' },
    { label: '星号动作,引号对话', example: '*Some action* "Some speech"' },
]

const FormattingManager = () => {
    const markdownStyle = MarkdownStyle.useMarkdownStyle()
    const [useTemplate, setUseTemplate] = useMMKVBoolean(AppSettings.UseModelTemplate)
    const { currentInstruct, loadInstruct, setCurrentInstruct } = Instructs.useInstruct(
        useShallow((state) => ({
            currentInstruct: state.data,
            loadInstruct: state.load,
            setCurrentInstruct: state.setData,
        }))
    )
    const instructID = currentInstruct?.id
    const { color, spacing, borderRadius } = Theme.useTheme()
    const { data } = useLiveQuery(Instructs.db.query.instructListQuery())
    const instructList = data
    const selectedItem = data.filter((item) => item.id === instructID)?.[0]
    const [showNewInstruct, setShowNewInstruct] = useState<boolean>(false)
    const { textFilter, setTextFilter, sendFilteredText, setSendFilteredText } = useTextFilterStore(
        useShallow((state) => ({
            sendFilteredText: state.sendFilteredText,
            setSendFilteredText: state.setSendFilteredText,
            textFilter: state.filter,
            setTextFilter: state.setFilter,
        }))
    )

    const handleSaveInstruct = (log: boolean) => {
        if (currentInstruct && instructID)
            Instructs.db.mutate.updateInstruct(instructID, currentInstruct)
    }

    const handleRegenerateDefaults = () => {
        Alert.alert({
            title: `重新生成默认指令`,
            description: `确定要重新生成默认指令吗?`,
            buttons: [
                { label: '取消' },
                {
                    label: '重新生成默认预设',
                    onPress: async () => {
                        await Instructs.generateInitialDefaults()
                    },
                },
            ],
        })
    }

    const handleExportPreset = async () => {
        if (!instructID) return
        const name = (currentInstruct?.name ?? 'Default') + '.json'
        await saveStringToDownload(JSON.stringify(currentInstruct), name, 'utf8')
        Logger.infoToast(`已保存 "${name}" 到下载文件夹`)
    }

    const handleDeletePreset = () => {
        if (instructList.length === 1) {
            Logger.warnToast(`无法删除最后一个指令预设。`)
            return
        }

        Alert.alert({
            title: `删除配置`,
            description: `确定要删除 '${currentInstruct?.name}' 吗?`,
            buttons: [
                { label: '取消' },
                {
                    label: '删除指令',
                    onPress: async () => {
                        if (!instructID) return
                        const leftover = data.filter((item) => item.id !== instructID)
                        if (leftover.length === 0) {
                            Logger.warnToast('无法删除最后一个指令')
                            return
                        }
                        Instructs.db.mutate.deleteInstruct(instructID)
                        loadInstruct(leftover[0].id)
                    },
                    type: 'warning',
                },
            ],
        })
    }

    const headerRight = () => (
        <PopupMenu
            icon="setting"
            iconSize={24}
            placement="bottom"
            options={[
                {
                    label: '创建配置',
                    icon: 'addfile',
                    onPress: (menu) => {
                        setShowNewInstruct(true)

                        menu.current?.close()
                    },
                },
                {
                    label: '导出配置',
                    icon: 'download',
                    onPress: (menu) => {
                        handleExportPreset()
                        menu.current?.close()
                    },
                },
                {
                    label: '删除配置',
                    icon: 'delete',
                    onPress: (menu) => {
                        handleDeletePreset()
                        menu.current?.close()
                    },
                    warning: true,
                },
                {
                    label: '重新生成默认',
                    icon: 'reload1',
                    onPress: (menu) => {
                        handleRegenerateDefaults()
                        menu.current?.close()
                    },
                },
            ]}
        />
    )

    useAutosave({ data: currentInstruct, onSave: () => handleSaveInstruct(false), interval: 3000 })

    if (currentInstruct)
        return (
            <SafeAreaView
                edges={['bottom']}
                key={currentInstruct.id}
                style={{
                    marginVertical: spacing.xl,
                    flex: 1,
                }}>
                <HeaderTitle title="格式化" />
                <HeaderButton headerRight={headerRight} />
                <View>
                    <TextBoxModal
                        booleans={[showNewInstruct, setShowNewInstruct]}
                        onConfirm={(text) => {
                            if (instructList.some((item) => item.name === text)) {
                                Logger.warnToast(`配置名称已存在。`)
                                return
                            }
                            if (!currentInstruct) return

                            Instructs.db.mutate
                                .createInstruct({ ...currentInstruct, name: text })
                                .then(async (newid) => {
                                    Logger.infoToast(`配置已创建。`)
                                    await loadInstruct(newid)
                                })
                        }}
                    />
                </View>

                <View
                    style={{
                        paddingHorizontal: spacing.xl,
                        marginTop: spacing.xl,
                        paddingBottom: spacing.l,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <DropdownSheet
                        containerStyle={{ flex: 1 }}
                        selected={selectedItem}
                        data={instructList}
                        labelExtractor={(item) => item.name}
                        onChangeValue={(item) => {
                            if (item.id === instructID) return
                            loadInstruct(item.id)
                        }}
                        modalTitle="选择配置"
                        search
                    />
                    <ThemedButton iconName="save" iconSize={28} variant="tertiary" />
                </View>

                <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    style={{
                        flex: 1,
                        marginTop: 16,
                    }}
                    contentContainerStyle={{
                        rowGap: spacing.xl,
                        paddingHorizontal: spacing.xl,
                    }}>
                    <SectionTitle>指令格式化</SectionTitle>
                    <ThemedTextInput
                        label="系统提示词"
                        value={currentInstruct.system_prompt}
                        onChangeText={(text) => {
                            setCurrentInstruct({
                                ...currentInstruct,
                                system_prompt: text,
                            })
                        }}
                        numberOfLines={5}
                        multiline
                    />

                    <ThemedTextInput
                        label="系统提示词格式"
                        value={currentInstruct.system_prompt_format}
                        onChangeText={(text) => {
                            setCurrentInstruct({
                                ...currentInstruct,
                                system_prompt_format: text,
                            })
                        }}
                        numberOfLines={3}
                        multiline
                    />
                    <View style={{ flexDirection: 'row', columnGap: spacing.m }}>
                        <ThemedTextInput
                            label="系统前缀"
                            value={currentInstruct.system_prefix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    system_prefix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                        <ThemedTextInput
                            label="系统后缀"
                            value={currentInstruct.system_suffix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    system_suffix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                    </View>
                    <View style={{ flexDirection: 'row', columnGap: spacing.m }}>
                        <ThemedTextInput
                            label="输入前缀"
                            value={currentInstruct.input_prefix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    input_prefix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                        <ThemedTextInput
                            label="输入后缀"
                            value={currentInstruct.input_suffix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    input_suffix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                    </View>
                    <View style={{ flexDirection: 'row', columnGap: spacing.m }}>
                        <ThemedTextInput
                            label="输出前缀"
                            value={currentInstruct.output_prefix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    output_prefix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                        <ThemedTextInput
                            label="输出后缀"
                            value={currentInstruct.output_suffix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    output_suffix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                    </View>

                    <View style={{ flexDirection: 'row' }}>
                        <ThemedTextInput
                            label="最后输出前缀"
                            value={currentInstruct.last_output_prefix}
                            onChangeText={(text) => {
                                setCurrentInstruct({
                                    ...currentInstruct,
                                    last_output_prefix: text,
                                })
                            }}
                            numberOfLines={5}
                            multiline
                        />
                    </View>

                    <StringArrayEditor
                        containerStyle={{}}
                        label="停止序列"
                        value={
                            currentInstruct.stop_sequence
                                ? currentInstruct.stop_sequence.split(',')
                                : []
                        }
                        setValue={(data) => {
                            setCurrentInstruct({
                                ...currentInstruct,
                                stop_sequence: data.join(','),
                            })
                        }}
                        replaceNewLine="\n"
                    />

                    <ThemedCheckbox
                        label="使用通用停止序列"
                        value={currentInstruct.use_common_stop}
                        onChangeValue={(b) => {
                            setCurrentInstruct({
                                ...currentInstruct,
                                use_common_stop: b,
                            })
                        }}
                    />

                    <SectionTitle>宏与角色卡</SectionTitle>

                    <View
                        style={{
                            flexDirection: 'row',
                            columnGap: spacing.xl2,
                        }}>
                        <View style={{ flex: 1 }}>
                            <ThemedCheckbox
                                label="换行包裹"
                                value={currentInstruct.wrap}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        wrap: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="包含名称"
                                value={currentInstruct.names}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        names: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="添加时间戳"
                                value={currentInstruct.timestamp}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        timestamp: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="移除思考标签"
                                value={currentInstruct.hide_think_tags}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        hide_think_tags: b,
                                    })
                                }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedCheckbox
                                label="使用示例"
                                value={currentInstruct.examples}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        examples: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="使用场景"
                                value={currentInstruct.scenario}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        scenario: b,
                                    })
                                }}
                            />

                            <ThemedCheckbox
                                label="使用性格"
                                value={currentInstruct.personality}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        personality: b,
                                    })
                                }}
                            />
                        </View>
                    </View>

                    <SectionTitle>附件</SectionTitle>

                    <View
                        style={{
                            flexDirection: 'row',
                            columnGap: spacing.xl2,
                            justifyContent: 'space-between',
                        }}>
                        <View style={{ flex: 1 }}>
                            <ThemedCheckbox
                                label="发送图片"
                                value={currentInstruct.send_images}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        send_images: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="发送文档"
                                value={currentInstruct.send_documents}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        send_documents: b,
                                    })
                                }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedCheckbox
                                label="发送音频"
                                value={currentInstruct.send_audio}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        send_audio: b,
                                    })
                                }}
                            />
                            <ThemedCheckbox
                                label="仅使用最后一张图片"
                                value={currentInstruct.last_image_only}
                                onChangeValue={(b) => {
                                    setCurrentInstruct({
                                        ...currentInstruct,
                                        last_image_only: b,
                                    })
                                }}
                            />
                        </View>
                    </View>

                    <View style={{ rowGap: 8 }}>
                        <SectionTitle>文本格式化器</SectionTitle>
                        <Text
                            style={{
                                color: color.text._400,
                            }}>
                            自动将第一条消息格式化为以下样式:
                        </Text>
                        <View
                            style={{
                                backgroundColor: color.neutral._300,
                                marginTop: spacing.m,
                                paddingHorizontal: spacing.xl2,
                                alignItems: 'center',
                                borderRadius: borderRadius.m,
                            }}>
                            <Markdown
                                markdownit={MarkdownStyle.Rules}
                                rules={MarkdownStyle.RenderRules}
                                style={markdownStyle}>
                                {autoformatterData[currentInstruct.format_type].example}
                            </Markdown>
                        </View>
                        <View>
                            {autoformatterData.map((item, index) => (
                                <ThemedCheckbox
                                    key={item.label}
                                    label={item.label}
                                    value={currentInstruct.format_type === index}
                                    onChangeValue={(b) => {
                                        if (b)
                                            setCurrentInstruct({
                                                ...currentInstruct,
                                                format_type: index,
                                            })
                                    }}
                                />
                            ))}
                        </View>
                    </View>

                    <SectionTitle>隐藏文本</SectionTitle>
                    <Text
                        style={{
                            color: color.text._400,
                        }}>
                        隐藏与下方定义的正则表达式匹配的文本。(不区分大小写)
                    </Text>

                    <StringArrayEditor value={textFilter} setValue={setTextFilter} />

                    <ThemedSwitch
                        label="发送过滤文本"
                        description="发送过滤后的文本进行推理"
                        value={sendFilteredText}
                        onChangeValue={setSendFilteredText}
                    />

                    <SectionTitle>本地模板</SectionTitle>

                    <ThemedSwitch
                        label="使用内置本地模型模板"
                        description="在本地模式下,ChatterUI 自动使用加载的模型提供的指令模板。如果希望使用指令格式化消息,请禁用此选项。但系统提示词始终会被使用。"
                        value={useTemplate}
                        onChangeValue={setUseTemplate}
                    />

                    {/* @TODO: Macros are always replaced - people may want this to be changed
                            <CheckboxTitle
                                name="Replace Macro In Sequences"
                                varname="macro"
                                body={currentInstruct}
                                setValue={setCurrentInstruct}
                            />
                            */}

                    {/*  Groups are not implemented - leftover from ST
                            <CheckboxTitle
                                name="Force for Groups and Personas"
                                varname="names_force_groups"
                                body={currentInstruct}
                                setValue={setCurrentInstruct}
                            />
                            */}
                    {/* Activates Instruct when model is loaded with specific name that matches regex
                    
                            <TextBox
                                name="Activation Regex"
                                varname="activation_regex"
                                body={currentInstruct}
                                setValue={setCurrentInstruct}
                            />*/}
                    {/*    User Alignment Messages may be needed in future, might be removed on CCv3
                            <TextBox
                                name="User Alignment"
                                varname="user_alignment_message"
                                body={currentInstruct}
                                setValue={setCurrentInstruct}
                                multiline
                            />*/}
                </KeyboardAwareScrollView>
            </SafeAreaView>
        )
}

export default FormattingManager
