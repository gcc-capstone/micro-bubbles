// Person and pin views (shown inside the map's bottom sheet) plus event, Bubble profile and
// drop pin views (shown as page sheets).
import { ReactNode, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, StyleProp, StyleSheet, Switch, Text, TextInput, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Bubble, Button, IconName, MapPin, MenuButton, PageSheet, Segmented, Separator } from './components';
import { bubbleColors, colors, FIXED_TEXT, fonts, radius, shadow, spacing, type } from './theme';
import {
  avgRating, BubbleEvent, distanceFromMe, EVENTS, formatMiles, Group, groupColor, GROUPS, initials, Loc, LOCATIONS, ME, Member, memberColor, meters,
  notifiesFrom, Pin, PIN_CATEGORIES, PinCategory, phoneOf, sharesWith, SETTINGS, ratingCount, Hotspot, HotspotAlert, canInvite, ownerName,
} from './data';
import BubbleMap, { Focus } from './BubbleMap';
import { addMonths, dayNum, daysIn, isoOf, leadBlanks, monthStart, parts } from './calendarMath';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${MONTHS[m - 1]} ${d}`;
};

// "0.4 mi away", or just "Nearby" when very close.
const away = (lat: number, lng: number) => {
  const label = formatMiles(distanceFromMe(lat, lng));
  return label === 'Nearby' ? label : `${label} away`;
};

const directions = (lat: number, lng: number) =>
  Linking.openURL(
    Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${lat},${lng}` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  );

/* ---------- shared bits ---------- */

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

function Row({ icon, label, value, onPress, color = colors.primary, children }: {
  icon: IconName; label: string; value?: string; onPress?: () => void; color?: string; children?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[type.body, { flex: 1, color: color === colors.danger ? color : colors.text }]}>{label}</Text>
      {value && <Text style={type.caption}>{value}</Text>}
      {children}
      {onPress && !children && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </Pressable>
  );
}

function Toggle({ icon, label, initial }: { icon: IconName; label: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <Row icon={icon} label={label}>
      <Switch value={on} onValueChange={setOn} trackColor={{ true: colors.primary }} />
    </Row>
  );
}

function ActionButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function Stars({ value, size = 18, onChange }: { value: number; size?: number; onChange?: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onChange} onPress={() => onChange?.(n)} hitSlop={4}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={colors.primary} />
        </Pressable>
      ))}
    </View>
  );
}

// A few drifting bubbles behind a Bubble's cover, so it isn't just a flat color.
function CoverBubbles({ color }: { color: string }) {
  return (
    <>
      {[[44, 14, 12], [26, 78, 40], [60, 22, 260], [18, 90, 300], [34, 52, 330]].map(([s, top, left], i) => (
        <View key={i} style={{ position: 'absolute', top, left }}>
          <Bubble size={s} tint={color} />
        </View>
      ))}
    </>
  );
}

/* ---------- Locations ---------- */

// Location details: where it is, who's there, pins and upcoming events nearby.
export function LocationView({ loc }: { loc: Loc }) {
  const here = (x: { lat: number; lng: number }, m = 250) => meters(loc, x) < m;
  // check who's here before de-duplicating: the same person can have a different spot per Bubble
  const people = GROUPS.flatMap((g) => g.members).filter(here).filter((m, i, all) => all.findIndex((x) => x.name === m.name) === i);
  const pins = GROUPS.flatMap((g) => g.pins).filter((p) => here(p) && p.name !== loc.name);
  const events = EVENTS.filter((e) => here(e));
  const spots = GROUPS.flatMap((g) => g.hotspots.map((h) => ({ h, group: g }))).filter(({ h }) => h.name === loc.name);
  return (
    <View>
      <View style={styles.hero}>
        <View style={[styles.bigIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={loc.icon} size={34} color={colors.primary} />
        </View>
        <Text style={[type.h1, { marginTop: spacing.sm, textAlign: 'center' }]}>{loc.name}</Text>
        <Text style={type.caption}>{away(loc.lat, loc.lng)}</Text>
      </View>
      {/* static preview: scrolling the page shouldn't get stuck panning a map */}
      <View style={[styles.mapPreview, styles.noTouch]}>
        <BubbleMap members={people} hotspots={[]} pins={[]} color={colors.primary} focus={{ name: loc.name, lat: loc.lat, lng: loc.lng }} topInset={0} bottomInset={0} onMemberPress={() => {}} />
      </View>
      <View style={[styles.actions, { marginTop: spacing.md }]}>
        <ActionButton icon="navigate-outline" label="Directions" onPress={() => directions(loc.lat, loc.lng)} />
        <ActionButton icon="share-outline" label="Share" onPress={() => Share.share({ message: `${loc.name} — shared from Bubbles` })} />
      </View>

      {spots.map(({ h, group }) => (
        <HotspotAlerts key={group.id} hotspot={h} group={group} />
      ))}

      <Section title={`Here now · ${people.length}`}>
        {people.length === 0 && <Row icon="people-outline" label="Nobody from your Bubbles" color={colors.textMuted} />}
        {people.map((m, i) => (
          <View key={m.name}>
            {i > 0 && <Separator inset={60} />}
            <View style={styles.row}>
              <Avatar size={32} initials={initials(m.name)} color={memberColor(m.name)} />
              <Text style={[type.body, { flex: 1 }]}>{m.name}</Text>
              <Text style={type.caption}>{m.updated}</Text>
            </View>
          </View>
        ))}
      </Section>

      {pins.length > 0 && (
        <Section title="Pins nearby">
          {pins.map((p, i) => (
            <View key={p.name}>
              {i > 0 && <Separator inset={48} />}
              <Row icon={p.icon} label={p.name} value={`${avgRating(p).toFixed(1)}★`} />
            </View>
          ))}
        </Section>
      )}

      {events.length > 0 && (
        <Section title="Events here">
          {events.map((e, i) => (
            <View key={i}>
              {i > 0 && <Separator inset={48} />}
              <Row icon="calendar-outline" label={e.title} value={`${longDate(e.date).split(', ')[1]} · ${e.time}`} />
            </View>
          ))}
        </Section>
      )}
    </View>
  );
}

export function LocationDetail({ loc, onClose }: { loc: Loc | null; onClose: () => void }) {
  if (!loc) return null;
  return (
    <PageSheet visible title="Place" onClose={onClose}>
      <LocationView loc={loc} />
    </PageSheet>
  );
}

// Wraps anything so tapping it opens that location's details (nested sheets work on iOS).
export function PlaceLink({ loc, children }: { loc: Loc; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)}>{children}</Pressable>
      {open && <LocationDetail loc={loc} onClose={() => setOpen(false)} />}
    </>
  );
}

