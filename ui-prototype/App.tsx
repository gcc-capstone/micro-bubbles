// Prototype shell: tabs and the current screen. Dummy data only (see data.ts).
// Screens handle their own top inset so the map can run under the status bar;
// the tab bar paints down behind the home indicator.
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AccessibilityInfo, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getCalendars } from 'expo-localization';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Tab, TabBar } from './components';
import { applyTheme, colors, isDark } from './theme';
import { EVERYONE, INBOX, PROFILE } from './data';
import CalendarScreen from './CalendarScreen';
import HomeScreen from './HomeScreen';
import InboxScreen from './InboxScreen';
import ProfileScreen from './ProfileScreen';
import StyleReference from './StyleReference';

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
              <HomeScreen resetKey={homeReset} reduceMotion={reduceMotion} everyoneRadius={everyoneRadius} eventsOnMap={eventsOnMap} eventDays={eventDays} weekStart={weekStart} />
            )}
            {tab === 1 && <InboxScreen onChange={() => setInboxTick((t) => t + 1)} />}
            {tab === 2 && <CalendarScreen weekStart={weekStart} reduceMotion={reduceMotion} />}
            {tab === 3 && (
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
            )}
          </View>
          <TabBar tabs={TABS.map((t) => (t.label === 'Inbox' ? { ...t, badge: INBOX.filter((it) => !it.read).length } : t))} active={tab} onPress={(i) => (i === 0 && tab === 0 ? setHomeReset(homeReset + 1) : setTab(i))} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
