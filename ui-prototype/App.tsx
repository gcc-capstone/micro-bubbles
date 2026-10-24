// Prototype shell: tabs and the current screen. Dummy data only (see data.ts).
// Screens handle their own top inset so the map can run under the status bar;
// the tab bar paints down behind the home indicator.
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { initialWindowMetrics, SafeAreaInsetsContext, SafeAreaProvider } from 'react-native-safe-area-context';
import { getCalendars } from 'expo-localization';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { PopMenu, SheetTopProvider, Tab, TabBar } from './components';
import { applyTheme, colors, CONTROL, fonts, isDark, shadow, spacing } from './theme';
import { EVERYONE, INBOX, PROFILE } from './data';
import CalendarScreen from './CalendarScreen';
import HomeScreen, { CreateKind } from './HomeScreen';
import InboxScreen from './InboxScreen';
import ProfileScreen, { ProfileAvatar } from './ProfileScreen';
import StyleReference from './StyleReference';

// Navigation experiment: tabs are Bubbles · + · Calendar; Inbox and Profile become buttons on the
// Bubbles screen and open as sheets. false = the four-tab layout.
const NAV_EXPERIMENT = true;
const CREATE: CreateKind[] = ['Drop Pin', 'New Hotspot', 'New Event', 'New Bubble'];
// Same indices as TABS for the screens (0 Bubbles, 2 Calendar); 1 is the + button.
const EXP_TABS: Tab[] = [
  { icon: 'ellipse-outline', label: 'Bubbles' },
  { icon: 'add', label: 'New', action: true },
  { icon: 'calendar-outline', label: 'Calendar' },
];
const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 }; // page sheets start below the status bar

const TABS: Tab[] = [
  { icon: 'ellipse-outline', label: 'Bubbles' },
  { icon: 'mail-outline', label: 'Inbox' },
  { icon: 'calendar-outline', label: 'Calendar' },
  { icon: 'person-outline', label: 'Profile' },
];

