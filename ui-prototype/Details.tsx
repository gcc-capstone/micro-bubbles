// Person and pin views (shown inside the map's bottom sheet) plus event, Bubble profile and
// drop pin views (shown as page sheets).
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Bubble, Button, IconName, PageSheet, Segmented, Separator } from './components';
import { bubbleColors, colors, fonts, radius, spacing, type } from './theme';
import {
  avgRating, BubbleEvent, distanceFromMe, EVENTS, formatMiles, Group, groupColor, GROUPS, initials, joinCode, ME, Member, memberColor, Pin, ratingCount,
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
          <Text style={type.body}>{member.place}</Text>
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

export function EventDetail({ event, onClose }: { event: BubbleEvent | null; onClose: () => void }) {
  const [rsvp, setRsvp] = useState('');
  useEffect(() => setRsvp(''), [event]);
  if (!event) return null;
  const group = GROUPS.find((g) => g.id === event.groupId);
  const color = groupColor(event.groupId);
  const going = rsvp === 'Going' ? ['You', ...event.going] : event.going;

  return (
    <PageSheet visible title="Event" onClose={onClose}>
      <View style={styles.eventHero}>
        <View style={[styles.edge, { backgroundColor: color }]} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.h1}>{event.title}</Text>
          <Text style={type.body}>{longDate(event.date)}</Text>
          <Text style={type.body}>{event.time}</Text>
        </View>
      </View>

      <Section>
        <Row icon="location-outline" label={event.place} />
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
    </PageSheet>
  );
}

/* ---------- Bubble profile (view + edit) ---------- */

export function BubbleProfile({ group, onClose, onLeave, onChanged }: {
  group: Group | null; onClose: () => void; onLeave: () => void; onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [color, setColor] = useState('');
  const [privacy, setPrivacy] = useState('Private');
  useEffect(() => {
    if (!group) return;
    setEditing(false);
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
                <Row icon={pl.icon} label={pl.name} value={`${pl.radius} m`} />
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

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center' },
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
  shareLabel: { ...type.caption, fontSize: 11, marginTop: 4, textAlign: 'center', width: 64 },
});
