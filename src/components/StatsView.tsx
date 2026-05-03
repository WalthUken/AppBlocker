import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import type { PersistedState } from '../types'
import { colors, fonts, space } from '../theme'
import {
  computeStreak,
  consistencyLabel,
  focusTrendPath,
  focusTrendPercent,
  focusTrendSeries,
  type TrendPoint,
  formatDurationMinutes,
  formatSessionWhen,
  last7DaysUsage,
  lastFourWeekTotals,
  maxMinutes,
  rankLabel,
  sortSessionsRecent,
  todayMinutes,
  weekOverWeekReductionLabel,
} from '../utils/stats'

type Period = 'week' | 'month'

type Props = {
  data: PersistedState
  onOpenSettings: () => void
  bottomInset: number
}

function rankStripeCount(title: string): number {
  if (title === 'Elite') return 4
  if (title === 'Dedicated') return 3
  if (title === 'Rising') return 2
  return 1
}

function RankDiamond({ title }: { title: string }) {
  const n = rankStripeCount(title)
  return (
    <View style={styles.rankRow}>
      <View style={styles.diamondOuter}>
        <View style={styles.diamond} />
      </View>
      <View style={styles.stripes}>
        {Array.from({ length: n }).map((_, i) => (
          <View key={i} style={styles.stripe} />
        ))}
      </View>
    </View>
  )
}

function ScrubLineChart({
  pathD,
  points,
}: {
  pathD: string
  points: TrendPoint[]
}) {
  const [w, setW] = useState(0)
  const [idx, setIdx] = useState<number | null>(null)

  const applyX = (x: number) => {
    if (w <= 0 || points.length === 0) return
    const ratio = Math.max(0, Math.min(1, x / w))
    const i = Math.round(ratio * Math.max(0, points.length - 1))
    setIdx(i)
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => applyX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => applyX(e.nativeEvent.locationX),
      onPanResponderRelease: () => setIdx(null),
      onPanResponderTerminate: () => setIdx(null),
    }),
  ).current

  const cur = idx != null ? points[idx] : null
  const tipLeft =
    cur && w > 0 ? Math.min(w - 120, Math.max(8, (cur.x / 400) * w - 50)) : 0

  return (
    <View
      style={styles.scrubWrap}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {cur ? (
        <View style={[styles.tooltip, { left: tipLeft }]}>
          <Text style={styles.tooltipBig}>{formatDurationMinutes(cur.minutes)}</Text>
          <Text style={styles.tooltipSmall}>{cur.date || '—'}</Text>
        </View>
      ) : null}
      <View style={styles.svgInner}>
        <Svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
          <Path d={pathD} fill="none" stroke={colors.text} strokeWidth={1.5} />
          {cur && idx != null ? (
            <>
              <Line
                x1={cur.x}
                y1={0}
                x2={cur.x}
                y2={100}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1}
              />
              <Circle
                cx={cur.x}
                cy={cur.y}
                r={4}
                fill={colors.bg}
                stroke={colors.text}
                strokeWidth={1.5}
              />
            </>
          ) : null}
        </Svg>
        <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />
      </View>
      <Text style={styles.scrubHint}>Hold and drag horizontally to scrub the series.</Text>
    </View>
  )
}

