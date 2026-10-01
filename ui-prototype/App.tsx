import { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { bubbleColors, colors, fonts, radius, shadow, shimmer, spacing, type } from './theme';

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

type IconName = ComponentProps<typeof Ionicons>['name'];

// Soap bubble from the logo: clear film, rainbow rim, white shine.
function SoapBubble({ size, tint, strong, children }: { size: number; tint: string; strong?: boolean; children?: ReactNode }) {
  const r = size / 2;
  const rim = (width: number, inset: number, rotate: string, opacity: number, start: number) => (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute', top: inset, left: inset, right: inset, bottom: inset,
        borderRadius: r, borderWidth: width, opacity, transform: [{ rotate }],
        borderTopColor: shimmer[start % 4], borderRightColor: shimmer[(start + 1) % 4],
        borderBottomColor: shimmer[(start + 2) % 4], borderLeftColor: shimmer[(start + 3) % 4],
      }}
    />
  );
  return (
    <View style={[styles.soap, { width: size, height: size, borderRadius: r, backgroundColor: tint + (strong ? '2E' : '14') }]}>
      {rim(Math.max(1.5, size * 0.035), 0, '45deg', 0.8, 0)}
      {rim(Math.max(1, size * 0.02), size * 0.05, '-40deg', 0.45, 2)}
      <View pointerEvents="none" style={[styles.shine, { width: size * 0.3, height: size * 0.13, top: size * 0.15, left: size * 0.15 }]} />
      <View pointerEvents="none" style={[styles.shine, { width: size * 0.07, height: size * 0.07, top: size * 0.32, left: size * 0.13 }]} />
      <View pointerEvents="none" style={[styles.shine, { width: size * 0.12, height: size * 0.05, bottom: size * 0.16, right: size * 0.2, opacity: 0.5 }]} />
      {children}
    </View>
  );
}

