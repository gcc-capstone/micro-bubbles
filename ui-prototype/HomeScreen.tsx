// Home: opens on the map of Everyone within your radius. The Bubble row pages along the bottom;
// the selected Bubble's sheet sits on top of it, with people and pins as sub-views inside the sheet.
// Re-tapping the Bubbles tab (resetKey) or "More Bubbles…" shows all Bubbles as floating
// bubbles (few) or an Apple Watch-style honeycomb (many).
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Bubble, FloatingBubble, GlassTabs, IconName, MapButton, MenuAnchor, MenuButton, PopMenu, Separator } from './components';
import { colors, CONTROL, CONTROL_SLOP, FIXED_TEXT, fonts, radius, shadow, spacing, type } from './theme';
import { ALL, avgRating, canInvite, ownerName, BubbleEvent, distanceFromMe, EVENTS, EVERYONE, formatMiles, Group, groupColor, GROUPS, initials, Loc, Member, memberColor, meters, Pin, TODAY } from './data';
import { AddMembers, BubbleProfile, DropPin, NewHotspot, EventView, NewBubble, NewEvent, LinkedText, LocationView, longDate, PersonView, PinView, QuickMessages } from './Details';
import BubbleMap, { Focus } from './BubbleMap';
import MapSearch from './MapSearch';

const RS = 36; // row bubble size
const ROW_ITEM_MIN = 60; // 6 per page on a 360 pt phone // narrowest slot per bubble; slots stretch so each page shows whole bubbles
const ROW_H = 6 + RS + 3 + 14 + 6; // padding + bubble + gap + one-line label + padding (the sheet header names the selected Bubble in full)
const NAV_H = 44; // nav row above the large title
const ROW_GROW = 1.3; // bubbles scale up while the row has focus
const ROW_H_FOCUS = ROW_H + RS * (ROW_GROW - 1) + 2;
const SHEET_MIN = 80; // grabber + Bubble name + who's nearby
const NEARBY_MI = 1; // walking distance: "nearby" for a Bubble's sheet
const FEED_H = CONTROL; // activity pill above the sheet, same height as the map buttons
const RECENT_HOURS = 6; // the pill and its list cover this window...
const RECENT_MIN = 3; // ...but always show at least this many items
const PERSON_H = 250; // compact person card; quick messages float above it (like Life360)
const NOTES_H = 44; // the floating quick-message row
const MAX_BUBBLES = 15; // including Everyone; two All Bubbles screens hold them all
const FIRST_SCREEN = 5; // most recently active Bubbles shown up front, after Everyone
const SEARCH_H = 52;
const TOOLBAR_H = 44; // count + sort/filter row; tucked away with the search bar until you pull down
const HIDDEN_H = SEARCH_H + TOOLBAR_H;
const MAX_ROW = 11; // more than this many Bubbles shows a "More Bubbles…" bubble
const TABS = ['Members', 'Hotspots', 'Pins']; // activity lives in the pill above the sheet
const SORTS: Record<string, string[]> = {
  Hotspots: ['Nearest', 'A–Z', 'Most people'],
  Pins: ['Top rated', 'Nearest', 'A–Z'],
  Members: ['Last active', 'Nearest', 'A–Z'],
};
const FILTERS: Record<string, string[]> = {
  Hotspots: ['Alerts on', 'Someone there now'],
  Pins: ['4.5+ stars', 'Pinned by me', 'Within 10 mi'],
  Members: ['Moving now', 'Within 1 mi', 'Updated in the last hour'],
};

// First screen (Everyone + the most recently active Bubbles, then "More Bubbles…"): hand-placed floating layout
// on a 375 x 640 canvas, sized by member count.
const CANVAS = { w: 375, h: 640 };
const CENTERS = [
  { x: 120, y: 110 },
  { x: 290, y: 105 },
  { x: 285, y: 265 },
  { x: 110, y: 300 },
  { x: 260, y: 430 },
  { x: 95, y: 480 },
  { x: 275, y: 575 },
];
const FOLDER_S = 110; // folder bubble size on the first screen (canvas units)
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

// Create actions the app's + tab can ask for.
let handledCreate = 0;
export type CreateKind = 'Drop Pin' | 'New Hotspot' | 'New Event' | 'New Bubble';