export default function App() {
  const [fontsLoaded] = useFonts({ Lato_400Regular, Lato_700Bold, Montserrat_600SemiBold, Montserrat_700Bold });
  const [tab, setTab] = useState(0);
  const [showStyles, setShowStyles] = useState(false);
  const [homeReset, setHomeReset] = useState(0); // re-tapping Bubbles returns to the bubble view
  const [reduceMotion, setReduceMotion] = useState(false);
  const [everyoneRadius, setEveryoneRadius] = useState(10); // miles shown on the default Everyone map
  const [eventsOnMap, setEventsOnMap] = useState(false);
  const [eventDays, setEventDays] = useState(7); // how far ahead events show on the map
  const [, setInboxTick] = useState(0); // re-render for the Inbox tab badge
  const [sheet, setSheet] = useState<'inbox' | 'profile' | null>(null); // experiment: Inbox / Profile as sheets
  const [createReq, setCreateReq] = useState<{ kind: CreateKind; n: number }>();
  const unread = INBOX.filter((it) => !it.read).length;
  const [createOpen, setCreateOpen] = useState(false);
  const [allBubbles, setAllBubbles] = useState(false); // HomeScreen is showing All Bubbles: no tab bar
  const { width, height } = useWindowDimensions();
  // the + sits centered in the tab bar; its menu opens upward from it
  const plusAnchor = { x: width / 2 - 20, y: height - Math.max(initialWindowMetrics?.insets.bottom ?? 0, 8) - 46, w: 40, h: 40 };
  const create = (kind: CreateKind) => {
    setTab(0); // the create sheets live on the Bubbles screen
    setCreateReq((r) => ({ kind, n: (r?.n ?? 0) + 1 }));
  };
  const [themeKey, setThemeKey] = useState(0); // bumped after applyTheme so every screen redraws with new colors
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const retheme = () => {
    applyTheme(scheme, PROFILE.accent);
    EVERYONE.color = colors.primary;
    setThemeKey((k) => k + 1);
  };
  // follow Dark Mode, including changes while the app is open
  if (isDark !== (scheme === 'dark')) {
    applyTheme(scheme, PROFILE.accent);
    EVERYONE.color = colors.primary;
  }
  const [weekStartPref, setWeekStartPref] = useState<'System' | 'Sunday' | 'Monday'>('System');
  // expo-localization: firstWeekday 1 = Sunday, 2 = Monday
  const systemWeekStart = (getCalendars()[0]?.firstWeekday ?? 1) === 2 ? 1 : 0;
  const weekStart = weekStartPref === 'System' ? systemWeekStart : weekStartPref === 'Monday' ? 1 : 0;

  // Start from the system setting; Profile > Settings can override it.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion); // Settings changes while open
    return () => sub.remove();
  }, []);
  useEffect(() => setThemeKey((k) => k + 1), [scheme]);

  const profile = (
    <ProfileScreen
      reduceMotion={reduceMotion}
      onReduceMotion={setReduceMotion}
      everyoneRadius={everyoneRadius}
      onEveryoneRadius={setEveryoneRadius}
      eventsOnMap={eventsOnMap}
      onEventsOnMap={setEventsOnMap}
      eventDays={eventDays}
      onEventDays={setEventDays}
      weekStartPref={weekStartPref}
      systemWeekStart={systemWeekStart}
      onWeekStartPref={setWeekStartPref}
      onStyles={() => setShowStyles(true)}
      onAccent={retheme}
    />
  );

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {showStyles ? (
        <StyleReference onClose={() => setShowStyles(false)} />
      ) : (
        <View key={themeKey} style={styles.screen}>
          <View style={{ flex: 1 }}>
            {tab === 0 && (
              <HomeScreen
                resetKey={homeReset}
                reduceMotion={reduceMotion}
                everyoneRadius={everyoneRadius}
                eventsOnMap={eventsOnMap}
                eventDays={eventDays}
                weekStart={weekStart}
                nav={NAV_EXPERIMENT ? { unread, avatar: <ProfileAvatar size={CONTROL} />, onInbox: () => setSheet('inbox'), onProfile: () => setSheet('profile'), onAllBubbles: setAllBubbles } : undefined}
                createReq={createReq}
              />
            )}
            {!NAV_EXPERIMENT && tab === 1 && <InboxScreen onChange={() => setInboxTick((t) => t + 1)} />}
            {tab === 2 && <CalendarScreen weekStart={weekStart} reduceMotion={reduceMotion} />}
            {!NAV_EXPERIMENT && tab === 3 && profile}
          </View>
          {!(tab === 0 && allBubbles) && <TabBar
            tabs={NAV_EXPERIMENT ? EXP_TABS : TABS.map((t) => (t.label === 'Inbox' ? { ...t, badge: unread } : t))}
            active={tab}
            onPress={(i) => (NAV_EXPERIMENT && i === 1 ? setCreateOpen(true) : i === 0 && tab === 0 ? setHomeReset(homeReset + 1) : setTab(i))}
          />}
          <PopMenu
            visible={createOpen}
            anchor={plusAnchor}
            options={CREATE}
            icons={{ 'Drop Pin': 'location-outline', 'New Hotspot': 'radio-outline', 'New Event': 'calendar-outline', 'New Bubble': 'ellipse-outline' }}
            onSelect={(o) => create(o as CreateKind)}
            onClose={() => setCreateOpen(false)}
          />
          {NAV_EXPERIMENT && (
            <Modal visible={!!sheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSheet(null)}>
              <SafeAreaInsetsContext.Provider value={NO_INSETS}>
                <SheetTopProvider>
                <View style={styles.screen}>
                  {sheet === 'inbox' && <InboxScreen onChange={() => setInboxTick((t) => t + 1)} />}
                  {sheet === 'profile' && profile}
                  <Pressable onPress={() => setSheet(null)} style={styles.done} hitSlop={8}>
                    <Text style={styles.doneText}>Done</Text>
                  </Pressable>
                </View>
                </SheetTopProvider>
              </SafeAreaInsetsContext.Provider>
            </Modal>
          )}
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // leading, so it never collides with the screens' own trailing buttons (Mark All as Read, Settings)
  done: { position: 'absolute', top: 6, left: spacing.md, height: 32, paddingHorizontal: spacing.md, borderRadius: 16, justifyContent: 'center', backgroundColor: colors.surface, ...shadow },
  doneText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.primary },
});