export function StatsView({ data, onOpenSettings, bottomInset }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const scrollY = useRef(new Animated.Value(0)).current
  const fallback = data.profile.reportedDailyPhoneMinutes || 180

  const streak = computeStreak(data.dailyFocusMinutes)
  const rank = rankLabel(streak)
  const bars =
    period === 'week'
      ? last7DaysUsage(data.dailyUsage, fallback)
      : lastFourWeekTotals(data.dailyUsage, fallback)
  const cap = maxMinutes(bars)
  const today = todayMinutes(data.dailyUsage, fallback)
  const reduction = weekOverWeekReductionLabel(data.dailyUsage, fallback)
  const trend = focusTrendPercent(data.dailyFocusMinutes)
  const trendPath = focusTrendPath(data.dailyFocusMinutes)
  const trendPts = focusTrendSeries(data.dailyFocusMinutes)
  const attempts = data.blockAttempts
  const failed = data.blockFailed
  const successRate =
    attempts === 0 ? 100 : Math.round(((attempts - failed) / attempts) * 100)
  const sessions = sortSessionsRecent(data.sessions).slice(0, 8)

  const barSig = bars.map((b) => b.key).join('|')
  const barAnims = useMemo(
    () => bars.map(() => new Animated.Value(0)),
    [period, barSig],
  )
  useEffect(() => {
    barAnims.forEach((a) => a.setValue(0))
    Animated.stagger(
      45,
      barAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 420,
          useNativeDriver: false,
        }),
      ),
    ).start()
  }, [barAnims, barSig, period])

  /** First blocks stay full strength; lower sections ease in as you scroll (no heavy dimming). */
  let sidx = 0
  const wrap = (key: string, child: ReactNode) => {
    const i = sidx++
    if (i < 2) {
      return <View key={key}>{child}</View>
    }
    const start = 16 + (i - 2) * 48
    const opacity = scrollY.interpolate({
      inputRange: [start, start + 110],
      outputRange: [0.96, 1],
      extrapolate: 'clamp',
    })
    const translateY = scrollY.interpolate({
      inputRange: [start, start + 110],
      outputRange: [6, 0],
      extrapolate: 'clamp',
    })
    return (
      <Animated.View key={key} style={{ opacity, transform: [{ translateY }] }}>
        {child}
      </Animated.View>
    )
  }
  sidx = 0

  return (
    <Animated.ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + space.bottomNav + 28 },
      ]}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      )}
      scrollEventThrottle={16}
    >
      {wrap(
        'header',
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Statistics</Text>
            <Text style={styles.title}>
              Focus{'\n'}Performance
            </Text>
          </View>
          <Pressable
            onPress={onOpenSettings}
            accessibilityLabel="Open settings"
            style={styles.tuneBtn}
          >
            <Ionicons name="options-outline" size={26} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>,
      )}

      {wrap(
        'grid2',
        <View style={styles.grid2}>
          <View style={styles.cell}>
            <Text style={styles.label}>Streak</Text>
            <Text style={styles.bigLight}>{streak}</Text>
            <Text style={styles.caption}>
              Consistency: {consistencyLabel(streak)}
            </Text>
          </View>
          <View style={[styles.cell, { alignItems: 'flex-end' }]}>
            <Text style={[styles.label, { alignSelf: 'flex-end' }]}>Rank</Text>
            <View style={styles.rankBlock}>
              <RankDiamond title={rank.title} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bigLight}>{rank.title}</Text>
                <Text style={styles.caption}>{rank.subtitle}</Text>
              </View>
            </View>
          </View>
        </View>,
      )}

      {wrap(
        'toggle',
        <View style={styles.periodToggle}>
          <Pressable
            onPress={() => setPeriod('week')}
            style={[styles.periodChip, period === 'week' && styles.periodChipOn]}
          >
            <Text
              style={[styles.periodChipText, period === 'week' && styles.periodChipTextOn]}
            >
              Weekly
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPeriod('month')}
            style={[styles.periodChip, period === 'month' && styles.periodChipOn]}
          >
            <Text
              style={[styles.periodChipText, period === 'month' && styles.periodChipTextOn]}
            >
              Monthly
            </Text>
          </Pressable>
        </View>,
      )}

      {wrap(
        'chart',
        <View style={styles.chartSection}>
          <View style={styles.dailyHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>Phone time (estimate)</Text>
              <Text style={styles.huge}>{formatDurationMinutes(today)}</Text>
              <Text style={styles.chartHint}>
                Match this to Settings, Screen Time, then adjust in Settings here if needed.
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', paddingBottom: 8 }}>
              <Text style={styles.reduction}>{reduction}</Text>
              <Text style={styles.reductionMeta}>Vs prior week</Text>
            </View>
          </View>

          <View style={styles.barsRow}>
            {bars.map((b, bi) => {
              const pct = Math.max(8, Math.round((b.minutes / cap) * 100))
              const barH = Math.max(10, Math.round((pct / 100) * 96))
              const active = b.isToday
              const anim = barAnims[bi]
              const h = anim
                ? anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, barH],
                  })
                : barH
              return (
                <View key={b.key} style={styles.barCol}>
                  <View style={styles.barStack}>
                    <Animated.View
                      style={[
                        styles.bar,
                        {
                          height: h,
                          borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                          borderColor: active ? colors.text : colors.barBorder,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      active && { ...fonts.bold, color: colors.text },
                    ]}
                  >
                    {period === 'month' ? `W${b.label}` : b.label}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>,
      )}

      {wrap(
        'trend',
        <View style={{ gap: 48 }}>
          <View style={{ gap: 24 }}>
            <View style={styles.trendHead}>
              <Text style={styles.label}>Focus Trend</Text>
              <Text style={styles.trendPct}>
                {trend >= 0 ? '+' : ''}
                {trend}%
              </Text>
            </View>
            <ScrubLineChart pathD={trendPath} points={trendPts} />
          </View>

          <View style={styles.successRow}>
            <View>
              <Text style={styles.label}>Block Success Rate</Text>
              <Text style={styles.successVal}>{successRate}%</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 32 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaUpper}>Attempts</Text>
                <Text style={styles.metaNum}>{attempts}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaUpper}>Failed</Text>
                <Text style={styles.metaNum}>{failed}</Text>
              </View>
            </View>
          </View>
        </View>,
      )}

      {wrap(
        'log',
        <View style={{ paddingTop: 16, gap: 32 }}>
          <Text style={styles.logTitle}>Session Log</Text>
          <View>
            {sessions.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.logRow,
                  i > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.logName}>{s.title}</Text>
                  <Text style={styles.logWhen}>{formatSessionWhen(s.startedAt)}</Text>
                </View>
                <Text style={styles.logDur}>{s.durationMinutes}m</Text>
              </View>
            ))}
          </View>
        </View>,
      )}

      {wrap(
        'footer',
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Digital austerity is the final frontier of modern freedom.
          </Text>
          <View style={styles.footerRule} />
        </View>,
      )}
    </Animated.ScrollView>
  )
}