// nav (navigation experiment, App.tsx): Inbox and Profile live as buttons on this screen instead of
// tabs, and creating moves to the tab bar's + (createReq), so the map loses its own + button.
export default function HomeScreen({ resetKey, reduceMotion, everyoneRadius, eventsOnMap, eventDays, weekStart, nav, createReq }: {
  resetKey: number; reduceMotion: boolean; everyoneRadius: number; eventsOnMap: boolean; eventDays: number; weekStart: number;
  nav?: { unread: number; avatar: ReactNode; onInbox: () => void; onProfile: () => void };
  createReq?: { kind: CreateKind; n: number };
}) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Start on the map with Everyone selected.
  const [selected, setSelected] = useState<number | null>(0);
  const [mode, setMode] = useState<'field' | 'animating' | 'row'>('row');
  // Sheet heights: 0 = just the name, 1 = middle (map stays visible), 2 = full
  const [detent, setDetent] = useState<0 | 1 | 2>(0);
  const sheetOpen = detent > 0;
  const [tab, setTab] = useState(TABS[0]);
  const [sort, setSort] = useState<Record<string, string>>({ Hotspots: 'Nearest', Pins: 'Top rated', Members: 'Last active' }); // freshest locations first
  const [filters, setFilters] = useState<Record<string, string[]>>({ Hotspots: [], Pins: [], Members: [] });
  const [sub, setSub] = useState<{ person?: Member; pin?: Pin; event?: BubbleEvent; place?: Loc } | null>(null); // sheet sub-view
  const [profileOpen, setProfileOpen] = useState<false | 'view' | 'edit'>(false);

  const [dropOpen, setDropOpen] = useState(false);
  const [newBubbleOpen, setNewBubbleOpen] = useState(false);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [hotspotOpen, setHotspotOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState(false); // All Bubbles edit mode: − leaves
  const [bubbleQuery, setBubbleQuery] = useState<string | null>(null); // All Bubbles search (null = closed)
  const [searching, setSearching] = useState(false); // map search open
  const [feedIdx, setFeedIdx] = useState(0); // activity pill: which item is showing
  const [feedOpen, setFeedOpenState] = useState(false); // activity pill expanded into a list
  const [feedShown, setFeedShown] = useState(false); // list stays mounted while it animates closed
  const feedV = useRef(new Animated.Value(0)).current;
  // The list springs up out of the pill and shrinks back into it; rows follow one after another.
  const setFeedOpen = (open: boolean) => {
    setFeedOpenState(open);
    if (open) setFeedShown(true);
    if (reduceMotion) {
      feedV.setValue(open ? 1 : 0);
      if (!open) setFeedShown(false);
      return;
    }
    feedV.stopAnimation();
    (open
      ? Animated.spring(feedV, { toValue: 1, damping: 16, stiffness: 180, mass: 0.9, useNativeDriver: true })
      : Animated.timing(feedV, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true })
    ).start(({ finished }) => finished && !open && setFeedShown(false));
  };
  const feedO = useRef(new Animated.Value(1)).current;
  const [recenter, setRecenter] = useState(0); // bump to send the map back to the view around you
  const [dropped, setDropped] = useState<{ lat: number; lng: number } | null>(null); // long-pressed spot, pinned on the map
  const [dropAt, setDropAt] = useState<{ lat: number; lng: number } | null>(null); // long-pressed spot (pin, hotspot or event)
  const [rowX, setRowX] = useState(-1); // row scroll offset; -1 until it scrolls (starts at Everyone)
  const [popping, setPopping] = useState<string | null>(null); // Bubble being popped on leave
  const popV = useRef(new Animated.Value(0)).current;
  const [, setTick] = useState(0); // re-render after in-memory edits (drop pin, edit/leave Bubble)
  const refresh = () => setTick((t) => t + 1);
  const [query, setQuery] = useState('');
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [focus, setFocus] = useState<Focus | null>(null);
  const [toast, setToast] = useState('');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const p = useRef(new Animated.Value(1)).current;
  const sheetP = useRef(new Animated.Value(0)).current;
  const shown = sheetP.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }); // sheet content fades in by the middle height
  const rowP = useRef(new Animated.Value(0)).current; // 1 = row has focus (taller)
  const rowH = rowP.interpolate({ inputRange: [0, 1], outputRange: [ROW_H, ROW_H_FOCUS] });
  const tabX = useRef(new Animated.Value(0)).current; // slide for tab switches
  const tabO = useRef(new Animated.Value(1)).current;
  const subX = useRef(new Animated.Value(0)).current; // slide for person/pin push and back
  const subO = useRef(new Animated.Value(1)).current;
  const rowFocused = useRef(false);
  const rowTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const list = useRef<ScrollView>(null);
  const subList = useRef<ScrollView>(null);
  const rowList = useRef<ScrollView>(null);
  // switching Bubbles: scroll the row so the open one sits at the left edge (as far as the row
  // can scroll; near the end it just stays in view)
  useEffect(() => {
    if (selected === null) return;
    const slot = rowIdx.indexOf(selected);
    const maxX = Math.max(0, itemW * (1 + rowIdx.length + (overflow ? 1 : 0)) - w);
    rowList.current?.scrollTo({ x: Math.min(maxX, itemW * (1 + slot)), animated: !reduceMotion });
  }, [selected]);
  // The person card is short on purpose; flash the scroll bar so people know there's more below.
  useEffect(() => {
    if (!sub?.person) return;
    const t = setTimeout(() => subList.current?.flashScrollIndicators(), 450);
    return () => clearTimeout(t);
  }, [sub]);
  const [listH, setListH] = useState(0);

  const { w, h } = size;
  const fieldTop = insets.top + NAV_H + 56; // below nav row + large title
  // ponytail: the first screen holds at most 6, so the stream/honeycomb layouts below are parked (MANY_LAYOUT).
  const watch = false;
  // Everyone, then Bubbles by latest activity: the first FIRST_SCREEN float up front, the rest
  // go on the second screen. Order is ALL's order within each screen so bubbles don't reshuffle.
  const lastActive = (g: Group) => (g.id === 'everyone' ? -1 : Math.min(Infinity, ...g.activity.map((a) => minutesAgo(a.time))));
  const byRecent = ALL.map((_, i) => i).sort((a, b) => lastActive(ALL[a]) - lastActive(ALL[b]));
  const fieldIdx = byRecent.slice(0, FIRST_SCREEN + 1).sort((a, b) => a - b);
  const shelfIdx = byRecent.slice(FIRST_SCREEN + 1);
  // Two screens: recent, then the rest. A "More Bubbles…" bubble on each switches to the other one.
  const [page, setPage] = useState(0);
  const onPage = shelfIdx.length ? page : 0;
  const pageIdx = onPage === 0 ? fieldIdx : shelfIdx;
  const otherIdx = onPage === 0 ? shelfIdx : fieldIdx;
  const pageX = useRef(new Animated.Value(0)).current;
  const goPage = (next: number) => {
    if (next === onPage || !shelfIdx.length) return;
    setPage(next);
    pageX.setValue(reduceMotion ? 0 : (next > onPage ? 1 : -1) * w * 0.5);
    Animated.spring(pageX, { toValue: 0, useNativeDriver: false, damping: 22, stiffness: 200 }).start();
  };
  const goPageRef = useRef(goPage);
  goPageRef.current = goPage;
  const swipe = useRef(
    PanResponder.create({
      // sideways switches screens; pulling down opens Bubble search (iOS pull-to-search)
      onMoveShouldSetPanResponder: (_, g) => (Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 2) || (g.dy > 14 && g.dy > Math.abs(g.dx) * 2),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) goPageRef.current(1);
        if (g.dx > 50) goPageRef.current(0);
        if (g.dy > 60 && g.dy > Math.abs(g.dx) * 2) setBubbleQuery((q) => q ?? '');
      },
    }),
  ).current;
  const newBubble = () =>
    ALL.length >= MAX_BUBBLES ? showToast(`You can be in up to ${MAX_BUBBLES} Bubbles. Leave one to make room.`) : setNewBubbleOpen(true);
  const create = (k: CreateKind) => {
    setDropAt(null);
    if (k === 'Drop Pin') setDropOpen(true);
    if (k === 'New Hotspot') setHotspotOpen(true);
    if (k === 'New Event') setNewEventOpen(true);
    if (k === 'New Bubble') newBubble();
  };
  useEffect(() => {
    // each request once, even if this screen remounts later with the same one
    if (!createReq?.n || createReq.n <= handledCreate) return;
    handledCreate = createReq.n;
    create(createReq.kind);
  }, [createReq?.n]);
  // Bubble Info opened from a floating bubble (no Bubble selected yet)
  const [infoGroup, setInfoGroup] = useState<Group | null>(null);
  // One context menu for the screen (long-press a bubble or the map), styled like iOS's.
  const [menu, setMenu] = useState<{ anchor: MenuAnchor; dim?: boolean; title?: string; options: string[]; icons?: Record<string, IconName>; destructive?: string[]; onSelect: (o: string) => void } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const showMenu = (m: NonNullable<typeof menu>) => {
    setMenu(m);
    setMenuOpen(true);
  };
  const bubbleActions = (g: Group, anchor: MenuAnchor) =>
    showMenu({
      anchor,
      dim: true, // context menu on a bubble: focus it
      title: g.name,
      options: g.id === 'everyone' ? ['Bubble Info'] : ['Bubble Info', g.muted ? 'Unmute Notifications' : 'Mute Notifications', 'Leave Bubble'],
      icons: { 'Bubble Info': 'information-circle-outline', 'Mute Notifications': 'notifications-off-outline', 'Unmute Notifications': 'notifications-outline', 'Leave Bubble': 'exit-outline' },
      destructive: ['Leave Bubble'],
      onSelect: (o) => {
        if (o === 'Bubble Info') {
          setInfoGroup(g);
          setProfileOpen('view');
        }
        if (o.endsWith('Notifications')) toggleMute(g);
        if (o === 'Leave Bubble') confirmRemove(g);
      },
    });

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
  const fieldSpot = (i: number, g: Group | null) => {
    if (!watch) {
      const room = h - fieldTop - 8;
      if (onPage === 1) {
        // Second screen: up to 14 bubbles on a loose 3-column grid, nudged so it doesn't look ruled
        const n = pageIdx.length + 1;
        const rows = Math.ceil(n / 3);
        const cell = Math.min(w / 3, room / rows);
        const top = fieldTop + (room - cell * rows) / 2;
        return {
          x: ((i % 3) + 0.5) * (w / 3) + (jitter(i, 3) - 0.5) * cell * 0.1,
          y: top + (Math.floor(i / 3) + 0.5) * cell + (jitter(i, 4) - 0.5) * cell * 0.1,
          s: cell * 0.76, // leaves room to sway without touching the screen edge
          scale: 1,
        };
      }
      const k = Math.min(w / CANVAS.w, room / CANVAS.h);
      const c = CENTERS[i];
      return {
        x: (w - CANVAS.w * k) / 2 + c.x * k,
        y: fieldTop + (room - CANVAS.h * k) / 2 + c.y * k,
        s: (g ? bubbleSize(g.members.length) : FOLDER_S) * k,
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
      return { x, y, s: Math.min(140, bubbleSize(g?.members.length ?? 4) * 0.85), scale };
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

  // Row shows up to MAX_ROW - 1 Bubbles (selected one always visible) plus "More Bubbles…".
  const perPage = Math.max(4, Math.floor(w / ROW_ITEM_MIN));
  const grow = {
    scale: rowP.interpolate({ inputRange: [0, 1], outputRange: [1, ROW_GROW] }),
    lift: rowP.interpolate({ inputRange: [0, 1], outputRange: [0, (RS * (ROW_GROW - 1)) / 2] }), // keep the top edge in place
    gap: rowP.interpolate({ inputRange: [0, 1], outputRange: [3, 3 + RS * (ROW_GROW - 1)] }),
  };
  const itemW = w / perPage;
  const overflow = ALL.length > MAX_ROW;
  let rowIdx = ALL.map((_, i) => i).slice(0, overflow ? MAX_ROW - 1 : ALL.length);
  if (selected !== null && !rowIdx.includes(selected)) rowIdx = [...rowIdx.slice(0, -1), selected];
  const rowPages = Math.ceil((rowIdx.length + (overflow ? 1 : 0)) / perPage); // New Bubble peeks in before page 1

  const animate = (v: Animated.Value, to: number, duration: number, done?: () => void, bounce = false) => {
    if (reduceMotion) {
      v.setValue(to);
      done?.();
    } else {
      // springs feel smoother than timed easing (iOS-style); duration only picks how firm the spring is
      Animated.spring(v, { toValue: to, useNativeDriver: false, damping: 24, stiffness: duration > 400 ? 120 : 260, mass: 1, overshootClamping: !bounce }).start(() => done?.());
    }
  };

  const setSheet = (d: 0 | 1 | 2) => {
    setDetent(d);
    setQuery('');
    animate(sheetP, d / 2, 300);
  };
  // open = the middle height (or stay where it is if already open); closed = just the name
  const toggleSheet = (open: boolean) => setSheet(open ? (detent || 1) : 0);
  const stepSheetRef = useRef((_: number) => {});
  stepSheetRef.current = (dir: number) => setSheet(Math.max(0, Math.min(2, detent + dir)) as 0 | 1 | 2);

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
    }, true); // bubbles overshoot a little as they land
  };

  useEffect(() => {
    if (resetKey && mode === 'row') backToField();
  }, [resetKey]);

  // Keep the search bar tucked above the list until the user pulls down (iOS convention).
  const hideSearch = () => list.current?.scrollTo({ y: HIDDEN_H, animated: false });
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
  const weekOut = isoPlus(TODAY, eventDays);
  const upcoming = group
    ? EVENTS.filter((e) => (group.id === 'everyone' || e.groupId === group.id) && e.date >= TODAY && e.date <= weekOut)
        .sort((a, b) => a.date.localeCompare(b.date) || clockMinutes(a.time) - clockMinutes(b.time))
        .filter((e, i, all) => all.findIndex((x) => x.place === e.place) === i)
    : [];
  const mapEvents = upcoming.map((e) => ({ key: eventKey(e), title: e.title, when: `${dayLabel(e.date)} · ${e.time}`, color: groupColor(e.groupId), lat: e.lat, lng: e.lng }));
  const openEvent = (key: string) => showEvent(upcoming.find((x) => eventKey(x) === key)!);
  const showEvent = (e: BubbleEvent) => {
    setFocus({ name: e.title, lat: e.lat, lng: e.lng });
    slideIn(subX, subO, 1);
    setSub({ event: e });
    toggleSheet(true);
  };
  const color = group ? groupColor(group.id) : colors.primary;
  const sheetMax = (h - ROW_H - insets.top) * 0.8;
  const sheetMid = Math.min(sheetMax, Math.max(300, (h - ROW_H) * 0.45));
  const personCard = !!sub?.person && sheetOpen;
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
    setDropped(null);
  };

  // Bubble "..." menu: info, edit, invite, mute, leave. Everyone only has info.
  const isMuted = !!base?.muted;
  const bubbleMenu =
    base?.id === 'everyone'
      ? ['Bubble Info']
      : [
          'Bubble Info',
          // only the creator edits and invites
          ...(base && canInvite(base) ? ['Edit Bubble', 'Add Members'] : []),
          isMuted ? 'Unmute Notifications' : 'Mute Notifications',
          'Leave Bubble',
        ];
  // Same switch as Bubble Info > Notifications (Group.muted)
  const toggleMute = (g: Group) => {
    g.muted = !g.muted;
    refresh();
    showToast(g.muted ? `Muted ${g.name}` : `Notifications on for ${g.name}`);
  };
  const leaveGroup = () => removeGroup(base!);
  const removeGroup = (g: Group) => {
    // The bubble pops first (scale up, fade, droplets), on All Bubbles or in the map's row, then is
    // removed. Leaving from Bubble Info closes that sheet first so the pop is visible.
    if (mode !== 'animating' && !reduceMotion) {
      setProfileOpen(false);
      setPopping(g.id);
      popV.setValue(0);
      Animated.sequence([
        Animated.delay(profileOpen ? 450 : 0),
        Animated.timing(popV, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      ]).start(() => {
        setPopping(null);
        dropGroup(g);
      });
      return;
    }
    dropGroup(g);
  };
  // Droplets flying out of a popping bubble of the given size.
  const droplets = (size: number, color: string) =>
    [0, 1, 2, 3, 4, 5, 6, 7].map((d) => {
      const a = (d / 8) * Math.PI * 2;
      const dist = popV.interpolate({ inputRange: [0, 1], outputRange: [size * 0.3, size * (0.42 + 0.1 * (d % 3))] }); // uneven spread
      return (
        <Animated.View
          key={d}
          style={[
            styles.droplet,
            {
              left: size / 2 - 4,
              top: size / 2 - 4,
              backgroundColor: color,
              opacity: popV.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.7, 0.5, 0] }),
              transform: [
                { translateX: Animated.multiply(dist, Math.cos(a)) },
                { translateY: Animated.multiply(dist, Math.sin(a)) },
                { scale: popV.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) },
              ],
            },
          ]}
        />
      );
    });
  const dropGroup = (g: Group) => {
    // ponytail: removes from the in-memory lists only
    GROUPS.splice(GROUPS.indexOf(g), 1);
    ALL.splice(ALL.indexOf(g), 1);
    setProfileOpen(false);
    setSelected(0);
    showToast(`You left ${g.name}`);
  };
  const confirmRemove = (g: Group) =>
    Alert.alert(`Leave ${g.name}?`, 'Members will stop seeing your location, pins and photos.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => removeGroup(g) },
    ]);
  const onBubbleMenu = (o: string) => {
    const g = base!;
    if (o === 'Bubble Info') setProfileOpen('view');
    if (o === 'Edit Bubble') setProfileOpen('edit');
    if (o === 'Add Members') setInviteOpen(true);
    if (o.endsWith('Notifications')) toggleMute(g);
    if (o === 'Leave Bubble')
      Alert.alert(`Leave ${g.name}?`, 'Members will stop seeing your location, pins and photos.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: leaveGroup },
      ]);
  };

  // An activity row opens what it's about: the event or pin it names, otherwise the person.
  const openActivity = (key: string, text: string) => {
    setRead({ ...read, [key]: true });
    const event = EVENTS.find((e) => text.includes(e.title));
    if (event) return showEvent(event);
    const pin = GROUPS.flatMap((g) => g.pins).find((pn) => text.includes(pn.name));
    if (pin && text.includes('pinned')) return openPin(pin);
    const person = GROUPS.flatMap((g) => g.members).find((m) => text.startsWith(m.name));
    if (person) openPerson(person);
  };
  const openPerson = (m: Member) => {
    setFocus(m);
    slideIn(subX, subO, 1);
    setSub({ person: m });
    toggleSheet(true);
  };
  const openPlace = (l: Loc) => {
    setFocus(l);
    slideIn(subX, subO, 1);
    setSub({ place: l });
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
        // drag one height at a time; a long fling goes all the way
        if (g.dy > 30) stepSheetRef.current(g.dy > 220 ? -2 : -1);
        if (g.dy < -30) stepSheetRef.current(g.dy < -220 ? 2 : 1);
      },
    }),
  ).current;

  // Activity feed for the pill: newest first, the last RECENT_HOURS hours (at least RECENT_MIN items).
  // Arrivals and departures matter for a few hours; older news would only pile up and make people
  // feel behind, so the pill shows what helps you meet up now.
  const feed = !group
    ? []
    : (group.id === 'everyone'
        ? GROUPS.flatMap((g) => g.activity.map((a, i) => ({ ...a, key: `${g.id}:${i}`, unread: i < g.unread })))
        : group.activity.map((a, i) => ({ ...a, key: `${group.id}:${i}`, unread: i < group.unread }))
      )
        .map((a) => ({ ...a, unread: a.unread && !read[a.key] }))
        .sort((a, b) => minutesAgo(a.time) - minutesAgo(b.time));
  const recent = feed.filter((a, i) => i < RECENT_MIN || minutesAgo(a.time) <= RECENT_HOURS * 60);
  const feedItem = recent[feedIdx % Math.max(1, recent.length)];
  // The pill steps through recent items every few seconds (crossfade; an instant swap with reduced motion).
  useEffect(() => {
    if (feedOpen || recent.length < 2) return;
    const t = setInterval(() => {
      if (reduceMotion) return setFeedIdx((i) => i + 1);
      Animated.timing(feedO, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setFeedIdx((i) => i + 1);
        Animated.timing(feedO, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(t);
  }, [feedOpen, recent.length, reduceMotion]);
  useEffect(() => {
    setFeedIdx(0);
    setFeedOpen(false);
    setTab('Members'); // a Bubble opens on its people
  }, [selected]);
  const showFeed = !!group && !sheetOpen && !sub && !searching && recent.length > 0;
  const pins = !group
    ? []
    : group.pins
        .map((pin) => ({ ...pin, mi: distanceFromMe(pin.lat, pin.lng) }))
        .filter((pin) => match(pin.name, pin.note, pin.by))
        .filter((pin) => (!has('4.5+ stars') || avgRating(pin) >= 4.5) && (!has('Pinned by me') || pin.by === 'You') && (!has('Within 10 mi') || pin.mi <= 10))
        .sort((a, b) => (sort.Pins === 'Nearest' ? a.mi - b.mi : sort.Pins === 'A–Z' ? a.name.localeCompare(b.name) : avgRating(b) - avgRating(a)));
  // Hotspots in this Bubble (Everyone: all of them), with who's inside right now
  const hotspots = !group
    ? []
    : (group.id === 'everyone' ? GROUPS.flatMap((g) => g.hotspots) : group.hotspots)
        .filter((hs, i, all) => all.findIndex((x) => x.name === hs.name) === i)
        .map((hs) => ({ ...hs, mi: distanceFromMe(hs.lat, hs.lng), inside: group.members.filter((m) => meters(hs, m) <= hs.radius) }))
        .filter((hs) => match(hs.name))
        .filter((hs) => (!has('Alerts on') || Object.values(hs.alerts ?? {}).some((a) => a.arrive || a.leave)) && (!has('Someone there now') || hs.inside.length > 0))
        .sort((a, b) => (sort.Hotspots === 'A–Z' ? a.name.localeCompare(b.name) : sort.Hotspots === 'Most people' ? b.inside.length - a.inside.length : a.mi - b.mi));
  const members = !group
    ? []
    : group.members
        .map((m) => ({ ...m, mi: distanceFromMe(m.lat, m.lng) }))
        .filter((m) => match(m.name, m.place))
        .filter((m) => (!has('Moving now') || m.moving) && (!has('Within 1 mi') || m.mi <= 1) && (!has('Updated in the last hour') || minutesAgo(m.updated) < 60))
        .sort((a, b) =>
          sort.Members === 'A–Z' ? a.name.localeCompare(b.name) : sort.Members === 'Last active' ? minutesAgo(a.updated) - minutesAgo(b.updated) || a.mi - b.mi : a.mi - b.mi,
        );

  return (
    <View style={styles.fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* Full-bleed map, revealed as the bubble panel collapses */}
      {group && (
        <Animated.View style={[styles.mapArea, { opacity: p, bottom: rowH }]} onTouchStart={() => focusRow(false)}>
          <BubbleMap
            members={group.members}
            // Everyone is about people: pins and hotspots show inside their own Bubble
            hotspots={group.id === 'everyone' ? [] : group.hotspots}
            pins={group.id === 'everyone' ? [] : group.pins}
            color={color}
            focus={focus}
            topInset={insets.top + 56} // room for the search bar
            // the part of the map the sheet covers, so framing (and a dropped pin) stays in view above it
            bottomInset={personCard ? PERSON_H + NOTES_H : detent === 1 ? sheetMid : SHEET_MIN + FEED_H + spacing.md}
            onMemberPress={openPerson}
            onPinPress={openPin}
            radiusMi={group.id === 'everyone' ? everyoneRadius : undefined}
            events={eventsOnMap ? mapEvents : []}
            onPlacePress={(pl) => openPlace({ name: pl.name, lat: pl.lat, lng: pl.lng, icon: pl.icon })}
            onEventPress={openEvent}
            hideEdges={searching || feedOpen} // a panel covers part of the map
            recenter={recenter}
            dropped={dropped}
            onLongPress={(c) => {
              // long-press a spot (Apple Maps style): a pin drops there, the sheet shows the spot, and
              // a menu offers what to make there
              setDropped({ lat: c.lat, lng: c.lng });
              setFocus({ name: 'Dropped Pin', lat: c.lat, lng: c.lng }); // centers it above the sheet
              slideIn(subX, subO, 1);
              setSub({ place: { name: 'Dropped Pin', icon: 'location', lat: c.lat, lng: c.lng } });
              setSheet(1);
              // the menu opens from where the pin will settle: centered in the map left above the sheet
              const pinY = (insets.top + 56 + (h - ROW_H - sheetMid)) / 2;
              showMenu({
                anchor: { x: w / 2, y: pinY, w: 0, h: 0 },
                options: ['Drop Pin', 'New Hotspot', 'New Event'],
                icons: { 'Drop Pin': 'location-outline', 'New Hotspot': 'radio-outline', 'New Event': 'calendar-outline' },
                onSelect: (o) => {
                  setDropAt({ lat: c.lat, lng: c.lng });
                  if (o === 'Drop Pin') setDropOpen(true);
                  if (o === 'New Hotspot') setHotspotOpen(true);
                  if (o === 'New Event') setNewEventOpen(true);
                },
              });
            }}
          />
          {/* Right-side controls, just above the sheet */}
          <Animated.View
            style={[styles.rightStack, { opacity: sheetP.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' }) }, sheetOpen && styles.noTouch]}
          >
            {/* location arrow, filled while the map shows the view around you (Apple Maps style) */}
            <MapButton
              icon={focus ? 'navigate-outline' : 'navigate'}
              onPress={() => {
                setFocus(null);
                setRecenter((r) => r + 1);
              }}
            />
            {!nav && (
              <MenuButton
                icon="add"
                options={['Drop Pin', 'New Event', 'New Hotspot', 'New Bubble']}
                icons={{ 'Drop Pin': 'location-outline', 'New Bubble': 'ellipse-outline', 'New Event': 'calendar-outline', 'New Hotspot': 'radio-outline' }}
                onSelect={(o) => create(o as CreateKind)}
                triggerStyle={styles.smallFab}
                trigger={<Ionicons name="add" size={22} color={colors.text} />}
              />
            )}
          </Animated.View>
          {showFeed && feedShown && (
            // Recent activity, opened from the pill: grows up from the pill's edge
            <Animated.View
              pointerEvents={feedOpen ? 'auto' : 'none'}
              style={[
                styles.feedList,
                {
                  opacity: feedV.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }),
                  transformOrigin: 'bottom',
                  transform: [
                    { translateY: feedV.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                    { scale: feedV.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
                  ],
                },
              ]}
            >
              <Text style={styles.feedHead}>Last {RECENT_HOURS} hours</Text>
              <ScrollView style={{ maxHeight: 260 }}>
                {recent.map((a, i) => {
                  const at = Math.min(0.6, 0.08 * i); // stagger: later rows arrive a beat later
                  return (
                    <Animated.View
                      key={a.key}
                      style={{
                        opacity: feedV.interpolate({ inputRange: [at, at + 0.4], outputRange: [0, 1], extrapolate: 'clamp' }),
                        transform: [{ translateY: feedV.interpolate({ inputRange: [at, at + 0.4], outputRange: [10, 0], extrapolate: 'clamp' }) }],
                      }}
                    >
                      <Pressable onPress={() => { setFeedOpen(false); openActivity(a.key, a.text); }} style={[styles.feedRow, i > 0 && styles.divider]}>
                        <Ionicons name={a.icon} size={16} color={color} />
                        <Text numberOfLines={2} style={[type.body, { flex: 1, fontSize: 15 }, a.unread && { fontFamily: fonts.bodyBold }]}>{a.text}</Text>
                        <Text style={type.caption}>{a.time}</Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
          {showFeed && feedItem && (
            // Activity pill: steps through recent news; tap for the list
            <Pressable style={styles.feedPill} onPress={() => setFeedOpen(!feedOpen)} accessibilityLabel="Recent activity">
              <Animated.View style={[styles.row, { flex: 1, gap: spacing.sm, opacity: feedO }]}>
                <Ionicons name={feedItem.icon} size={16} color={color} />
                <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={[styles.feedText, feedItem.unread && { fontFamily: fonts.bodyBold }]}>
                  {feedItem.text}
                </Text>
                <Text maxFontSizeMultiplier={FIXED_TEXT} style={type.caption}>{feedItem.time}</Text>
              </Animated.View>
              <Animated.View style={{ transform: [{ rotate: feedV.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                <Ionicons name="chevron-up" size={14} color={colors.textMuted} />
              </Animated.View>
            </Pressable>
          )}
          {nav && (
            // top bar: your profile on the left; search (below), then Inbox, on the right
            <>
              <Pressable onPress={nav.onInbox} hitSlop={CONTROL_SLOP} style={[styles.topBtn, { top: insets.top + spacing.sm, right: spacing.sm + 4 }]} accessibilityLabel={`Inbox, ${nav.unread} unread`}>
                <Ionicons name="mail-outline" size={17} color={colors.text} />
                {nav.unread > 0 && <Badge count={nav.unread} style={styles.topBadge} />}
              </Pressable>
              <Pressable onPress={nav.onProfile} hitSlop={CONTROL_SLOP} style={[styles.topBtn, { top: insets.top + spacing.sm, left: spacing.sm + 4 }]} accessibilityLabel="Profile">
                {nav.avatar}
              </Pressable>
            </>
          )}
          <MapSearch
            buttonOffset={nav ? CONTROL + spacing.sm : 0} // leaves room for Inbox at the right edge
            top={insets.top + spacing.sm}
            reduceMotion={reduceMotion}
            onOpenChange={(o) => {
              setSearching(o);
              if (o) toggleSheet(false);
            }}
            onPerson={openPerson}
            onPin={openPin}
            onPlace={openPlace}
          />
        </Animated.View>
      )}

      {/* Quick messages float over the map, just above the compact person card */}
      {personCard && (
        <Animated.View style={[styles.notesFloat, { bottom: Animated.add(rowH, PERSON_H) }]} pointerEvents="box-none">
          <QuickMessages floating member={sub!.person!} />
        </Animated.View>
      )}

      {/* Sheet, resting on top of the row */}
      {group && w > 0 && (
        <Animated.View
          style={[
            styles.sheet,
            { opacity: p, bottom: rowH, height: sheetP.interpolate({ inputRange: [0, 0.5, 1], outputRange: sub?.person ? [SHEET_MIN, PERSON_H, PERSON_H] : [SHEET_MIN, sheetMid, sheetMax] }) },
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
              <ScrollView ref={subList} contentContainerStyle={{ paddingBottom: spacing.lg }}>
                {sub.person && <PersonView compact member={sub.person} onShowOnMap={(m) => { setFocus(m); toggleSheet(false); }} />}
                {sub.event && <EventView event={sub.event} />}
                {sub.place && <LocationView loc={sub.place} />}
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
              <View style={{ flex: 1 }}>
                <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={styles.sheetTitle}>{group.name}</Text>
                {/* who you could get to: Everyone uses the map radius setting, Bubbles walking distance */}
                <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={type.caption}>
                  {(() => {
                    const r = group.id === 'everyone' ? everyoneRadius : NEARBY_MI;
                    const n = group.members.filter((m) => distanceFromMe(m.lat, m.lng) <= r).length;
                    return `${n} of ${group.members.length} within ${r} mi`;
                  })()}
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
          {/* tabs appear as the sheet opens, so the collapsed sheet is just the name */}
          <Animated.View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xs, opacity: shown }}>
            <GlassTabs options={TABS} value={tab} onChange={switchTab} />
          </Animated.View>
          <Animated.View style={{ flex: 1, opacity: Animated.multiply(tabO, shown), transform: [{ translateX: tabX }] }}>
          <ScrollView
            ref={list}
            onLayout={(e) => setListH(e.nativeEvent.layout.height)}
            contentContainerStyle={[styles.sheetBody, { minHeight: listH + HIDDEN_H }]}
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
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                />
              </View>
            </View>

            {/* Sort and filter menus, below the hidden search */}
            <View style={styles.toolbar}>
              <Text style={[type.caption, { flex: 1 }]}>
                {tab === 'Pins' ? `${pins.length} pins` : tab === 'Hotspots' ? `${hotspots.length} hotspots` : `${members.length} members`}
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

            {tab === 'Hotspots' && (
              <Pressable style={styles.listRow} onPress={() => create('New Hotspot')}>
                <View style={[styles.iconCircle, { backgroundColor: color + '1F' }]}>
                  <Ionicons name="add" size={20} color={color} />
                </View>
                <Text style={[type.body, { color: colors.primary }]}>New Hotspot</Text>
              </Pressable>
            )}
            {tab === 'Hotspots' &&
              hotspots.map((hs) => (
                <Pressable key={hs.name} style={[styles.listRow, styles.divider]} onPress={() => openPlace({ name: hs.name, lat: hs.lat, lng: hs.lng, icon: hs.icon })}>
                  <View style={[styles.iconCircle, { backgroundColor: color + '1F' }]}>
                    <Ionicons name={hs.icon} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.rowTitle}>{hs.name}</Text>
                    <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={type.caption}>
                      {hs.inside.length ? `${hs.inside.map((m) => m.name.split(' ')[0]).join(', ')} there now` : 'Nobody there now'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.distance}>{hs.radius >= 1000 ? `${hs.radius / 1000} km` : `${hs.radius} m`}</Text>
                    <Text style={type.caption}>{formatMiles(hs.mi)}</Text>
                  </View>
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
                    <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={type.caption}>{pin.note}</Text>
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

            {tab === 'Members' && group.id !== 'everyone' && (
              // invite lives where people look for it: the top of the member list
              <Pressable style={styles.listRow} disabled={!canInvite(group)} onPress={() => setInviteOpen(true)}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="person-add" size={17} color={canInvite(group) ? colors.primary : colors.textMuted} />
                </View>
                <Text style={[type.body, { flex: 1, color: canInvite(group) ? colors.primary : colors.textMuted }]}>
                  {canInvite(group) ? 'Add Members' : `Only ${ownerName(group)} can add members`}
                </Text>
              </Pressable>
            )}
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
                      <LinkedText style={type.caption} text={m.place} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.distance}>{formatMiles(m.mi)}</Text>
                    <Text style={type.caption}>{m.updated}</Text>
                  </View>
                </Pressable>
              ))}

            {((tab === 'Pins' && !pins.length) || (tab === 'Members' && !members.length) || (tab === 'Hotspots' && !hotspots.length && !!q)) && (
              <Text style={[type.caption, { padding: spacing.md }]}>
                {q ? `No results for “${query.trim()}”` : tab === 'Pins' ? 'No pins yet' : 'No members yet'}
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
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: pageX }] }]} {...(mode === 'field' ? (watch ? pan : swipe).panHandlers : {})}>
          {pageIdx.map((i, pos) => {
            const g = ALL[i];
            const f = fieldSpot(pos, g);
            // stagger: later bubbles leave the row a little after earlier ones (rise one by one)
            const lag = Math.min(0.45, pos * 0.07);
            const along = (from: number, to: number) => p.interpolate({ inputRange: [0, 1 - lag, 1], outputRange: [from, to, to], extrapolateRight: 'clamp' });
            const isPop = popping === g.id;
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
                    { translateX: along(f.x - f.s / 2, rx - f.s / 2) },
                    { translateY: along(f.y - f.s / 2, ry - f.s / 2) },
                    { scale: isPop ? popV.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) : along(f.scale, RS / f.s) },
                  ],
                  opacity: isPop ? popV.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.6, 0] }) : 1,
                }}
              >
                {isPop && droplets(f.s, groupColor(g.id))}
                <FloatingBubble
                  size={f.s}
                  tint={groupColor(g.id)}
                  label={g.name}
                  sublabel={`${g.members.length} ${g.id === 'everyone' ? 'people' : 'members'}`}
                  icon={g.icon}
                  count={editing ? 0 : g.unread} // edit badges take that corner
                  delay={i * 500}
                  still={reduceMotion}
                  onPress={() => (editing ? g.id !== 'everyone' && confirmRemove(g) : select(i))}
                  onLongPress={editing ? undefined : () => bubbleActions(g, { x: f.x - f.s / 2, y: f.y - f.s / 2, w: f.s, h: f.s })} // Bubble Info, mute, leave
                  style={{ left: 0, top: 0 }}
                />
                {editing && g.id !== 'everyone' && (
                  <Pressable style={[styles.removeBadge, { transform: [{ scale: f.scale }] }]} onPress={() => confirmRemove(g)} hitSlop={8}>
                    <Ionicons name="remove" size={18} color={'white'} />
                  </Pressable>
                )}
              </Animated.View>
            );
          })}
          {otherIdx.length > 0 && (() => {
            // "More Bubbles…": tap (or swipe) to switch screens
            const f = fieldSpot(pageIdx.length, null);
            return (
              <Animated.View
                style={{
                  position: 'absolute',
                  width: f.s,
                  height: f.s,
                  transform: [{ translateX: f.x - f.s / 2 }, { translateY: f.y - f.s / 2 }],
                  opacity: p.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: 'clamp' }),
                }}
              >
                <FloatingBubble
                  size={f.s}
                  tint={colors.textMuted}
                  label={onPage === 0 ? 'More Bubbles…' : 'Recent'}
                  icon={onPage === 0 ? 'ellipsis-horizontal' : 'arrow-back'}
                  delay={pageIdx.length * 500}
                  still={reduceMotion}
                  onPress={() => goPage(onPage === 0 ? 1 : 0)}
                  style={{ left: 0, top: 0 }}
                />
              </Animated.View>
            );
          })()}
        </Animated.View>
      )}
      {mode !== 'row' && (
        <Animated.Text style={[type.largeTitle, styles.title, { top: insets.top + NAV_H, opacity: p.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] }) }]}>
          All Bubbles
        </Animated.Text>
      )}
      {mode === 'field' && !editing && (
        // Search at the leading end of the nav row
        <View style={[styles.fieldActions, { top: insets.top, left: spacing.md, right: undefined }]}>
          {!nav && (
            <Pressable onPress={() => setBubbleQuery(bubbleQuery === null ? '' : null)} hitSlop={10} accessibilityLabel={bubbleQuery === null ? 'Search Bubbles' : 'Close search'}>
              <Ionicons name={bubbleQuery === null ? 'search' : 'close'} size={24} color={colors.primary} />
            </Pressable>
          )}
        </View>
      )}
      {mode === 'field' && (
        // Edit (leave Bubbles) and + (new Bubble) in a nav row above the large title, like iOS
        <View style={[styles.fieldActions, { top: insets.top }]}>
          {nav && !editing && (
            <>
              <Pressable onPress={() => setBubbleQuery(bubbleQuery === null ? '' : null)} hitSlop={10} accessibilityLabel={bubbleQuery === null ? 'Search Bubbles' : 'Close search'}>
                <Ionicons name={bubbleQuery === null ? 'search' : 'close'} size={24} color={colors.primary} />
              </Pressable>
            </>
          )}
          <Pressable onPress={() => setEditing(!editing)} hitSlop={10}>
            <Text style={[styles.fieldAction, editing && { fontFamily: fonts.bodyBold }]}>{editing ? 'Done' : 'Edit'}</Text>
          </Pressable>
          {!editing && !nav && (
            <Pressable onPress={newBubble} hitSlop={10}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </Pressable>
          )}
        </View>
      )}
      {/* Bubble search: its own page sheet over the screen. Before you type, Bubbles are listed by
          latest activity, so the ones with news are at the top. */}
      <Modal visible={bubbleQuery !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBubbleQuery(null)}>
        <View style={styles.searchSheet}>
          <View style={styles.searchHead}>
            <View style={[styles.search, { flex: 1, backgroundColor: colors.text + '0F' }]}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                autoFocus
                value={bubbleQuery ?? ''}
                onChangeText={setBubbleQuery}
                placeholder="Search Bubbles"
                autoCorrect={false}
                autoCapitalize="none"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
              />
            </View>
            <Pressable onPress={() => setBubbleQuery(null)} hitSlop={10}>
              <Text style={styles.fieldAction}>Cancel</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {!(bubbleQuery ?? '').trim() && <Text style={styles.searchSection}>Recently active</Text>}
            <View style={styles.searchList}>
              {byRecent
                .map((i) => ({ g: ALL[i], i }))
                .filter(({ g }) => g.name.toLowerCase().includes((bubbleQuery ?? '').trim().toLowerCase()))
                .map(({ g, i }, n) => (
                  <Pressable key={g.id} style={[styles.resultRow, n > 0 && styles.divider]} onPress={() => { setBubbleQuery(null); select(i); }}>
                    <Bubble size={36} tint={groupColor(g.id)}>{g.icon && <Ionicons name={g.icon} size={15} color={groupColor(g.id)} />}</Bubble>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{g.name}</Text>
                      <Text numberOfLines={1} style={type.caption}>
                        {g.members.length} {g.id === 'everyone' ? 'people' : 'members'}
                        {g.activity[0] ? ` · ${g.activity[0].text}` : ''}
                      </Text>
                    </View>
                    {g.activity[0] && <Text style={type.caption}>{g.activity[0].time}</Text>}
                  </Pressable>
                ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* Compact scrollable row once collapsed */}
      {mode === 'row' && (
        <Animated.View style={[styles.rowWrap, { height: rowH }]}>
        {/* Starts at Everyone; scroll left past it for New Bubble. Snaps a page at a time. */}
        <ScrollView
          ref={rowList}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
          contentOffset={{ x: itemW, y: 0 }}
          snapToOffsets={[0, ...Array.from({ length: rowPages }, (_, k) => itemW + k * w)]}
          decelerationRate="fast"
          scrollEventThrottle={32}
          onScroll={(e) => setRowX(e.nativeEvent.contentOffset.x)}
          onTouchStart={() => focusRow(true)}
          onScrollBeginDrag={() => focusRow(true)}
        >
          <Pressable onPress={newBubble} style={[styles.rowItem, { width: itemW }]} accessibilityLabel="New Bubble">
            <Animated.View style={{ transform: [{ translateY: grow.lift }, { scale: grow.scale }] }}>
              <Bubble size={RS} tint={colors.textMuted}>
                <Ionicons name="add" size={22} color={colors.textMuted} />
              </Bubble>
            </Animated.View>
            <Animated.Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={[styles.rowLabel, { marginTop: grow.gap }]}>New Bubble</Animated.Text>
          </Pressable>
          {rowIdx.map((i) => {
            const g = ALL[i];
            return (
              <Pressable key={g.id} onPress={() => select(i)} style={[styles.rowItem, { width: itemW }]}>
                <Animated.View style={{ transform: [{ translateY: grow.lift }, { scale: grow.scale }] }}>
                  {popping === g.id && droplets(RS, groupColor(g.id))}
                  <Animated.View
                    style={popping === g.id && {
                      transform: [{ scale: popV.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
                      opacity: popV.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.6, 0] }),
                    }}
                  >
                    <Bubble size={RS} tint={groupColor(g.id)}>
                      {g.icon && <Ionicons name={g.icon} size={18} color={groupColor(g.id)} />}
                    </Bubble>
                  </Animated.View>
                </Animated.View>
                {/* outside the scaled view so it stays crisp; slides out with the bubble's edge */}
                {g.unread > 0 && (
                  <Animated.View style={[styles.rowBadge, { transform: [{ translateX: Animated.multiply(Animated.add(grow.scale, -1), RS / 2) }, { scale: 0.8 }] }]}>
                    <Badge count={g.unread} />
                  </Animated.View>
                )}
                <Animated.Text
                  maxFontSizeMultiplier={FIXED_TEXT}
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
              <Animated.Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={[styles.rowLabel, { marginTop: grow.gap }]}>More Bubbles…</Animated.Text>
            </Pressable>
          )}
        </ScrollView>
        {/* tiny dim chevrons on whichever side has more to scroll to */}
        {(() => {
          const x = rowX < 0 ? itemW : rowX;
          const contentW = itemW * (1 + rowIdx.length + (overflow ? 1 : 0));
          return (
            <>
              {x > 4 && <Ionicons name="chevron-back" size={12} color={colors.textMuted} style={[styles.rowChevron, { left: 1 }]} />}
              {x < contentW - w - 4 && <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={[styles.rowChevron, { right: 1 }]} />}
            </>
          );
        })()}
        </Animated.View>
      )}

      <PopMenu
        dim={menu?.dim}
        visible={menuOpen}
        anchor={menu?.anchor ?? null}
        title={menu?.title}
        options={menu?.options ?? []}
        icons={menu?.icons}
        destructive={menu?.destructive}
        onSelect={(o) => menu?.onSelect(o)}
        onClose={() => setMenuOpen(false)}
      />
      {profileOpen && (
        <BubbleProfile
          group={infoGroup ?? group}
          startEditing={profileOpen === 'edit'}
          onMute={() => toggleMute((infoGroup ?? group)!)}
          onClose={() => {
            setProfileOpen(false);
            setInfoGroup(null);
          }}
          onChanged={refresh}
          onLeave={() => removeGroup((infoGroup ?? group)!)}
          onInvite={() => setInviteOpen(true)}
        />
      )}
      <DropPin
        visible={dropOpen}
        groups={GROUPS}
        initialGroupId={group?.id}
        at={dropAt}
        onClose={() => setDropOpen(false)}
        onDrop={(pin, groupId, notify) => {
          if (dropped) closeSub(); // made something at the dropped pin: it's done its job
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

      <AddMembers group={inviteOpen ? base : null} onClose={() => setInviteOpen(false)} />
      <NewHotspot
        visible={hotspotOpen}
        groups={GROUPS}
        initialGroupId={group?.id}
        at={dropAt}
        onClose={() => setHotspotOpen(false)}
        onCreate={(h, groupId) => {
          if (dropped) closeSub(); // made something at the dropped pin: it's done its job
          const g = GROUPS.find((x) => x.id === groupId)!;
          g.hotspots.push(h);
          if (!EVERYONE.hotspots.some((x) => x.name === h.name)) EVERYONE.hotspots.push(h);
          g.activity.unshift({ icon: 'radio-outline', text: `You added the hotspot ${h.name}`, time: 'Now' });
          setHotspotOpen(false);
          setSelected(ALL.indexOf(g));
          setFocus(h);
          showToast(`Hotspot ${h.name} added to ${g.name}`);
        }}
      />
      <NewBubble
        visible={newBubbleOpen}
        onClose={() => setNewBubbleOpen(false)}
        onCreate={(g) => {
          g.activity.unshift({ icon: 'add-circle-outline', text: `You created ${g.name}`, time: 'Now' }); // counts as recent
          GROUPS.push(g);
          ALL.push(g);
          setNewBubbleOpen(false);
          showToast(`Created ${g.name}`);
          if (mode === 'row') setSelected(ALL.length - 1);
        }}
      />
      <NewEvent
        visible={newEventOpen}
        groups={GROUPS}
        initialGroupId={group?.id}
        at={dropAt}
        today={TODAY}
        weekStart={weekStart}
        onClose={() => setNewEventOpen(false)}
        onCreate={(e) => {
          if (dropped) closeSub(); // made something at the dropped pin: it's done its job
          EVENTS.push(e);
          const g = GROUPS.find((x) => x.id === e.groupId);
          g?.activity.unshift({ icon: 'calendar-outline', text: `You added ${e.title} to the calendar`, time: 'Now' });
          setNewEventOpen(false);
          showToast(`Added ${e.title}`);
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
  droplet: { position: 'absolute', width: 8, height: 8, borderRadius: 4, opacity: 0.6 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  fieldActions: { position: 'absolute', right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, height: NAV_H },
  fieldAction: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  removeBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { flex: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  noTouch: { pointerEvents: 'none' },
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0 },
  notesFloat: { position: 'absolute', left: 0, right: 0, height: NOTES_H, justifyContent: 'center' },
  rightStack: { position: 'absolute', right: spacing.sm + 4, bottom: SHEET_MIN + spacing.sm + 4, alignItems: 'center', gap: spacing.sm + 4 },
  topBtn: { position: 'absolute', width: CONTROL, height: CONTROL, borderRadius: CONTROL / 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  topBadge: { position: 'absolute', top: -4, right: -6, transform: [{ scale: 0.85 }] },
  smallFab: { width: CONTROL, height: CONTROL, borderRadius: CONTROL / 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  rowChevron: { position: 'absolute', top: 6 + RS / 2 - 6, opacity: 0.45, pointerEvents: 'none' },
  feedPill: { position: 'absolute', left: spacing.sm + 4, right: spacing.sm + 4 + CONTROL + spacing.sm, bottom: SHEET_MIN + spacing.sm + 4, height: FEED_H, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm + 6, backgroundColor: colors.surface, ...shadow }, // centered on the arrow button beside it
  feedText: { ...type.body, fontSize: 14, lineHeight: 18, flex: 1 },
  feedList: { position: 'absolute', left: spacing.sm + 4, right: spacing.sm + 4, bottom: SHEET_MIN + spacing.sm + 4 + CONTROL + spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, paddingVertical: spacing.sm, ...shadow },
  feedHead: { ...type.caption, fontFamily: fonts.bodyBold, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
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
  toolbar: { height: TOOLBAR_H, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  sheetBody: { paddingBottom: spacing.md },
  searchSheet: { flex: 1, backgroundColor: colors.background },
  searchHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  searchSection: { ...type.caption, fontFamily: fonts.bodyBold, textTransform: 'uppercase', paddingHorizontal: spacing.md * 2, paddingBottom: 6 },
  searchList: { marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radius.sm + 4, overflow: 'hidden' },
  searchWrap: { height: SEARCH_H, justifyContent: 'center', paddingHorizontal: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 2, height: 36 },
  searchInput: { ...type.input, flex: 1, padding: 0 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  unread: { backgroundColor: colors.primarySoft },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  distance: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderTopColor: colors.border },
  rowContent: { paddingTop: 6 },
  rowItem: { alignItems: 'center' },
  rowBadge: { position: 'absolute', top: -4, left: '50%', marginLeft: RS / 2 - 16 },
  rowLabel: { ...type.caption, fontSize: 10, lineHeight: 14, width: '92%', textAlign: 'center' },
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
