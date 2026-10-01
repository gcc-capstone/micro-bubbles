import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { bubbleColors, colors, fonts, radius, shadow, spacing, type } from './theme';

const OPTIONS = ['My Option 1', 'My Option 2', 'My Option 3'];

function Avatar({ i, size = 44, ring }: { i: number; size?: number; ring?: string }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bubbleColors[i % bubbleColors.length] },
        ring && { borderWidth: 3, borderColor: ring },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>MN</Text>
    </View>
  );
}

// Translucent bubble that bobs up and down; tapping "zooms" it.
function FloatingBubble({ size, color, count, delay, selected, onPress, style }: {
  size: number; color: string; count: number; delay: number; selected: boolean; onPress: () => void; style: ViewStyle;
}) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -10, duration: 2000, delay, easing: ease, useNativeDriver: false }),
        Animated.timing(y, { toValue: 0, duration: 2000, easing: ease, useNativeDriver: false }),
      ]),
    ).start();
  }, [y, delay]);

  return (
    <Animated.View style={[{ position: 'absolute', transform: [{ translateY: y }, { scale: selected ? 1.15 : 1 }] }, style]}>
      <Pressable
        onPress={onPress}
        style={[styles.floatBubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + 'D9' }, selected && styles.floatBubbleOn]}
      >
        <View style={[styles.bubbleShine, { width: size * 0.28, height: size * 0.16, top: size * 0.14, left: size * 0.2 }]} />
        <Text numberOfLines={1} style={[styles.floatLabel, { fontSize: size > 100 ? 16 : 12 }]}>My Bubble</Text>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Lato_400Regular, Lato_700Bold, Montserrat_600SemiBold, Montserrat_700Bold });
  const [checked, setChecked] = useState(true);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(OPTIONS[0]);
  const [bubble, setBubble] = useState(0);
  const [profileColor, setProfileColor] = useState(0);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      {/* Navigation / header */}
      <View style={styles.header}>
        <View style={styles.row}>
          <View style={styles.logoMark}>
            <View style={styles.logoShine} />
          </View>
          <Text style={styles.logo}>Bubbles</Text>
        </View>
        <View style={[styles.row, { gap: spacing.md }]}>
          <View>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.dot} />
          </View>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={type.h1}>My Heading</Text>
          <Text style={type.h2}>My Subheading</Text>
          <Text style={type.body}>My body text. This is what regular paragraph content looks like across the app.</Text>
          <Text style={type.caption}>My caption text</Text>
        </View>

        {/* Color palette */}
        <View style={styles.section}>
          <Text style={type.h2}>Colors</Text>
          <View style={styles.swatches}>
            {Object.entries(colors).map(([name, hex]) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.swatchColor, { backgroundColor: hex }]} />
                <Text style={styles.swatchName}>{name}</Text>
                <Text style={type.caption}>{hex}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.label}>Bubble colors</Text>
          <View style={[styles.row, { gap: spacing.sm }]}>
            {bubbleColors.map((c) => (
              <View key={c} style={[styles.miniBubble, { backgroundColor: c }]} />
            ))}
          </View>
        </View>

        {/* Bubble picker: floating bubbles, tap to zoom */}
        <View style={styles.section}>
          <Text style={type.h2}>Bubble Picker</Text>
          <View style={styles.bubbleField}>
            <FloatingBubble size={120} color={bubbleColors[0]} count={3} delay={0} selected={bubble === 0} onPress={() => setBubble(0)} style={{ top: 40, left: 20 }} />
            <FloatingBubble size={90} color={bubbleColors[1]} count={0} delay={500} selected={bubble === 1} onPress={() => setBubble(1)} style={{ top: 20, right: 30 }} />
            <FloatingBubble size={80} color={bubbleColors[2]} count={1} delay={1000} selected={bubble === 2} onPress={() => setBubble(2)} style={{ bottom: 20, left: 150 }} />
            <FloatingBubble size={76} color={bubbleColors[3]} count={0} delay={1500} selected={bubble === 3} onPress={() => setBubble(3)} style={{ bottom: 40, right: 16 }} />
          </View>
          {/* Zoomed-in preview of the tapped bubble */}
          <View style={[styles.card, { borderTopWidth: 4, borderTopColor: bubbleColors[bubble] }]}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.cardName}>My Bubble</Text>
              <View style={styles.privacyChip}>
                <Ionicons name="lock-closed" size={11} color={colors.secure} />
                <Text style={styles.privacyText}>Private · 5 members</Text>
              </View>
            </View>
            {['My Notification', 'My Notification'].map((n, i) => (
              <View key={i} style={[styles.row, { gap: spacing.sm, marginTop: spacing.sm }]}>
                <Ionicons name={i === 0 ? 'enter-outline' : 'pin-outline'} size={18} color={bubbleColors[bubble]} />
                <Text style={[type.body, { flex: 1 }]}>{n}</Text>
                <Text style={type.caption}>2m</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Map: home page view of selected bubble */}
        <View style={styles.section}>
          <Text style={type.h2}>Map</Text>
          <View style={styles.map}>
            <View style={[styles.road, { top: 90, left: -20, right: -20, transform: [{ rotate: '-8deg' }] }]} />
            <View style={[styles.road, { top: -20, left: 200, width: 14, height: 300, transform: [{ rotate: '12deg' }] }]} />
            {/* Location circle (geofence) */}
            <View style={[styles.geofence, { borderColor: bubbleColors[bubble], backgroundColor: bubbleColors[bubble] + '26' }]}>
              <Text style={[styles.geofenceLabel, { color: bubbleColors[bubble] }]}>My Place</Text>
            </View>
            {/* Member pins */}
            <View style={[styles.mapPin, { top: 70, left: 60 }]}><Avatar i={0} size={36} ring={colors.surface} /></View>
            <View style={[styles.mapPin, { top: 120, left: 110 }]}><Avatar i={2} size={36} ring={colors.surface} /></View>
            {/* Custom dropped pin with rank */}
            <View style={[styles.customPin, { top: 40, right: 50 }]}>
              <View style={styles.pinLabel}>
                <Text style={styles.rank}>#1</Text>
                <Text style={styles.pinText}>My Pin</Text>
              </View>
              <Ionicons name="location" size={32} color={colors.danger} />
            </View>
            {/* Bubble switcher overlay */}
            <Pressable style={styles.switcher}>
              <View style={[styles.miniBubble, { width: 14, height: 14, backgroundColor: bubbleColors[bubble] }]} />
              <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My Bubble</Text>
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Security notice panel */}
        <View style={styles.notice}>
          <Ionicons name="lock-closed" size={20} color={colors.secure} />
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My Security Notice</Text>
            <Text style={type.caption}>My notice text. Only people in My Bubble can see this.</Text>
          </View>
        </View>

        {/* Profile: customizable */}
        <View style={styles.section}>
          <Text style={type.h2}>Profile</Text>
          <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
            <View style={[styles.cover, { backgroundColor: bubbleColors[profileColor] }]}>
              <View style={[styles.coverBubble, { width: 90, height: 90, top: -20, right: 30 }]} />
              <View style={[styles.coverBubble, { width: 40, height: 40, top: 40, right: 140 }]} />
            </View>
            <View style={styles.profileBody}>
              <View style={styles.profileAvatar}>
                <Avatar i={profileColor + 1} size={80} ring={colors.surface} />
              </View>
              <Text style={[type.h2, { marginTop: spacing.sm }]}>My Name</Text>
              <Text style={type.caption}>@myhandle</Text>
              <Text style={[type.body, { marginTop: spacing.sm }]}>My bio text goes here.</Text>
              <View style={styles.stats}>
                {['Bubbles', 'Pins', 'Friends'].map((s, i) => (
                  <View key={s} style={{ alignItems: 'center' }}>
                    <Text style={[type.h2, { color: bubbleColors[profileColor] }]}>{[4, 27, 58][i]}</Text>
                    <Text style={type.caption}>{s}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.label}>My Theme</Text>
              <View style={[styles.row, { gap: spacing.sm }]}>
                {bubbleColors.map((c, i) => (
                  <Pressable key={c} onPress={() => setProfileColor(i)} style={[styles.themeDot, { backgroundColor: c }, profileColor === i && styles.themeDotOn]}>
                    {profileColor === i && <Ionicons name="checkmark" size={16} color={colors.surface} />}
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Card: pin post */}
        <View style={styles.section}>
          <Text style={type.h2}>Card</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Avatar i={0} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <View style={styles.row}>
                  <Text style={styles.cardName}>My Name </Text>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                </View>
                <View style={styles.privacyChip}>
                  <Ionicons name="lock-closed" size={11} color={colors.secure} />
                  <Text style={styles.privacyText}>My Bubble · 5m</Text>
                </View>
              </View>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
            </View>
            <Text style={[type.body, { marginVertical: spacing.md }]}>My card text. A pin shared with My Bubble.</Text>
            <View style={styles.mediaPlaceholder}>
              <Ionicons name="location" size={32} color={colors.primary} />
              <Text style={type.caption}>My Place</Text>
            </View>
          </View>
        </View>

        {/* Calendar event */}
        <View style={styles.section}>
          <Text style={type.h2}>Calendar Event</Text>
          <View style={[styles.card, styles.row, { gap: spacing.md }]}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateMonth}>OCT</Text>
              <Text style={styles.dateDay}>12</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardName}>My Event</Text>
              <Text style={type.caption}>6:00 PM · My Place</Text>
              <View style={[styles.row, { gap: 4 }]}>
                <View style={[styles.miniBubble, { width: 10, height: 10, backgroundColor: bubbleColors[1] }]} />
                <Text style={type.caption}>My Bubble</Text>
              </View>
            </View>
            <View style={styles.row}>
              {[0, 2, 3].map((i, n) => (
                <View key={i} style={{ marginLeft: n ? -10 : 0 }}><Avatar i={i} size={28} ring={colors.surface} /></View>
              ))}
            </View>
          </View>
        </View>

        {/* List: ranked places */}
        <View style={styles.section}>
          <Text style={type.h2}>List</Text>
          <View style={[styles.card, { paddingVertical: spacing.xs }]}>
            {[1, 2, 3].map((r) => (
              <View key={r} style={[styles.listItem, r > 1 && styles.listDivider]}>
                <View style={[styles.rankCircle, r === 1 && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.rankNum, r === 1 && { color: colors.surface }]}>{r}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My List Item</Text>
                  <View style={styles.row}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name={s <= 5 - r + 1 ? 'star' : 'star-outline'} size={13} color={colors.primary} />
                    ))}
                    <Text style={[type.caption, { marginLeft: spacing.xs }]}>12 visits</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            ))}
          </View>
        </View>

        {/* Form controls */}
        <View style={styles.section}>
          <Text style={type.h2}>Form Controls</Text>

          <Pressable style={[styles.row, { gap: spacing.sm, paddingVertical: spacing.xs }]} onPress={() => setChecked(!checked)}>
            <View style={[styles.checkbox, checked && styles.checkboxOn]}>
              {checked && <Ionicons name="checkmark" size={16} color={colors.surface} />}
            </View>
            <Text style={type.body}>My Checkbox</Text>
          </Pressable>

          <Text style={styles.label}>My Text Input</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="My placeholder"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* ponytail: toggled list instead of a picker library; fine for a prototype */}
          <Text style={styles.label}>My Dropdown</Text>
          <Pressable style={styles.inputWrap} onPress={() => setOpen(!open)}>
            <Ionicons name="eye-outline" size={18} color={colors.textMuted} />
            <Text style={[type.body, { flex: 1 }]}>{choice}</Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </Pressable>
          {open && (
            <View style={styles.menu}>
              {OPTIONS.map((o) => (
                <Pressable key={o} style={[styles.row, styles.menuItem]} onPress={() => { setChoice(o); setOpen(false); }}>
                  <Text style={[type.body, { flex: 1 }, o === choice && { color: colors.primary, fontFamily: fonts.bodyBold }]}>{o}</Text>
                  {o === choice && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.section}>
          <Text style={type.h2}>Buttons</Text>
          <Pressable style={({ pressed }) => [styles.button, styles.primary, pressed && { backgroundColor: colors.primaryDark }]}>
            <Text style={[type.button, { color: colors.surface }]}>My Button</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.button, styles.secondary, pressed && { opacity: 0.7 }]}>
            <Text style={[type.button, { color: colors.primary }]}>My Secondary Button</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom tab navigation: Map, Bubbles, Add pin, Calendar, Profile */}
      <View style={styles.tabBar}>
        {(['map', 'ellipse', 'add', 'calendar', 'person'] as const).map((icon, i) =>
          icon === 'add' ? (
            <View key={icon} style={styles.tab}>
              <View style={styles.tabAdd}>
                <Ionicons name="add" size={28} color={colors.surface} />
              </View>
            </View>
          ) : (
            <View key={icon} style={styles.tab}>
              <Ionicons name={i === 0 ? icon : `${icon}-outline`} size={24} color={i === 0 ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabLabel, i === 0 && { color: colors.primary }]}>My Tab</Text>
            </View>
          ),
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoMark: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent },
  logoShine: { position: 'absolute', top: 5, left: 6, width: 7, height: 5, borderRadius: 4, backgroundColor: colors.surface, opacity: 0.8 },
  logo: { fontFamily: fonts.heading, fontSize: 22, color: colors.primary, marginLeft: spacing.sm },
  dot: { position: 'absolute', top: 0, right: 1, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.surface },
  content: { paddingBottom: spacing.xl },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.sm },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.surface, fontFamily: fonts.bodyBold },

  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: { width: 90 },
  swatchColor: { height: 56, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  swatchName: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold, marginTop: spacing.xs },
  miniBubble: { width: 28, height: 28, borderRadius: radius.pill },

  bubbleField: { height: 260, borderRadius: radius.md, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  floatBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    ...shadow,
  },
  floatBubbleOn: { borderColor: colors.surface, borderWidth: 3 },
  bubbleShine: { position: 'absolute', borderRadius: radius.pill, backgroundColor: colors.surface, opacity: 0.5, transform: [{ rotate: '-30deg' }] },
  floatLabel: { color: colors.surface, fontFamily: fonts.bodyBold },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { color: colors.surface, fontFamily: fonts.bodyBold, fontSize: 11 },

  map: { height: 240, borderRadius: radius.md, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  road: { position: 'absolute', height: 14, backgroundColor: colors.surface },
  geofence: {
    position: 'absolute',
    top: 40,
    left: 30,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  geofenceLabel: { fontFamily: fonts.bodyBold, fontSize: 12 },
  mapPin: { position: 'absolute', borderRadius: radius.pill, ...shadow },
  customPin: { position: 'absolute', alignItems: 'center' },
  pinLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: -2,
    ...shadow,
  },
  rank: { fontFamily: fonts.heading, fontSize: 12, color: colors.primary },
  pinText: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold },
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
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#EAF6F0', // ponytail: tint of colors.secure
    borderWidth: 1,
    borderColor: colors.secure,
  },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow },
  cardName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  privacyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  privacyText: { ...type.caption, fontSize: 12 },
  mediaPlaceholder: {
    height: 140,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cover: { height: 100 },
  coverBubble: { position: 'absolute', borderRadius: radius.pill, backgroundColor: colors.surface, opacity: 0.2 },
  profileBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, alignItems: 'center' },
  profileAvatar: { marginTop: -40 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginVertical: spacing.md },
  themeDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  themeDotOn: { borderWidth: 3, borderColor: colors.primarySoft },

  dateBlock: { width: 56, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center' },
  dateMonth: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  dateDay: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },

  listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 4 },
  listDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rankCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontFamily: fonts.heading, fontSize: 14, color: colors.primary },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold, marginTop: spacing.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  input: { ...type.body, flex: 1, padding: 0 },
  menu: { backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },

  button: { borderRadius: radius.pill, paddingVertical: spacing.md - 2, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },

  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabAdd: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { ...type.caption, fontSize: 11, fontFamily: fonts.bodyBold },
});
