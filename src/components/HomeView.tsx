import { Ionicons } from '@expo/vector-icons'
import { useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, space } from '../theme'
import { consistencyLabel, rankLabel } from '../utils/stats'

type Active = {
  title: string
  startedAt: number
  endAt: number
  durationMinutes: number
}

type Props = {
  enabledBlockCount: number
  currentStreak: number
  daysInApp: number
  active: Active | null
  onStartSession: (minutes: number, title: string) => void
  now: number
  bottomInset: number
  scrollIntroDone: boolean
  onScrollPastIntro: () => void
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const presets: { minutes: number; title: string; caption: string }[] = [
  { minutes: 25, title: 'Focus Sprint', caption: 'Pomodoro' },
  { minutes: 50, title: 'Deep Work', caption: 'Standard' },
  { minutes: 90, title: 'Extended Lock', caption: 'Long runway' },
]

export function HomeView({
  enabledBlockCount,
  currentStreak,
  daysInApp,
  active,
  onStartSession,
  now,
  bottomInset,
  scrollIntroDone,
  onScrollPastIntro,
}: Props) {
  const remaining = active ? Math.max(0, active.endAt - now) : 0
  const scrollY = useRef(new Animated.Value(0)).current
  const rank = rankLabel(currentStreak)

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
        if (!scrollIntroDone && e.nativeEvent.contentOffset.y > 72) {
          onScrollPastIntro()
        }
      },
    },
  )

  /** Content below the fold gently brightens and settles as you scroll down. */
  const lowerRevealOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0.96, 1],
    extrapolate: 'clamp',
  })
  const lowerRevealY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [6, 0],
    extrapolate: 'clamp',
  })

  return (
    <Animated.ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + space.bottomNav + 28 },
      ]}
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Overview</Text>
          <Text style={styles.title}>
            Focus{'\n'}Shield
          </Text>
        </View>
        <View style={styles.iconBadge}>
          <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.55)" />
        </View>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakCol}>
          <Text style={styles.statKicker}>Streak</Text>
          <Text style={styles.streakNum}>
            {String(currentStreak).padStart(2, '0')}
          </Text>
          <Text style={styles.consistencyText}>
            Consistency: {consistencyLabel(currentStreak)}
          </Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.rankCol}>
          <Text style={[styles.statKicker, styles.statKickerRight]}>Rank</Text>
          <View style={styles.rankDiamondRow}>
            <View style={styles.diamondOuter}>
              <View style={styles.diamond} />
            </View>
            <View style={styles.rankConnector} />
            <Text style={styles.rankTitle} numberOfLines={1}>
              {rank.title}
            </Text>
          </View>
          <Text style={styles.rankSubtitle}>{rank.subtitle}</Text>
        </View>
      </View>
      <Text style={styles.daysInAppFoot}>
        {daysInApp} {daysInApp === 1 ? 'day' : 'days'} in app
      </Text>

      {active ? (
        <>
          <View style={styles.thinBorder}>
            <Text style={styles.label}>Active session</Text>
            <Text style={styles.sessionTitle}>{active.title}</Text>
            <Text style={styles.timer}>{formatCountdown(remaining)}</Text>
            <Text style={styles.bodyMuted}>
              {enabledBlockCount} targets are marked for this session. Limits still require
              Screen Time or Focus on iPhone.
            </Text>
          </View>
          <Animated.View
            style={{
              opacity: lowerRevealOpacity,
              transform: [{ translateY: lowerRevealY }],
            }}
          >
            <View style={styles.presetGrid}>
              {presets.map((p) => (
                <View key={p.minutes} style={[styles.presetCard, styles.presetDisabled]}>
                  <Text style={styles.presetCap}>{p.caption}</Text>
                  <Text style={styles.presetName}>{p.title}</Text>
                  <Text style={styles.presetMin}>{p.minutes} minutes</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </>
      ) : (
        <>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.label}>Block list</Text>
              <Text style={styles.metricValue}>
                {enabledBlockCount}{' '}
                <Text style={styles.metricSuffix}>enabled</Text>
              </Text>
              <Text style={styles.caption}>Manual picks</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.label}>Mode</Text>
              <Text style={styles.metricValue}>Strict</Text>
              <Text style={styles.caption}>Session-based</Text>
            </View>
          </View>
          <Animated.View
            style={{
              opacity: lowerRevealOpacity,
              transform: [{ translateY: lowerRevealY }],
            }}
          >
            <Text style={[styles.label, { marginBottom: 24 }]}>Start session</Text>
            <View style={styles.presetGrid}>
              {presets.map((p) => (
                <Pressable
                  key={p.minutes}
                  onPress={() => onStartSession(p.minutes, p.title)}
                  style={({ pressed }) => [
                    styles.presetCard,
                    styles.presetHit,
                    pressed && { borderBottomColor: 'rgba(255,255,255,0.35)' },
                  ]}
                >
                  <Text style={styles.presetCap}>{p.caption}</Text>
                  <Text style={styles.presetName}>{p.title}</Text>
                  <Text style={styles.presetMin}>{p.minutes} minutes</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </>
      )}
    </Animated.ScrollView>
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
    letterSpacing: -0.5,
    color: colors.text,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outline,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  streakCol: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statKicker: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statKickerRight: {
    alignSelf: 'flex-end',
    textAlign: 'right',
  },
  consistencyText: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.muted2,
    marginTop: 8,
  },
  rankCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rankDiamondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: '100%',
  },
  diamondOuter: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.text,
    transform: [{ rotate: '45deg' }],
  },
  rankConnector: {
    width: 22,
    height: 1.5,
    backgroundColor: colors.text,
    marginHorizontal: 10,
    opacity: 0.95,
  },
  rankTitle: {
    ...fonts.medium,
    fontSize: 22,
    color: colors.text,
    flexShrink: 1,
  },
  rankSubtitle: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.muted2,
    marginTop: 8,
    textAlign: 'right',
  },
  daysInAppFoot: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.muted2,
    textAlign: 'center',
    marginBottom: 28,
  },
  streakDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    minHeight: 72,
    backgroundColor: colors.outline,
    marginHorizontal: 4,
  },
  streakNum: {
    ...fonts.bold,
    fontSize: 34,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  thinBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outline,
    paddingBottom: 40,
    marginBottom: 8,
  },
  label: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sessionTitle: {
    ...fonts.medium,
    fontSize: 28,
    color: colors.text,
  },
  timer: {
    ...fonts.light,
    fontSize: 64,
    marginTop: 24,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  bodyMuted: {
    marginTop: 16,
    maxWidth: 400,
    ...fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 48,
    marginBottom: 8,
  },
  metric: { flex: 1, gap: 4 },
  metricValue: {
    ...fonts.light,
    fontSize: 32,
    color: colors.text,
  },
  metricSuffix: {
    fontSize: 14,
    color: colors.muted,
  },
  caption: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.muted2,
  },
  section: { gap: 40 },
  presetGrid: { gap: 16 },
  presetCard: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 20,
  },
  presetHit: {},
  presetDisabled: { opacity: 0.4 },
  presetCap: {
    ...fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  presetName: {
    ...fonts.semibold,
    fontSize: 18,
    color: colors.text,
    marginTop: 2,
  },
  presetMin: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.muted2,
    marginTop: 4,
  },
})
