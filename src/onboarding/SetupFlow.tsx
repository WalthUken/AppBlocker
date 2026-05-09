import Slider from '@react-native-community/slider'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { UserProfile } from '../types'
import { colors, fonts, space } from '../theme'
import {
  hoursPerWeek,
  hoursPerYear,
  lifeRemainingGrid,
  recoverableHoursPerYear,
} from '../utils/lifeProjection'
import {
  openAppSettings,
  openFocusModesHelp,
  openScreenTimeSettings,
} from '../utils/iosSystem'

const OBJECTIVES = [
  { id: 'deep', label: 'Reclaim deep work & attention' },
  { id: 'sleep', label: 'Sleep, mornings, and boundaries' },
  { id: 'scroll', label: 'Stop doomscrolling' },
  { id: 'people', label: 'Be more present with people' },
  { id: 'study', label: 'School, exams, or career push' },
  { id: 'other', label: 'Something else' },
] as const

/** Pick one or more — stored as a single line joined with " · ". */
const LONG_TERM_GOAL_OPTIONS = [
  { id: 'lt_career', label: 'Career growth & mastery' },
  { id: 'lt_finance', label: 'Financial stability' },
  { id: 'lt_health', label: 'Health & longevity' },
  { id: 'lt_relationships', label: 'Relationships & family' },
  { id: 'lt_creative', label: 'Creative work or a major project' },
  { id: 'lt_education', label: 'Education or credentials' },
  { id: 'lt_balance', label: 'Calmer pace & better boundaries' },
  { id: 'lt_other', label: 'Something else (describe)' },
] as const

const SHORT_TERM_GOAL_OPTIONS = [
  { id: 'st_exam', label: 'Pass an exam or finish a course' },
  { id: 'st_habit', label: 'Build a daily habit (30 days)' },
  { id: 'st_project', label: 'Ship a project milestone' },
  { id: 'st_screen', label: 'Cut passive screen time this month' },
  { id: 'st_sleep', label: 'Improve sleep / morning routine' },
  { id: 'st_focus', label: 'More deep-work blocks each week' },
  { id: 'st_fitness', label: 'Fitness or training block' },
  { id: 'st_other', label: 'Something else (describe)' },
] as const

const AGE_CHOICES = [
  { label: '18–24', age: 21 },
  { label: '25–34', age: 30 },
  { label: '35–44', age: 40 },
  { label: '45–54', age: 50 },
  { label: '55–64', age: 58 },
  { label: '65+', age: 70 },
] as const

const STEPS = 8

type Props = {
  onFinished: (profile: UserProfile) => void
}