// Text where every known place name becomes a tappable teal link.
export function LinkedText({ text, style, numberOfLines }: { text: string; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const [open, setOpen] = useState<Loc | null>(null);
  const parts: (string | Loc)[] = [];
  let rest = text;
  while (rest) {
    let best: { i: number; loc: Loc } | null = null;
    for (const loc of LOCATIONS) {
      const i = rest.indexOf(loc.name);
      if (i >= 0 && (!best || i < best.i)) best = { i, loc }; // LOCATIONS is longest-first, so ties keep the longer name
    }
    if (!best) {
      parts.push(rest);
      break;
    }
    if (best.i > 0) parts.push(rest.slice(0, best.i));
    parts.push(best.loc);
    rest = rest.slice(best.i + best.loc.name.length);
  }
  return (
    <>
      <Text style={style} numberOfLines={numberOfLines}>
        {parts.map((p, i) =>
          typeof p === 'string' ? (
            p
          ) : (
            <Text key={i} style={styles.link} onPress={() => setOpen(p)} suppressHighlighting>
              {p.name}
            </Text>
          ),
        )}
      </Text>
      {open && <LocationDetail loc={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/* ---------- Hotspots ---------- */

const radiusLabel = (m: number) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);

// Per-member alerts for one hotspot: tap Arrives / Leaves to get notified.
export function HotspotAlerts({ hotspot, group }: { hotspot: Hotspot; group: Group }) {
  const [, setTick] = useState(0);
  const flip = (name: string, key: keyof HotspotAlert) => {
    const a = (hotspot.alerts ??= {})[name] ?? { arrive: false, leave: false };
    hotspot.alerts[name] = { ...a, [key]: !a[key] };
    setTick((t) => t + 1);
  };
  return (
    <Section title={`Hotspot alerts · ${group.name}`}>
      <Row icon="radio-outline" label={`${radiusLabel(hotspot.radius)} around ${hotspot.name}`} />
      {group.members.map((m) => {
        const a = hotspot.alerts?.[m.name];
        return (
          <View key={m.name}>
            <Separator inset={60} />
            <View style={styles.row}>
              <Avatar size={32} initials={initials(m.name)} color={memberColor(m.name)} />
              <Text numberOfLines={1} style={[type.body, { flex: 1 }]}>{m.name}</Text>
              {(['arrive', 'leave'] as const).map((k) => (
                <Pressable key={k} onPress={() => flip(m.name, k)} style={[styles.alertChip, a?.[k] && styles.alertChipOn]} hitSlop={10}>
                  <Ionicons name={k === 'arrive' ? 'enter-outline' : 'exit-outline'} size={13} color={a?.[k] ? colors.onPrimary : colors.primary} />
                  <Text style={[styles.alertChipText, a?.[k] && { color: colors.onPrimary }]}>{k === 'arrive' ? 'Arrives' : 'Leaves'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </Section>
  );
}

const RADII_M = [100, 250, 500, 1000, 3000];

// Create a hotspot: name, where (search or drag), size, Bubble, and who you want alerts for.
export function NewHotspot({ visible, groups, initialGroupId, onClose, onCreate }: {
  visible: boolean; groups: Group[]; initialGroupId?: string; onClose: () => void; onCreate: (h: Hotspot, groupId: string) => void;
}) {
  const [name, setName] = useState('');
  const [radius, setRadius] = useState(250);
  const [groupId, setGroupId] = useState(groups[0]?.id);
  const [start, setStart] = useState<Focus>({ name: 'You', lat: ME.lat, lng: ME.lng });
  const [center, setCenter] = useState({ lat: ME.lat, lng: ME.lng });
  const [search, setSearch] = useState('');
  const [who, setWho] = useState<string[]>([]);
  const [when, setWhen] = useState('Both');
  useEffect(() => {
    if (!visible) return;
    setName('');
    setRadius(250);
    setGroupId(initialGroupId && initialGroupId !== 'everyone' ? initialGroupId : groups[0]?.id);
    setStart({ name: 'You', lat: ME.lat, lng: ME.lng });
    setCenter({ lat: ME.lat, lng: ME.lng });
    setSearch('');
    setWho([]);
    setWhen('Both');
  }, [visible]);
  const group = groups.find((g) => g.id === groupId);
  const color = groupColor(groupId);
  const q = search.trim().toLowerCase();
  const matches = q ? LOCATIONS.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 5) : [];
  const create = () =>
    onCreate(
      {
        name: name.trim(),
        icon: 'radio-outline',
        lat: center.lat,
        lng: center.lng,
        radius,
        alerts: Object.fromEntries(who.map((n) => [n, { arrive: when !== 'Leaves', leave: when !== 'Arrives' }])),
      },
      groupId,
    );

  return (
    <PageSheet
      visible={visible}
      title="New Hotspot"
      onClose={onClose}
      cancel
      dirty={!!name.trim()}
      right={
        <Pressable disabled={!name.trim()} onPress={create} hitSlop={10}>
          <Text style={[styles.headerAction, { fontFamily: fonts.bodyBold }, !name.trim() && { color: colors.textMuted }]}>Create</Text>
        </Pressable>
      }
    >
      <View style={[styles.searchRow, { marginHorizontal: spacing.md }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search a place" placeholderTextColor={colors.textMuted} style={styles.searchInput} autoCorrect={false} />
      </View>
      {matches.length > 0 && (
        <View style={[styles.group, { marginHorizontal: spacing.md, marginTop: spacing.xs }]}>
          {matches.map((l, i) => (
            <Pressable
              key={l.name}
              onPress={() => {
                setStart({ name: l.name, lat: l.lat, lng: l.lng });
                setCenter({ lat: l.lat, lng: l.lng });
                if (!name.trim()) setName(l.name);
                setSearch('');
              }}
            >
              {i > 0 && <Separator inset={48} />}
              <Row icon={l.icon} label={l.name} value={formatMiles(distanceFromMe(l.lat, l.lng))} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={[styles.mapPreview, { marginTop: spacing.sm }]}>
        <BubbleMap members={NO_MEMBERS} hotspots={[]} pins={[]} color={color} focus={start} topInset={0} bottomInset={0} onMemberPress={() => {}} onCenterChange={setCenter} />
        {/* ponytail: circle drawn at a fixed screen size, not to the map's scale */}
        <View style={[styles.areaRing, { borderColor: color, backgroundColor: color + '30' }, styles.noTouch]} />
      </View>
      <Text style={[type.caption, { textAlign: 'center' }]}>Drag the map to place the center</Text>

      <Section title="Name">
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Home, Davis Park, Campus" placeholderTextColor={colors.textMuted} style={styles.input} />
      </Section>

      <Section title="Size">
        <View style={[styles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
          {RADII_M.map((m) => (
            <Pressable key={m} onPress={() => setRadius(m)} style={[styles.timeChip, m === radius && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
              <Text style={[styles.timeText, m === radius && { color: colors.primary }]}>{radiusLabel(m)}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Bubble">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {groups.map((g) => (
            <Pressable key={g.id} onPress={() => { setGroupId(g.id); setWho([]); }} style={{ alignItems: 'center', width: 64 }}>
              <Bubble size={44} tint={groupColor(g.id)}>
                {g.id === groupId && <Ionicons name="checkmark" size={20} color={groupColor(g.id)} />}
              </Bubble>
              <Text numberOfLines={1} style={[styles.shareLabel, g.id === groupId && { color: colors.primary, fontFamily: fonts.bodyBold }]}>{g.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Section>

      <Section title="Alert me when">
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <View style={[styles.row, { flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: 0, paddingVertical: 0 }]}>
            {group?.members.map((m) => {
              const on = who.includes(m.name);
              return (
                <Pressable key={m.name} onPress={() => setWho(on ? who.filter((x) => x !== m.name) : [...who, m.name])} style={[styles.timeChip, on && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={[styles.timeText, on && { color: colors.onPrimary }]}>{m.name.split(' ')[0]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Segmented options={['Arrives', 'Leaves', 'Both']} value={when} onChange={setWhen} />
          <Text style={type.caption}>{who.length ? `You'll be notified when ${who.length === 1 ? who[0].split(' ')[0] : `any of ${who.length} people`} ${when === 'Arrives' ? 'arrives' : when === 'Leaves' ? 'leaves' : 'arrives or leaves'}.` : 'Pick people to get alerts for.'}</Text>
        </View>
      </Section>
    </PageSheet>
  );
}

/* ---------- Add members (Bubble creator only) ---------- */

export function AddMembers({ group, onClose }: { group: Group | null; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [invited, setInvited] = useState<string[]>([]);
  useEffect(() => {
    setQuery('');
    setInvited([]);
  }, [group]);
  if (!group) return null;
  const q = query.trim().toLowerCase();
  // People you share another Bubble with, who aren't in this one yet
  const people = GROUPS.flatMap((g) => g.members)
    .filter((m, i, all) => all.findIndex((x) => x.name === m.name) === i)
    .filter((m) => !group.members.some((x) => x.name === m.name) && (!q || m.name.toLowerCase().includes(q)));
  return (
    <PageSheet visible title="Add Members" onClose={onClose}>
      <View style={[styles.searchRow, { marginHorizontal: spacing.md }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search people" placeholderTextColor={colors.textMuted} style={styles.searchInput} autoCorrect={false} />
      </View>
      <Section>
        <Row icon="share-outline" label="Share invite link" onPress={() => Share.share({ message: `Join ${group.name} on Bubbles: https://bubbles.app/join/${group.id}` })} />
      </Section>
      <Section title="People you know">
        {people.map((m, i) => {
          const done = invited.includes(m.name);
          return (
            <View key={m.name}>
              {i > 0 && <Separator inset={60} />}
              <View style={styles.row}>
                <Avatar size={32} initials={initials(m.name)} color={memberColor(m.name)} />
                <Text style={[type.body, { flex: 1 }]}>{m.name}</Text>
                <Pressable disabled={done} onPress={() => setInvited([...invited, m.name])} style={[styles.alertChip, !done && styles.alertChipOn]} hitSlop={10}>
                  <Text style={[styles.alertChipText, !done && { color: colors.onPrimary }]}>{done ? 'Invited' : 'Invite'}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        {people.length === 0 && <Row icon="people-outline" label="No one to add" color={colors.textMuted} />}
      </Section>
      <Text style={[styles.footnote, { paddingHorizontal: spacing.lg, paddingTop: spacing.sm }]}>Invites arrive in their Inbox. They join only if they accept.</Text>
    </PageSheet>
  );
}

/* ---------- Person ---------- */

const QUICK_NOTES = ['👋', '?', 'On my way!', 'Call me', 'Running late', 'Here!', 'Need a ride?'];

// Open the phone's own Messages app to this person, with an optional message filled in. Bubbles
// has no chat of its own.
export const textPerson = (m: Member, body?: string) =>
  Linking.openURL(`sms:${phoneOf(m.name)}${body ? `&body=${encodeURIComponent(body)}` : ''}`).catch(() =>
    Alert.alert('Messages Unavailable', `This device can't send texts.${body ? ` Your message: "${body}"` : ''}`),
  );

// One-tap messages, sent through Messages. floating: white pills over the map, in a row that
// scrolls sideways; the last pill is cut off at the screen edge, so it reads as scrollable.
export function QuickMessages({ member, floating }: { member: Member; floating?: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.notes, floating && { paddingHorizontal: spacing.md }]}>
      {QUICK_NOTES.map((n) => (
        <Pressable key={n} style={[styles.note, floating && styles.noteFloat]} hitSlop={{ top: 8, bottom: 8 }} onPress={() => textPerson(member, n)}>
          <Text style={styles.noteText}>{n}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// compact: a short header row so the map sheet can stay low (quick messages float above it).
export function PersonView({ member, onShowOnMap, compact }: { member: Member | null; onShowOnMap: (m: Member) => void; compact?: boolean }) {
  if (!member) return null;
  const first = member.name.split(' ')[0];
  const shared = GROUPS.filter((g) => g.members.some((m) => m.name === member.name));
  const where = (
    <View style={[styles.inline, { gap: 4 }]}>
      {member.moving && <Ionicons name="navigate" size={13} color={colors.primary} />}
      <LinkedText style={type.body} text={member.place} />
    </View>
  );
  const status = `${away(member.lat, member.lng)} · Updated ${member.updated.toLowerCase()} · ${member.battery}% battery`;

  return (
    <View>
      {compact ? (
        <View style={styles.personRow}>
          <Avatar color={memberColor(member.name)} initials={initials(member.name)} size={52} />
          <View style={{ flex: 1 }}>
            <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={type.h2}>{member.name}</Text>
            {where}
            <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={type.caption}>{status}</Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <Avatar color={memberColor(member.name)} initials={initials(member.name)} size={88} />
            <Text style={[type.h1, { marginTop: spacing.sm }]}>{member.name}</Text>
            {where}
            <Text style={type.caption}>{status}</Text>
          </View>
          <Section title="Quick message">
            <QuickMessages member={member} />
          </Section>
        </>
      )}

      <View style={[styles.actions, { marginTop: spacing.sm }]}>
        <ActionButton icon="map-outline" label="Show on map" onPress={() => onShowOnMap(member)} />
        <ActionButton icon="navigate-outline" label="Directions" onPress={() => directions(member.lat, member.lng)} />
        <ActionButton icon="chatbubble-outline" label="Message" onPress={() => textPerson(member)} />
      </View>

      <Section title="Alerts">
        <Toggle icon="enter-outline" label={`When ${first} arrives at a Hotspot`} initial={false} />
        <Separator inset={48} />
        <Toggle icon="exit-outline" label={`When ${first} leaves a Hotspot`} initial={false} />
      </Section>

      <Section title="Shared Bubbles">
        {shared.map((g, i) => (
          <View key={g.id}>
            {i > 0 && <Separator inset={48} />}
            <View style={styles.row}>
              <Bubble size={20} tint={groupColor(g.id)} />
              <Text style={[type.body, { flex: 1 }]}>{g.name}</Text>
            </View>
          </View>
        ))}
      </Section>
    </View>
  );
}

/* ---------- Pin ---------- */

export function PinView({ pin, groupName, color, onShowOnMap }: {
  pin: Pin | null; groupName: string; color: string; onShowOnMap: (p: Pin) => void;
}) {
  const [mine, setMine] = useState(0);
  useEffect(() => setMine(0), [pin]);
  if (!pin) return null;
  return (
    <View>
      <View style={styles.hero}>
        <View style={[styles.bigIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={pin.icon} size={36} color={color} />
        </View>
        <Text style={[type.h1, { marginTop: spacing.sm, textAlign: 'center' }]}>{pin.name}</Text>
        <View style={[styles.inline, { gap: 4 }]}>
          <Text style={styles.avg}>{avgRating(pin).toFixed(1)}</Text>
          <Ionicons name="star" size={16} color={colors.primary} />
          <Text style={type.caption}>from {ratingCount(pin)} members</Text>
        </View>
        <Text style={type.caption}>
          Pinned by {pin.by} in {groupName} · {away(pin.lat, pin.lng)}
        </Text>
        <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm }]}>{pin.note}</Text>
      </View>

      <View style={[styles.actions, { marginTop: spacing.sm }]}>
        <ActionButton icon="map-outline" label="Show on map" onPress={() => onShowOnMap(pin)} />
        <ActionButton icon="navigate-outline" label="Directions" onPress={() => directions(pin.lat, pin.lng)} />
      </View>

      <Section title="Your rating">
        <View style={styles.row}>
          <Stars value={mine} size={28} onChange={setMine} />
          <Text style={[type.caption, { flex: 1, textAlign: 'right' }]}>{mine ? 'Thanks! Saved to this Bubble' : 'Tap to rate'}</Text>
        </View>
      </Section>

      <Section title="Photos">
        <View style={[styles.row, { gap: spacing.sm }]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.photo, { backgroundColor: color + '22' }]}>
              <Ionicons name="image-outline" size={22} color={color} />
            </View>
          ))}
        </View>
      </Section>
    </View>
  );
}

/* ---------- Event ---------- */

// Page sheet version (Calendar).
export function EventDetail({ event, onClose }: { event: BubbleEvent | null; onClose: () => void }) {
  if (!event) return null;
  return (
    <PageSheet visible title="Event" onClose={onClose}>
      <EventView event={event} />
    </PageSheet>
  );
}

// Plain view (also shown inside the map's bottom sheet).
export function EventView({ event }: { event: BubbleEvent | null }) {
  const [rsvp, setRsvp] = useState('');
  useEffect(() => setRsvp(''), [event]);
  if (!event) return null;
  const group = GROUPS.find((g) => g.id === event.groupId);
  const color = groupColor(event.groupId);
  const going = rsvp === 'Going' ? ['You', ...event.going] : event.going;

  return (
    <View>
      <View style={styles.eventHero}>
        <View style={[styles.edge, { backgroundColor: color }]} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.h1}>{event.title}</Text>
          <Text style={type.body}>{longDate(event.date)}</Text>
          <Text style={type.body}>{event.time}</Text>
        </View>
      </View>

      <Section>
        <PlaceLink loc={{ name: event.place, lat: event.lat, lng: event.lng, icon: 'location-outline' }}>
          <Row icon="location-outline" label={event.place} color={colors.primary}>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Row>
        </PlaceLink>
        <Separator inset={48} />
        <View style={styles.row}>
          <Bubble size={20} tint={color} />
          <Text style={[type.body, { flex: 1 }]}>{group?.name}</Text>
        </View>
        <Separator inset={48} />
        <Row icon="person-outline" label={`Hosted by ${event.going[0]}`} />
      </Section>

      <Section title="Are you going?">
        <View style={{ padding: spacing.md }}>
          <Segmented options={['Going', 'Maybe', "Can't go"]} value={rsvp} onChange={setRsvp} />
        </View>
      </Section>

      <Section title={`Going · ${going.length}`}>
        {going.map((n, i) => (
          <View key={n}>
            {i > 0 && <Separator inset={60} />}
            <View style={styles.row}>
              <Avatar size={32} initials={n === 'You' ? 'ME' : initials(n)} color={n === 'You' ? colors.primary : memberColor(n)} />
              <Text style={type.body}>{n}</Text>
            </View>
          </View>
        ))}
      </Section>

      <Section>
        <Toggle icon="alarm-outline" label="Remind me 1 hour before" initial />
      </Section>
    </View>
  );
}

/* ---------- Bubble profile (view + edit) ---------- */

export function BubbleProfile({ group, startEditing, onMute, onClose, onLeave, onChanged, onInvite }: {
  group: Group | null; startEditing?: boolean; onMute: () => void; onClose: () => void; onLeave: () => void; onChanged: () => void; onInvite: () => void;
}) {
  const [hotspotOpen, setHotspotOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState<IconName | undefined>();
  const [privacy, setPrivacy] = useState('Private');
  useEffect(() => {
    if (!group) return;
    setEditing(!!startEditing);
    setName(group.name);
    setAbout(group.about ?? `${group.name} on Bubbles.`);
    setColor(groupColor(group.id));
    setIcon(group.icon);
    setPrivacy(group.isPublic ? 'Public' : 'Private');
  }, [group]);
  if (!group) return null;
  const everyone = group.id === 'everyone';
  const events = EVENTS.filter((e) => everyone || e.groupId === group.id);

  const reset = () => {
    setName(group.name);
    setAbout(group.about ?? `${group.name} on Bubbles.`);
    setColor(groupColor(group.id));
    setIcon(group.icon);
    setPrivacy(group.isPublic ? 'Public' : 'Private');
  };
  const cancelEdit = () => {
    reset();
    setEditing(false);
  };
  const save = () => {
    // ponytail: edits mutate the in-memory dummy data; nothing is persisted
    Object.assign(group, { name: name.trim(), about, color, icon, isPublic: privacy === 'Public' });
    onChanged();
    setEditing(false);
  };
  const leave = () =>
    Alert.alert(`Leave ${group.name}?`, 'Members will stop seeing your location, pins and photos.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: onLeave },
    ]);

  return (
    <PageSheet
      visible
      title={editing ? 'Edit Bubble' : group.name}
      // Cancel in edit mode goes back to the info view (or closes, if the sheet opened for editing)
      onClose={editing && !startEditing ? cancelEdit : onClose}
      cancel={editing}
      dirty={editing && (name !== group.name || about !== (group.about ?? `${group.name} on Bubbles.`) || color !== groupColor(group.id) || icon !== group.icon || privacy !== (group.isPublic ? 'Public' : 'Private'))}
      right={
        editing ? (
          <Pressable onPress={save} disabled={!name.trim()} hitSlop={10}>
            <Text style={[styles.headerAction, { fontFamily: fonts.bodyBold }, !name.trim() && { color: colors.textMuted }]}>Done</Text>
          </Pressable>
        ) : everyone ? null : (
          // ⋯ like the map sheet: edit (creator only), mute, leave
          <MenuButton
            plain
            icon="ellipsis-horizontal-circle-outline"
            options={[...(canInvite(group) ? ['Edit Bubble'] : []), group.muted ? 'Unmute Notifications' : 'Mute Notifications', 'Leave Bubble']}
            icons={{ 'Edit Bubble': 'create-outline', 'Mute Notifications': 'notifications-off-outline', 'Unmute Notifications': 'notifications-outline', 'Leave Bubble': 'exit-outline' }}
            destructive={['Leave Bubble']}
            onSelect={(o) => (o === 'Edit Bubble' ? setEditing(true) : o === 'Leave Bubble' ? leave() : onMute())}
          />
        )
      }
    >
      <View style={[styles.cover, { backgroundColor: color + '33' }]}>
        <CoverBubbles color={color} />
        <Bubble size={96} tint={color}>
          {icon && <Ionicons name={icon} size={34} color={color} />}
        </Bubble>
      </View>

      {editing ? (
        <>
          <Section title="Name">
            <TextInput value={name} onChangeText={setName} style={styles.input} />
          </Section>
          <Section title="About">
            <TextInput value={about} onChangeText={setAbout} style={[styles.input, { minHeight: 72 }]} multiline />
          </Section>
          <Section title="Icon">
            <View style={[styles.row, { gap: spacing.sm, flexWrap: 'wrap' }]}>
              {BUBBLE_ICONS.map((ic) => (
                <Pressable key={ic} onPress={() => setIcon(ic)} style={[styles.category, ic === icon && { backgroundColor: color, borderColor: color }]}>
                  <Ionicons name={ic} size={18} color={ic === icon ? 'white' : colors.text} />
                </Pressable>
              ))}
            </View>
          </Section>
          <Section title="Bubble color">
            <View style={[styles.row, { gap: spacing.md }]}>
              {bubbleColors.map((c) => (
                <Pressable key={c} onPress={() => setColor(c)}>
                  <Bubble size={40} tint={c}>{c === color && <Ionicons name="checkmark" size={18} color={c} />}</Bubble>
                </Pressable>
              ))}
            </View>
          </Section>
          <Section title="Who can join">
            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              <Segmented options={['Private', 'Public']} value={privacy} onChange={setPrivacy} />
              <Text style={type.caption}>
                {privacy === 'Private' ? 'Hidden from search. Only people you invite can join.' : 'Anyone can find this Bubble, but only you can invite members.'}
              </Text>
            </View>
          </Section>
        </>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={[type.h1, { textAlign: 'center' }]}>{group.name}</Text>
            <Text style={type.caption}>
              {everyone ? 'Everyone you share with' : `${group.isPublic ? 'Public' : 'Private'} · ${group.members.length} members`}
            </Text>
            <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm }]}>{about}</Text>
          </View>

          {!everyone && (
            // alerts first: testers looked for them at the top
            <Section title="Notifications & sharing">
              {/* one state with ⋯ > Mute and Profile > Settings; the app-wide switch wins when off */}
              <Row icon="notifications-outline" label="Notifications">
                <Switch value={notifiesFrom(group)} disabled={!SETTINGS.notifications} onValueChange={onMute} trackColor={{ true: colors.primary }} />
              </Row>
              <Separator inset={48} />
              <Row icon="location-outline" label="Share my location">
                <Switch
                  value={sharesWith(group)}
                  disabled={!SETTINGS.sharing}
                  onValueChange={(v) => {
                    group.paused = !v;
                    onChanged();
                  }}
                  trackColor={{ true: colors.primary }}
                />
              </Row>
              <Text style={styles.footnote}>
                {!SETTINGS.sharing || !SETTINGS.notifications
                  ? `${!SETTINGS.sharing ? 'Location sharing' : 'Notifications'} turned off for all Bubbles in Profile › Settings. `
                  : ''}
                Only members of this Bubble can see your location, pins and photos.
              </Text>
            </Section>
          )}

          {events.length > 0 && (
            <Section title="Upcoming">
              {events.slice(0, 3).map((e, i) => (
                <View key={i}>
                  {i > 0 && <Separator inset={48} />}
                  <Row icon="calendar-outline" label={e.title} value={`${longDate(e.date).split(',')[1]} · ${e.time}`} />
                </View>
              ))}
            </Section>
          )}

          <Section title="Hotspots">
            {group.hotspots.map((pl, i) => (
              <View key={pl.name}>
                {i > 0 && <Separator inset={48} />}
                <PlaceLink loc={pl}>
                  <Row icon={pl.icon} label={pl.name} value={`${radiusLabel(pl.radius)}${Object.values(pl.alerts ?? {}).some((a) => a.arrive || a.leave) ? ' · alerts on' : ''}`}>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Row>
                </PlaceLink>
              </View>
            ))}
            {!everyone && (
              <>
                {group.hotspots.length > 0 && <Separator inset={48} />}
                <Row icon="add-circle-outline" label="New Hotspot" onPress={() => setHotspotOpen(true)} />
              </>
            )}
          </Section>
          <NewHotspot
            visible={hotspotOpen}
            groups={[group]}
            initialGroupId={group.id}
            onClose={() => setHotspotOpen(false)}
            onCreate={(h) => {
              group.hotspots.push(h);
              group.activity.unshift({ icon: 'radio-outline', text: `You added the hotspot ${h.name}`, time: 'Now' });
              setHotspotOpen(false);
              onChanged();
            }}
          />

          {!everyone && (
            <>
              <Section>
                {canInvite(group) ? (
                  <Row icon="person-add-outline" label="Add Members" onPress={onInvite} />
                ) : (
                  <Row icon="person-add-outline" label={`Only ${ownerName(group)} can add members`} color={colors.textMuted} />
                )}
                <Separator inset={48} />
                <Row icon="exit-outline" label="Leave Bubble" color={colors.danger} onPress={leave} />
              </Section>
            </>
          )}
        </>
      )}
    </PageSheet>
  );
}

/* ---------- Drop pin ---------- */

// Icons a Bubble can show inside it.
const BUBBLE_ICONS: IconName[] = ['ellipse-outline', 'people', 'home', 'school', 'leaf', 'football', 'basketball', 'musical-notes', 'book', 'restaurant', 'fitness', 'heart'];


// Stable empty list: a new [] each render would make the map re-fit and undo the user's drag.
const NO_MEMBERS: Member[] = [];

// at: where to start (a long-pressed spot on the map); defaults to your location.
export function DropPin({ visible, groups, initialGroupId, at, onClose, onDrop }: {
  visible: boolean; groups: Group[]; initialGroupId?: string; at?: { lat: number; lng: number } | null; onClose: () => void; onDrop: (pin: Pin, groupId: string, notify: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<PinCategory>('Other');
  const [rating, setRating] = useState(5);
  const [groupId, setGroupId] = useState(groups[0]?.id);
  const [notify, setNotify] = useState(true);
  // Where the map is centered (start = where it jumps to; center = where the user dragged it).
  const [start, setStart] = useState<Focus>({ name: 'You', lat: ME.lat, lng: ME.lng });
  const [center, setCenter] = useState({ lat: ME.lat, lng: ME.lng });
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!visible) return;
    setName('');
    setNote('');
    setCategory('Other');
    setRating(5);
    setGroupId(initialGroupId && initialGroupId !== 'everyone' ? initialGroupId : groups[0]?.id);
    setNotify(true);
    const p = at ?? { lat: ME.lat, lng: ME.lng };
    setStart({ name: at ? 'Dropped pin' : 'You', ...p });
    setCenter(p);
    setSearch('');
  }, [visible]);
  const color = groupColor(groupId);
  const icon = PIN_CATEGORIES.find((c) => c.name === category)!.icon;
  const q = search.trim().toLowerCase();
  const matches = q ? LOCATIONS.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 5) : [];
  const nearMe = distanceFromMe(center.lat, center.lng) < 0.05;

  return (
    <PageSheet
      visible={visible}
      title="Drop Pin"
      onClose={onClose}
      cancel
      dirty={!!(name.trim() || note.trim())}
      right={
        <Pressable
          disabled={!name.trim()}
          onPress={() => onDrop({ name: name.trim(), note, by: 'You', rating, icon, category, lat: center.lat, lng: center.lng }, groupId, notify)}
          hitSlop={10}
        >
          <Text style={[styles.headerAction, { fontFamily: fonts.bodyBold }, !name.trim() && { color: colors.textMuted }]}>Drop</Text>
        </Pressable>
      }
    >
      {/* Search for a place, or drag the map under the fixed pin */}
      <View style={[styles.searchRow, { marginHorizontal: spacing.md }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search a place" placeholderTextColor={colors.textMuted} style={styles.searchInput} autoCorrect={false} />
      </View>
      {matches.length > 0 && (
        <View style={[styles.group, { marginHorizontal: spacing.md, marginTop: spacing.xs }]}>
          {matches.map((l, i) => (
            <Pressable
              key={l.name}
              onPress={() => {
                setStart({ name: l.name, lat: l.lat, lng: l.lng });
                setCenter({ lat: l.lat, lng: l.lng });
                if (!name.trim()) setName(l.name);
                setSearch('');
              }}
            >
              {i > 0 && <Separator inset={48} />}
              <Row icon={l.icon} label={l.name} value={formatMiles(distanceFromMe(l.lat, l.lng))} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={[styles.mapPreview, { marginTop: spacing.sm }]}>
        <BubbleMap members={NO_MEMBERS} hotspots={[]} pins={[]} color={color} focus={start} topInset={0} bottomInset={0} onMemberPress={() => {}} onCenterChange={setCenter} />
        <View style={styles.centerPin} pointerEvents="none">
          <MapPin color={color} icon={icon} style={{ position: 'relative' }} />
        </View>
      </View>
      <Text style={[type.caption, { textAlign: 'center' }]}>{nearMe ? 'At your current location · drag the map to move the pin' : `${away(center.lat, center.lng)} · drag to adjust`}</Text>

      <Section title="Details">
        <TextInput value={name} onChangeText={setName} placeholder="Name, e.g. Sunken Garden Trail" placeholderTextColor={colors.textMuted} style={styles.input} />
        <Separator />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Why is it worth visiting?"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { minHeight: 64 }]}
          multiline
        />
      </Section>

      <Section title="Category">
        <View style={[styles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
          {PIN_CATEGORIES.map((c) => {
            const on = c.name === category;
            return (
              <Pressable key={c.name} onPress={() => setCategory(c.name)} style={[styles.timeChip, on && { backgroundColor: color, borderColor: color }]}>
                <View style={[styles.row, { paddingHorizontal: 0, paddingVertical: 0, gap: 6 }]}>
                  <Ionicons name={c.icon} size={15} color={on ? 'white' : colors.text} />
                  <Text style={[styles.timeText, on && { color: 'white' }]}>{c.name}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Your rating">
        <View style={styles.row}>
          <Stars value={rating} size={28} onChange={setRating} />
        </View>
      </Section>

      <Section title="Share to">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {groups.map((g) => (
            <Pressable key={g.id} onPress={() => setGroupId(g.id)} style={{ alignItems: 'center', width: 64 }}>
              <Bubble size={44} tint={groupColor(g.id)}>
                {g.id === groupId && <Ionicons name="checkmark" size={20} color={groupColor(g.id)} />}
              </Bubble>
              <Text numberOfLines={1} style={[styles.shareLabel, g.id === groupId && { color: colors.primary, fontFamily: fonts.bodyBold }]}>{g.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Separator />
        <Row icon="notifications-outline" label="Notify members">
          <Switch value={notify} onValueChange={setNotify} trackColor={{ true: colors.primary }} />
        </Row>
      </Section>
    </PageSheet>
  );
}

/* ---------- New Bubble ---------- */

export function NewBubble({ visible, onClose, onCreate }: {
  visible: boolean; onClose: () => void; onCreate: (g: Group) => void;
}) {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [color, setColor] = useState(bubbleColors[0]);
  const [icon, setIcon] = useState<IconName>('ellipse-outline');
  const [privacy, setPrivacy] = useState('Private');
  useEffect(() => {
    if (!visible) return;
    setName('');
    setAbout('');
    setColor(bubbleColors[(GROUPS.length + 1) % bubbleColors.length]);
    setPrivacy('Private');
  }, [visible]);
  const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'new';

  const create = () =>
    onCreate({
      id: `${id}-${Date.now() % 10000}`,
      name: name.trim(),
      about: about.trim() || undefined,
      color,
      icon,
      isPublic: privacy === 'Public',
      unread: 0,
      // you're the first member, at your current location
      members: [{ name: 'Ashlea Morgan', place: 'Grove City College', updated: 'Now', battery: 80, lat: ME.lat, lng: ME.lng }],
      hotspots: [],
      pins: [],
      activity: [{ icon: 'sparkles-outline', text: `You created ${name.trim()}`, time: 'Now' }],
    });

  return (
    <PageSheet
      visible={visible}
      title="New Bubble"
      onClose={onClose}
      cancel
      dirty={!!name.trim()}
      right={
        <Pressable disabled={!name.trim()} onPress={create} hitSlop={10}>
          <Text style={[styles.headerAction, { fontFamily: fonts.bodyBold }, !name.trim() && { color: colors.textMuted }]}>Create</Text>
        </Pressable>
      }
    >
      <View style={[styles.cover, { backgroundColor: color + '33' }]}>
        <CoverBubbles color={color} />
        <Bubble size={96} tint={color}>
          <Ionicons name={icon} size={34} color={color} />
        </Bubble>
      </View>
      <Section title="Name">
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Hiking Club" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus />
      </Section>
      <Section title="About">
        <TextInput value={about} onChangeText={setAbout} placeholder="What's this Bubble for?" placeholderTextColor={colors.textMuted} style={[styles.input, { minHeight: 64 }]} multiline />
      </Section>
      <Section title="Icon">
        <View style={[styles.row, { gap: spacing.sm, flexWrap: 'wrap' }]}>
          {BUBBLE_ICONS.map((ic) => (
            <Pressable key={ic} onPress={() => setIcon(ic)} style={[styles.category, ic === icon && { backgroundColor: color, borderColor: color }]}>
              <Ionicons name={ic} size={18} color={ic === icon ? 'white' : colors.text} />
            </Pressable>
          ))}
        </View>
      </Section>
      <Section title="Bubble color">
        <View style={[styles.row, { gap: spacing.md, flexWrap: 'wrap' }]}>
          {bubbleColors.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)}>
              <Bubble size={40} tint={c}>{c === color && <Ionicons name="checkmark" size={18} color={c} />}</Bubble>
            </Pressable>
          ))}
        </View>
      </Section>
      <Section title="Who can join">
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <Segmented options={['Private', 'Public']} value={privacy} onChange={setPrivacy} />
          <Text style={type.caption}>
            {privacy === 'Private' ? 'Hidden from search. Only people you invite can join.' : 'Anyone can find this Bubble, but only you can invite members.'}
          </Text>
        </View>
      </Section>
    </PageSheet>
  );
}

/* ---------- New Event ---------- */

// Every half hour, 6:00 AM to 11:30 PM; the row starts scrolled to the chosen time.
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const h = 6 + Math.floor(i / 2);
  return `${((h + 11) % 12) + 1}:${i % 2 ? '30' : '00'} ${h < 12 ? 'AM' : 'PM'}`;
});
const DEFAULT_TIME = TIMES.indexOf('7:00 PM');
const TIME_W = 92; // chip width + gap, for scrolling to a time

// Month grid for picking any day; arrows page through months. Days before today are disabled.
function DatePicker({ value, today, weekStart, onChange }: { value: string; today: string; weekStart: number; onChange: (iso: string) => void }) {
  const T = dayNum(today);
  const v = dayNum(value);
  const [ym, setYm] = useState(() => ({ y: parts(v).y, m: parts(v).m }));
  const start = monthStart(ym.y, ym.m);
  const cells = [...Array<null>(leadBlanks(ym.y, ym.m, weekStart)).fill(null), ...Array.from({ length: daysIn(ym.y, ym.m) }, (_, i) => start + i)];
  const page = (i: number) => setYm(addMonths(ym.y, ym.m, i));
  const canBack = start > T;
  return (
    <View style={{ padding: spacing.sm + 4 }}>
      <View style={[styles.inline, { justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: spacing.sm }]}>
        <Text style={type.h2}>{MONTHS[ym.m]} {ym.y}</Text>
        <View style={[styles.inline, { gap: spacing.lg }]}>
          <Pressable onPress={() => page(-1)} disabled={!canBack} hitSlop={10} accessibilityLabel="Previous month">
            <Ionicons name="chevron-back" size={22} color={canBack ? colors.primary : colors.border} />
          </Pressable>
          <Pressable onPress={() => page(1)} hitSlop={10} accessibilityLabel="Next month">
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>
      <View style={styles.calGrid}>
        {Array.from({ length: 7 }, (_, i) => (
          <Text key={'d' + i} style={[styles.calCell, styles.calDow]}>{WEEKDAYS[(i + weekStart) % 7].slice(0, 1)}</Text>
        ))}
        {cells.map((n, i) =>
          n === null ? (
            <View key={i} style={styles.calCell} />
          ) : (
            <Pressable key={i} style={styles.calCell} disabled={n < T} onPress={() => onChange(isoOf(n))}>
              <View style={[styles.calDay, n === T && n !== v && styles.calToday, n === v && { backgroundColor: colors.primary }]}>
                <Text style={[styles.calNum, n < T && { color: colors.border }, n === T && { color: colors.primary }, n === v && { color: colors.onPrimary }]}>{parts(n).d}</Text>
              </View>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

export function NewEvent({ visible, groups, initialGroupId, today, initialDate = today, weekStart = 0, onClose, onCreate }: {
  visible: boolean; groups: Group[]; initialGroupId?: string; today: string; initialDate?: string; weekStart?: number; onClose: () => void; onCreate: (e: BubbleEvent) => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(TIMES[DEFAULT_TIME]);
  const [place, setPlace] = useState<Loc | null>(null);
  const [groupId, setGroupId] = useState(groups[0]?.id);
  const [remind, setRemind] = useState(true);
  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setDate(initialDate < today ? today : initialDate);
    setTime(TIMES[DEFAULT_TIME]);
    setPlace(null);
    setGroupId(initialGroupId && initialGroupId !== 'everyone' ? initialGroupId : groups[0]?.id);
    setRemind(true);
  }, [visible]);
  const where = place ?? { name: 'Current location', lat: ME.lat, lng: ME.lng, icon: 'locate' as IconName };
  const ok = title.trim().length > 0;

  return (
    <PageSheet
      visible={visible}
      title="New Event"
      onClose={onClose}
      cancel
      dirty={!!title.trim()}
      right={
        <Pressable
          disabled={!ok}
          onPress={() => onCreate({ groupId, title: title.trim(), date, time, place: where.name, going: ['Ashlea Morgan'], lat: where.lat, lng: where.lng })}
          hitSlop={10}
        >
          <Text style={[styles.headerAction, { fontFamily: fonts.bodyBold }, !ok && { color: colors.textMuted }]}>Add</Text>
        </Pressable>
      }
    >
      <Section title="Title">
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Beginner hike" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus />
      </Section>

      <Section title={`Day · ${longDate(date)}`}>
        <View style={styles.group}>
          <DatePicker value={date} today={today} weekStart={weekStart} onChange={setDate} />
        </View>
      </Section>

      <Section title="Time">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: Math.max(0, (DEFAULT_TIME - 1) * TIME_W), y: 0 }}
          contentContainerStyle={{ padding: spacing.sm + 4, gap: spacing.sm }}
        >
          {TIMES.map((t) => (
            <Pressable key={t} onPress={() => setTime(t)} style={[styles.timeChip, { width: TIME_W - spacing.sm, alignItems: 'center' }, t === time && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
              <Text style={[styles.timeText, t === time && { color: colors.primary }]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Section>

      <Section title="Where">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: spacing.sm + 4, gap: spacing.sm }}>
          {[null, ...LOCATIONS.filter((l) => distanceFromMe(l.lat, l.lng) < 15).slice(0, 12)].map((l) => {
            const on = (l?.name ?? null) === (place?.name ?? null);
            return (
              <Pressable key={l?.name ?? 'here'} onPress={() => setPlace(l)} style={[styles.timeChip, on && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                <View style={[styles.row, { paddingHorizontal: 0, paddingVertical: 0, gap: 4 }]}>
                  <Ionicons name={l?.icon ?? 'locate'} size={14} color={on ? colors.primary : colors.textMuted} />
                  <Text style={[styles.timeText, on && { color: colors.primary }]}>{l?.name ?? 'Current location'}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Section>

      <Section title="Bubble">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {groups.map((g) => (
            <Pressable key={g.id} onPress={() => setGroupId(g.id)} style={{ alignItems: 'center', width: 64 }}>
              <Bubble size={44} tint={groupColor(g.id)}>
                {g.id === groupId && <Ionicons name="checkmark" size={20} color={groupColor(g.id)} />}
              </Bubble>
              <Text numberOfLines={1} style={[styles.shareLabel, g.id === groupId && { color: colors.primary, fontFamily: fonts.bodyBold }]}>{g.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Separator />
        <Row icon="notifications-outline" label="Notify members">
          <Switch value={remind} onValueChange={setRemind} trackColor={{ true: colors.primary }} />
        </Row>
      </Section>
    </PageSheet>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center' },
  link: { color: colors.primary, fontFamily: fonts.bodyBold },
  avg: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 4 },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.md, gap: 6 },
  sectionTitle: { ...type.caption, fontFamily: fonts.bodyBold, textTransform: 'uppercase', paddingHorizontal: spacing.md },
  group: { backgroundColor: colors.surface, borderRadius: radius.sm + 4, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  action: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm + 4, backgroundColor: colors.surface, borderRadius: radius.sm + 4 },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  note: { paddingHorizontal: spacing.sm + 6, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  noteFloat: { backgroundColor: colors.surface, ...shadow },
  notes: { gap: spacing.sm, paddingVertical: 6, alignItems: 'center' }, // don't stretch pills to the row height
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  noteText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
  bigIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  photo: { flex: 1, aspectRatio: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  eventHero: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  edge: { width: 5, borderRadius: 3 },
  headerAction: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  cover: { height: 140, alignItems: 'center', justifyContent: 'center' },
  input: { ...type.body, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  highlight: { width: 104, height: 104, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, gap: 4 },
  highlightText: { ...type.caption, fontSize: 12, textAlign: 'center', color: colors.text },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 2, height: 38 },
  searchInput: { ...type.body, flex: 1, padding: 0 },
  centerPin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -15, marginTop: -44 },
  noTouch: { pointerEvents: 'none' },
  footnote: { ...type.caption, paddingHorizontal: spacing.md, paddingBottom: spacing.sm + 2 },
  alertChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  alertChipOn: { backgroundColor: colors.primary },
  alertChipText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  areaRing: { position: 'absolute', left: '50%', top: '50%', width: 110, height: 110, marginLeft: -55, marginTop: -55, borderRadius: 55, borderWidth: 2 },
  mapPreview: { height: 180, marginHorizontal: spacing.md, borderRadius: radius.md, overflow: 'hidden' },
  category: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  calDow: { ...type.caption, fontFamily: fonts.bodyBold, paddingBottom: 4 },
  calDay: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  calToday: { borderWidth: 2, borderColor: colors.primary },
  calNum: { fontFamily: fonts.body, fontSize: 16, color: colors.text },
  timeChip: { paddingHorizontal: spacing.sm + 4, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  timeText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  shareLabel: { ...type.caption, fontSize: 11, marginTop: 4, textAlign: 'center', width: 64 },
});
