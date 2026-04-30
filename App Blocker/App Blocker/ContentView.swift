//
//  ContentView.swift
//  App Blocker
//
//  Created by Kerven Lalanne on 2026-04-30.
//

import SwiftUI

struct ContentView: View {
    @AppStorage("appblocker_streak") private var streakDays = 2
    @AppStorage("appblocker_focus_hours") private var focusHours = 24
    @AppStorage("appblocker_pickups") private var pickups = 59
    @AppStorage("appblocker_notifications") private var notifications = 11
    @AppStorage("appblocker_screen_time_minutes") private var screenTimeMinutes = 167
    @AppStorage("appblocker_strict_mode") private var strictModeRaw = StrictMode.normal.rawValue
    @AppStorage("appblocker_block_title") private var blockTitle = "Block Distracting Apps"
    @AppStorage("appblocker_location_based") private var isLocationBased = false
    @AppStorage("appblocker_repeat") private var repeatRule = "Every day"
    @AppStorage("appblocker_start_minutes") private var startMinutes = 0
    @AppStorage("appblocker_end_minutes") private var endMinutes = 1439

    @State private var selectedTab: AppTab = .home
    @State private var selectedRange: TimeRange = .day
    @State private var selectedDate = Date.now
    @State private var selectedMetric: ReportMetric = .screenTime
    @State private var showBlockEditor = false
    @State private var showDeleteConfirmation = false
    @State private var showSavedToast = false
    @State private var leaderboardPeople = [
        Friend(name: "Liam Rutherford", screenTime: "1h 03m", rank: 1),
        Friend(name: "Emma Garcia", screenTime: "1h 12m", rank: 2),
        Friend(name: "Me", screenTime: "2h 47m", rank: 3),
        Friend(name: "Noah Thompson", screenTime: "2h 54m", rank: 4),
        Friend(name: "Sophia Lee", screenTime: "3h 05m", rank: 5)
    ]
    @State private var blockedApps = [
        BlockedApp(name: "YouTube", icon: "play.square.fill", color: .red),
        BlockedApp(name: "Instagram", icon: "camera.fill", color: .pink),
        BlockedApp(name: "TikTok", icon: "music.note", color: .purple)
    ]
    @State private var weeklyTrend: [CGFloat] = [0.65, 0.48, 0.43, 0.51, 0.46, 0.31, 0.28]

    var body: some View {
        ZStack {
            backgroundGradient
                .ignoresSafeArea()

            TabView(selection: $selectedTab) {
                homeView
                    .tag(AppTab.home)
                    .tabItem { Label("Home", systemImage: "house") }
                reportView
                    .tag(AppTab.report)
                    .tabItem { Label("Report", systemImage: "chart.bar.fill") }
                sessionsView
                    .tag(AppTab.sessions)
                    .tabItem { Label("Sessions", systemImage: "rectangle.grid.1x2") }
                leaderboardView
                    .tag(AppTab.leaderboard)
                    .tabItem { Label("Leaderboard", systemImage: "trophy") }
                profileView
                    .tag(AppTab.profile)
                    .tabItem { Label("Profile", systemImage: "person.crop.circle") }
            }
            .tint(.cyan)
            .preferredColorScheme(.dark)

            if showSavedToast {
                VStack {
                    Spacer()
                    Text("Saved")
                        .font(.headline)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color.black.opacity(0.75), in: Capsule())
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.12), lineWidth: 1)
                        )
                        .padding(.bottom, 95)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .sheet(isPresented: $showBlockEditor) {
            blockEditorSheet
        }
        .alert("Delete schedule?", isPresented: $showDeleteConfirmation) {
            Button("Delete", role: .destructive) {
                blockedApps.removeAll()
                withAnimation { showSavedToast = true }
                dismissToast()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This removes all blocked apps from this schedule.")
        }
    }

    private var backgroundGradient: some View {
        RadialGradient(
            colors: [
                Color(red: 0.18, green: 0.52, blue: 0.45).opacity(0.6),
                Color(red: 0.03, green: 0.15, blue: 0.22),
                Color.black
            ],
            center: .top,
            startRadius: 20,
            endRadius: 700
        )
    }