export function SetupFlow({ onFinished }: Props) {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0)
  const [mainObjective, setMainObjective] = useState<string>('')
  const [objectiveOther, setObjectiveOther] = useState('')
  const [longTermPicked, setLongTermPicked] = useState<string[]>([])
  const [longTermOther, setLongTermOther] = useState('')
  const [shortTermPicked, setShortTermPicked] = useState<string[]>([])
  const [shortTermOther, setShortTermOther] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState(180)
  const [age, setAge] = useState<number | null>(null)
  const fade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    fade.setValue(0)
    Animated.timing(fade, {
      toValue: 1,
      duration: 340,
      useNativeDriver: true,
    }).start()
  }, [step, fade])

  const objectiveLabel =
    mainObjective === 'other' && objectiveOther.trim()
      ? objectiveOther.trim()
      : OBJECTIVES.find((o) => o.id === mainObjective)?.label ?? ''

  const togglePicked = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]

  const formatPickedGoals = (
    picked: string[],
    options: readonly { id: string; label: string }[],
    otherId: string,
    otherText: string,
  ) => {
    const labels = picked
      .filter((id) => id !== otherId)
      .map((id) => options.find((o) => o.id === id)?.label)
      .filter((x): x is string => !!x)
    if (picked.includes(otherId) && otherText.trim()) labels.push(otherText.trim())
    return labels.join(' · ')
  }

  const longTermGoalsText = formatPickedGoals(
    longTermPicked,
    LONG_TERM_GOAL_OPTIONS,
    'lt_other',
    longTermOther,
  )
  const shortTermGoalsText = formatPickedGoals(
    shortTermPicked,
    SHORT_TERM_GOAL_OPTIONS,
    'st_other',
    shortTermOther,
  )

  const grid = lifeRemainingGrid(dailyMinutes, age)

  const canNext = () => {
    switch (step) {
      case 0:
        return (
          !!mainObjective &&
          (mainObjective !== 'other' || objectiveOther.trim().length > 0)
        )
      case 1:
        if (longTermPicked.length === 0) return false
        if (longTermPicked.includes('lt_other') && !longTermOther.trim()) return false
        return longTermGoalsText.length > 0
      case 2:
        if (shortTermPicked.length === 0) return false
        if (shortTermPicked.includes('st_other') && !shortTermOther.trim()) return false
        return shortTermGoalsText.length > 0
      case 3:
        return dailyMinutes >= 30
      case 4:
        return age !== null
      default:
        return true
    }
  }

  const next = () => {
    if (step < STEPS - 1) setStep((s) => s + 1)
    else {
      const profile: UserProfile = {
        mainObjective: objectiveLabel,
        longTermGoals: longTermGoalsText,
        shortTermGoals: shortTermGoalsText,
        reportedDailyPhoneMinutes: dailyMinutes,
        age,
        setupComplete: true,
        onboardingDone: false,
        setupCompletedAt: null,
        hasSeenMainScrollIntro: false,
      }
      onFinished(profile)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.progressRow}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, i <= step && styles.progressDotOn]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: space.container,
          paddingBottom: insets.bottom + 120,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fade }}>
          {step === 0 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>Start</Text>
              <Text style={styles.headline}>What is the main reason you want this app?</Text>
              <Text style={styles.sub}>Pick the one that fits best.</Text>
              <View style={styles.options}>
                {OBJECTIVES.map((o) => {
                  const on = mainObjective === o.id
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() => setMainObjective(o.id)}
                      style={[styles.optionBox, on && styles.optionBoxOn]}
                    >
                      <Text style={[styles.optionText, on && styles.optionTextOn]}>
                        {o.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              {mainObjective === 'other' && (
                <TextInput
                  value={objectiveOther}
                  onChangeText={setObjectiveOther}
                  placeholder="Describe in a few words"
                  placeholderTextColor={colors.muted3}
                  style={styles.textInput}
                />
              )}
            </View>
          )}

          {step === 1 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>Direction</Text>
              <Text style={styles.headline}>What are your long-term goals?</Text>
              <Text style={styles.sub}>
                Think years ahead. Tap all that apply—you can refine later in Settings.
              </Text>
              <View style={styles.options}>
                {LONG_TERM_GOAL_OPTIONS.map((o) => {
                  const on = longTermPicked.includes(o.id)
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() =>
                        setLongTermPicked((prev) => togglePicked(prev, o.id))
                      }
                      style={[styles.optionBox, on && styles.optionBoxOn]}
                    >
                      <Text style={[styles.optionText, on && styles.optionTextOn]}>
                        {o.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              {longTermPicked.includes('lt_other') && (
                <TextInput
                  value={longTermOther}
                  onChangeText={setLongTermOther}
                  placeholder="Your long-term focus in a few words"
                  placeholderTextColor={colors.muted3}
                  style={styles.textInput}
                />
              )}
            </View>
          )}

          {step === 2 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>Now</Text>
              <Text style={styles.headline}>What are your short-term goals?</Text>
              <Text style={styles.sub}>
                This month or this semester—concrete wins. Select any that fit.
              </Text>
              <View style={styles.options}>
                {SHORT_TERM_GOAL_OPTIONS.map((o) => {
                  const on = shortTermPicked.includes(o.id)
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() =>
                        setShortTermPicked((prev) => togglePicked(prev, o.id))
                      }
                      style={[styles.optionBox, on && styles.optionBoxOn]}
                    >
                      <Text style={[styles.optionText, on && styles.optionTextOn]}>
                        {o.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              {shortTermPicked.includes('st_other') && (
                <TextInput
                  value={shortTermOther}
                  onChangeText={setShortTermOther}
                  placeholder="Your short-term focus in a few words"
                  placeholderTextColor={colors.muted3}
                  style={styles.textInput}
                />
              )}
            </View>
          )}

          {step === 3 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>Baseline</Text>
              <Text style={styles.headline}>
                Roughly how much time do you spend on your phone each day?
              </Text>
              <Text style={styles.sub}>
                Drag the slider. You can match this later to Settings ▸ Screen Time.
              </Text>
              <Text style={styles.sliderReadout}>
                {(dailyMinutes / 60).toFixed(1)} hours / day
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={30}
                maximumValue={900}
                step={15}
                value={dailyMinutes}
                onValueChange={setDailyMinutes}
                minimumTrackTintColor={colors.text}
                maximumTrackTintColor={colors.outline}
                thumbTintColor={colors.text}
              />
              <View style={styles.statBlock}>
                <Text style={styles.statLine}>
                  <Text style={styles.statEm}>{hoursPerWeek(dailyMinutes).toFixed(1)}h</Text> per
                  week
                </Text>
                <Text style={styles.statLine}>
                  <Text style={styles.statEm}>{Math.round(hoursPerYear(dailyMinutes))}h</Text> per
                  year on the device
                </Text>
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>Perspective</Text>
              <Text style={styles.headline}>Which age band are you in?</Text>
              <Text style={styles.sub}>
                Used only to frame the next visual. Not stored for anything else.
              </Text>
              <View style={styles.gridChoices}>
                {AGE_CHOICES.map((a) => {
                  const on = age === a.age
                  return (
                    <Pressable
                      key={a.label}
                      onPress={() => setAge(a.age)}
                      style={[styles.hourBox, on && styles.hourBoxOn]}
                    >
                      <Text style={[styles.hourBoxText, on && styles.hourBoxTextOn]}>
                        {a.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {step === 5 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>The map</Text>
              <Text style={styles.headline}>Waking life: yours vs. the phone</Text>
              <Text style={styles.sub}>
                Each square is a slice of waking time at your current pace. White is life still
                yours; grey is hours going to the phone (~{Math.round(grid.f * 100)}% of waking
                hours).
              </Text>
              <View style={styles.lifeGrid}>
                {Array.from({ length: grid.total }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.lifeCell,
                      i < grid.whiteCount ? styles.lifeWhite : styles.lifeGrey,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {step === 6 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>Momentum</Text>
              <Text style={styles.headline}>What you could take back</Text>
              <Text style={styles.sub}>
                If limits and focus cut even a quarter of passive phone time, you could recover
                roughly{' '}
                <Text style={styles.statEm}>
                  {Math.round(recoverableHoursPerYear(dailyMinutes, 0.25))}h
                </Text>{' '}
                per year for what you said matters—without touching sleep or work hours in this
                estimate.
              </Text>
            </View>
          )}

          {step === 7 && (
            <View style={styles.step}>
              <Text style={styles.kicker}>iPhone</Text>
              <Text style={styles.headline}>Turn on real blocking</Text>
              <Text style={styles.sub}>
                Apple does not let third-party apps read Screen Time or block other apps directly.
                Limits live in Settings. Use the buttons below—this opens system screens you
                control.
              </Text>
              <Pressable style={styles.primaryBtn} onPress={() => openScreenTimeSettings()}>
                <Text style={styles.primaryBtnText}>Screen Time &amp; App Limits</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => openFocusModesHelp()}>
                <Text style={styles.secondaryBtnText}>Focus modes (guide)</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => openAppSettings()}>
                <Text style={styles.secondaryBtnText}>This app in Settings</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={next}
          disabled={!canNext()}
          style={[styles.nextBtn, !canNext() && styles.nextBtnOff]}
        >
          <Text style={styles.nextBtnText}>
            {step === STEPS - 1 ? 'Enter app' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: space.container,
    marginBottom: 20,
  },
  progressDot: {
    flex: 1,
    height: 3,
    backgroundColor: colors.outline,
  },
  progressDotOn: { backgroundColor: colors.text },
  scroll: { flex: 1 },
  step: { gap: 16, paddingTop: 8 },
  kicker: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  headline: {
    ...fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  sub: {
    ...fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted2,
    marginBottom: 8,
  },
  sliderReadout: {
    ...fonts.bold,
    fontSize: 22,
    color: colors.text,
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 44,
    marginTop: 4,
  },
  options: { gap: 10, marginTop: 8 },
  optionBox: {
    minHeight: 56,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: 'transparent',
  },
  optionBoxOn: {
    borderColor: colors.text,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  optionText: {
    ...fonts.medium,
    fontSize: 16,
    color: colors.muted2,
  },
  optionTextOn: { color: colors.text },
  gridChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  hourBox: {
    flexBasis: '47%',
    maxWidth: '47%',
    minHeight: 64,
    aspectRatio: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  hourBoxOn: {
    borderColor: colors.text,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  hourBoxText: {
    ...fonts.semibold,
    fontSize: 16,
    color: colors.muted2,
  },
  hourBoxTextOn: { color: colors.text },
  textInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 14,
    ...fonts.regular,
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
  },
  textArea: { minHeight: 140, textAlignVertical: 'top' },
  statBlock: {
    marginTop: 12,
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.outline,
    gap: 12,
  },
  statLine: {
    ...fonts.regular,
    fontSize: 18,
    color: colors.muted2,
  },
  statEm: { ...fonts.bold, color: colors.text },
  lifeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 20,
    maxWidth: 12 * 11,
  },
  lifeCell: { width: 8, height: 8 },
  lifeWhite: { backgroundColor: '#ffffff' },
  lifeGrey: { backgroundColor: '#333333' },
  primaryBtn: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...fonts.semibold,
    fontSize: 14,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...fonts.medium,
    fontSize: 15,
    color: colors.muted2,
  },
  footer: {
    paddingHorizontal: space.container,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  nextBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.text,
  },
  nextBtnOff: { opacity: 0.35 },
  nextBtnText: {
    ...fonts.semibold,
    fontSize: 15,
    color: colors.bg,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
})