// Bubble that floats, sways and wobbles; tapping "zooms" it.
function FloatingBubble({ size, color, count, delay, selected, onPress, style }: {
  size: number; color: string; count: number; delay: number; selected: boolean; onPress: () => void; style: ViewStyle;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(t, { toValue: 1, duration: 4200 + delay, easing: Easing.linear, useNativeDriver: false })).start();
  }, [t, delay]);
  const wave = (a: number, b: number) => t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, a, 0, b, 0] });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          transform: [
            { translateY: wave(-12, 8) },
            { translateX: wave(5, -5) },
            { scaleX: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 1.04, 1, 0.97, 1] }) },
            { scaleY: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.96, 1, 1.03, 1] }) },
            { scale: selected ? 1.15 : 1 },
          ],
        },
        style,
      ]}
    >
      <Pressable onPress={onPress}>
        <SoapBubble size={size} tint={color} strong={selected}>
          <Text numberOfLines={1} style={[styles.floatLabel, { color, fontSize: size > 110 ? 16 : 13 }]}>My Bubble</Text>
        </SoapBubble>
        {count > 0 && (
          <View style={[styles.badge, { right: size * 0.08, top: size * 0.04 }]}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Teardrop pin with a ring at its base, like the logo's pin.
function MapPin({ color, icon, rank, label, style }: { color: string; icon: IconName; rank?: number; label?: string; style: ViewStyle }) {
  return (
    <View style={[styles.pinWrap, style]}>
      {(label || rank) && (
        <View style={styles.pinLabel}>
          {rank && <Text style={styles.rank}>#{rank}</Text>}
          {label && <Text style={styles.pinText}>{label}</Text>}
        </View>
      )}
      <View style={[styles.pinHead, { backgroundColor: color }]}>
        <View style={{ transform: [{ rotate: '-45deg' }] }}>
          <Ionicons name={icon} size={14} color={colors.surface} />
        </View>
      </View>
      <View style={[styles.pinGround, { borderColor: color }]} />
    </View>
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
          <SoapBubble size={30} tint={colors.iris} />
          <Text style={styles.logo}>Bubbles</Text>
        </View>
        <View style={[styles.row, { gap: spacing.md }]}>
          <View>
            <Ionicons name="notifications-outline" size={24} color={colors.iris} />
            <View style={styles.dot} />
          </View>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.iris} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={type.h1}>My Heading</Text>
          <Text style={type.h2}>My Subheading</Text>
          <Text style={type.body}>My body text. This is what regular paragraph content looks like across the app.</Text>
          <Text style={type.caption}>My caption text</Text>
        </View>

        {/* Logo */}
        <View style={styles.section}>
          <Text style={type.h2}>Logo</Text>
          <View style={[styles.card, styles.row, { gap: spacing.md }]}>
            <Image source={require('./assets/logo.jpg')} style={styles.logoImage} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.logo, { marginLeft: 0 }]}>Bubbles</Text>
              <Text style={type.caption}>Iridescent bubbles, violet icons, crimson pin.</Text>
            </View>
          </View>
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
          <Text style={styles.label}>Bubble shimmer (from logo)</Text>
          <View style={[styles.row, { gap: spacing.sm }]}>
            {shimmer.map((c) => (
              <View key={c} style={[styles.miniBubble, { backgroundColor: c }]} />
            ))}
            <SoapBubble size={40} tint={colors.iris} />
          </View>
        </View>

        {/* Bubble picker: floating bubbles, tap to zoom */}
        <View style={styles.section}>
          <Text style={type.h2}>Bubble Picker</Text>
          <View style={styles.bubbleField}>
            {/* Tiny drifting bubbles for atmosphere */}
            {[[12, 30, 250], [20, 150, 20], [14, 300, 260], [24, 280, 150], [10, 120, 270]].map(([s, x, y], i) => (
              <View key={i} style={{ position: 'absolute', left: x, top: y }}><SoapBubble size={s} tint={colors.iris} /></View>
            ))}
            <FloatingBubble size={130} color={bubbleColors[0]} count={3} delay={0} selected={bubble === 0} onPress={() => setBubble(0)} style={{ top: 50, left: 10 }} />
            <FloatingBubble size={100} color={bubbleColors[1]} count={0} delay={700} selected={bubble === 1} onPress={() => setBubble(1)} style={{ top: 16, right: 24 }} />
            <FloatingBubble size={88} color={bubbleColors[2]} count={1} delay={1400} selected={bubble === 2} onPress={() => setBubble(2)} style={{ bottom: 18, left: 140 }} />
            <FloatingBubble size={80} color={bubbleColors[3]} count={0} delay={2100} selected={bubble === 3} onPress={() => setBubble(3)} style={{ bottom: 70, right: 10 }} />
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
            {/* Terrain: water, park, roads */}
            <View style={[styles.area, { top: -50, right: -50, width: 170, height: 170, backgroundColor: colors.accent + '40' }]} />
            <View style={[styles.area, { bottom: -30, left: -40, width: 190, height: 120, backgroundColor: colors.secure + '26' }]} />
            <View style={[styles.road, { top: 150, left: -20, right: -20, transform: [{ rotate: '-6deg' }] }]} />
            <View style={[styles.road, { top: -20, left: 180, width: 14, height: 460, transform: [{ rotate: '10deg' }] }]} />
            <View style={[styles.road, { top: 300, left: -20, right: -20, height: 8, transform: [{ rotate: '3deg' }] }]} />

            {/* Location circles (geofences): solid = selected Bubble, dashed = another Bubble */}
            <View style={[styles.geofence, { top: 56, left: 12, width: 150, height: 150, borderColor: bubbleColors[bubble], backgroundColor: bubbleColors[bubble] + '22' }]}>
              <View style={[styles.placeTag, { backgroundColor: bubbleColors[bubble] }]}>
                <Ionicons name="home" size={11} color={colors.surface} />
                <Text style={styles.placeTagText}>My Place</Text>
              </View>
            </View>
            <View style={[styles.geofence, { top: 205, left: 170, width: 124, height: 124, borderColor: colors.iris, borderStyle: 'dashed', backgroundColor: colors.iris + '14' }]}>
              <View style={[styles.placeTag, { backgroundColor: colors.iris }]}>
                <Ionicons name="school" size={11} color={colors.surface} />
                <Text style={styles.placeTagText}>My Place</Text>
              </View>
            </View>

            {/* Members */}
            <View style={[styles.mapPin, { top: 82, left: 42 }]}><Avatar i={0} size={36} ring={colors.surface} /></View>
            <View style={[styles.mapPin, { top: 128, left: 96 }]}>
              <Avatar i={2} size={36} ring={colors.surface} />
              <View style={styles.movingBadge}><Ionicons name="navigate" size={9} color={colors.surface} /></View>
            </View>
            <View style={[styles.memberTagWrap, { top: 228, left: 206 }]}>
              <View style={styles.memberAvatar}><Avatar i={1} size={36} ring={colors.surface} /></View>
              <View style={styles.memberTag}><Text style={styles.pinText}>My Name · 2m</Text></View>
            </View>
            {/* You */}
            <View style={[styles.youPulse, { top: 166, left: 132 }]}>
              <View style={styles.youDot} />
            </View>
            {/* SOS member */}
            <View style={[styles.memberTagWrap, { top: 322, left: 22 }]}>
              <View style={[styles.memberAvatar, styles.sosRing]}><Avatar i={3} size={36} ring={colors.surface} /></View>
              <View style={[styles.memberTag, { backgroundColor: colors.danger }]}>
                <Text style={[styles.pinText, { color: colors.surface }]}>SOS</Text>
              </View>
            </View>
            {/* Cluster of nearby members */}
            <View style={[styles.cluster, { top: 334, left: 120 }]}><Text style={styles.clusterText}>+3</Text></View>

            {/* Custom dropped pins */}
            <MapPin color={colors.pin} icon="star" rank={1} label="My Pin" style={{ top: 40, right: 36 }} />
            <MapPin color={colors.iris} icon="restaurant" rank={2} style={{ top: 112, right: 70 }} />
            <MapPin color={colors.accent} icon="camera" label="My Photo" style={{ top: 232, left: 92 }} />
            <MapPin color={colors.primary} icon="calendar" label="My Event" style={{ top: 330, right: 18 }} />

            {/* Map controls */}
            <View style={styles.mapControls}>
              {(['add', 'remove', 'locate'] as const).map((icon) => (
                <View key={icon} style={styles.mapButton}><Ionicons name={icon} size={18} color={colors.text} /></View>
              ))}
            </View>

            {/* Bubble switcher overlay */}
            <Pressable style={styles.switcher}>
              <SoapBubble size={18} tint={bubbleColors[bubble]} />
              <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My Bubble</Text>
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </Pressable>
          </View>
          {/* Legend */}
          <View style={[styles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
            {([
              ['people', 'Members', colors.primary],
              ['ellipse-outline', 'Places', colors.iris],
              ['location', 'Pins', colors.pin],
              ['calendar', 'Events', colors.primary],
              ['warning', 'SOS', colors.danger],
            ] as const).map(([icon, label, c]) => (
              <View key={label} style={styles.legendChip}>
                <Ionicons name={icon} size={14} color={c} />
                <Text style={styles.pinText}>{label}</Text>
              </View>
            ))}
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
              {[[90, -20, 30], [40, 44, 140], [26, 10, 200], [56, 30, 260]].map(([s, top, right], i) => (
                <View key={i} style={{ position: 'absolute', top, right }}><SoapBubble size={s} tint={colors.surface} /></View>
              ))}
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
  logo: { fontFamily: fonts.heading, fontSize: 22, color: colors.primary, marginLeft: spacing.sm },
  dot: { position: 'absolute', top: 0, right: 1, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pin, borderWidth: 1.5, borderColor: colors.surface },
  content: { paddingBottom: spacing.xl },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.sm },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.surface, fontFamily: fonts.bodyBold },

  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: { width: 90 },
  swatchColor: { height: 56, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  swatchName: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold, marginTop: spacing.xs },
  miniBubble: { width: 28, height: 28, borderRadius: radius.pill },

  logoImage: { width: 96, height: 96, borderRadius: radius.sm },

  soap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: colors.iris,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  shine: { position: 'absolute', borderRadius: radius.pill, backgroundColor: colors.surface, opacity: 0.9, transform: [{ rotate: '-35deg' }] },
  bubbleField: { height: 300, borderRadius: radius.md, backgroundColor: colors.iris + '12', overflow: 'hidden' },
  floatLabel: { fontFamily: fonts.bodyBold },
  badge: {
    position: 'absolute',
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.pin,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { color: colors.surface, fontFamily: fonts.bodyBold, fontSize: 11 },

  map: { height: 400, borderRadius: radius.md, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  area: { position: 'absolute', borderRadius: radius.pill },
  road: { position: 'absolute', height: 14, backgroundColor: colors.surface },
  geofence: {
    position: 'absolute',
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  placeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
  placeTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.surface },
  mapPin: { position: 'absolute', borderRadius: radius.pill, ...shadow },
  memberAvatar: { borderRadius: radius.pill, ...shadow },
  memberTagWrap: { position: 'absolute', alignItems: 'center' },
  memberTag: { marginTop: -4, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1, ...shadow },
  movingBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosRing: { borderWidth: 3, borderColor: colors.danger, padding: 2, backgroundColor: colors.danger + '33' },
  youPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '33', alignItems: 'center', justifyContent: 'center' },
  youDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.surface },
  cluster: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.iris,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  clusterText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.surface },
  pinWrap: { position: 'absolute', alignItems: 'center' },
  pinHead: {
    width: 30,
    height: 30,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow,
  },
  pinGround: { width: 22, height: 7, borderRadius: 4, borderWidth: 2, marginTop: 3 },
  mapControls: { position: 'absolute', right: spacing.sm, top: 186, gap: spacing.sm },
  mapButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  pinLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: 4,
    ...shadow,
  },
  rank: { fontFamily: fonts.heading, fontSize: 12, color: colors.pin },
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
