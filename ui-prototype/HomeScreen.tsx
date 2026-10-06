// Home: opens on the map of Everyone within your radius. The Bubble row pages along the bottom;
// the selected Bubble's sheet sits on top of it, with people and pins as sub-views inside the sheet.
// Re-tapping the Bubbles tab (resetKey) or "More bubbles..." shows all Bubbles as floating
// bubbles (few) or an Apple Watch-style honeycomb (many).
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, PanResponder, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Bubble, FloatingBubble, IconName, MapButton, MenuButton, Segmented, Separator } from './components';
import { colors, fonts, radius, shadow, spacing, type } from './theme';
import { ALL, avgRating, BubbleEvent, distanceFromMe, EVENTS, EVERYONE, formatMiles, Group, groupColor, GROUPS, initials, joinCode, ME, Member, memberColor, Pin, TODAY } from './data';
import { BubbleProfile, DropPin, EventView, longDate, PersonView, PinView } from './Details';
import BubbleMap, { Focus } from './BubbleMap';

const RS = 44; // row bubble size
const ROW_ITEM_MIN = 68; // narrowest slot per bubble; slots stretch so each page shows whole bubbles
const ROW_H = 8 + RS + 4 + 16 + 8; // padding + bubble + gap + one-line label + padding
const ROW_GROW = 1.3; // bubbles scale up while the row has focus
const ROW_H_FOCUS = ROW_H + RS * (ROW_GROW - 1) + 2;
const SHEET_MIN = 66;
const SEARCH_H = 52;
const MAX_ROW = 11; // more than this many Bubbles shows a "More bubbles..." bubble
const TABS = ['Activity', 'Pins', 'Members'];
const SORTS: Record<string, string[]> = {
  Activity: ['Newest', 'Oldest'],
  Pins: ['Top rated', 'Nearest', 'A–Z'],
  Members: ['Nearest', 'A–Z', 'Recently updated'],
};
const FILTERS: Record<string, string[]> = {
  Activity: ['Unread', 'Arrivals & departures', 'Pins', 'Events'],
  Pins: ['4.5+ stars', 'Pinned by me', 'Within 10 mi'],
  Members: ['Moving now', 'Within 1 mi', 'Updated in the last hour'],
};
const ACTIVITY_KIND: Record<string, string[]> = {
  'Arrivals & departures': ['enter-outline', 'exit-outline'],
  Pins: ['pin-outline'],
  Events: ['calendar-outline'],
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

// Layout used when there are many Bubbles. 'stream' = horizontal, endlessly scrolling band of
// bubbles; 'honeycomb' = Apple Watch-style grid (kept for comparison, switch back here).
const MANY_LAYOUT: 'stream' | 'honeycomb' = 'stream';
const STREAM_D = 80; // horizontal spacing between stream bubbles
// Stable pseudo-random 0..1 per index, so bubbles look scattered but don't jump between renders.
const jitter = (i: number, seed: number) => {
  const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const MENU_ICONS: Record<string, IconName> = {
  'Bubble Info': 'information-circle-outline',
  'Edit Bubble': 'create-outline',
  'Add Members': 'person-add-outline',
  'Mute Notifications': 'notifications-off-outline',
  'Unmute Notifications': 'notifications-outline',
  'Leave Bubble': 'exit-outline',
};

const eventKey = (e: BubbleEvent) => `${e.groupId}|${e.date}|${e.title}`;
const clockMinutes = (t: string) => {
  const [hm, ap] = t.split(' ');
  const [hh, mm] = hm.split(':').map(Number);
  return ((hh % 12) + (ap === 'PM' ? 12 : 0)) * 60 + mm;
};
const isoPlus = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(y, m - 1, d + days);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};
const dayLabel = (iso: string) => (iso === TODAY ? 'Today' : iso === isoPlus(TODAY, 1) ? 'Tomorrow' : longDate(iso).split(',')[0]);

const minutesAgo = (s: string) =>
  s === 'Now' ? 0 : parseInt(s, 10) * (s.includes('h') ? 60 : s.includes('d') ? 1440 : s.includes('w') ? 10080 : 1);

export default function HomeScreen({ resetKey, reduceMotion, everyoneRadius }: { resetKey: number; reduceMotion: boolean; everyoneRadius: number }) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Start on the map with Everyone selected.
  const [selected, setSelected] = useState<number | null>(0);
  const [mode, setMode] = useState<'field' | 'animating' | 'row'>('row');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const [sort, setSort] = useState<Record<string, string>>({ Activity: 'Newest', Pins: 'Top rated', Members: 'Nearest' });
  const [filters, setFilters] = useState<Record<string, string[]>>({ Activity: [], Pins: [], Members: [] });
  const [sub, setSub] = useState<{ person?: Member; pin?: Pin; event?: BubbleEvent } | null>(null); // sheet sub-view
  const [profileOpen, setProfileOpen] = useState<false | 'view' | 'edit'>(false);
  const [muted, setMuted] = useState<Record<string, boolean>>({});

  const [dropOpen, setDropOpen] = useState(false);
  const [, setTick] = useState(0); // re-render after in-memory edits (drop pin, edit/leave Bubble)
  const refresh = () => setTick((t) => t + 1);
  const [query, setQuery] = useState('');
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [focus, setFocus] = useState<Focus | null>(null);
  const [toast, setToast] = useState('');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const p = useRef(new Animated.Value(1)).current;
  const sheetP = useRef(new Animated.Value(0)).current;
  const rowP = useRef(new Animated.Value(0)).current; // 1 = row has focus (taller)
  const rowH = rowP.interpolate({ inputRange: [0, 1], outputRange: [ROW_H, ROW_H_FOCUS] });
  const tabX = useRef(new Animated.Value(0)).current; // slide for tab switches
  const tabO = useRef(new Animated.Value(1)).current;
  const subX = useRef(new Animated.Value(0)).current; // slide for person/pin push and back
  const subO = useRef(new Animated.Value(1)).current;
  const rowFocused = useRef(false);
  const rowTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
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
        offsetRef.current =
          MANY_LAYOUT === 'stream'
            ? { x: dragStart.current.x + g.dx, y: 0 } // horizontal only, endless
            : { x: c(dragStart.current.x + g.dx), y: c(dragStart.current.y + g.dy) };
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
    if (MANY_LAYOUT === 'stream') {
      // Band vertically centered in the free space; x wraps around so the stream never ends.
      const cy = fieldTop + (h - fieldTop) / 2;
      const band = Math.min(380, (h - fieldTop) * 0.7);
      const total = ALL.length * STREAM_D;
      const raw = i * STREAM_D + (jitter(i, 1) - 0.5) * 30 + offset.x + w * 0.2;
      const x = ((((raw + STREAM_D) % total) + total) % total) - STREAM_D;
      const y = cy + (i % 2 ? 1 : -1) * (0.15 + jitter(i, 2) * 0.35) * band; // alternate above/below so neighbors don't collide
      // Bubbles grow toward the middle and shrink as they leave either side.
      const edge = Math.min(x, w - x);
      const scale = Math.max(0.25, Math.min(1, (edge + 20) / (w * 0.22)));
      return { x, y, s: Math.min(140, bubbleSize(g.members.length) * 0.85), scale };
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
  const perPage = Math.max(4, Math.floor(w / ROW_ITEM_MIN));
  const grow = {
    scale: rowP.interpolate({ inputRange: [0, 1], outputRange: [1, ROW_GROW] }),
    lift: rowP.interpolate({ inputRange: [0, 1], outputRange: [0, (RS * (ROW_GROW - 1)) / 2] }), // keep the top edge in place
    gap: rowP.interpolate({ inputRange: [0, 1], outputRange: [4, 4 + RS * (ROW_GROW - 1)] }),
  };
  const itemW = w / perPage;
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

  const toggleSheetRef = useRef((_: boolean) => {});
  const toggleSheet = (open: boolean) => {
    setSheetOpen(open);
    setQuery('');
    animate(sheetP, open ? 1 : 0, 300);
  };

  toggleSheetRef.current = toggleSheet;

  const select = (i: number) => {
    if (mode === 'row') {
      setFocus(null);
      setSub(null);
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

  const base: Group | null = selected === null ? null : ALL[selected];
  const group = base;

  // Upcoming events (next 7 days) for the selected Bubble, pinned on the map; one per place.
  const weekOut = isoPlus(TODAY, 7);
  const upcoming = group
    ? EVENTS.filter((e) => (group.id === 'everyone' || e.groupId === group.id) && e.date >= TODAY && e.date <= weekOut)
        .sort((a, b) => a.date.localeCompare(b.date) || clockMinutes(a.time) - clockMinutes(b.time))
        .filter((e, i, all) => all.findIndex((x) => x.place === e.place) === i)
    : [];
  const mapEvents = upcoming.map((e) => ({ key: eventKey(e), title: e.title, when: `${dayLabel(e.date)} · ${e.time}`, color: groupColor(e.groupId), lat: e.lat, lng: e.lng }));
  const openEvent = (key: string) => {
    const e = upcoming.find((x) => eventKey(x) === key)!;
    setFocus({ name: e.title, lat: e.lat, lng: e.lng });
    slideIn(subX, subO, 1);
    setSub({ event: e });
    toggleSheet(true);
  };
  const color = group ? groupColor(group.id) : colors.primary;
  const sheetMax = (h - ROW_H - insets.top) * 0.8;
  const q = query.trim().toLowerCase();
  const match = (...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q));
  const has = (f: string) => filters[tab].includes(f);
  const toggleFilter = (f: string) =>
    setFilters({ ...filters, [tab]: has(f) ? filters[tab].filter((x) => x !== f) : [...filters[tab], f] });
  // Row grows while touched/scrolled; shrinks on touches elsewhere or after a pause.
  const focusRow = (on: boolean) => {
    clearTimeout(rowTimer.current);
    if (on) rowTimer.current = setTimeout(() => focusRow(false), 4000);
    if (on === rowFocused.current) return;
    rowFocused.current = on;
    animate(rowP, on ? 1 : 0, 220);
  };

  // Page switches slide in from the side they come from (crossfade only with reduced motion).
  const slideIn = (x: Animated.Value, o: Animated.Value, dir: number) => {
    x.setValue(reduceMotion ? 0 : dir * 60);
    o.setValue(0);
    Animated.parallel([
      Animated.timing(x, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(o, { toValue: 1, duration: 220, useNativeDriver: false }),
    ]).start();
  };
  const switchTab = (t: string) => {
    if (t === tab) return;
    slideIn(tabX, tabO, TABS.indexOf(t) > TABS.indexOf(tab) ? 1 : -1);
    setTab(t);
  };
  const closeSub = () => {
    slideIn(subX, subO, -1);
    setSub(null);
    setFocus(null);
  };

  // Bubble "..." menu: info, edit, invite, mute, leave. Everyone only has info.
  const isMuted = !!(base && muted[base.id]);
  const bubbleMenu =
    base?.id === 'everyone'
      ? ['Bubble Info']
      : ['Bubble Info', 'Edit Bubble', 'Add Members', isMuted ? 'Unmute Notifications' : 'Mute Notifications', 'Leave Bubble'];
  const leaveGroup = () => {
    // ponytail: removes from the in-memory lists only
    const g = base!;
    GROUPS.splice(GROUPS.indexOf(g), 1);
    ALL.splice(ALL.indexOf(g), 1);
    setProfileOpen(false);
    setSelected(0);
    showToast(`You left ${g.name}`);
  };
  const onBubbleMenu = (o: string) => {
    const g = base!;
    if (o === 'Bubble Info') setProfileOpen('view');
    if (o === 'Edit Bubble') setProfileOpen('edit');
    if (o === 'Add Members') Share.share({ message: `Join ${g.name} on Bubbles with code ${joinCode(g.id)}` });
    if (o.endsWith('Notifications')) {
      setMuted({ ...muted, [g.id]: !isMuted });
      showToast(isMuted ? `Notifications on for ${g.name}` : `Muted ${g.name}`);
    }
    if (o === 'Leave Bubble')
      Alert.alert(`Leave ${g.name}?`, 'Members will stop seeing your location, pins and photos.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: leaveGroup },
      ]);
  };

  const openPerson = (m: Member) => {
    setFocus(m);
    slideIn(subX, subO, 1);
    setSub({ person: m });
    toggleSheet(true);
  };
  const openPin = (pn: Pin) => {
    setFocus(pn);
    slideIn(subX, subO, 1);
    setSub({ pin: pn });
    toggleSheet(true);
  };

  // Header drag: down collapses, up expands (the grabber replaces the old chevron).
  const headerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderRelease: (_, g) => {
        if (g.dy > 30) toggleSheetRef.current(false);
        if (g.dy < -30) toggleSheetRef.current(true);
      },
    }),
  ).current;

  // Sheet rows for the current tab, after sort/filter and search.
  const activity = !group
    ? []
    : (group.id === 'everyone'
        ? GROUPS.flatMap((g) => g.activity.map((a, i) => ({ ...a, key: `${g.id}:${i}`, unread: i < g.unread })))
        : group.activity.map((a, i) => ({ ...a, key: `${group.id}:${i}`, unread: i < group.unread })))
        .map((a) => ({ ...a, unread: a.unread && !read[a.key] }))
        .filter((a) => match(a.text))
        .filter((a) => !has('Unread') || a.unread)
        .filter((a) => {
          const kinds = filters.Activity.filter((f) => ACTIVITY_KIND[f]);
          return !kinds.length || kinds.some((f) => ACTIVITY_KIND[f].includes(a.icon));
        });
  activity.sort((a, b) => minutesAgo(a.time) - minutesAgo(b.time)); // newest first, across Bubbles
  if (sort.Activity === 'Oldest') activity.reverse();
  const pins = !group
    ? []
    : group.pins
        .map((pin) => ({ ...pin, mi: distanceFromMe(pin.lat, pin.lng) }))
        .filter((pin) => match(pin.name, pin.note, pin.by))
        .filter((pin) => (!has('4.5+ stars') || avgRating(pin) >= 4.5) && (!has('Pinned by me') || pin.by === 'You') && (!has('Within 10 mi') || pin.mi <= 10))
        .sort((a, b) => (sort.Pins === 'Nearest' ? a.mi - b.mi : sort.Pins === 'A–Z' ? a.name.localeCompare(b.name) : avgRating(b) - avgRating(a)));
  const members = !group
    ? []
    : group.members
        .map((m) => ({ ...m, mi: distanceFromMe(m.lat, m.lng) }))
        .filter((m) => match(m.name, m.place))
        .filter((m) => (!has('Moving now') || m.moving) && (!has('Within 1 mi') || m.mi <= 1) && (!has('Updated in the last hour') || minutesAgo(m.updated) < 60))
        .sort((a, b) =>
          sort.Members === 'A–Z' ? a.name.localeCompare(b.name) : sort.Members === 'Recently updated' ? minutesAgo(a.updated) - minutesAgo(b.updated) : a.mi - b.mi,
        );

  return (
    <View style={styles.fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* Full-bleed map, revealed as the bubble panel collapses */}
      {group && (
        <Animated.View style={[styles.mapArea, { opacity: p, bottom: rowH }]} onTouchStart={() => focusRow(false)}>
          <BubbleMap
            members={group.members}
            places={group.places}
            pins={group.pins}
            color={color}
            focus={focus}
            topInset={insets.top}
            bottomInset={SHEET_MIN}
            onMemberPress={openPerson}
            onPinPress={openPin}
            radiusMi={group.id === 'everyone' ? everyoneRadius : undefined}
            events={mapEvents}
            onEventPress={openEvent}
          />
          {/* Right-side controls, just above the sheet */}
          <Animated.View
            style={[styles.rightStack, { opacity: sheetP.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }, sheetOpen && styles.noTouch]}
          >
            <MapButton icon="locate" onPress={() => setFocus({ name: 'You', lat: ME.lat, lng: ME.lng })} />
            <Pressable style={styles.fab} onPress={() => setDropOpen(true)}>
              <Ionicons name="add" size={30} color={colors.primary} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}

      {/* Sheet, resting on top of the row */}
      {group && w > 0 && (
        <Animated.View
          style={[
            styles.sheet,
            { opacity: p, bottom: rowH, height: sheetP.interpolate({ inputRange: [0, 1], outputRange: [SHEET_MIN, sheetMax] }) },
            sub && { backgroundColor: colors.background }, // grabber area matches the sub-view
          ]}
          onTouchStart={() => focusRow(false)}
        >
          <Animated.View style={{ flex: 1, opacity: subO, transform: [{ translateX: subX }] }}>
          {sub ? (
            <>
              {/* Sub-view: a person or pin, with its own back button */}
              <View {...headerPan.panHandlers}>
                <Pressable onPress={() => toggleSheet(!sheetOpen)} style={styles.sheetHeader}>
                  <View style={styles.handle} />
                  <Pressable onPress={closeSub} hitSlop={10} style={[styles.row, { gap: 2 }]}>
                    <Ionicons name="chevron-back" size={22} color={colors.primary} />
                    <Text style={styles.back}>{group.name}</Text>
                  </Pressable>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
                {sub.person && <PersonView member={sub.person} onShowOnMap={(m) => { setFocus(m); toggleSheet(false); }} />}
                {sub.event && <EventView event={sub.event} />}
                {sub.pin && (
                  <PinView
                    pin={sub.pin}
                    groupName={GROUPS.find((g) => g.pins.some((x) => x.name === sub.pin?.name))?.name ?? group.name}
                    color={color}
                    onShowOnMap={(pn) => { setFocus(pn); toggleSheet(false); }}
                  />
                )}
              </ScrollView>
            </>
          ) : (
          <>
          <View {...headerPan.panHandlers}>
          <Pressable onPress={() => toggleSheet(!sheetOpen)} style={styles.sheetHeader}>
            <View style={styles.handle} />
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Bubble size={22} tint={color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{group.name}</Text>
                <Text numberOfLines={1} style={type.caption}>
                  {`${group.members.length} ${group.id === 'everyone' ? 'people' : 'members'} · ${
                    group.members.filter((m) => distanceFromMe(m.lat, m.lng) <= everyoneRadius).length
                  } within ${everyoneRadius} mi`}
                </Text>
              </View>
              <MenuButton
                plain
                icon="ellipsis-horizontal-circle-outline"
                options={bubbleMenu}
                icons={MENU_ICONS}
                destructive={['Leave Bubble']}
                onSelect={onBubbleMenu}
              />
            </View>
          </Pressable>
          </View>
          <View style={{ paddingHorizontal: spacing.md }}>
            <Segmented options={TABS} value={tab} onChange={switchTab} />
          </View>
          <Animated.View style={{ flex: 1, opacity: tabO, transform: [{ translateX: tabX }] }}>
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

            {/* Sort and filter menus, below the hidden search */}
            <View style={styles.toolbar}>
              <Text style={[type.caption, { flex: 1 }]}>
                {tab === 'Activity' ? `${activity.length} updates` : tab === 'Pins' ? `${pins.length} pins` : `${members.length} members`}
              </Text>
              <MenuButton icon="swap-vertical" label={sort[tab]} options={SORTS[tab]} selected={[sort[tab]]} onSelect={(o) => setSort({ ...sort, [tab]: o })} />
              <MenuButton
                icon={filters[tab].length ? 'funnel' : 'funnel-outline'}
                label={filters[tab].length ? `${filters[tab].length}` : undefined}
                options={FILTERS[tab]}
                selected={filters[tab]}
                onSelect={toggleFilter}
                multi
                active={filters[tab].length > 0}
              />
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
                  onPress={() => openPin(pin)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: color + '1F' }]}>
                    <Ionicons name={pin.icon} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.rowTitle}>{pin.name}</Text>
                    <Text numberOfLines={1} style={type.caption}>{pin.note}</Text>
                    <Text style={type.caption}>by {pin.by}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[styles.row, { gap: 2 }]}>
                      <Text style={styles.distance}>{avgRating(pin).toFixed(1)}</Text>
                      <Ionicons name="star" size={13} color={colors.primary} />
                    </View>
                    <Text style={type.caption}>{formatMiles(pin.mi)}</Text>
                  </View>
                </Pressable>
              ))}

            {tab === 'Members' &&
              members.map((m, i) => (
                <Pressable
                  key={m.name}
                  style={[styles.listRow, i > 0 && styles.divider]}
                  onPress={() => openPerson(m)}
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
              <Text style={[type.caption, { padding: spacing.md }]}>
                Nothing here.
              </Text>
            )}
          </ScrollView>
          </Animated.View>
          </>
          )}
          </Animated.View>
        </Animated.View>
      )}

      {/* Bubble panel: full screen in the bubble view, shrinks into the row strip */}
      <Animated.View
        style={[
          styles.panel,
          {
            height: Animated.add(p.interpolate({ inputRange: [0, 1], outputRange: [(h || 1) - ROW_H, 0] }), rowH),
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
            const rx = slot * itemW + itemW / 2;
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
                  still={reduceMotion}
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
          All Bubbles
        </Animated.Text>
      )}

      {/* Compact scrollable row once collapsed */}
      {mode === 'row' && (
        <Animated.View style={[styles.rowWrap, { height: rowH }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
          onTouchStart={() => focusRow(true)}
          onScrollBeginDrag={() => focusRow(true)}
        >
          {rowIdx.map((i) => {
            const g = ALL[i];
            return (
              <Pressable key={g.id} onPress={() => select(i)} style={[styles.rowItem, { width: itemW }]}>
                <Animated.View style={{ transform: [{ translateY: grow.lift }, { scale: grow.scale }] }}>
                  <Bubble size={RS} tint={groupColor(g.id)}>
                    {g.id === 'everyone' && <Ionicons name="people" size={18} color={groupColor(g.id)} />}
                  </Bubble>
                  {g.unread > 0 && <Badge count={g.unread} style={styles.rowBadge} />}
                </Animated.View>
                <Animated.Text
                  numberOfLines={1}
                  style={[styles.rowLabel, { marginTop: grow.gap }, i === selected && { color: colors.primary, fontFamily: fonts.bodyBold }]}
                >
                  {g.name}
                </Animated.Text>
              </Pressable>
            );
          })}
          {overflow && (
            <Pressable onPress={backToField} style={[styles.rowItem, { width: itemW }]}>
              <Animated.View style={{ transform: [{ translateY: grow.lift }, { scale: grow.scale }] }}>
                <Bubble size={RS} tint={colors.textMuted}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                </Bubble>
              </Animated.View>
              <Animated.Text numberOfLines={1} style={[styles.rowLabel, { marginTop: grow.gap }]}>More bubbles...</Animated.Text>
            </Pressable>
          )}
        </ScrollView>
        </Animated.View>
      )}

      {profileOpen && (
        <BubbleProfile group={group} startEditing={profileOpen === 'edit'} onClose={() => setProfileOpen(false)} onChanged={refresh} onLeave={leaveGroup} />
      )}
      <DropPin
        visible={dropOpen}
        groups={GROUPS}
        initialGroupId={group?.id}
        onClose={() => setDropOpen(false)}
        onDrop={(pin, groupId, notify) => {
          const g = GROUPS.find((x) => x.id === groupId)!;
          g.pins.unshift(pin);
          EVERYONE.pins.unshift(pin);
          g.activity.unshift({ icon: 'pin-outline', text: `You pinned ${pin.name}${notify ? ' and notified members' : ''}`, time: 'Now' });
          setDropOpen(false);
          setSelected(ALL.indexOf(g));
          setFocus(pin);
          showToast(`Pinned ${pin.name} in ${g.name}`);
        }}
      />

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
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0 },
  rightStack: { position: 'absolute', right: spacing.sm + 4, bottom: SHEET_MIN + spacing.sm + 4, alignItems: 'center', gap: spacing.sm + 4 },
  fab: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
  title: { position: 'absolute', left: spacing.md, pointerEvents: 'none' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
    ...shadow,
  },
  sheetHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.sm },
  sheetTitle: { fontFamily: fonts.subheading, fontSize: 17, color: colors.text },
  back: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sheetBody: { paddingBottom: spacing.md },
  searchWrap: { height: SEARCH_H, justifyContent: 'center', paddingHorizontal: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 2, height: 36 },
  searchInput: { ...type.body, flex: 1, padding: 0 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  unread: { backgroundColor: colors.primarySoft },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  distance: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderTopColor: colors.border },
  rowContent: { paddingTop: spacing.sm },
  rowItem: { alignItems: 'center' },
  rowBadge: { position: 'absolute', right: -8, top: -6, transform: [{ scale: 0.8 }] },
  rowLabel: { ...type.caption, fontSize: 11, lineHeight: 16, width: '92%', textAlign: 'center' },
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
