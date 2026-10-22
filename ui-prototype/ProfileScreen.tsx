// Profile (report Task 9): customizable header, about, photos, and app Settings.
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Bubble, Button, IconName, MenuButton, PageSheet, Separator } from './components';
import { LinkedText, PersonView, PlaceLink } from './Details';
import { ACCENTS, bubbleColors, colors, fonts, radius, spacing, type } from './theme';
import { allPins, AVATAR_ICONS, avgRating, friends, GROUPS, groupColor, initials, LINK_KINDS, Member, memberColor, PROFILE, pinCategory } from './data';

const RADII = [1, 5, 10, 25, 50];

const EVENT_DAYS = [1, 3, 7, 14, 30];

export default function ProfileScreen({
  reduceMotion, onReduceMotion, everyoneRadius, onEveryoneRadius, eventsOnMap, onEventsOnMap, eventDays, onEventDays, weekStartPref, systemWeekStart, onWeekStartPref,
  onStyles, onAccent,
}: {
  reduceMotion: boolean; onReduceMotion: (v: boolean) => void; everyoneRadius: number; onEveryoneRadius: (mi: number) => void;
  eventsOnMap: boolean; onEventsOnMap: (v: boolean) => void; eventDays: number; onEventDays: (d: number) => void;
  weekStartPref: 'System' | 'Sunday' | 'Monday'; systemWeekStart: number; onWeekStartPref: (v: 'System' | 'Sunday' | 'Monday') => void; onStyles: () => void;
  onAccent: (i: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  // Edits write straight to PROFILE so they survive leaving the tab; tick re-renders.
  const [, setTick] = useState(0);
  const save = (change: Partial<typeof PROFILE>) => {
    Object.assign(PROFILE, change);
    setTick((t) => t + 1);
  };
  const [isPublic, setIsPublic] = useState(true);
  const [sharing, setSharing] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [hobby, setHobby] = useState('');
  const [linkKind, setLinkKind] = useState<string | null>(null);
  const [linkText, setLinkText] = useState('');
  const pins = allPins();
  // not from allPins: its de-dupe by name can keep someone else's copy of a place you also pinned
  const myPins = GROUPS.flatMap((g) => g.pins.filter((pin) => pin.by === 'You').map((pin) => ({ pin, group: g })));
  const topPins = [...pins].sort((a, b) => avgRating(b.pin) - avgRating(a.pin)).slice(0, 10);
  const tile = (width - spacing.md * 2 - spacing.sm * 2) / 3;
  const accent = ACCENTS[PROFILE.accent];

  const setting = (icon: IconName, label: string, value: boolean, onChange: (v: boolean) => void, divider = true) => (
    <View style={[styles.settingRow, divider && styles.divider]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[type.body, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
  const addHobby = () => {
    const h = hobby.trim();
    if (h && !PROFILE.hobbies.includes(h)) save({ hobbies: [...PROFILE.hobbies, h] });
    setHobby('');
  };
  const addLink = () => {
    const k = LINK_KINDS.find((l) => l.kind === linkKind)!;
    const v = linkText.trim();
    if (v) save({ links: [...PROFILE.links, { kind: k.kind, url: v.includes('.') ? v : k.prefix + v }] });
    setLinkKind(null);
    setLinkText('');
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
      {/* Cover: your photos (Telegram-style); the profile card sits over it like a sheet */}
      <View style={[styles.cover, { height: 190 + insets.top }]}>
        {PROFILE.photos.slice(0, 3).map((ph, i) => (
          <View key={ph} style={[styles.coverPhoto, { backgroundColor: bubbleColors[(i + 1) % bubbleColors.length] + '55' }]}>
            <Ionicons name="image" size={40} color={bubbleColors[(i + 1) % bubbleColors.length]} />
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Pressable onPress={() => setAvatarOpen(true)} style={{ marginTop: -52 }} accessibilityLabel="Change profile picture">
          <ProfileAvatar size={96} />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color={colors.surface} />
          </View>
        </Pressable>
        {editing ? (
          <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm }}>
            <TextInput value={PROFILE.name} onChangeText={(v) => save({ name: v })} style={styles.input} placeholder="Name" />
            <TextInput value={PROFILE.bio} onChangeText={(v) => save({ bio: v })} style={[styles.input, { minHeight: 64 }]} multiline placeholder="Bio" />
          </View>
        ) : (
          <>
            <Text style={[type.h1, { marginTop: spacing.sm }]}>{PROFILE.name}</Text>
            <Text style={type.caption}>{PROFILE.handle} · {isPublic ? 'Public' : 'Private'} profile</Text>
            <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm }]}>{PROFILE.bio}</Text>
          </>
        )}
        <View style={styles.stats}>
          {([['Bubbles', GROUPS.length, null], ['Pins', myPins.length, () => setPinsOpen(true)], ['Friends', friends().length, () => setFriendsOpen(true)]] as const).map(
            ([label, n, onPress]) => (
              <Pressable key={label} disabled={!onPress} onPress={onPress ?? undefined} style={{ alignItems: 'center' }}>
                <Text style={[type.h2, { color: colors.primary }]}>{n}</Text>
                <Text style={[type.caption, onPress && { color: colors.primary }]}>{label}{onPress ? ' ›' : ''}</Text>
              </Pressable>
            ),
          )}
        </View>
        <View style={{ alignSelf: 'stretch' }}>
          <Button title={editing ? 'Done' : 'Edit Profile'} variant={editing ? 'primary' : 'secondary'} onPress={() => setEditing(!editing)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Links</Text>
        <View style={styles.group}>
          {PROFILE.links.map((l, i) => {
            const k = LINK_KINDS.find((x) => x.kind === l.kind) ?? LINK_KINDS[LINK_KINDS.length - 1];
            return (
              <View key={l.url} style={[styles.settingRow, i > 0 && styles.divider]}>
                <Ionicons name={k.icon} size={20} color={colors.primary} />
                <Pressable style={{ flex: 1 }} onPress={() => Linking.openURL(`https://${l.url}`)}>
                  <Text style={type.caption}>{l.kind}</Text>
                  <Text numberOfLines={1} style={[type.body, { color: colors.primary }]}>{l.url}</Text>
                </Pressable>
                {editing && (
                  <Pressable onPress={() => save({ links: PROFILE.links.filter((x) => x !== l) })} hitSlop={12} accessibilityLabel={`Remove ${l.kind}`}>
                    <Ionicons name="remove-circle" size={24} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            );
          })}
          {editing &&
            (linkKind ? (
              <View style={[styles.settingRow, PROFILE.links.length > 0 && styles.divider]}>
                <Ionicons name={LINK_KINDS.find((x) => x.kind === linkKind)!.icon} size={20} color={colors.primary} />
                <TextInput
                  autoFocus
                  value={linkText}
                  onChangeText={setLinkText}
                  onSubmitEditing={addLink}
                  placeholder={linkKind === 'Website' ? 'yoursite.com' : 'username'}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[type.body, { flex: 1, padding: 0 }]}
                />
                <Pressable onPress={addLink} hitSlop={10}>
                  <Text style={styles.link}>Add</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.settingRow, PROFILE.links.length > 0 && styles.divider]}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[type.body, { flex: 1, color: colors.primary }]}>Add link</Text>
                <MenuButton icon="chevron-expand" label="Choose" options={LINK_KINDS.map((l) => l.kind)} onSelect={setLinkKind} />
              </View>
            ))}
          {!editing && PROFILE.links.length === 0 && <Text style={[type.caption, { padding: spacing.md }]}>No links yet</Text>}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hobbies</Text>
        <View style={[styles.group, styles.hobbies]}>
          {PROFILE.hobbies.map((hb) => (
            <View key={hb} style={styles.hobby}>
              <Text style={styles.hobbyText}>{hb}</Text>
              {editing && (
                // big target: easy to hit for everyone
                <Pressable onPress={() => save({ hobbies: PROFILE.hobbies.filter((x) => x !== hb) })} hitSlop={14} accessibilityLabel={`Remove ${hb}`}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          ))}
          {editing && (
            <View style={[styles.hobby, styles.hobbyAdd]}>
              <TextInput value={hobby} onChangeText={setHobby} onSubmitEditing={addHobby} placeholder="Add hobby" placeholderTextColor={colors.textMuted} style={styles.hobbyInput} />
              <Pressable onPress={addHobby} hitSlop={10}>
                <Ionicons name="add-circle" size={22} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App color</Text>
        <View style={[styles.group, styles.accents]}>
          {ACCENTS.map((a, i) => (
            <Pressable key={a.name} onPress={() => { save({ accent: i }); onAccent(i); }} style={{ alignItems: 'center', gap: 4 }} accessibilityLabel={a.name}>
              <View style={[styles.swatch, { backgroundColor: a.primary }, PROFILE.accent === i && styles.swatchOn]}>
                {PROFILE.accent === i && <Ionicons name="checkmark" size={18} color={colors.surface} />}
              </View>
              <Text style={[type.caption, PROFILE.accent === i && { color: a.primary, fontFamily: fonts.bodyBold }]}>{a.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[type.caption, { paddingHorizontal: spacing.md }]}>Changes buttons, tabs and links everywhere. Now: {accent.name}.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photos}>
          {PROFILE.photos.map((ph, i) => (
            <View key={ph} style={[styles.photo, { width: tile, height: tile, backgroundColor: bubbleColors[i % bubbleColors.length] + '33' }]}>
              <Ionicons name="image-outline" size={24} color={bubbleColors[i % bubbleColors.length]} />
              <LinkedText numberOfLines={2} style={styles.photoLabel} text={ph} />
            </View>
          ))}
        </View>
      </View>

      <PageSheet visible={avatarOpen} title="Profile Picture" onClose={() => setAvatarOpen(false)}>
        <View style={[styles.card, { marginTop: spacing.lg }]}>
          <ProfileAvatar size={120} />
        </View>
        <View style={[styles.section, styles.avatarGrid]}>
          {['initials', ...AVATAR_ICONS].map((a) => (
            <Pressable key={a} onPress={() => save({ avatar: a })} style={[styles.avatarOption, PROFILE.avatar === a && styles.avatarOptionOn]}>
              {a === 'initials' ? <Text style={styles.avatarInitials}>{initials(PROFILE.name)}</Text> : <Ionicons name={a as IconName} size={28} color={colors.surface} />}
            </Pressable>
          ))}
        </View>
        <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.md }]}>Photo upload comes later; pick an icon or your initials for now.</Text>
      </PageSheet>

      <FriendsSheet visible={friendsOpen} onClose={() => setFriendsOpen(false)} />

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
          {setting('calendar-outline', 'Show events on map', eventsOnMap, onEventsOnMap)}
          {eventsOnMap && (
            <View style={[styles.settingRow, styles.divider]}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[type.body, { flex: 1 }]}>Days ahead</Text>
              <MenuButton
                icon="chevron-expand"
                label={`${eventDays} ${eventDays === 1 ? 'day' : 'days'}`}
                options={EVENT_DAYS.map((d) => `${d} ${d === 1 ? 'day' : 'days'}`)}
                selected={[`${eventDays} ${eventDays === 1 ? 'day' : 'days'}`]}
                onSelect={(o) => onEventDays(parseInt(o, 10))}
              />
            </View>
          )}
          <View style={[styles.settingRow, styles.divider]}>
            <Ionicons name="calendar-number-outline" size={20} color={colors.primary} />
            <Text style={[type.body, { flex: 1 }]}>Week starts on</Text>
            <MenuButton
              icon="chevron-expand"
              label={weekStartPref === 'System' ? `System (${systemWeekStart ? 'Mon' : 'Sun'})` : weekStartPref}
              options={[`System (${systemWeekStart ? 'Monday' : 'Sunday'})`, 'Sunday', 'Monday']}
              selected={[weekStartPref === 'System' ? `System (${systemWeekStart ? 'Monday' : 'Sunday'})` : weekStartPref]}
              onSelect={(o) => onWeekStartPref(o.startsWith('System') ? 'System' : (o as 'Sunday' | 'Monday'))}
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
      <PageSheet visible={pinsOpen} title="Your Pins" onClose={() => setPinsOpen(false)}>
        {[['Pinned by you', myPins], ['Top rated in your Bubbles', topPins]].map(([title, list]) => (
          <View key={title as string} style={styles.section}>
            <Text style={styles.sectionTitle}>{title as string}</Text>
            <View style={styles.group}>
              {(list as typeof pins).map(({ pin, group }, i) => (
                <PlaceLink key={pin.name} loc={{ name: pin.name, lat: pin.lat, lng: pin.lng, icon: pin.icon }}>
                  {i > 0 && <Separator inset={48} />}
                  <View style={styles.settingRow}>
                    <Ionicons name={pin.icon} size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={type.body}>{pin.name}</Text>
                      <Text style={type.caption}>{pinCategory(pin)} · {group.name}</Text>
                    </View>
                    <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>{avgRating(pin).toFixed(1)}★</Text>
                  </View>
                </PlaceLink>
              ))}
            </View>
          </View>
        ))}
      </PageSheet>
    </ScrollView>
  );
}

function ProfileAvatar({ size }: { size: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary }]}>
      {PROFILE.avatar === 'initials' ? (
        <Text style={[styles.avatarInitials, { fontSize: size * 0.36 }]}>{initials(PROFILE.name)}</Text>
      ) : (
        <Ionicons name={PROFILE.avatar as IconName} size={size * 0.45} color={colors.surface} />
      )}
    </View>
  );
}

// Friends: everyone you share a Bubble with, searchable and filterable by Bubble.
function FriendsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [bubble, setBubble] = useState<string | null>(null);
  const [open, setOpen] = useState<Member | null>(null);
  const q = query.trim().toLowerCase();
  const shown = friends()
    .filter((m) => !q || m.name.toLowerCase().includes(q))
    .filter((m) => !bubble || GROUPS.find((g) => g.id === bubble)?.members.some((x) => x.name === m.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <PageSheet visible={visible} title="Friends" onClose={onClose}>
      <View style={[styles.search, { marginHorizontal: spacing.md }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search friends" placeholderTextColor={colors.textMuted} autoCorrect={false} style={[type.body, { flex: 1, padding: 0 }]} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {[null, ...GROUPS.map((g) => g.id)].map((id) => {
          const g = GROUPS.find((x) => x.id === id);
          const on = bubble === id;
          return (
            <Pressable key={id ?? 'all'} onPress={() => setBubble(id)} style={[styles.filterChip, on && styles.filterChipOn]}>
              {g && <Bubble size={14} tint={groupColor(g.id)} />}
              <Text style={[styles.hobbyText, on && { color: colors.primary }]}>{g?.name ?? 'All Bubbles'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={[styles.group, { marginHorizontal: spacing.md }]}>
        {shown.map((m, i) => (
          <Pressable key={m.name} onPress={() => setOpen(m)}>
            {i > 0 && <Separator inset={60} />}
            <View style={styles.settingRow}>
              <Avatar size={32} initials={initials(m.name)} color={memberColor(m.name)} />
              <View style={{ flex: 1 }}>
                <Text style={type.body}>{m.name}</Text>
                <Text numberOfLines={1} style={type.caption}>{GROUPS.filter((g) => g.members.some((x) => x.name === m.name)).map((g) => g.name).join(', ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </Pressable>
        ))}
        {shown.length === 0 && <Text style={[type.caption, { padding: spacing.md }]}>No friends match</Text>}
      </View>
      <PageSheet visible={!!open} title={open?.name ?? ''} onClose={() => setOpen(null)}>
        <PersonView member={open} onShowOnMap={() => setOpen(null)} />
      </PageSheet>
    </PageSheet>
  );
}

const styles = StyleSheet.create({
  cover: { flexDirection: 'row', gap: 2, overflow: 'hidden' },
  coverPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md, marginTop: -28, borderTopLeftRadius: radius.md + 8, borderTopRightRadius: radius.md + 8, backgroundColor: colors.background },
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.background },
  avatarInitials: { fontFamily: fonts.heading, fontSize: 22, color: colors.surface },
  cameraBadge: { position: 'absolute', right: 2, bottom: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.text, borderWidth: 2, borderColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  avatarOption: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarOptionOn: { borderWidth: 4, borderColor: colors.primarySoft },
  link: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.primary },
  hobbies: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  hobbyAdd: { borderStyle: 'dashed', paddingVertical: 2 },
  hobbyInput: { ...type.body, fontSize: 14, minWidth: 90, padding: 0 },
  accents: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 2, height: 38 },
  filterRow: { gap: spacing.sm, padding: spacing.md },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm + 4, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterChipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  input: { ...type.body, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginVertical: spacing.md },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.md, gap: spacing.sm },
  sectionTitle: { ...type.caption, fontFamily: fonts.bodyBold, textTransform: 'uppercase', paddingHorizontal: spacing.md },
  group: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  hobby: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 4, paddingVertical: 6 },
  hobbyText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  swatchOn: { borderWidth: 3, borderColor: colors.surface },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', padding: spacing.xs, gap: 4 },
  photoLabel: { ...type.caption, fontSize: 11, textAlign: 'center', color: colors.text },
});
