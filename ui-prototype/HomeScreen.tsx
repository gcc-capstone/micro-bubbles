// Home: Bubbles as floating bubbles (few) or an Apple Watch-style honeycomb (many). Tapping one
// collapses them into a compact row under a full-bleed map; the selected Bubble's sheet sits on
// top of the row. Re-tapping the Bubbles tab (resetKey) returns to the bubble view.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Bubble, FloatingBubble, MapButton, Segmented } from './components';
import { colors, fonts, radius, shadow, spacing, type } from './theme';
import { ALL, distanceFromMe, formatMiles, Group, groupColor, GROUPS, initials, ME, memberColor } from './data';
import BubbleMap, { Focus } from './BubbleMap';

const RS = 44; // row bubble size
const GAP = 12;
const ROW_H = 78;
const SHEET_MIN = 66;
const SEARCH_H = 52;
const MAX_ROW = 11; // more than this many Bubbles shows a "More bubbles..." bubble
const TABS = ['Activity', 'Pins', 'Members'];
const SORTS: Record<string, string[]> = {
  Activity: ['All', 'Unread'],
  Pins: ['Top rated', 'Nearest'],
  Members: ['Nearest', 'A–Z', 'Recent'],
};

// Few Bubbles: hand-placed floating layout on a 375 x 560 canvas, sized by member count.
const CANVAS = { w: 375, h: 560 };
const CENTERS = [
  { x: 120, y: 115 },
  { x: 295, y: 110 },
  { x: 290, y: 270 },
  { x: 250, y: 420 },
  { x: 115, y: 315 },
  { x: 95, y: 470 },
];
const bubbleSize = (members: number) => Math.min(175, 40 + 30 * Math.sqrt(members));

// Many Bubbles: honeycomb rings around the center, bubbles shrink toward the edges.
const WATCH_S = 92;
const WATCH_D = 100; // center-to-center spacing
const hexLayout = (n: number) => {
  const out = [{ x: 0, y: 0 }];
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  for (let k = 1; out.length < n; k++) {
    const ring: { x: number; y: number }[] = [];
    let [q, r] = [-k, k];
    for (const [dq, dr] of dirs) for (let j = 0; j < k; j++) {
      ring.push({ x: WATCH_D * (q + r / 2), y: WATCH_D * (Math.sqrt(3) / 2) * r });
      q += dq;
      r += dr;
    }
    // a partly filled outer ring is spread evenly instead of bunching on one side
    const take = Math.min(ring.length, n - out.length);
    for (let j = 0; j < take; j++) out.push(ring[Math.floor((j * ring.length) / take)]);
  }
  return out;
};
const HEX = hexLayout(ALL.length);

const minutesAgo = (s: string) => (s === 'Now' ? 0 : parseInt(s, 10) * (s.includes('h') ? 60 : s.includes('d') ? 1440 : 1));

