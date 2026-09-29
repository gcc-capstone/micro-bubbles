import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { colors, fonts, radius, spacing, type } from './theme';

const OPTIONS = ['My Option 1', 'My Option 2', 'My Option 3'];
const AVATAR_COLORS = [colors.primary, colors.accent, colors.secure, colors.primaryDark, colors.textMuted];

function Avatar({ i, size = 44 }: { i: number; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>MN</Text>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Lato_400Regular, Lato_700Bold, Montserrat_600SemiBold, Montserrat_700Bold });
  const [checked, setChecked] = useState(true);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(OPTIONS[0]);
  const [liked, setLiked] = useState(false);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      {/* Navigation / header */}
      <View style={styles.header}>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={styles.logo}>My App</Text>
        </View>
        <View style={[styles.row, { gap: spacing.md }]}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Bubble row: story-style avatars, teal ring = sharing location */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bubbleRow}>
          <View style={styles.bubble}>
            <View style={[styles.ring, styles.ringAdd]}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </View>
            <Text style={styles.bubbleLabel}>My Bubble</Text>
          </View>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.bubble}>
              <View style={styles.ring}>
                <Avatar i={i} size={56} />
              </View>
              <Text style={styles.bubbleLabel}>My Name</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <Text style={type.h1}>My Heading</Text>
          <Text style={type.h2}>My Subheading</Text>
          <Text style={type.body}>My body text. This is what regular paragraph content looks like across the app.</Text>
          <Text style={type.caption}>My caption text</Text>
        </View>

        {/* Security notice panel */}
        <View style={styles.notice}>
          <Ionicons name="lock-closed" size={20} color={colors.secure} />
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My Security Notice</Text>
            <Text style={type.caption}>My notice text. Only people in My Bubble can see this.</Text>
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
        </View>

        {/* Card: social post */}
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
            <Text style={[type.body, { marginVertical: spacing.md }]}>My card text. A short post shared with My Bubble.</Text>
            <View style={styles.mediaPlaceholder}>
              <Ionicons name="location" size={32} color={colors.primary} />
              <Text style={type.caption}>My Place</Text>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.row} onPress={() => setLiked(!liked)}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.danger : colors.text} />
                <Text style={styles.actionText}>{liked ? 13 : 12}</Text>
              </Pressable>
              <View style={styles.row}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                <Text style={styles.actionText}>4</Text>
              </View>
              <View style={styles.row}>
                <Ionicons name="navigate-outline" size={20} color={colors.text} />
                <Text style={styles.actionText}>My Action</Text>
              </View>
            </View>
          </View>
        </View>

        {/* List */}
        <View style={styles.section}>
          <Text style={type.h2}>List</Text>
          <View style={[styles.card, { paddingVertical: spacing.xs }]}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.listItem, i > 1 && styles.listDivider]}>
                <Avatar i={i} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>My List Item</Text>
                  <Text style={type.caption}>My list detail</Text>
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

      {/* Bottom tab navigation */}
      <View style={styles.tabBar}>
        {(['home', 'map', 'add', 'notifications', 'person'] as const).map((icon, i) =>
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
  logo: { fontFamily: fonts.heading, fontSize: 22, color: colors.primary, marginLeft: spacing.xs },
  content: { paddingBottom: spacing.xl },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.sm },

  bubbleRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md, backgroundColor: colors.surface },
  bubble: { alignItems: 'center', width: 68 },
  ring: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringAdd: { borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.primarySoft },
  bubbleLabel: { ...type.caption, color: colors.text, marginTop: spacing.xs },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.surface, fontFamily: fonts.bodyBold },

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

  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: { width: 90 },
  swatchColor: { height: 56, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  swatchName: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold, marginTop: spacing.xs },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
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
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  actionText: { ...type.caption, color: colors.text, marginLeft: spacing.xs },

  listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 4 },
  listDivider: { borderTopWidth: 1, borderTopColor: colors.border },

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
