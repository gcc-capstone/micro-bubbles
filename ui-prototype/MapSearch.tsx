// Search bar that stays at the top of the map. Finds people, pins and places across all your
// Bubbles; category chips list top-rated pins by what you want to do, not which Bubble they're in.
import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, IconName, Separator } from './components';
import { colors, fonts, radius, shadow, spacing, type } from './theme';
import {
  allPins, avgRating, distanceFromMe, formatMiles, GROUPS, initials, Loc, LOCATIONS, Member, memberColor, Pin, PIN_CATEGORIES, pinCategory, PinCategory,
} from './data';

type Result =
  | { kind: 'person'; key: string; member: Member }
  | { kind: 'pin'; key: string; pin: Pin; groupName: string }
  | { kind: 'place'; key: string; loc: Loc };

export default function MapSearch({ top, onPerson, onPin, onPlace }: {
  top: number; onPerson: (m: Member) => void; onPin: (p: Pin) => void; onPlace: (l: Loc) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PinCategory | null>(null);
  const q = query.trim().toLowerCase();

  const close = () => {
    Keyboard.dismiss();
    setOpen(false);
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
      <View style={styles.bar}>
        <Ionicons name="search" size={17} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setOpen(true)}
          placeholder="Search places, pins, people"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {open && (
          <Pressable onPress={close} hitSlop={10}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        )}
      </View>

      {open && (
        <View style={styles.panel}>
          {/* What do you want to do? */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
            {PIN_CATEGORIES.map((c) => {
              const on = c.name === category;
              return (
                <Pressable key={c.name} onPress={() => setCategory(on ? null : c.name)} style={[styles.chip, on && styles.chipOn]}>
                  <Ionicons name={c.icon} size={14} color={on ? colors.surface : colors.primary} />
                  <Text style={[styles.chipText, on && { color: colors.surface }]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {category && <Text style={styles.heading}>Top {category} pins in your Bubbles</Text>}
          {!category && !q && <Text style={styles.heading}>Top pins in your Bubbles</Text>}
          <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
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
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.sm + 4, right: spacing.sm + 4, gap: spacing.sm },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, ...shadow },
  input: { ...type.body, flex: 1, padding: 0 },
  cancel: { fontFamily: fonts.body, fontSize: 16, color: colors.primary },
  panel: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', ...shadow },
  chips: { gap: spacing.sm, padding: spacing.sm + 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm + 2, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  chipOn: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
  heading: { ...type.caption, fontFamily: fonts.bodyBold, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  results: { maxHeight: 340 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  rating: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
});
