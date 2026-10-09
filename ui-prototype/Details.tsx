// Person and pin views (shown inside the map's bottom sheet) plus event, Bubble profile and
// drop pin views (shown as page sheets).
import { ReactNode, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, StyleProp, StyleSheet, Switch, Text, TextInput, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Bubble, Button, IconName, PageSheet, Segmented, Separator } from './components';
import { bubbleColors, colors, fonts, radius, spacing, type } from './theme';
import {
  avgRating, BubbleEvent, distanceFromMe, EVENTS, formatMiles, Group, groupColor, GROUPS, initials, joinCode, Loc, LOCATIONS, ME, Member, memberColor, meters,
  Pin, ratingCount,
} from './data';
import BubbleMap from './BubbleMap';

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

/* ---------- Locations ---------- */

// Location details: where it is, who's there, pins and upcoming events nearby.
export function LocationView({ loc }: { loc: Loc }) {
  const here = (x: { lat: number; lng: number }, m = 250) => meters(loc, x) < m;
  const people = GROUPS.flatMap((g) => g.members).filter((m, i, all) => all.findIndex((x) => x.name === m.name) === i && here(m));
  const pins = GROUPS.flatMap((g) => g.pins).filter((p) => here(p) && p.name !== loc.name);
  const events = EVENTS.filter((e) => here(e));
  const places = GROUPS.flatMap((g) => g.places.map((p) => ({ ...p, group: g }))).filter((p) => p.name === loc.name);
  return (
    <View>
      <View style={styles.hero}>
        <View style={[styles.bigIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={loc.icon} size={34} color={colors.primary} />
        </View>
        <Text style={[type.h1, { marginTop: spacing.sm, textAlign: 'center' }]}>{loc.name}</Text>
        <Text style={type.caption}>{away(loc.lat, loc.lng)}</Text>
      </View>
      <View style={styles.mapPreview}>
        <BubbleMap members={people} places={[]} pins={[]} color={colors.primary} focus={{ name: loc.name, lat: loc.lat, lng: loc.lng }} topInset={0} bottomInset={0} onMemberPress={() => {}} />
      </View>
      <View style={[styles.actions, { marginTop: spacing.md }]}>
        <ActionButton icon="navigate-outline" label="Directions" onPress={() => directions(loc.lat, loc.lng)} />
        <ActionButton icon="share-outline" label="Share" onPress={() => Share.share({ message: `${loc.name} — shared from Bubbles` })} />
      </View>

      {places.length > 0 && (
        <Section title="Place alerts">
          {places.map((p, i) => (
            <View key={p.group.id}>
              {i > 0 && <Separator inset={48} />}
              <Toggle icon="notifications-outline" label={`Arrivals & departures · ${p.group.name}`} initial={p.name === 'Davis Park'} />
            </View>
          ))}
        </Section>
      )}

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
    <PageSheet visible title="Location" onClose={onClose}>
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
            <Text key={i} style={styles.link} onPress={() => setOpen(p)} suppressHighlighting={false}>
              {p.name}
            </Text>
          ),
        )}
      </Text>
      {open && <LocationDetail loc={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/* ---------- Person ---------- */

const QUICK_NOTES = ['👋', '?', 'On my way!', 'Call me'];

export function PersonView({ member, onShowOnMap }: { member: Member | null; onShowOnMap: (m: Member) => void }) {
  const [sent, setSent] = useState('');
  useEffect(() => setSent(''), [member]);
  if (!member) return null;
  const first = member.name.split(' ')[0];
  const shared = GROUPS.filter((g) => g.members.some((m) => m.name === member.name));

  return (
    <View>
      <View style={styles.hero}>
        <Avatar color={memberColor(member.name)} initials={initials(member.name)} size={88} />
        <Text style={[type.h1, { marginTop: spacing.sm }]}>{member.name}</Text>
        <View style={[styles.inline, { gap: 4 }]}>
          {member.moving && <Ionicons name="navigate" size={13} color={colors.primary} />}
          <LinkedText style={type.body} text={member.place} />
        </View>
        <Text style={type.caption}>
          {away(member.lat, member.lng)} · Updated {member.updated.toLowerCase()} · {member.battery}% battery
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton icon="map-outline" label="Show on map" onPress={() => onShowOnMap(member)} />
        <ActionButton icon="navigate-outline" label="Directions" onPress={() => directions(member.lat, member.lng)} />
        <ActionButton icon="chatbubble-outline" label="Message" onPress={() => setSent('Messages open in a later flow')} />
      </View>

      <Section title="Quick note">
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          {QUICK_NOTES.map((n) => (
            <Pressable key={n} style={styles.note} onPress={() => setSent(`Sent "${n}" to ${first}`)}>
              <Text style={styles.noteText}>{n}</Text>
            </Pressable>
          ))}
        </View>
        {sent !== '' && (
          <>
            <Separator />
            <Row icon="checkmark-circle" label={sent} color={colors.secure} />
          </>
        )}
      </Section>

      <Section title="Alerts">
        <Toggle icon="enter-outline" label={`When ${first} arrives at a place`} initial={false} />
        <Separator inset={48} />
        <Toggle icon="exit-outline" label={`When ${first} leaves a place`} initial={false} />
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

      <View style={styles.actions}>
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

export function BubbleProfile({ group, startEditing, onClose, onLeave, onChanged }: {
  group: Group | null; startEditing?: boolean; onClose: () => void; onLeave: () => void; onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [color, setColor] = useState('');
  const [privacy, setPrivacy] = useState('Private');
  useEffect(() => {
    if (!group) return;
    setEditing(!!startEditing);
    setName(group.name);
    setAbout(group.about ?? `${group.name} on Bubbles.`);
    setColor(groupColor(group.id));
    setPrivacy(group.isPublic ? 'Public' : 'Private');
  }, [group]);
  if (!group) return null;
  const everyone = group.id === 'everyone';
  const events = EVENTS.filter((e) => everyone || e.groupId === group.id);

  const save = () => {
    // ponytail: edits mutate the in-memory dummy data; nothing is persisted
    Object.assign(group, { name, about, color, isPublic: privacy === 'Public' });
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
      onClose={onClose}
      right={
        !everyone && (
          <Pressable onPress={editing ? save : () => setEditing(true)} hitSlop={10}>
            <Text style={[styles.headerAction, editing && { fontFamily: fonts.bodyBold }]}>{editing ? 'Done' : 'Edit'}</Text>
          </Pressable>
        )
      }
    >
      <View style={[styles.cover, { backgroundColor: color + '33' }]}>
        <Bubble size={96} tint={color}>
          {everyone && <Ionicons name="people" size={34} color={color} />}
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
                {privacy === 'Private' ? `People join with code ${joinCode(group.id)} and your approval.` : 'Anyone nearby can find and join without a code.'}
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

          <Section title="Highlights">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
              {[...group.pins.map((pn) => pn.name), 'Group photo'].map((hl) => (
                <View key={hl} style={[styles.highlight, { backgroundColor: color + '22' }]}>
                  <Ionicons name="images-outline" size={22} color={color} />
                  <Text numberOfLines={2} style={styles.highlightText}>{hl}</Text>
                </View>
              ))}
            </ScrollView>
          </Section>

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

          <Section title="Places">
            {group.places.map((pl, i) => (
              <View key={pl.name}>
                {i > 0 && <Separator inset={48} />}
                <PlaceLink loc={pl}>
                  <Row icon={pl.icon} label={pl.name} value={`${pl.radius} m`}>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Row>
                </PlaceLink>
              </View>
            ))}
          </Section>

          {!everyone && (
            <>
              <Section title="Your sharing in this Bubble">
                <Toggle icon="location-outline" label="Share my location" initial />
                <Separator inset={48} />
                <Toggle icon="images-outline" label="Show my photos and pins" initial={group.id !== 'discgolf'} />
                <Separator inset={48} />
                <Toggle icon="notifications-outline" label="Notifications" initial />
              </Section>

              <Section>
                <Row
                  icon="person-add-outline"
                  label="Invite people"
                  value={group.isPublic ? 'Public' : joinCode(group.id)}
                  onPress={() => Share.share({ message: `Join ${group.name} on Bubbles with code ${joinCode(group.id)}` })}
                />
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

const CATEGORIES: IconName[] = ['star', 'leaf', 'restaurant', 'cafe', 'football', 'camera'];

export function DropPin({ visible, groups, initialGroupId, onClose, onDrop }: {
  visible: boolean; groups: Group[]; initialGroupId?: string; onClose: () => void; onDrop: (pin: Pin, groupId: string, notify: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [icon, setIcon] = useState<IconName>('star');
  const [rating, setRating] = useState(5);
  const [groupId, setGroupId] = useState(groups[0]?.id);
  const [notify, setNotify] = useState(true);
  useEffect(() => {
    if (!visible) return;
    setName('');
    setNote('');
    setIcon('star');
    setRating(5);
    setGroupId(initialGroupId && initialGroupId !== 'everyone' ? initialGroupId : groups[0]?.id);
    setNotify(true);
  }, [visible]);
  const color = groupColor(groupId);
  const draft: Pin = { name: name || 'New pin', note, by: 'You', rating, icon, lat: ME.lat, lng: ME.lng };

  return (
    <PageSheet
      visible={visible}
      title="Drop Pin"
      onClose={onClose}
      right={
        <Pressable disabled={!name.trim()} onPress={() => onDrop({ ...draft, name: name.trim() }, groupId, notify)} hitSlop={10}>
          <Text style={[styles.headerAction, { fontFamily: fonts.bodyBold }, !name.trim() && { color: colors.textMuted }]}>Drop</Text>
        </Pressable>
      }
    >
      <View style={styles.mapPreview}>
        <BubbleMap members={[]} places={[]} pins={[draft]} color={color} focus={{ name: 'You', lat: ME.lat, lng: ME.lng }} topInset={0} bottomInset={0} onMemberPress={() => {}} />
      </View>
      <Text style={[type.caption, { textAlign: 'center' }]}>Pinned at your current location</Text>

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

      <Section title="Type">
        <View style={[styles.row, { gap: spacing.sm }]}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setIcon(c)} style={[styles.category, c === icon && { backgroundColor: color, borderColor: color }]}>
              <Ionicons name={c} size={18} color={c === icon ? colors.surface : colors.text} />
            </Pressable>
          ))}
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
      isPublic: privacy === 'Public',
      unread: 0,
      // you're the first member, at your current location
      members: [{ name: 'Ashlea Morgan', place: 'Grove City College', updated: 'Now', battery: 80, lat: ME.lat, lng: ME.lng }],
      places: [],
      pins: [],
      activity: [{ icon: 'sparkles-outline', text: `You created ${name.trim()}`, time: 'Now' }],
    });

  return (
    <PageSheet
      visible={visible}
      title="New Bubble"
      onClose={onClose}
      right={
        <Pressable disabled={!name.trim()} onPress={create} hitSlop={10}>
          <Text style={[styles.headerAction, { fontFamily: fonts.bodyBold }, !name.trim() && { color: colors.textMuted }]}>Create</Text>
        </Pressable>
      }
    >
      <View style={[styles.cover, { backgroundColor: color + '33' }]}>
        <Bubble size={96} tint={color} />
      </View>
      <Section title="Name">
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Hiking Club" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus />
      </Section>
      <Section title="About">
        <TextInput value={about} onChangeText={setAbout} placeholder="What's this Bubble for?" placeholderTextColor={colors.textMuted} style={[styles.input, { minHeight: 64 }]} multiline />
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
            {privacy === 'Private' ? 'People join with an invite code and your approval.' : 'Anyone nearby can find and join without a code.'}
          </Text>
        </View>
      </Section>
    </PageSheet>
  );
}

/* ---------- New Event ---------- */

const TIMES = ['9:00 AM', '12:00 PM', '3:00 PM', '5:30 PM', '7:00 PM', '9:00 PM'];

export function NewEvent({ visible, groups, initialGroupId, today, onClose, onCreate }: {
  visible: boolean; groups: Group[]; initialGroupId?: string; today: string; onClose: () => void; onCreate: (e: BubbleEvent) => void;
}) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const [y, m, d] = today.split('-').map(Number);
    const t = new Date(y, m - 1, d + i);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState(TIMES[4]);
  const [place, setPlace] = useState<Loc | null>(null);
  const [groupId, setGroupId] = useState(groups[0]?.id);
  const [remind, setRemind] = useState(true);
  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setDate(days[0]);
    setTime(TIMES[4]);
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

      <Section title="Day">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: spacing.sm + 4, gap: spacing.sm }}>
          {days.map((d, i) => {
            const [y, m, dd] = d.split('-').map(Number);
            const on = d === date;
            return (
              <Pressable key={d} onPress={() => setDate(d)} style={[styles.dayChip, on && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <Text style={[styles.dayChipTop, on && { color: colors.surface }]}>{i === 0 ? 'Today' : WEEKDAYS[new Date(y, m - 1, dd).getDay()].slice(0, 3)}</Text>
                <Text style={[styles.dayChipNum, on && { color: colors.surface }]}>{dd}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Section>

      <Section title="Time">
        <View style={[styles.row, { flexWrap: 'wrap', gap: spacing.sm }]}>
          {TIMES.map((t) => (
            <Pressable key={t} onPress={() => setTime(t)} style={[styles.timeChip, t === time && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
              <Text style={[styles.timeText, t === time && { color: colors.primary }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Where">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: spacing.sm + 4, gap: spacing.sm }}>
          {[null, ...LOCATIONS.filter((l) => distanceFromMe(l.lat, l.lng) < 15).slice(0, 12)].map((l) => {
            const on = (l?.name ?? null) === (place?.name ?? null);
            return (
              <Pressable key={l?.name ?? 'here'} onPress={() => setPlace(l)} style={[styles.timeChip, on && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                <View style={[styles.row, { padding: 0, gap: 4 }]}>
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
  note: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  noteText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary },
  bigIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  photo: { flex: 1, aspectRatio: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  eventHero: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  edge: { width: 5, borderRadius: 3 },
  headerAction: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  cover: { height: 140, alignItems: 'center', justifyContent: 'center' },
  input: { ...type.body, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  highlight: { width: 104, height: 104, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, gap: 4 },
  highlightText: { ...type.caption, fontSize: 12, textAlign: 'center', color: colors.text },
  mapPreview: { height: 180, marginHorizontal: spacing.md, borderRadius: radius.md, overflow: 'hidden' },
  category: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dayChip: { width: 52, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  dayChipTop: { ...type.caption, fontSize: 11, fontFamily: fonts.bodyBold },
  dayChipNum: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  timeChip: { paddingHorizontal: spacing.sm + 4, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  timeText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  shareLabel: { ...type.caption, fontSize: 11, marginTop: 4, textAlign: 'center', width: 64 },
});
