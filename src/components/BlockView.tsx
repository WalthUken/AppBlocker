import Slider from '@react-native-community/slider'
import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState, type ReactNode } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { BlockTarget } from '../types'
import { cardRadius, colors, fonts, space } from '../theme'

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

type ActiveSession = {
  title: string
  startedAt: number
  endAt: number
  durationMinutes: number
  stopAvailableAt: number
}

type Props = {
  targets: BlockTarget[]
  enabledBlockCount: number
  active: ActiveSession | null
  now: number
  onToggle: (id: string) => void
  onAdd: (name: string) => void
  onStartSession: (minutes: number, title: string) => void
  onStopSessionEarly: () => void
  bottomInset: number
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function IconBadge({ children }: { children: ReactNode }) {
  return <View style={styles.iconBadge}>{children}</View>
}

export function BlockView({
  targets,
  enabledBlockCount,
  active,
  now,
  onToggle,
  onAdd,
  onStartSession,
  onStopSessionEarly,
  bottomInset,
}: Props) {
  const [draft, setDraft] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customMinutes, setCustomMinutes] = useState(25)

  const byName = useMemo(() => {
    const m = new Map<string, BlockTarget>()
    targets.forEach((t) => m.set(t.name.toLowerCase(), t))
    return m
  }, [targets])

  const remaining = active ? Math.max(0, active.endAt - now) : 0
  const stopInMs = active ? Math.max(0, active.stopAvailableAt - now) : 0
  const canStopEarly = active != null && now >= active.stopAvailableAt

  const toggleCatalog = (name: string) => {
    const key = name.toLowerCase()
    const existing = byName.get(key)
    if (existing) onToggle(existing.id)
    else onAdd(name)
  }

  const openStartModal = () => {
    if (active) return
    setCustomTitle('')
    setCustomMinutes(25)
    setCreateOpen(true)
  }

  const startFromModal = () => {
    const title = customTitle.trim() || 'Focus session'
    if (active) return
    onStartSession(customMinutes, title)
    setCreateOpen(false)
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + space.bottomNav + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kickerRow}>
          <Text style={styles.pageKicker}>Apps</Text>
        </View>

        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <IconBadge>
              <Ionicons name="lock-closed-outline" size={22} color={colors.muted2} />
            </IconBadge>
            <Text style={styles.pageTitle}>Blocks</Text>
          </View>
        </View>

        <View style={[styles.card, styles.minCard]}>
          <Text style={styles.cardKicker}>Focus session</Text>
          <Text style={styles.cardBody}>
            While a timer runs, the apps you enable below are the ones you intend to stay away
            from—real limits still use Screen Time or Focus on your iPhone.
          </Text>
          <Text style={styles.metaLine}>
            {enabledBlockCount} {enabledBlockCount === 1 ? 'app' : 'apps'} on for sessions
          </Text>

          {active ? (
            <View style={styles.activeBox}>
              <Text style={styles.activeKicker}>Active</Text>
              <Text style={styles.activeTitle}>{active.title}</Text>
              <Text style={styles.activeTimer}>{formatCountdown(remaining)}</Text>
              {!canStopEarly ? (
                <Text style={styles.stopWait}>End unlocks in {Math.ceil(stopInMs / 1000)}s…</Text>
              ) : (
                <Pressable
                  onPress={onStopSessionEarly}
                  style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.endBtnText}>End session early</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              onPress={openStartModal}
              style={({ pressed }) => [styles.sessionRow, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.sessionRowLeft}>
                <Ionicons name="play-outline" size={22} color={colors.text} />
                <View style={styles.sessionRowText}>
                  <Text style={styles.sessionRowTitle}>Start focus timer</Text>
                  <Text style={styles.sessionRowSub}>Set length here—stays on this screen</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted3} />
            </Pressable>
          )}
        </View>

        <View style={[styles.card, styles.minCard]}>
          <Text style={styles.cardKicker}>Apps to block</Text>
          <Text style={styles.sectionHint}>
            Choose what you want to avoid during focus. Tap a name to add; tap again to turn off.
          </Text>

          <Text style={styles.subLabel}>Pick manually</Text>
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

          <View style={styles.insetDivider} />

          <Text style={styles.subLabel}>Custom name</Text>
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

          <View style={styles.insetDivider} />

          <Text style={styles.subLabel}>Your list</Text>
          {targets.length === 0 ? (
            <Text style={styles.empty}>Nothing here yet.</Text>
          ) : (
            targets.map((t, i) => (
              <View
                key={t.id}
                style={[
                  styles.row,
                  i > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.outline,
                  },
                ]}
              >
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={styles.rowMeta}>{t.enabled ? 'On for sessions' : 'Off'}</Text>
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

      <Modal
        visible={createOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setCreateOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCreateOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New focus session</Text>
            <Text style={styles.modalLabel}>What are you working on?</Text>
            <TextInput
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="Optional label"
              placeholderTextColor={colors.muted3}
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Length · {customMinutes} min</Text>
            <Slider
              style={styles.modalSlider}
              minimumValue={10}
              maximumValue={180}
              step={5}
              value={customMinutes}
              onValueChange={setCustomMinutes}
              minimumTrackTintColor={colors.text}
              maximumTrackTintColor={colors.outline}
              thumbTintColor={colors.text}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setCreateOpen(false)} style={styles.modalSecondary}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={startFromModal} style={styles.modalPrimary}>
                <Text style={styles.modalPrimaryText}>Start</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: space.container,
    paddingTop: 12,
  },
  minCard: {
    borderRadius: cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    backgroundColor: 'transparent',
  },
  kickerRow: { marginBottom: 20 },
  pageKicker: {
    ...fonts.semibold,
    fontSize: 12,
    letterSpacing: 2.4,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    ...fonts.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: colors.text,
    flex: 1,
  },
  card: {
    padding: 18,
    marginBottom: 16,
  },
  cardKicker: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  cardBody: {
    ...fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted2,
    marginBottom: 12,
  },
  metaLine: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.muted3,
    marginBottom: 16,
  },
  activeBox: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  activeKicker: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  activeTitle: {
    ...fonts.medium,
    fontSize: 18,
    color: colors.text,
    marginTop: 8,
  },
  activeTimer: {
    ...fonts.light,
    fontSize: 44,
    marginTop: 12,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  stopWait: {
    marginTop: 14,
    ...fonts.regular,
    fontSize: 13,
    color: colors.muted2,
  },
  endBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
  },
  endBtnText: {
    ...fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
  },
  sessionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  sessionRowText: { flex: 1, minWidth: 0 },
  sessionRowTitle: {
    ...fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  sessionRowSub: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.muted2,
    marginTop: 2,
  },
  sectionHint: {
    ...fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted2,
    marginBottom: 16,
  },
  subLabel: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  insetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outline,
    marginVertical: 18,
  },
  catalog: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    borderRadius: 12,
    maxWidth: '48%',
  },
  chipOn: {
    borderColor: colors.text,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipDim: {
    opacity: 0.5,
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
  },
  input: {
    flex: 1,
    ...fonts.regular,
    fontSize: 15,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.text,
    borderRadius: 12,
  },
  addLabel: {
    ...fonts.semibold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase',
  },
  empty: {
    ...fonts.regular,
    fontSize: 14,
    color: colors.muted2,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowTitle: {
    ...fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  rowMeta: {
    marginTop: 4,
    ...fonts.regular,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.muted3,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  switchOff: {
    borderColor: colors.outline,
    backgroundColor: 'transparent',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    marginLeft: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: space.container,
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    padding: 22,
    gap: 8,
    borderRadius: cardRadius,
  },
  modalTitle: {
    ...fonts.bold,
    fontSize: 22,
    color: colors.text,
    marginBottom: 8,
  },
  modalLabel: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    padding: 14,
    ...fonts.regular,
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
    borderRadius: 12,
  },
  modalSlider: {
    width: '100%',
    height: 44,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    justifyContent: 'flex-end',
  },
  modalSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    borderRadius: 12,
  },
  modalSecondaryText: {
    ...fonts.medium,
    fontSize: 15,
    color: colors.muted2,
  },
  modalPrimary: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    backgroundColor: colors.text,
    borderRadius: 12,
  },
  modalPrimaryText: {
    ...fonts.semibold,
    fontSize: 15,
    color: colors.bg,
  },
})
