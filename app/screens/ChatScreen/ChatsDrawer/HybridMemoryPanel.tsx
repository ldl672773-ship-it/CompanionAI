/**
 * HybridMemory Pro 控制面板
 * 提供设置开关和统计信息查看
 */

import Alert from '@components/views/Alert'
import { useTranslation } from 'react-i18next'
import { AntDesign } from '@expo/vector-icons'
import { useHybridMemory } from '@lib/state/HybridMemory'
import { Theme } from '@lib/theme/ThemeManager'
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native'

interface HybridMemoryStats {
    totalMemories: number
    knowledgeGraph?: { entities: number; relations: number }
}

export const HybridMemoryPanel = () => {
    const { color } = Theme.useTheme()
    const styles = useStyles()
    const {
        enabled,
        enableKnowledgeGraph,
        enableEmotionAnalysis,
        enableActiveManagement,
        enableForgettingCurve,
        setEnabled,
        setKnowledgeGraph,
        setEmotionAnalysis,
        setActiveManagement,
        setForgettingCurve,
        getStatistics,
        consolidate,
    } = useHybridMemory()

    const [stats, setStats] = useState<HybridMemoryStats | null>(null)
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        if (enabled && expanded) {
            loadStats()
        }
    }, [enabled, expanded])

    const loadStats = async () => {
        try {
            const statistics = await getStatistics()
            setStats(statistics)
        } catch (error) {
            console.error('Failed to load statistics:', error)
        }
    }

    const handleConsolidate = async () => {
        setLoading(true)
        try {
            const result = await consolidate()
            if (result.insights.length > 0) {
                Alert.alert({
                    title: '记忆巩固完成',
                    description: `发现 ${result.insights.length} 条新洞察:\n${result.insights.map((i) => `• ${i.description}`).join('\n')}`,
                    buttons: [{ label: '确定' }],
                })
            } else {
                Alert.alert({
                    title: '记忆巩固完成',
                    description: '未发现新模式',
                    buttons: [{ label: '确定' }],
                })
            }
            await loadStats()
        } catch (error) {
            Alert.alert({
                title: '巩固失败',
                description: '记忆巩固过程出错',
                buttons: [{ label: '确定' }],
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}>
                <View style={styles.headerLeft}>
                    <AntDesign name="bulb1" size={20} color={color.text._100} />
                    <Text style={styles.headerTitle}>智能记忆系统</Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={[styles.statusText, enabled && styles.statusTextActive]}>
                        {enabled ? '已启用' : '已禁用'}
                    </Text>
                    <AntDesign
                        name={expanded ? 'up' : 'down'}
                        size={16}
                        color={color.text._100}
                    />
                </View>
            </TouchableOpacity>

            {expanded && (
                <ScrollView style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>总开关</Text>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>启用HybridMemory Pro</Text>
                            <Switch value={enabled} onValueChange={setEnabled} />
                        </View>
                        <Text style={styles.settingDescription}>
                            智能记忆管理系统,自动提取和组织对话中的重要信息
                        </Text>
                    </View>

                    {enabled && (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>高级功能</Text>

                                <View style={styles.settingRow}>
                                    <Text style={styles.settingLabel}>知识图谱</Text>
                                    <Switch
                                        value={enableKnowledgeGraph}
                                        onValueChange={setKnowledgeGraph}
                                    />
                                </View>
                                <Text style={styles.settingDescription}>
                                    构建实体关系网络,提升检索准确率(98%)
                                </Text>

                                <View style={styles.settingRow}>
                                    <Text style={styles.settingLabel}>情感分析</Text>
                                    <Switch
                                        value={enableEmotionAnalysis}
                                        onValueChange={setEmotionAnalysis}
                                    />
                                </View>
                                <Text style={styles.settingDescription}>
                                    检测和记录对话中的情绪变化
                                </Text>

                                <View style={styles.settingRow}>
                                    <Text style={styles.settingLabel}>主动管理</Text>
                                    <Switch
                                        value={enableActiveManagement}
                                        onValueChange={setActiveManagement}
                                    />
                                </View>
                                <Text style={styles.settingDescription}>
                                    自动发现模式和生成洞察
                                </Text>

                                <View style={styles.settingRow}>
                                    <Text style={styles.settingLabel}>遗忘曲线</Text>
                                    <Switch
                                        value={enableForgettingCurve}
                                        onValueChange={setForgettingCurve}
                                    />
                                </View>
                                <Text style={styles.settingDescription}>
                                    模拟人类记忆衰减,优先检索新近信息
                                </Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>统计信息</Text>
                                {stats ? (
                                    <>
                                        <View style={styles.statRow}>
                                            <Text style={styles.statLabel}>记忆条目:</Text>
                                            <Text style={styles.statValue}>
                                                {stats.totalMemories}
                                            </Text>
                                        </View>
                                        {stats.knowledgeGraph && (
                                            <>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statLabel}>实体数量:</Text>
                                                    <Text style={styles.statValue}>
                                                        {stats.knowledgeGraph.entities}
                                                    </Text>
                                                </View>
                                                <View style={styles.statRow}>
                                                    <Text style={styles.statLabel}>关系数量:</Text>
                                                    <Text style={styles.statValue}>
                                                        {stats.knowledgeGraph.relations}
                                                    </Text>
                                                </View>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <Text style={styles.statLabel}>等待加载...</Text>
                                )}
                            </View>

                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                                    onPress={handleConsolidate}
                                    disabled={loading}>
                                    <AntDesign
                                        name="sync"
                                        size={18}
                                        color={color.text._100}
                                    />
                                    <Text style={styles.actionButtonText}>
                                        {loading ? '巩固中...' : '立即巩固记忆'}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.settingDescription}>
                                    分析最近7天的对话,发现隐藏模式和生成洞察
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    )
}

const useStyles = () => {
    const { color } = Theme.useTheme()

    return StyleSheet.create({
        container: {
            borderRadius: 12,
            backgroundColor: color.surface._200,
            marginVertical: 8,
            overflow: 'hidden',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: color.text._100,
        },
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        statusText: {
            fontSize: 14,
            color: color.text._200,
        },
        statusTextActive: {
            color: color.brand,
        },
        content: {
            maxHeight: 500,
            padding: 16,
            paddingTop: 0,
        },
        section: {
            marginBottom: 20,
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: color.text._100,
            marginBottom: 12,
        },
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 8,
        },
        settingLabel: {
            fontSize: 14,
            color: color.text._100,
        },
        settingDescription: {
            fontSize: 12,
            color: color.text._200,
            marginTop: 4,
            marginBottom: 12,
        },
        statRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 6,
        },
        statLabel: {
            fontSize: 14,
            color: color.text._200,
        },
        statValue: {
            fontSize: 14,
            fontWeight: '600',
            color: color.text._100,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: color.surface._300,
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
        },
        actionButtonDisabled: {
            opacity: 0.5,
        },
        actionButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: color.text._100,
        },
    })
}
