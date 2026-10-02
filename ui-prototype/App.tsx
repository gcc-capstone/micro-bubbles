// Style reference: shows every token in theme.ts and component in components.tsx.
// App screens should import from those two files, not from here.
import { ReactNode, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { bubbleColors, colors, fonts, radius, shadow, spacing, type } from './theme';
import {
  AppHeader, Avatar, Bubble, Button, Card, Checkbox, Chip, Cluster, Dropdown, FloatingBubble,
  LocationCircle, MapButton, MapPin, MemberPin, Tab, TabBar, TextField, YouDot,
} from './components';

const OPTIONS = ['My Option 1', 'My Option 2', 'My Option 3'];
const TABS: Tab[] = [
  { icon: 'map', label: 'My Tab' },
  { icon: 'ellipse-outline', label: 'My Tab' },
  { icon: 'add', label: 'My Tab', action: true },
  { icon: 'calendar-outline', label: 'My Tab' },
  { icon: 'person-outline', label: 'My Tab' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={type.h2}>{title}</Text>
      {children}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Lato_400Regular, Lato_700Bold, Montserrat_600SemiBold, Montserrat_700Bold });
  const [checked, setChecked] = useState(true);
  const [text, setText] = useState('');
  const [choice, setChoice] = useState(OPTIONS[0]);
  const [bubble, setBubble] = useState(0);
  const [profileColor, setProfileColor] = useState(0);
  const [tab, setTab] = useState(0);

  if (!fontsLoaded) return null;
  const sel = bubbleColors[bubble];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <AppHeader unread />

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Typography">
          <Text style={type.h1}>My Heading</Text>
          <Text style={type.h2}>My Subheading</Text>
          <Text style={type.body}>My body text. This is what regular paragraph content looks like across the app.</Text>
          <Text style={type.caption}>My caption text</Text>
        </Section>

        <Section title="Logo">
          <Card style={[styles.row, { gap: spacing.md }]}>
            <Image source={require('./assets/logo.jpg')} style={styles.logoImage} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <View style={[styles.row, { gap: spacing.sm }]}>
                <Bubble size={28} />
                <Text style={styles.wordmark}>Bubbles</Text>
              </View>
              <Text style={type.caption}>Header mark: one Bubble + wordmark.</Text>
            </View>
          </Card>
        </Section>

        <Section title="Colors">
          <View style={styles.swatches}>
            {Object.entries(colors).map(([name, hex]) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.swatchColor, { backgroundColor: hex }]} />
                <Text style={styles.swatchName}>{name}</Text>
                <Text style={type.caption}>{hex}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.label}>Bubble colors (one per group)</Text>
          <View style={[styles.row, { gap: spacing.md }]}>
            {bubbleColors.map((c) => <Bubble key={c} size={48} tint={c} />)}
          </View>
        </Section>

        <Section title="Spacing & Radius">
          {Object.entries(spacing).map(([name, v]) => (
            <View key={name} style={[styles.row, { gap: spacing.sm }]}>
              <Text style={[styles.label, { width: 28 }]}>{name}</Text>
              <View style={{ width: v * 4, height: 12, borderRadius: 3, backgroundColor: colors.accent }} />
              <Text style={type.caption}>{v}</Text>
            </View>
          ))}
          <View style={[styles.row, { gap: spacing.md, marginTop: spacing.sm }]}>
            {Object.entries(radius).map(([name, v]) => (
              <View key={name} style={{ alignItems: 'center', gap: spacing.xs }}>
                <View style={{ width: 56, height: 40, borderRadius: v, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }} />
                <Text style={type.caption}>{name}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Bubble Picker">
          <View style={styles.bubbleField}>
            <FloatingBubble size={130} tint={bubbleColors[0]} label="My Bubble" count={3} selected={bubble === 0} onPress={() => setBubble(0)} style={{ top: 50, left: 10 }} />
            <FloatingBubble size={100} tint={bubbleColors[1]} label="My Bubble" delay={700} selected={bubble === 1} onPress={() => setBubble(1)} style={{ top: 16, right: 24 }} />
            <FloatingBubble size={88} tint={bubbleColors[2]} label="My Bubble" count={1} delay={1400} selected={bubble === 2} onPress={() => setBubble(2)} style={{ bottom: 18, left: 140 }} />
            <FloatingBubble size={80} tint={bubbleColors[3]} label="My Bubble" delay={2100} selected={bubble === 3} onPress={() => setBubble(3)} style={{ bottom: 70, right: 10 }} />
          </View>
          <Card style={{ borderTopWidth: 4, borderTopColor: sel }}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.cardName}>My Bubble</Text>
              <Chip icon="lock-closed" color={colors.secure} label="Private · 5 members" />
            </View>
            {(['enter-outline', 'pin-outline'] as const).map((icon) => (
              <View key={icon} style={[styles.row, { gap: spacing.sm, marginTop: spacing.sm }]}>
                <Ionicons name={icon} size={18} color={sel} />
                <Text style={[type.body, { flex: 1 }]}>My Notification</Text>
                <Text style={type.caption}>2m</Text>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Map">
          <View style={styles.map}>
            {/* ponytail: drawn backdrop stands in for a real map view */}
            <View style={[styles.area, { top: -50, right: -50, width: 170, height: 170, backgroundColor: colors.accent + '40' }]} />
            <View style={[styles.area, { bottom: -30, left: -40, width: 190, height: 120, backgroundColor: colors.secure + '26' }]} />
            <View style={[styles.road, { top: 150, left: -20, right: -20, transform: [{ rotate: '-6deg' }] }]} />
            <View style={[styles.road, { top: -20, left: 180, width: 14, height: 460, transform: [{ rotate: '10deg' }] }]} />
            <View style={[styles.road, { top: 300, left: -20, right: -20, height: 8, transform: [{ rotate: '3deg' }] }]} />

            <LocationCircle size={150} color={sel} icon="home" label="My Place" style={{ top: 56, left: 12 }} />
            <LocationCircle size={124} color={colors.primaryDark} icon="school" label="My Place" dashed style={{ top: 205, left: 170 }} />

            <MemberPin color={bubbleColors[0]} style={{ top: 82, left: 42 }} />
            <MemberPin color={bubbleColors[2]} status="moving" style={{ top: 128, left: 96 }} />
            <MemberPin color={bubbleColors[1]} tag="My Name · 2m" style={{ top: 228, left: 206 }} />
            <MemberPin color={bubbleColors[3]} status="sos" style={{ top: 322, left: 22 }} />
            <Cluster count={3} style={{ top: 334, left: 120 }} />
            <YouDot style={{ top: 166, left: 132 }} />

            <MapPin color={colors.primary} icon="star" rank={1} label="My Pin" style={{ top: 40, right: 36 }} />
            <MapPin color={colors.accent} icon="restaurant" rank={2} style={{ top: 112, right: 70 }} />
            <MapPin color={colors.secure} icon="camera" label="My Photo" style={{ top: 232, left: 92 }} />
            <MapPin color={colors.primaryDark} icon="calendar" label="My Event" style={{ top: 330, right: 18 }} />

            <View style={styles.mapControls}>
              <MapButton icon="add" />
              <MapButton icon="remove" />
              <MapButton icon="locate" />
            </View>

            <View style={styles.switcher}>
              <Bubble size={18} tint={sel} />
              <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My Bubble</Text>
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </View>
          </View>
          <View style={[styles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
            <Chip variant="outline" icon="people" color={colors.primary} label="Members" />
            <Chip variant="outline" icon="ellipse-outline" color={colors.primary} label="Places" />
            <Chip variant="outline" icon="location" color={colors.primary} label="Pins" />
            <Chip variant="outline" icon="calendar" color={colors.primary} label="Events" />
            <Chip variant="outline" icon="warning" color={colors.danger} label="SOS" />
          </View>
        </Section>

        <Section title="Notice">
          <View style={styles.notice}>
            <Ionicons name="lock-closed" size={20} color={colors.secure} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My Security Notice</Text>
              <Text style={type.caption}>My notice text. Only people in My Bubble can see this.</Text>
            </View>
          </View>
        </Section>

        <Section title="Profile">
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={[styles.cover, { backgroundColor: bubbleColors[profileColor] }]}>
              {[[90, -20, 30], [40, 44, 140], [26, 10, 200], [56, 30, 260]].map(([size, top, right], i) => (
                <View key={i} style={{ position: 'absolute', top, right }}><Bubble size={size} tint={colors.surface} /></View>
              ))}
            </View>
            <View style={styles.profileBody}>
              <View style={{ marginTop: -40 }}>
                <Avatar color={bubbleColors[(profileColor + 1) % bubbleColors.length]} size={80} ring={colors.surface} />
              </View>
              <Text style={[type.h2, { marginTop: spacing.sm }]}>My Name</Text>
              <Text style={type.caption}>@myhandle</Text>
              <Text style={[type.body, { marginTop: spacing.sm }]}>My bio text goes here.</Text>
              <View style={styles.stats}>
                {['Bubbles', 'Pins', 'Friends'].map((label, i) => (
                  <View key={label} style={{ alignItems: 'center' }}>
                    <Text style={[type.h2, { color: bubbleColors[profileColor] }]}>{[4, 27, 58][i]}</Text>
                    <Text style={type.caption}>{label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.label}>My Theme</Text>
              <View style={[styles.row, { gap: spacing.sm, marginTop: spacing.xs }]}>
                {bubbleColors.map((c, i) => (
                  <Pressable key={c} onPress={() => setProfileColor(i)} style={[styles.themeDot, { backgroundColor: c }, profileColor === i && styles.themeDotOn]}>
                    {profileColor === i && <Ionicons name="checkmark" size={16} color={colors.surface} />}
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>
        </Section>

        <Section title="Card">
          <Card>
            <View style={styles.row}>
              <Avatar />
              <View style={{ flex: 1, marginLeft: spacing.sm, gap: 2 }}>
                <View style={styles.row}>
                  <Text style={styles.cardName}>My Name </Text>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                </View>
                <Chip icon="lock-closed" color={colors.secure} label="My Bubble · 5m" />
              </View>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
            </View>
            <Text style={[type.body, { marginVertical: spacing.md }]}>My card text. A pin shared with My Bubble.</Text>
            <View style={styles.media}>
              <Ionicons name="location" size={32} color={colors.primary} />
              <Text style={type.caption}>My Place</Text>
            </View>
          </Card>
        </Section>

        <Section title="Calendar Event">
          <Card style={[styles.row, { gap: spacing.md }]}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateMonth}>OCT</Text>
              <Text style={styles.dateDay}>12</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardName}>My Event</Text>
              <Text style={type.caption}>6:00 PM · My Place</Text>
              <View style={[styles.row, { gap: 4 }]}>
                <Bubble size={12} tint={bubbleColors[1]} />
                <Text style={type.caption}>My Bubble</Text>
              </View>
            </View>
            <View style={styles.row}>
              {[0, 2, 3].map((i, n) => (
                <View key={i} style={{ marginLeft: n ? -10 : 0 }}><Avatar color={bubbleColors[i]} size={28} ring={colors.surface} /></View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="List">
          <Card style={{ paddingVertical: spacing.xs }}>
            {[1, 2, 3].map((r) => (
              <View key={r} style={[styles.listItem, r > 1 && styles.listDivider]}>
                <View style={[styles.rankCircle, r === 1 && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.rankNum, r === 1 && { color: colors.surface }]}>{r}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My List Item</Text>
                  <View style={styles.row}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons key={n} name={n <= 6 - r ? 'star' : 'star-outline'} size={13} color={colors.primary} />
                    ))}
                    <Text style={[type.caption, { marginLeft: spacing.xs }]}>12 visits</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Form Controls">
          <Checkbox label="My Checkbox" value={checked} onChange={setChecked} />
          <TextField label="My Text Input" icon="search" placeholder="My placeholder" value={text} onChangeText={setText} />
          <Dropdown label="My Dropdown" icon="eye-outline" options={OPTIONS} value={choice} onChange={setChoice} />
        </Section>

        <Section title="Buttons">
          <Button title="My Button" />
          <Button title="My Secondary Button" variant="secondary" />
        </Section>
      </ScrollView>

      <TabBar tabs={TABS} active={tab} onPress={setTab} />
    </SafeAreaView>
  );
}

// Layout for this reference page only; reusable styles live in components.tsx.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center' },
  content: { paddingBottom: spacing.xl },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.sm },
  label: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold },
  cardName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  wordmark: { fontFamily: fonts.heading, fontSize: 22, color: colors.primary },
  logoImage: { width: 96, height: 96, borderRadius: radius.sm },

  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: { width: 90 },
  swatchColor: { height: 56, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  swatchName: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold, marginTop: spacing.xs },

  bubbleField: { height: 300, borderRadius: radius.md, backgroundColor: colors.primarySoft, overflow: 'hidden' },

  map: { height: 400, borderRadius: radius.md, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  area: { position: 'absolute', borderRadius: radius.pill },
  road: { position: 'absolute', height: 14, backgroundColor: colors.surface },
  mapControls: { position: 'absolute', right: spacing.sm, top: 186, gap: spacing.sm },
  switcher: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.xs + 2,
    ...shadow,
  },

  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.secure + '14',
    borderWidth: 1,
    borderColor: colors.secure,
  },

  cover: { height: 100 },
  profileBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, alignItems: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginVertical: spacing.md },
  themeDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  themeDotOn: { borderWidth: 3, borderColor: colors.primarySoft },

  media: { height: 140, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },

  dateBlock: { width: 56, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center' },
  dateMonth: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  dateDay: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },

  listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 4 },
  listDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rankCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontFamily: fonts.heading, fontSize: 14, color: colors.primary },
});