    private var homeView: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 24) {
                    topBar
                    crystalHero
                    statsGrid
                    usageBarsCard
                    sessionCard
                    quickActions
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 30)
            }
        }
    }

    private var topBar: some View {
        HStack {
            Text("App blocker")
                .font(.system(size: 34, weight: .heavy, design: .rounded))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color.white, Color.teal.opacity(0.9)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
            Spacer()
            HStack(spacing: 5) {
                Text("TODAY")
                    .font(.system(size: 12, weight: .semibold))
                Image(systemName: "chevron.down")
                    .font(.system(size: 10, weight: .bold))
            }
            .foregroundStyle(.white.opacity(0.8))

            Button(action: {}) {
                Image(systemName: "gift")
                    .font(.system(size: 16, weight: .semibold))
                    .padding(9)
                    .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 10))
            }
            .foregroundStyle(.white.opacity(0.85))
        }
    }

    private var crystalHero: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.cyan.opacity(0.85), Color.clear],
                            center: .center,
                            startRadius: 20,
                            endRadius: 110
                        )
                    )
                    .frame(width: 200, height: 200)

                RoundedRectangle(cornerRadius: 36, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.82),
                                Color.blue.opacity(0.45),
                                Color.teal.opacity(0.55),
                                Color.purple.opacity(0.42)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 138, height: 148)
                    .overlay(
                        RoundedRectangle(cornerRadius: 36, style: .continuous)
                            .stroke(Color.white.opacity(0.35), lineWidth: 1)
                    )
                    .rotationEffect(.degrees(-18))
                    .shadow(color: .cyan.opacity(0.35), radius: 24, x: 0, y: 10)
            }

            Text(readableDuration(minutes: screenTimeMinutes))
                .font(.system(size: 50, weight: .medium, design: .rounded))
                .foregroundStyle(.mint)
            Text("SCREEN TIME")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white.opacity(0.72))
        }
    }

    private var statsGrid: some View {
        HStack(spacing: 20) {
            statItem(title: "MOST USED", value: blockedApps.prefix(3).map(\.name).joined(separator: " · "))
            statItem(title: "FOCUS LEVEL", value: "83%")
            statItem(title: "PICKUPS", value: "\(pickups)")
        }
    }

    private func statItem(title: String, value: String) -> some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white.opacity(0.62))
            Text(value)
                .font(.system(size: 19, weight: .medium, design: .rounded))
                .foregroundStyle(.white.opacity(0.95))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }

    private var usageBarsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .bottom, spacing: 8) {
                ForEach(Array(reportBars(for: .pickups).prefix(12).enumerated()), id: \.offset) { index, value in
                    VStack(spacing: 0) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(index.isMultiple(of: 4) ? Color.red.opacity(0.9) : Color.mint.opacity(0.95))
                            .frame(width: 10, height: 74 * value)
                        Spacer(minLength: 0)
                    }
                    .frame(height: 80)
                    .overlay(
                        RoundedRectangle(cornerRadius: 3)
                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                    )
                }
            }

            HStack {
                Text("6AM")
                Spacer()
                Text("10AM")
                Spacer()
                Text("2PM")
                Spacer()
                Text("8P")
            }
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(.white.opacity(0.45))
        }
        .padding(16)
        .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    private var sessionCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label("Time Offline", systemImage: "moon.zzz.fill")
                    .font(.system(size: 20, weight: .medium, design: .rounded))
                    .foregroundStyle(.mint)
                Spacer()
                Text("5h 36m")
                    .font(.system(size: 26, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
            }
            Text("68% of your day")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.68))

            Divider()
                .overlay(Color.white.opacity(0.12))

            HStack {
                Text("Session: \(timeString(from: startMinutes))-\(timeString(from: endMinutes))")
                Spacer()
                Text(blockTitle)
                    .foregroundStyle(.white.opacity(0.9))
                Image(systemName: "chevron.up")
            }
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.white.opacity(0.55))
        }
        .padding(16)
        .background(Color.black.opacity(0.3), in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }

    private var quickActions: some View {
        VStack(spacing: 10) {
            Button {
                showBlockEditor = true
            } label: {
                Label("Edit Block Distracting Apps", systemImage: "lock.shield.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.cyan)

            Button {
                selectedTab = .report
            } label: {
                Label("Open Daily Report", systemImage: "chart.xyaxis.line")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
    }

    private var reportView: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    headerWithActions(title: "refocus")
                    rangeSelector
                    dateSelector
                    reportSummaryCard
                    metricCard(title: "Screen Time per Hour", bars: reportBars(for: .screenTime), color: .cyan)
                    metricCard(title: "Pickups per Hour", bars: reportBars(for: .pickups), color: .mint)
                    metricCard(title: "Notifications per Hour", bars: reportBars(for: .notifications), color: .orange)
                }
                .padding(.horizontal, 20)
                .padding(.top, 6)
                .padding(.bottom, 30)
            }
        }
    }

    private func headerWithActions(title: String) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 34, weight: .bold, design: .rounded))
            Spacer()
            Button(action: { showBlockEditor = true }) {
                Image(systemName: "eye.slash")
                    .padding(10)
                    .background(Color.white.opacity(0.08), in: Circle())
            }
            Button(action: {}) {
                Image(systemName: "questionmark")
                    .padding(10)
                    .background(Color.white.opacity(0.08), in: Circle())
            }
        }
        .foregroundStyle(.white)
    }

    private var rangeSelector: some View {
        HStack(spacing: 0) {
            ForEach(TimeRange.allCases, id: \.self) { range in
                Button {
                    selectedRange = range
                } label: {
                    Text(range.rawValue)
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            selectedRange == range ? Color.blue : Color.clear,
                            in: RoundedRectangle(cornerRadius: 14)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
    }

    private var dateSelector: some View {
        let dates = (0..<7).compactMap { Calendar.current.date(byAdding: .day, value: -6 + $0, to: selectedDate) }
        let symbols = Calendar.current.shortWeekdaySymbols

        return HStack(spacing: 9) {
            ForEach(dates, id: \.self) { date in
                let day = Calendar.current.component(.day, from: date)
                let weekday = Calendar.current.component(.weekday, from: date) - 1
                let isToday = Calendar.current.isDateInToday(date)

                VStack(spacing: 4) {
                    Text(symbols[max(0, min(weekday, symbols.count - 1))].prefix(1))
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.6))
                    Text("\(day)")
                        .font(.headline)
                        .frame(width: 38, height: 38)
                        .background(isToday ? Color.blue : Color.white.opacity(0.08), in: Circle())
                }
            }
        }
    }

    private var reportSummaryCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Summary")
                .font(.title3.weight(.semibold))
            VStack(alignment: .leading, spacing: 6) {
                Text(formattedTodayDate())
                    .foregroundStyle(.secondary)
                Text(readableDuration(minutes: screenTimeMinutes))
                    .font(.system(size: 50, weight: .semibold, design: .rounded))
                Text("Screen Time")
                    .foregroundStyle(.secondary)
                HStack(spacing: 22) {
                    statItem(title: "PICKUPS", value: "\(pickups)")
                    statItem(title: "NOTIFICATIONS", value: "\(notifications)")
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))
        }
    }

    private func metricCard(title: String, bars: [CGFloat], color: Color) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.title3.weight(.semibold))
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .bottom, spacing: 6) {
                    ForEach(Array(bars.enumerated()), id: \.offset) { _, value in
                        RoundedRectangle(cornerRadius: 3)
                            .fill(color.opacity(0.9))
                            .frame(width: 8, height: 84 * value + 2)
                    }
                }
                HStack {
                    Text("12 AM")
                    Spacer()
                    Text("6 AM")
                    Spacer()
                    Text("12 PM")
                    Spacer()
                    Text("6 PM")
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))
        }
    }

    private var sessionsView: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    headerWithActions(title: "refocus")
                    activeBlockCard
                    ForEach(blockedApps) { app in
                        HStack {
                            Image(systemName: app.icon)
                                .foregroundStyle(app.color)
                                .frame(width: 32)
                            Text(app.name)
                            Spacer()
                            Text("Blocked")
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 25)
            }
        }
    }

    private var activeBlockCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(blockTitle)
                .font(.title2.weight(.semibold))
            HStack {
                Label("Start", systemImage: "clock")
                Spacer()
                Text(timeString(from: startMinutes))
            }
            HStack {
                Label("End", systemImage: "clock.fill")
                Spacer()
                Text(timeString(from: endMinutes))
            }
            HStack {
                Text("Repeat")
                Spacer()
                Text(repeatRule)
            }
            HStack {
                Text("Strict mode")
                Spacer()
                Text(strictMode.rawValue)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.orange.opacity(0.2), in: Capsule())
            }
            Button("Edit Block Distracting Apps") { showBlockEditor = true }
                .buttonStyle(.borderedProminent)
                .tint(.blue)
        }
        .padding()
        .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))
    }

    private var leaderboardView: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    HStack {
                        Text("Leaderboard")
                            .font(.largeTitle.bold())
                        Spacer()
                        Button(action: {}) {
                            Label("Add Friends", systemImage: "plus")
                                .font(.headline)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color.white.opacity(0.08), in: Capsule())
                        }
                    }

                    VStack(spacing: 7) {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.system(size: 78))
                            .foregroundStyle(.white.opacity(0.8))
                        Text("Just You!")
                            .foregroundStyle(.secondary)
                        Text("The Focused One")
                            .font(.system(size: 40, weight: .bold, design: .serif))
                            .multilineTextAlignment(.center)
                        Text("See your friends' screen time")
                            .foregroundStyle(.secondary)
                        Button("Find Friends on App blocker") {}
                            .buttonStyle(.borderedProminent)
                            .tint(.white)
                            .foregroundStyle(.black)
                            .padding(.top, 6)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()

                    ForEach(leaderboardPeople) { person in
                        HStack {
                            Text("\(person.rank)")
                                .font(.headline)
                                .foregroundStyle(.secondary)
                                .frame(width: 18)
                            Image(systemName: person.name == "Me" ? "person.crop.circle.fill.badge.checkmark" : "person.circle.fill")
                                .foregroundStyle(person.name == "Me" ? .cyan : .white.opacity(0.7))
                            VStack(alignment: .leading) {
                                Text(person.name)
                                Text(person.screenTime)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 30)
            }
        }
    }

    private var profileView: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "person.crop.circle")
                            .font(.system(size: 64))
                            .foregroundStyle(.white.opacity(0.9))
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Powellite5120")
                                .font(.title.bold())
                            Text("Top 5%")
                                .font(.caption.weight(.bold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.yellow.opacity(0.16), in: Capsule())
                        }
                        Spacer()
                    }

                    HStack(spacing: 0) {
                        profileStat(title: "DAY STREAK", value: "\(streakDays)", symbol: "flame.fill", tint: .orange)
                        profileStat(title: "FOCUS HOURS", value: "\(focusHours)", symbol: "hourglass.bottomhalf.filled", tint: .cyan)
                    }
                    .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))

                    VStack(alignment: .leading, spacing: 14) {
                        Picker("Range", selection: $selectedMetric) {
                            ForEach(ReportMetric.allCases, id: \.self) { metric in
                                Text(metric.rawValue).tag(metric)
                            }
                        }
                        .pickerStyle(.segmented)

                        HStack {
                            Text("Avg Screen Time")
                            Spacer()
                            Text(readableDuration(minutes: screenTimeMinutes / 3))
                                .fontWeight(.bold)
                        }

                        HStack(alignment: .bottom, spacing: 8) {
                            ForEach(Array(weeklyTrend.enumerated()), id: \.offset) { _, value in
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.cyan.opacity(0.85))
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 95 * value + 3)
                            }
                        }
                        .frame(height: 100, alignment: .bottom)

                        HStack {
                            ForEach(["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"], id: \.self) { day in
                                Text(day)
                                    .frame(maxWidth: .infinity)
                                    .foregroundStyle(.secondary)
                                    .font(.caption)
                            }
                        }
                    }
                    .padding()
                    .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Community")
                            .font(.title3.bold())
                        Text("Your screen time was 78% lower than your peers yesterday. Great work.")
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 30)
            }
        }
    }

    private func profileStat(title: String, value: String, symbol: String, tint: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: symbol)
                .font(.largeTitle)
                .foregroundStyle(tint)
            Text(value)
                .font(.system(size: 52, weight: .black, design: .rounded))
            Text(title)
                .font(.headline)
                .foregroundStyle(.white.opacity(0.85))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
    }

    private var blockEditorSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    editorGroup {
                        TextField("Title", text: $blockTitle)
                            .textFieldStyle(.roundedBorder)
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Apps & Websites To Block")
                                .foregroundStyle(.secondary)
                            ForEach(blockedApps) { app in
                                HStack {
                                    Image(systemName: app.icon)
                                        .foregroundStyle(app.color)
                                    Text(app.name)
                                    Spacer()
                                }
                                .padding(10)
                                .background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 10))
                            }
                        }
                    }

                    editorGroup {
                        durationRow(title: "Start at", value: $startMinutes)
                        durationRow(title: "End at", value: $endMinutes)

                        Picker("Repeat", selection: $repeatRule) {
                            Text("Every day").tag("Every day")
                            Text("Weekdays").tag("Weekdays")
                            Text("Weekends").tag("Weekends")
                        }
                        .pickerStyle(.menu)
                    }

                    editorGroup {
                        Picker("Strict mode", selection: $strictModeRaw) {
                            ForEach(StrictMode.allCases, id: \.rawValue) { mode in
                                Text(mode.rawValue).tag(mode.rawValue)
                            }
                        }
                        .pickerStyle(.segmented)

                        Toggle("Location based", isOn: $isLocationBased)
                            .tint(.blue)
                    }

                    Button("Save") {
                        withAnimation { showSavedToast = true }
                        dismissToast()
                        showBlockEditor = false
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.blue)
                    .frame(maxWidth: .infinity)

                    Button("Delete", role: .destructive) {
                        showDeleteConfirmation = true
                    }
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .background(Color.black)
            .navigationTitle("Edit Block Distracting Apps")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { showBlockEditor = false }
                }
            }
        }
    }

    private func editorGroup<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12, content: content)
            .padding()
            .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 16))
    }

    private func durationRow(title: String, value: Binding<Int>) -> some View {
        HStack {
            Text(title)
            Spacer()
            Stepper(timeString(from: value.wrappedValue), value: value, in: 0...1439, step: 15)
                .labelsHidden()
        }
    }

    private var strictMode: StrictMode {
        StrictMode(rawValue: strictModeRaw) ?? .normal
    }

    private func timeString(from minutes: Int) -> String {
        let hour = (minutes / 60) % 24
        let minute = minutes % 60
        let suffix = hour >= 12 ? "PM" : "AM"
        let displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour)
        return String(format: "%d:%02d %@", displayHour, minute, suffix)
    }

    private func readableDuration(minutes: Int) -> String {
        let hours = minutes / 60
        let remainder = minutes % 60
        if hours == 0 { return "\(remainder)m" }
        return "\(hours)h \(remainder)m"
    }

    private func reportBars(for metric: ReportMetric) -> [CGFloat] {
        switch metric {
        case .screenTime:
            return [0.03, 0.02, 0.04, 0.03, 0.02, 0.04, 0.06, 0.05, 0.09, 0.22, 0.31, 0.43, 0.46, 0.53, 0.49, 0.63, 0.74, 0.86, 0.61, 0.52, 0.37, 0.24, 0.12, 0.07]
        case .pickups:
            return [0.01, 0.0, 0.0, 0.0, 0.02, 0.0, 0.01, 0.0, 0.0, 0.08, 0.04, 0.03, 0.03, 0.0, 0.05, 0.0, 0.0, 0.95, 0.12, 0.0, 0.06, 0.0, 0.0, 0.0]
        case .notifications:
            return [0.0, 0.0, 0.01, 0.0, 0.0, 0.0, 0.0, 0.04, 0.03, 0.0, 0.02, 0.0, 0.0, 0.0, 0.08, 0.03, 0.02, 0.04, 0.09, 0.08, 0.05, 0.03, 0.01, 0.0]
        }
    }

    private func formattedTodayDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: Date.now)
    }

    private func dismissToast() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            withAnimation { showSavedToast = false }
        }
    }
}

private enum AppTab {
    case home
    case report
    case sessions
    case leaderboard
    case profile
}

private enum TimeRange: String, CaseIterable {
    case month = "Month"
    case week = "Week"
    case day = "Day"
}

private enum ReportMetric: String, CaseIterable {
    case screenTime = "Screen Time"
    case pickups = "Pickups"
    case notifications = "Notifications"
}

private enum StrictMode: String, CaseIterable {
    case easy = "Easy"
    case normal = "Normal"
    case hard = "Hard"
}

private struct Friend: Identifiable {
    let id = UUID()
    let name: String
    let screenTime: String
    let rank: Int
}

private struct BlockedApp: Identifiable {
    let id = UUID()
    let name: String
    let icon: String
    let color: Color
}

#Preview {
    ContentView()
}
