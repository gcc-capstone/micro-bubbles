// Profile (report Task 9): customizable header, about, photos, and app Settings.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Bubble, Button, IconName, MenuButton } from './components';
import { bubbleColors, colors, fonts, radius, spacing, type } from './theme';
import { GROUPS, PROFILE } from './data';

const RADII = [1, 5, 10, 25, 50];

export default function ProfileScreen({ reduceMotion, onReduceMotion, everyoneRadius, onEveryoneRadius, onStyles }: {
  reduceMotion: boolean; onReduceMotion: (v: boolean) => void; everyoneRadius: number; onEveryoneRadius: (mi: number) => void; onStyles: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(PROFILE.name);
  const [bio, setBio] = useState(PROFILE.bio);
  const [color, setColor] = useState(1); // teal by default
  const [isPublic, setIsPublic] = useState(true);
  const [sharing, setSharing] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const tint = bubbleColors[color];
  const tile = (useWindowDimensions().width - spacing.md * 2 - spacing.sm * 2) / 3;

  const setting = (icon: IconName, label: string, value: boolean, onChange: (v: boolean) => void, divider = true) => (
    <View style={[styles.settingRow, divider && styles.divider]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[type.body, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
      {/* Header: cover in your chosen color, with bubbles */}
      <View style={[styles.cover, { backgroundColor: tint, paddingTop: insets.top }]}>
        {[[90, insets.top - 10, 20], [40, insets.top + 50, 130], [26, insets.top + 10, 190], [56, insets.top + 40, 250]].map(([s, top, right], i) => (
          <View key={i} style={{ position: 'absolute', top, right }}><Bubble size={s} tint={colors.surface} /></View>
        ))}
      </View>
      <View style={styles.header}>
        <View style={{ marginTop: -44 }}>
          <Avatar initials="AM" color={bubbleColors[(color + 1) % bubbleColors.length]} size={88} ring={colors.surface} />
        </View>
        {editing ? (
          <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm }}>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Name" />
            <TextInput value={bio} onChangeText={setBio} style={[styles.input, { minHeight: 64 }]} multiline placeholder="Bio" />
          </View>
        ) : (
          <>
            <Text style={[type.h1, { marginTop: spacing.sm }]}>{name}</Text>
            <Text style={type.caption}>{PROFILE.handle} · {isPublic ? 'Public' : 'Private'} profile</Text>
            <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm }]}>{bio}</Text>
          </>
        )}
        <View style={styles.stats}>
          {[['Bubbles', GROUPS.length], ['Pins', 27], ['Friends', 58]].map(([label, n]) => (
            <View key={label} style={{ alignItems: 'center' }}>
              <Text style={[type.h2, { color: tint }]}>{n}</Text>
              <Text style={type.caption}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={{ alignSelf: 'stretch' }}>
          <Button title={editing ? 'Done' : 'Edit Profile'} variant={editing ? 'primary' : 'secondary'} onPress={() => setEditing(!editing)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.group}>
          <View style={styles.settingRow}>
            <Ionicons name="logo-instagram" size={20} color={colors.primary} />
            <Text style={[type.body, { flex: 1, color: colors.primary }]}>{PROFILE.instagram}</Text>
          </View>
          <View style={[styles.settingRow, styles.divider, { flexWrap: 'wrap' }]}>
            {PROFILE.hobbies.map((hb) => (
              <View key={hb} style={styles.hobby}>
                <Text style={styles.hobbyText}>{hb}</Text>
              </View>
            ))}
            {editing && (
              <View style={[styles.hobby, { borderStyle: 'dashed' }]}>
                <Text style={styles.hobbyText}>+ Add</Text>
              </View>
            )}
          </View>
          {editing && (
            <View style={[styles.settingRow, styles.divider]}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
              <Text style={[type.body, { flex: 1 }]}>Profile color</Text>
              {bubbleColors.map((c, i) => (
                <Pressable key={c} onPress={() => setColor(i)} style={[styles.swatch, { backgroundColor: c }, color === i && styles.swatchOn]} />
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photos}>
          {PROFILE.photos.map((ph, i) => (
            <View key={ph} style={[styles.photo, { width: tile, height: tile, backgroundColor: bubbleColors[i % bubbleColors.length] + '33' }]}>
              <Ionicons name="image-outline" size={24} color={bubbleColors[i % bubbleColors.length]} />
              <Text numberOfLines={2} style={styles.photoLabel}>{ph}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.group}>
          {setting('globe-outline', 'Public profile', isPublic, setIsPublic, false)}
          {setting('location-outline', 'Share my location', sharing, setSharing)}
          <View style={[styles.settingRow, styles.divider]}>
            <Ionicons name="radio-outline" size={20} color={colors.primary} />
            <Text style={[type.body, { flex: 1 }]}>Everyone map radius</Text>
            <MenuButton
              icon="chevron-expand"
              label={`${everyoneRadius} mi`}
              options={RADII.map((r) => `${r} mi`)}
              selected={[`${everyoneRadius} mi`]}
              onSelect={(o) => onEveryoneRadius(parseInt(o, 10))}
            />
          </View>
          {setting('notifications-outline', 'Notifications', alerts, setAlerts)}
          {setting('accessibility-outline', 'Reduce motion', reduceMotion, onReduceMotion)}
          <Pressable style={[styles.settingRow, styles.divider]} onPress={onStyles}>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            <Text style={[type.body, { flex: 1 }]}>Style reference</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
        <Text style={[type.caption, { paddingHorizontal: spacing.md }]}>Reduce motion stops floating bubbles and replaces animations with instant changes.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cover: { height: 150, overflow: 'hidden' },
  header: { alignItems: 'center', paddingHorizontal: spacing.md },
  input: { ...type.body, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginVertical: spacing.md },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.md, gap: spacing.sm },
  sectionTitle: { ...type.caption, fontFamily: fonts.bodyBold, textTransform: 'uppercase', paddingHorizontal: spacing.md },
  group: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  hobby: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 4, paddingVertical: 4 },
  hobbyText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  swatch: { width: 24, height: 24, borderRadius: 12 },
  swatchOn: { borderWidth: 3, borderColor: colors.primarySoft },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', padding: spacing.xs, gap: 4 },
  photoLabel: { ...type.caption, fontSize: 11, textAlign: 'center', color: colors.text },
});
