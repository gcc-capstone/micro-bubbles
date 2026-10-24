// Search button at the top right of the map; tapping it opens search as a page sheet (like All Bubbles'
// search), not a panel over the map. Finds people, pins and places across all your Bubbles; category
// chips list top-rated pins by what you want to do, not which Bubble they're in.
import { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, IconName, Separator } from './components';
import { CONTROL, CONTROL_SLOP, colors, fonts, radius, shadow, spacing, type } from './theme';
import {
  allPins, avgRating, distanceFromMe, formatMiles, GROUPS, initials, Loc, LOCATIONS, Member, memberColor, Pin, PIN_CATEGORIES, pinCategory, PinCategory,
} from './data';

type Result =
  | { kind: 'person'; key: string; member: Member }
  | { kind: 'pin'; key: string; pin: Pin; groupName: string }
  | { kind: 'place'; key: string; loc: Loc };

// buttonOffset: gap between the closed search button and the right edge (room for other buttons).
export default function MapSearch({ top, buttonOffset = 0, reduceMotion, onOpenChange, onPerson, onPin, onPlace }: {
  top: number; buttonOffset?: number; reduceMotion: boolean; onOpenChange: (open: boolean) => void; onPerson: (m: Member) => void; onPin: (p: Pin) => void; onPlace: (l: Loc) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PinCategory | null>(null);
  const q = query.trim().toLowerCase();

  const expand = () => {
    setOpen(true);
    onOpenChange(true);
  };
  const close = () => {
    Keyboard.dismiss();
    setOpen(false);
    onOpenChange(false);
    setQuery('');
    setCategory(null);
  };
  const pick = (r: Result) => {
    close();
    if (r.kind === 'person') onPerson(r.member);
    if (r.kind === 'pin') onPin(r.pin);
    if (r.kind === 'place') onPlace(r.loc);
  };

  const pins = allPins()
    .filter(({ pin }) => (!category || pinCategory(pin) === category) && (!q || `${pin.name} ${pin.note}`.toLowerCase().includes(q)))
    .sort((a, b) => avgRating(b.pin) - avgRating(a.pin) || distanceFromMe(a.pin.lat, a.pin.lng) - distanceFromMe(b.pin.lat, b.pin.lng));
  const people = q && !category
    ? GROUPS.flatMap((g) => g.members).filter((m, i, all) => all.findIndex((x) => x.name === m.name) === i && m.name.toLowerCase().includes(q))
    : [];
  const places = q && !category ? LOCATIONS.filter((l) => l.name.toLowerCase().includes(q) && !pins.some((p) => p.pin.name === l.name)) : [];
  const results: Result[] = [
    ...people.slice(0, 5).map((m) => ({ kind: 'person' as const, key: 'm' + m.name, member: m })),
    ...pins.slice(0, category ? 20 : 6).map(({ pin, group }) => ({ kind: 'pin' as const, key: 'p' + pin.name, pin, groupName: group.name })),
    ...places.slice(0, 5).map((l) => ({ kind: 'place' as const, key: 'l' + l.name, loc: l })),
  ];

  return (
    <View style={[styles.wrap, { top }]} pointerEvents="box-none">
      <Pressable style={[styles.button, { marginRight: buttonOffset }]} hitSlop={CONTROL_SLOP} onPress={expand} accessibilityLabel="Search places, pins, people">
        <Ionicons name="search" size={17} color={colors.text} />
      </Pressable>

      <Modal visible={open} animationType={reduceMotion ? 'none' : 'slide'} presentationStyle="pageSheet" onRequestClose={close}>
        <View style={styles.sheet}>
          {/* Cancel sits outside the field, as in iOS search bars */}
          <View style={styles.barRow}>
            <View style={styles.bar}>
              <Ionicons name="search" size={17} color={colors.textMuted} />
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search places, pins, people"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>
            <Pressable onPress={close} hitSlop={10}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>
          {/* What do you want to do? */}
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
              {PIN_CATEGORIES.map((c) => {
                const on = c.name === category;
                return (
                  <Pressable key={c.name} onPress={() => setCategory(on ? null : c.name)} style={[styles.chip, on && styles.chipOn]}>
                    <Ionicons name={c.icon} size={14} color={on ? colors.onPrimary : colors.primary} />
                    <Text style={[styles.chipText, on && { color: colors.onPrimary }]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          {category && <Text style={styles.heading}>Top {category} pins in your Bubbles</Text>}
          {!category && !q && <Text style={styles.heading}>Top pins in your Bubbles</Text>}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <View style={styles.panel}>
              {results.map((r, i) => (
                <Pressable key={r.key} onPress={() => pick(r)}>
                  {i > 0 && <Separator inset={60} />}
                  <View style={styles.row}>
                    {r.kind === 'person' ? (
                      <Avatar size={32} initials={initials(r.member.name)} color={memberColor(r.member.name)} />
                    ) : (
                      <View style={styles.icon}>
                        <Ionicons name={(r.kind === 'pin' ? r.pin.icon : r.loc.icon) as IconName} size={16} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={styles.title}>{r.kind === 'person' ? r.member.name : r.kind === 'pin' ? r.pin.name : r.loc.name}</Text>
                      <Text numberOfLines={1} style={type.caption}>
                        {r.kind === 'person' ? r.member.place : r.kind === 'pin' ? `${pinCategory(r.pin)} · ${r.groupName}` : 'Place'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {r.kind === 'pin' && <Text style={styles.rating}>{avgRating(r.pin).toFixed(1)}★</Text>}
                      <Text style={type.caption}>
                        {formatMiles(r.kind === 'person' ? distanceFromMe(r.member.lat, r.member.lng) : r.kind === 'pin' ? distanceFromMe(r.pin.lat, r.pin.lng) : distanceFromMe(r.loc.lat, r.loc.lng))}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
              {results.length === 0 && <Text style={[type.caption, { padding: spacing.md }]}>No matches</Text>}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.sm + 4, right: spacing.sm + 4, gap: spacing.sm },
  sheet: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  bar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: CONTROL, paddingHorizontal: spacing.sm + 4, borderRadius: radius.sm, backgroundColor: colors.text + '0F' },
  button: { alignSelf: 'flex-end', width: CONTROL, height: CONTROL, borderRadius: CONTROL / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, ...shadow },
  input: { ...type.input, flex: 1, padding: 0 },
  cancel: { fontFamily: fonts.body, fontSize: 16, color: colors.primary },
  panel: { backgroundColor: colors.surface, borderRadius: radius.sm + 4, overflow: 'hidden', marginHorizontal: spacing.md },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm + 2, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  chipOn: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
  heading: { ...type.caption, fontFamily: fonts.bodyBold, textTransform: 'uppercase', paddingHorizontal: spacing.lg + 4, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  rating: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
});
