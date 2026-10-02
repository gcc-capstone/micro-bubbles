// Prototype shell: header, tabs, and the current screen. Dummy data only (see data.ts).
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { AppHeader, Button, Card, Tab, TabBar } from './components';
import { colors, spacing, type } from './theme';
import CalendarScreen from './CalendarScreen';
import HomeScreen from './HomeScreen';
import StyleReference from './StyleReference';

const TABS: Tab[] = [
  { icon: 'ellipse', label: 'Bubbles' },
  { icon: 'mail-outline', label: 'Inbox' },
  { icon: 'add', label: 'Drop Pin', action: true },
  { icon: 'calendar-outline', label: 'Calendar' },
  { icon: 'person-outline', label: 'Profile' },
];

export default function App() {
  const [fontsLoaded] = useFonts({ Lato_400Regular, Lato_700Bold, Montserrat_600SemiBold, Montserrat_700Bold });
  const [tab, setTab] = useState(0);
  const [showStyles, setShowStyles] = useState(false);

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
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <AppHeader unread />
        <View style={{ flex: 1 }}>
          {tab === 0 ? (
            <HomeScreen />
          ) : tab === 3 ? (
            <CalendarScreen />
          ) : (
            // ponytail: placeholder until each flow is built
            <View style={styles.placeholder}>
              <Card style={{ gap: spacing.sm }}>
                <Text style={type.h2}>{TABS[tab].label}</Text>
                <Text style={type.body}>This screen isn't built yet in the prototype.</Text>
                {tab === 4 && <Button title="View Style Reference" variant="secondary" onPress={() => setShowStyles(true)} />}
              </Card>
            </View>
          )}
        </View>
        <TabBar tabs={TABS} active={tab} onPress={setTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  placeholder: { flex: 1, padding: spacing.md, justifyContent: 'center' },
});
