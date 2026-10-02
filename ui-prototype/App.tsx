// Prototype shell: tabs and the current screen. Dummy data only (see data.ts).
// Screens handle their own top inset so the map can run under the status bar.
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Button, Card, Tab, TabBar } from './components';
import { colors, spacing, type } from './theme';
import CalendarScreen from './CalendarScreen';
import HomeScreen from './HomeScreen';
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
  const [homeReset, setHomeReset] = useState(0); // re-tapping Bubbles returns to the floating view

  if (!fontsLoaded) return null;
  if (showStyles) {
    return (
      <SafeAreaProvider>
        <StyleReference onClose={() => setShowStyles(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>
          {tab === 0 ? (
            <HomeScreen resetKey={homeReset} />
          ) : tab === 2 ? (
            <CalendarScreen />
          ) : (
            <Placeholder title={TABS[tab].label} onStyles={tab === 3 ? () => setShowStyles(true) : undefined} />
          )}
        </View>
        <TabBar tabs={TABS} active={tab} onPress={(i) => (i === 0 && tab === 0 ? setHomeReset(homeReset + 1) : setTab(i))} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ponytail: placeholder until each flow is built
function Placeholder({ title, onStyles }: { title: string; onStyles?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholder, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={type.largeTitle}>{title}</Text>
      <Card style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <Text style={type.body}>This screen isn't built yet in the prototype.</Text>
        {onStyles && <Button title="View Style Reference" variant="secondary" onPress={onStyles} />}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  placeholder: { flex: 1, padding: spacing.md },
});
