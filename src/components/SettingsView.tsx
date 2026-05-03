import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { PersistedState } from '../types'
import { colors, fonts, space } from '../theme'
import {
  openAppSettings,
  openFocusModesHelp,
  openScreenTimeSettings,
} from '../utils/iosSystem'
import { patchReportedScreenTime } from '../storage'

type Props = {
  data: PersistedState
  onUpdate: (next: PersistedState) => void
  onReset: () => void
  onReplaySetup: () => void
  bottomInset: number
}

export function SettingsView({
  data,
  onUpdate,
  onReset,
  onReplaySetup,
  bottomInset,
}: Props) {
  const [hoursDraft, setHoursDraft] = useState(
    String(Math.round((data.profile.reportedDailyPhoneMinutes / 60) * 10) / 10),
  )

  const applyDailyAverage = () => {
    const h = parseFloat(hoursDraft.replace(',', '.'))
    if (Number.isNaN(h) || h <= 0) {
      Alert.alert('Enter hours', 'Use a number like 3.5 for hours per day.')
      return
    }
    const minutes = Math.round(h * 60)
    onUpdate(patchReportedScreenTime(data, minutes))
    Alert.alert('Updated', 'Charts now use this daily average. Compare with Screen Time in Settings.')
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + space.bottomNav + 24 },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>System</Text>
          <Text style={styles.title}>Settings</Text>
        </View>
        <Ionicons name="settings-outline" size={28} color="rgba(255,255,255,0.4)" />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Your focus</Text>
        <Text style={styles.body}>
          {data.profile.mainObjective || '—'}
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Screen time average</Text>
        <Text style={[styles.body, { marginBottom: 12 }]}>
          iOS does not expose Screen Time to this app. Enter the daily average you see under
          Settings ▸ Screen Time so charts match your real usage.
        </Text>
        <TextInput
          value={hoursDraft}
          onChangeText={setHoursDraft}
          keyboardType="decimal-pad"
          placeholder="Hours per day"
          placeholderTextColor={colors.muted3}
          style={styles.input}
        />
        <Pressable style={styles.actionBtn} onPress={applyDailyAverage}>
          <Text style={styles.actionBtnText}>Save &amp; refresh charts</Text>
        </Pressable>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>iPhone blocking</Text>
        <Text style={[styles.body, { marginBottom: 16 }]}>
          App limits and Downtime are controlled by Apple in Settings. These buttons open system
          screens (when iOS allows the link).
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

      <View style={styles.block}>
        <Text style={styles.label}>Setup</Text>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() =>
            Alert.alert('Run setup again?', 'You will go through the questions again.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue', onPress: onReplaySetup },
            ])
          }
        >
          <Text style={styles.secondaryBtnText}>Run setup again</Text>
        </Pressable>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Data</Text>
        <Text style={[styles.body, { marginBottom: 24 }]}>
          Everything stays on this device. Uninstalling clears it.
        </Text>
        <Pressable
          onPress={() =>
            Alert.alert(
              'Reset local data',
              'Reset sessions, charts, block list, and profile to defaults?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: onReset },
              ],
            )
          }
          style={styles.resetBtn}
        >
          <Text style={styles.resetLabel}>Reset local data</Text>
        </Pressable>
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
    gap: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  block: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outline,
    paddingBottom: 32,
  },
  label: {
    ...fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  body: {
    ...fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.5)',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 14,
    ...fonts.regular,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.text,
  },
  actionBtnText: {
    ...fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.text,
    textTransform: 'uppercase',
  },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    ...fonts.semibold,
    fontSize: 12,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryBtnText: {
    ...fonts.medium,
    fontSize: 14,
    color: colors.muted2,
  },
  resetBtn: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  resetLabel: {
    ...fonts.semibold,
    fontSize: 13,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
})
