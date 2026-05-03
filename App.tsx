import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomNav } from './src/components/BottomNav'
import { BlockView } from './src/components/BlockView'
import { HomeView } from './src/components/HomeView'
import { SettingsView } from './src/components/SettingsView'
import { StatsView } from './src/components/StatsView'
import { SetupFlow } from './src/onboarding/SetupFlow'
import {
  finishSetupPatch,
  loadPersisted,
  resetPersisted,
  savePersisted,
} from './src/storage'
import { colors } from './src/theme'
import type { PersistedState, TabId, UserProfile } from './src/types'
import { addOrMergeDaily, computeStreak, dateKey } from './src/utils/stats'
import { daysInAppSince } from './src/utils/time'

type ActiveSession = {
  id: string
  title: string
  startedAt: number
  endAt: number
  durationMinutes: number
}

function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function Shell() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<TabId>('stats')
  const [data, setData] = useState<PersistedState | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const lastCompletedId = useRef<string | null>(null)
  const skipSave = useRef(true)

  useEffect(() => {
    loadPersisted().then(setData)
  }, [])

  useEffect(() => {
    if (!data) return
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    savePersisted(data)
  }, [data])

  useEffect(() => {
    if (!activeSession) return
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeSession])

  useEffect(() => {
    if (!activeSession || now < activeSession.endAt) return
    if (lastCompletedId.current === activeSession.id) return
    lastCompletedId.current = activeSession.id
    const done = activeSession
    setActiveSession(null)
    setData((d) => {
      if (!d) return d
      return {
        ...d,
        sessions: [
          {
            id: randomId(),
            title: done.title,
            startedAt: new Date(done.startedAt).toISOString(),
            durationMinutes: done.durationMinutes,
          },
          ...d.sessions,
        ],
        dailyFocusMinutes: addOrMergeDaily(
          d.dailyFocusMinutes,
          dateKey(new Date()),
          done.durationMinutes,
        ),
      }
    })
  }, [activeSession, now])

  if (!data) {
    return <View style={styles.boot} />
  }

  if (!data.profile.onboardingDone) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SetupFlow
          onFinished={(profile: UserProfile) => {
            setData((d) => (d ? finishSetupPatch(d, profile) : d))
          }}
        />
      </View>
    )
  }

  const enabledBlockCount = data.targets.filter((t) => t.enabled).length
  const bottomInset = insets.bottom

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.main, { paddingTop: insets.top }]}>
        {tab === 'home' && (
          <HomeView
            enabledBlockCount={enabledBlockCount}
            currentStreak={computeStreak(data.dailyFocusMinutes)}
            daysInApp={daysInAppSince(data.profile.setupCompletedAt)}
            scrollIntroDone={data.profile.hasSeenMainScrollIntro === true}
            onScrollPastIntro={() =>
              setData((d) =>
                d
                  ? {
                      ...d,
                      profile: { ...d.profile, hasSeenMainScrollIntro: true },
                    }
                  : d,
              )
            }
            active={activeSession}
            now={now}
            bottomInset={bottomInset}
            onStartSession={(minutes, title) => {
              const t = Date.now()
              setNow(t)
              setActiveSession({
                id: randomId(),
                title,
                startedAt: t,
                endAt: t + minutes * 60_000,
                durationMinutes: minutes,
              })
            }}
          />
        )}
        {tab === 'block' && (
          <BlockView
            targets={data.targets}
            bottomInset={bottomInset}
            onToggle={(id) =>
              setData((d) =>
                d
                  ? {
                      ...d,
                      targets: d.targets.map((x) =>
                        x.id === id ? { ...x, enabled: !x.enabled } : x,
                      ),
                    }
                  : d,
              )
            }
            onAdd={(name) =>
              setData((d) => {
                if (!d) return d
                const key = name.trim().toLowerCase()
                if (!key) return d
                if (d.targets.some((t) => t.name.trim().toLowerCase() === key)) return d
                return {
                  ...d,
                  targets: [...d.targets, { id: randomId(), name: name.trim(), enabled: true }],
                }
              })
            }
          />
        )}
        {tab === 'stats' && (
          <StatsView
            data={data}
            bottomInset={bottomInset}
            onOpenSettings={() => setTab('settings')}
          />
        )}
        {tab === 'settings' && (
          <SettingsView
            data={data}
            bottomInset={bottomInset}
            onUpdate={(next) => setData(next)}
            onReset={() => {
              resetPersisted().then((fresh) => {
                setData(fresh)
                setActiveSession(null)
              })
            }}
            onReplaySetup={() =>
              setData((d) =>
                d
                  ? {
                      ...d,
                      profile: {
                        ...d.profile,
                        setupComplete: false,
                        onboardingDone: false,
                        setupCompletedAt: null,
                        hasSeenMainScrollIntro: false,
                      },
                    }
                  : d,
              )
            }
          />
        )}
      </View>
      <BottomNav active={tab} onChange={setTab} />
    </View>
  )
}

export default function App() {
  const [loaded] = useFonts(
    Platform.OS === 'android'
      ? {
          Inter_300Light,
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        }
      : {},
  )

  if (Platform.OS === 'android' && !loaded) {
    return <View style={styles.boot} />
  }

  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  main: {
    flex: 1,
  },
})
