import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { BlockTarget } from '../types'
import { colors, fonts, space } from '../theme'

const CATALOG = [
  'Instagram',
  'TikTok',
  'X (Twitter)',
  'YouTube',
  'Reddit',
  'Snapchat',
  'Facebook',
  'Discord',
  'Threads',
  'LinkedIn',
  'Pinterest',
  'Twitch',
  'Netflix',
  'Safari',
  'Chrome',
  'Mail',
  'Messages',
] as const

type Props = {
  targets: BlockTarget[]
  onToggle: (id: string) => void
  onAdd: (name: string) => void
  bottomInset: number
}

export function BlockView({ targets, onToggle, onAdd, bottomInset }: Props) {
  const [draft, setDraft] = useState('')

  const byName = useMemo(() => {
    const m = new Map<string, BlockTarget>()
    targets.forEach((t) => m.set(t.name.toLowerCase(), t))
    return m
  }, [targets])

  const toggleCatalog = (name: string) => {
    const key = name.toLowerCase()
    const existing = byName.get(key)
    if (existing) onToggle(existing.id)
    else onAdd(name)
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + space.bottomNav + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Controls</Text>
          <Text style={styles.title}>
            Block{'\n'}List
          </Text>
        </View>
        <Ionicons name="lock-closed-outline" size={28} color="rgba(255,255,255,0.4)" />
      </View>

      <Text style={styles.sectionLabel}>Pick apps manually</Text>
      <Text style={styles.sectionHint}>
        Tap a name to add it to your list, or tap again if it is already there to toggle it off.
      </Text>
      <View style={styles.catalog}>
        {CATALOG.map((name) => {
          const hit = byName.get(name.toLowerCase())
          const on = hit?.enabled ?? false
          const listed = !!hit
          return (
            <Pressable
              key={name}
              onPress={() => toggleCatalog(name)}
              style={[
                styles.chip,
                listed && on && styles.chipOn,
                listed && !on && styles.chipDim,
              ]}
            >
              <Text
                style={[styles.chipText, listed && on && styles.chipTextOn]}
                numberOfLines={1}
              >
                {name}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Custom name</Text>
      <View style={styles.form}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Other app or site"
          placeholderTextColor={colors.muted3}
          style={styles.input}
          onSubmitEditing={() => {
            const name = draft.trim()
            if (!name) return
            if (!byName.get(name.toLowerCase())) onAdd(name)
            setDraft('')
          }}
          returnKeyType="done"
        />
        <Pressable
          onPress={() => {
            const name = draft.trim()
            if (!name) return
            if (!byName.get(name.toLowerCase())) onAdd(name)
            setDraft('')
          }}
          style={styles.addBtn}
        >
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Your list</Text>
      <View>
        {targets.length === 0 ? (
          <Text style={styles.empty}>Nothing here yet. Pick apps above or add a custom name.</Text>
        ) : (
          targets.map((t, i) => (
            <View
              key={t.id}
              style={[
                styles.row,
                i > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {t.name}
                </Text>
                <Text style={styles.rowMeta}>
                  {t.enabled ? 'On for sessions' : 'Off'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: t.enabled }}
                onPress={() => onToggle(t.id)}
                style={[
                  styles.switchTrack,
                  t.enabled ? styles.switchOn : styles.switchOff,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    { transform: [{ translateX: t.enabled ? 20 : 0 }] },
                  ]}
                />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: space.container,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  kicker: {
    ...fonts.semibold,
    fontSize: 12,
    letterSpacing: 2.4,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    ...fonts.bold,
    fontSize: 42,
    lineHeight: 46,
    color: colors.text,
  },
  sectionLabel: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionHint: {
    ...fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted2,
    marginBottom: 14,
  },
  catalog: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    maxWidth: '48%',
  },
  chipOn: {
    borderColor: colors.text,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipDim: {
    borderColor: 'rgba(255,255,255,0.15)',
    opacity: 0.55,
  },
  chipText: {
    ...fonts.medium,
    fontSize: 14,
    color: colors.muted2,
  },
  chipTextOn: {
    color: colors.text,
  },
  form: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    ...fonts.regular,
    fontSize: 15,
    color: colors.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
  },
  addBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  addLabel: {
    ...fonts.semibold,
    fontSize: 13,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  empty: {
    ...fonts.regular,
    fontSize: 14,
    color: colors.muted2,
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  rowTitle: {
    ...fonts.medium,
    fontSize: 17,
    color: colors.text,
  },
  rowMeta: {
    marginTop: 4,
    ...fonts.regular,
    fontSize: 12,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    borderColor: colors.text,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  switchOff: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    marginLeft: 2,
  },
})