export default function HomeScreen({ resetKey, reduceMotion }: { resetKey: number; reduceMotion: boolean }) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [mode, setMode] = useState<'field' | 'animating' | 'row'>('field');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const [sort, setSort] = useState<Record<string, string>>({ Activity: 'All', Pins: 'Top rated', Members: 'Nearest' });
  const [query, setQuery] = useState('');
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [focus, setFocus] = useState<Focus | null>(null);
  const [toast, setToast] = useState('');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const p = useRef(new Animated.Value(0)).current;
  const sheetP = useRef(new Animated.Value(0)).current;
  const list = useRef<ScrollView>(null);
  const [listH, setListH] = useState(0);

  const { w, h } = size;
  const fieldTop = insets.top + 64;
  const watch = ALL.length > CENTERS.length;

  // Drag the honeycomb around (field mode only); taps still reach the bubbles.
  const offsetRef = useRef(offset);
  const dragStart = useRef(offset);
  const maxPan = WATCH_D * Math.ceil(Math.sqrt(ALL.length / 3));
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 8,
      onPanResponderGrant: () => (dragStart.current = offsetRef.current),
      onPanResponderMove: (_, g) => {
        const c = (v: number) => Math.max(-maxPan, Math.min(maxPan, v));
        offsetRef.current = { x: c(dragStart.current.x + g.dx), y: c(dragStart.current.y + g.dy) };
        setOffset(offsetRef.current);
      },
    }),
  ).current;

  // Where bubble i sits in the bubble view: center, size, and edge shrink.
  const fieldSpot = (i: number, g: Group) => {
    if (!watch) {
      const k = Math.min(w / CANVAS.w, (h - fieldTop - 8) / CANVAS.h);
      const c = CENTERS[i];
      return {
        x: (w - CANVAS.w * k) / 2 + c.x * k,
        y: fieldTop + (h - fieldTop - 8 - CANVAS.h * k) / 2 + c.y * k,
        s: bubbleSize(g.members.length) * k,
        scale: 1,
      };
    }
    const cx = w / 2;
    const cy = fieldTop + (h - fieldTop) / 2;
    const r0 = 0.3 * Math.min(w, h - fieldTop);
    let x = cx + HEX[i].x + offset.x;
    let y = cy + HEX[i].y + offset.y;
    const d = Math.hypot(x - cx, y - cy);
    const scale = d <= r0 ? 1 : Math.max(0.25, 1 - (d - r0) / (0.5 * Math.min(w, h - fieldTop)));
    // pull shrunken bubbles inward so the gaps close up, like the watch app grid
    x = cx + (x - cx) * (0.7 + 0.3 * scale);
    y = cy + (y - cy) * (0.7 + 0.3 * scale);
    return { x, y, s: WATCH_S, scale };
  };

  // Row shows up to MAX_ROW - 1 Bubbles (selected one always visible) plus "More bubbles...".
  const overflow = ALL.length > MAX_ROW;
  let rowIdx = ALL.map((_, i) => i).slice(0, overflow ? MAX_ROW - 1 : ALL.length);
  if (selected !== null && !rowIdx.includes(selected)) rowIdx = [...rowIdx.slice(0, -1), selected];

  const animate = (v: Animated.Value, to: number, duration: number, done?: () => void) => {
    if (reduceMotion) {
      v.setValue(to);
      done?.();
    } else {
      Animated.timing(v, { toValue: to, duration, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(() => done?.());
    }
  };

  const toggleSheet = (open: boolean) => {
    setSheetOpen(open);
    setQuery('');
    animate(sheetP, open ? 1 : 0, 300);
  };

  const select = (i: number) => {
    if (mode === 'row') {
      setFocus(null);
      if (i === selected) return toggleSheet(!sheetOpen);
      setSelected(i);
      return;
    }
    if (mode !== 'field') return;
    setSelected(i);
    setMode('animating');
    animate(p, 1, 600, () => setMode('row'));
  };

  const backToField = () => {
    toggleSheet(false);
    setFocus(null);
    setMode('animating');
    animate(p, 0, 600, () => {
      setMode('field');
      setSelected(null);
    });
  };

  useEffect(() => {
    if (resetKey && mode === 'row') backToField();
  }, [resetKey]);

  // Keep the search bar tucked above the list until the user pulls down (iOS convention).
  const hideSearch = () => list.current?.scrollTo({ y: SEARCH_H, animated: false });
  useEffect(() => {
    if (sheetOpen && !query) setTimeout(hideSearch, 50);
  }, [tab, sheetOpen, selected, listH]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const group: Group | null = selected === null ? null : ALL[selected];
  const color = group ? groupColor(group.id) : colors.primary;
  const sheetMax = (h - ROW_H - insets.top) * 0.8;
  const q = query.trim().toLowerCase();
  const match = (...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q));

  // Sheet rows for the current tab, after sort/filter and search.
  const activity = !group
    ? []
    : (group.id === 'everyone' ? GROUPS.map((g) => ({ ...g.activity[0], key: `${g.id}:0`, unread: g.unread > 0 })) : group.activity.map((a, i) => ({ ...a, key: `${group.id}:${i}`, unread: i < group.unread })))
        .map((a) => ({ ...a, unread: a.unread && !read[a.key] }))
        .filter((a) => (sort.Activity === 'Unread' ? a.unread : true) && match(a.text));
  const pins = !group
    ? []
    : group.pins
        .map((pin) => ({ ...pin, mi: distanceFromMe(pin.lat, pin.lng) }))
        .filter((pin) => match(pin.name, pin.note, pin.by))
        .sort((a, b) => (sort.Pins === 'Nearest' ? a.mi - b.mi : b.rating - a.rating));
  const members = !group
    ? []
    : group.members
        .map((m) => ({ ...m, mi: distanceFromMe(m.lat, m.lng) }))
        .filter((m) => match(m.name, m.place))
        .sort((a, b) =>
          sort.Members === 'A–Z' ? a.name.localeCompare(b.name) : sort.Members === 'Recent' ? minutesAgo(a.updated) - minutesAgo(b.updated) : a.mi - b.mi,
        );

  return (
    <View style={styles.fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* Full-bleed map, revealed as the bubble panel collapses */}
      {group && (
        <Animated.View style={[styles.mapArea, { opacity: p }]}>
          <BubbleMap
            members={group.members}
            places={group.places}
            pins={group.pins}
            color={color}
            focus={focus}
            topInset={insets.top}
            bottomInset={SHEET_MIN}
            onMemberPress={setFocus}
          />
          {/* Right-side controls, just above the sheet */}
          <Animated.View
            style={[styles.rightStack, { opacity: sheetP.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }, sheetOpen && styles.noTouch]}
          >
            <MapButton icon="locate" onPress={() => setFocus({ name: 'You', lat: ME.lat, lng: ME.lng })} />
            <Pressable style={styles.fab} onPress={() => showToast("Drop Pin isn't built yet in the prototype")}>
              <Ionicons name="add" size={28} color={colors.surface} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}

      {/* Sheet, resting on top of the row */}
      {group && w > 0 && (
        <Animated.View
          style={[styles.sheet, { opacity: p, height: sheetP.interpolate({ inputRange: [0, 1], outputRange: [SHEET_MIN, sheetMax] }) }]}
        >
          <Pressable onPress={() => toggleSheet(!sheetOpen)} style={styles.sheetHeader}>
            <View style={styles.handle} />
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Bubble size={22} tint={color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{group.name}</Text>
                <Text numberOfLines={1} style={type.caption}>
                  {group.members.length} members · {group.places.map((pl) => pl.name).join(', ')}
                </Text>
              </View>
              <Ionicons name={sheetOpen ? 'chevron-down' : 'chevron-up'} size={20} color={colors.textMuted} />
            </View>
          </Pressable>
          <View style={{ paddingHorizontal: spacing.md }}>
            <Segmented options={TABS} value={tab} onChange={setTab} />
          </View>
          {/* Sort / filter bar, always visible */}
          <View style={styles.sortBar}>
            {SORTS[tab].map((o) => (
              <Pressable key={o} onPress={() => setSort({ ...sort, [tab]: o })} style={[styles.sortChip, sort[tab] === o && styles.sortChipOn]}>
                <Text style={[styles.sortText, sort[tab] === o && { color: colors.primary }]}>{o}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView
            ref={list}
            onLayout={(e) => setListH(e.nativeEvent.layout.height)}
            contentContainerStyle={[styles.sheetBody, { minHeight: listH + SEARCH_H }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hidden until pulled down */}
            <View style={styles.searchWrap}>
              <View style={styles.search}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={`Search ${tab.toLowerCase()}`}
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                />
              </View>
            </View>

            {tab === 'Activity' &&
              activity.map((a, i) => (
                <Pressable key={a.key} onPress={() => setRead({ ...read, [a.key]: true })} style={[styles.listRow, i > 0 && styles.divider, a.unread && styles.unread]}>
                  <View style={[styles.iconCircle, { backgroundColor: color + '1F' }]}>
                    <Ionicons name={a.icon} size={18} color={color} />
                  </View>
                  <Text style={[type.body, { flex: 1 }, a.unread && { fontFamily: fonts.bodyBold }]}>{a.text}</Text>
                  <Text style={type.caption}>{a.time}</Text>
                  {a.unread && <View style={styles.unreadDot} />}
                </Pressable>
              ))}

            {tab === 'Pins' &&
              pins.map((pin, i) => (
                <Pressable
                  key={pin.name}
                  style={[styles.listRow, i > 0 && styles.divider]}
                  onPress={() => {
                    setFocus(pin);
                    toggleSheet(false);
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: color + '1F' }]}>
                    <Ionicons name={pin.icon} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.rowTitle}>{pin.name}</Text>
                    <View style={styles.row}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Ionicons key={n} name={n <= pin.rating ? 'star' : 'star-outline'} size={12} color={colors.primary} />
                      ))}
                      <Text style={[type.caption, { marginLeft: spacing.xs }]}>by {pin.by}</Text>
                    </View>
                    <Text style={type.caption}>{pin.note}</Text>
                  </View>
                  <Text style={type.caption}>{formatMiles(pin.mi)}</Text>
                </Pressable>
              ))}

            {tab === 'Members' &&
              members.map((m, i) => (
                <Pressable
                  key={m.name}
                  style={[styles.listRow, i > 0 && styles.divider]}
                  onPress={() => {
                    setFocus(m);
                    toggleSheet(false);
                  }}
                >
                  <Avatar color={memberColor(m.name)} initials={initials(m.name)} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{m.name}</Text>
                    <View style={[styles.row, { gap: 4 }]}>
                      {m.moving && <Ionicons name="navigate" size={11} color={colors.primary} />}
                      <Text style={type.caption}>{m.place}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.distance}>{formatMiles(m.mi)}</Text>
                    <Text style={type.caption}>{m.updated}</Text>
                  </View>
                </Pressable>
              ))}

            {((tab === 'Activity' && !activity.length) || (tab === 'Pins' && !pins.length) || (tab === 'Members' && !members.length)) && (
              <Text style={[type.caption, { paddingVertical: spacing.md }]}>Nothing here.</Text>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* Bubble panel: full screen in the bubble view, shrinks into the row strip */}
      <Animated.View
        style={[
          styles.panel,
          {
            height: p.interpolate({ inputRange: [0, 1], outputRange: [h || 1, ROW_H] }),
            backgroundColor: p.interpolate({ inputRange: [0, 1], outputRange: [colors.primarySoft, colors.surface] }),
          },
        ]}
      />

      {/* Bubbles that fly into the row */}
      {mode !== 'row' && w > 0 && (
        <View style={StyleSheet.absoluteFill} {...(watch && mode === 'field' ? pan.panHandlers : {})}>
          {ALL.map((g, i) => {
            const f = fieldSpot(i, g);
            const slot = rowIdx.includes(i) ? rowIdx.indexOf(i) : MAX_ROW - 1;
            const rx = spacing.md + slot * (RS + GAP) + RS / 2;
            const ry = h - ROW_H + spacing.sm + RS / 2;
            return (
              <Animated.View
                key={g.id}
                style={{
                  position: 'absolute',
                  width: f.s,
                  height: f.s,
                  transform: [
                    { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [f.x - f.s / 2, rx - f.s / 2] }) },
                    { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [f.y - f.s / 2, ry - f.s / 2] }) },
                    { scale: p.interpolate({ inputRange: [0, 1], outputRange: [f.scale, RS / f.s] }) },
                  ],
                }}
              >
                <FloatingBubble
                  size={f.s}
                  tint={groupColor(g.id)}
                  label={g.name}
                  sublabel={`${g.members.length} ${g.id === 'everyone' ? 'people' : 'members'}`}
                  count={g.unread}
                  delay={i * 500}
                  still={reduceMotion || watch}
                  onPress={() => select(i)}
                  style={{ left: 0, top: 0 }}
                />
              </Animated.View>
            );
          })}
        </View>
      )}
      {mode !== 'row' && (
        <Animated.Text style={[type.largeTitle, styles.title, { top: insets.top + spacing.sm, opacity: p.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] }) }]}>
          Your Bubbles
        </Animated.Text>
      )}

      {/* Compact scrollable row once collapsed */}
      {mode === 'row' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll} contentContainerStyle={styles.rowContent}>
          {rowIdx.map((i) => {
            const g = ALL[i];
            return (
              <Pressable key={g.id} onPress={() => select(i)} style={styles.rowItem}>
                <Bubble size={RS} tint={groupColor(g.id)}>
                  {g.id === 'everyone' && <Ionicons name="people" size={18} color={groupColor(g.id)} />}
                </Bubble>
                {g.unread > 0 && <Badge count={g.unread} style={styles.rowBadge} />}
                <Text numberOfLines={1} style={[styles.rowLabel, i === selected && { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                  {g.name}
                </Text>
              </Pressable>
            );
          })}
          {overflow && (
            <Pressable onPress={backToField} style={styles.rowItem}>
              <Bubble size={RS} tint={colors.textMuted}>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
              </Bubble>
              <Text numberOfLines={1} style={styles.rowLabel}>More bubbles...</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {toast !== '' && (
        <View style={[styles.toast, { top: insets.top + 64 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  noTouch: { pointerEvents: 'none' },
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: ROW_H },
  rightStack: { position: 'absolute', right: spacing.sm + 4, bottom: SHEET_MIN + spacing.sm + 4, alignItems: 'center', gap: spacing.sm + 4 },
  fab: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
  title: { position: 'absolute', left: spacing.md, pointerEvents: 'none' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: ROW_H,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
    ...shadow,
  },
  sheetHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.sm },
  sheetTitle: { fontFamily: fonts.subheading, fontSize: 17, color: colors.text },
  sortBar: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sortChip: { paddingHorizontal: spacing.sm + 4, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  sortChipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  sortText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted },
  sheetBody: { paddingBottom: spacing.md },
  searchWrap: { height: SEARCH_H, justifyContent: 'center', paddingHorizontal: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 2, height: 36 },
  searchInput: { ...type.body, flex: 1, padding: 0 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  unread: { backgroundColor: colors.primarySoft },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  distance: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowScroll: { position: 'absolute', left: 0, right: 0, bottom: 0, height: ROW_H, borderTopWidth: 1, borderTopColor: colors.border },
  rowContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: GAP },
  rowItem: { width: RS, alignItems: 'center' },
  rowBadge: { position: 'absolute', right: -6, top: -4, transform: [{ scale: 0.8 }] },
  rowLabel: { ...type.caption, fontSize: 11, marginTop: 3, width: RS + GAP - 2, textAlign: 'center' },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toastText: { color: colors.surface, fontFamily: fonts.bodyBold, fontSize: 13 },
});