const styles = StyleSheet.create({
  scrubWrap: { marginTop: 8, paddingTop: 44, minHeight: 120 },
  svgInner: { height: 64, width: '100%' },
  scrubHint: {
    ...fonts.regular,
    fontSize: 11,
    color: colors.muted2,
    marginTop: 10,
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: 'rgba(0,0,0,0.92)',
    minWidth: 100,
    zIndex: 2,
  },
  tooltipBig: {
    ...fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  tooltipSmall: {
    ...fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  diamondOuter: {
    width: 36,
    height: 36,
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
  stripes: { gap: 5 },
  stripe: {
    width: 36,
    height: 2,
    backgroundColor: colors.text,
  },
  rankBlock: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scroll: { flex: 1 },
  content: {
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: space.container,
    paddingTop: 56,
    gap: 64,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: -16,
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
  tuneBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid2: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
  },
  cell: { flex: 1, gap: 4 },
  label: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  bigLight: {
    ...fonts.light,
    fontSize: 32,
    color: colors.text,
  },
  caption: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.muted2,
  },
  periodToggle: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -32,
  },
  periodChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  periodChipOn: {
    borderColor: colors.text,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  periodChipText: {
    ...fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.muted2,
    textTransform: 'uppercase',
  },
  periodChipTextOn: { color: colors.text },
  chartSection: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.outline,
    paddingTop: 32,
    paddingBottom: 48,
    gap: 48,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  huge: {
    ...fonts.bold,
    fontSize: 48,
    letterSpacing: -1,
    color: colors.text,
    marginTop: 4,
  },
  chartHint: {
    marginTop: 10,
    ...fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted2,
    maxWidth: 280,
  },
  reduction: {
    ...fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  reductionMeta: {
    ...fonts.semibold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    height: 128,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barStack: {
    width: '100%',
    height: 96,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: 'transparent',
    minHeight: 4,
  },
  barLabel: {
    marginTop: 12,
    ...fonts.medium,
    fontSize: 10,
    color: colors.muted2,
  },
  trendHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendPct: {
    ...fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.outline,
    paddingVertical: 32,
  },
  successVal: {
    ...fonts.bold,
    fontSize: 32,
    color: colors.text,
    marginTop: 4,
  },
  metaUpper: {
    ...fonts.semibold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  metaNum: {
    ...fonts.medium,
    fontSize: 18,
    color: colors.text,
    marginTop: 4,
  },
  logTitle: {
    ...fonts.bold,
    fontSize: 24,
    letterSpacing: -0.3,
    color: colors.text,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  logName: {
    ...fonts.medium,
    fontSize: 17,
    color: colors.text,
  },
  logWhen: {
    marginTop: 4,
    ...fonts.regular,
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  logDur: {
    ...fonts.bold,
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    paddingVertical: 96,
    gap: 24,
    opacity: 0.3,
  },
  footerText: {
    ...fonts.light,
    fontSize: 18,
    lineHeight: 26,
    maxWidth: 280,
    color: colors.text,
  },
  footerRule: {
    width: 48,
    height: 1,
    backgroundColor: colors.text,
  },
})
