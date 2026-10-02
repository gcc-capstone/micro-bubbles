// Prototype shell: tabs and the current screen. Dummy data only (see data.ts).
// Screens handle their own top inset so the map can run under the status bar;
// the tab bar paints down behind the home indicator.
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Tab, TabBar } from './components';
import { colors } from './theme';
import CalendarScreen from './CalendarScreen';
import HomeScreen from './HomeScreen';
import InboxScreen from './InboxScreen';
import ProfileScreen from './ProfileScreen';
import StyleReference from './StyleReference';

const TABS: Tab[] = [
  { icon: 'ellipse', label: 'Bubbles' },
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

  // Start from the system setting; Profile > Settings can override it.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {showStyles ? (
        <StyleReference onClose={() => setShowStyles(false)} />
      ) : (
        <View style={styles.screen}>
          <View style={{ flex: 1 }}>
            {tab === 0 && <HomeScreen resetKey={homeReset} reduceMotion={reduceMotion} everyoneRadius={everyoneRadius} />}
            {tab === 1 && <InboxScreen />}
            {tab === 2 && <CalendarScreen />}
            {tab === 3 && (
              <ProfileScreen
                reduceMotion={reduceMotion}
                onReduceMotion={setReduceMotion}
                everyoneRadius={everyoneRadius}
                onEveryoneRadius={setEveryoneRadius}
                onStyles={() => setShowStyles(true)}
              />
            )}
          </View>
          <TabBar tabs={TABS} active={tab} onPress={(i) => (i === 0 && tab === 0 ? setHomeReset(homeReset + 1) : setTab(i))} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
