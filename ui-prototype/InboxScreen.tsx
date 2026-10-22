// Inbox: invites, quick messages, place alerts, new pins and events. Edge-to-edge list like Mail;
// unread rows are shaded and bold. Pull down at the top to reveal search. Tap opens the item;
// swipe right (or long-press) toggles read/unread.
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Alert, Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Bubble, PageSheet, Separator } from './components';
import { EventView, LinkedText, LocationView, PersonView, PinView } from './Details';
import { colors, fonts, radius, spacing, type } from './theme';
import { ALL, allPins, EVENTS, GROUPS, groupColor, INBOX, InboxItem, initials, memberColor } from './data';

const SEARCH_H = 52;
const HEAD_H = 71; // large title + unread line

export default function InboxScreen({ onChange }: { onChange: () => void }) {
  const insets = useSafeAreaInsets();
  // INBOX is the store (module-level), so read state survives leaving the tab; tick re-renders.
  const [, setTick] = useState(0);
  const items = INBOX;
  const setItems = (next: InboxItem[]) => {
    INBOX.splice(0, INBOX.length, ...next);
    setTick((t) => t + 1);
    onChange(); // tab badge
  };
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = items.find((it) => it.id === openId) ?? null;
  // Joining starts sharing your location, so the inline Accept asks first (the detail sheet spells it out).
  const acceptInvite = (it: InboxItem) =>
    Alert.alert(`Join ${it.open?.bubble ?? 'this Bubble'}?`, `${it.body.split(' · ')[1] ?? 'Its members'} will see your location, pins and photos.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Join', onPress: () => update(it.id, { invite: 'accepted', read: true }) },
    ]);
  const open = (it: InboxItem) => {
    update(it.id, { read: true });
    setOpenId(it.id);
  };
  const [query, setQuery] = useState('');
  const [listH, setListH] = useState(0);
  const list = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(SEARCH_H)).current;
  const update = (id: string, change: Partial<InboxItem>) => setItems(items.map((it) => (it.id === id ? { ...it, ...change } : it)));
  const unread = items.filter((it) => !it.read).length;
  const q = query.trim().toLowerCase();
  const shown = items.filter((it) => !q || `${it.title} ${it.body}`.toLowerCase().includes(q));

  // Keep search tucked above the list until pulled down (iOS convention).
  useEffect(() => {
    if (listH) list.current?.scrollTo({ y: SEARCH_H, animated: false });
  }, [listH]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {/* iOS: bar buttons sit in the nav row above the large title */}
      <View style={styles.nav}>
        {/* the large title collapses into this one as the list scrolls (iOS large titles) */}
        <Animated.Text pointerEvents="none" style={[styles.navTitle, { opacity: scrollY.interpolate({ inputRange: [SEARCH_H + 40, SEARCH_H + 70], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
          Inbox
        </Animated.Text>
        {unread > 0 && (
          <Pressable onPress={() => setItems(items.map((it) => ({ ...it, read: true })))} hitSlop={8}>
            <Text style={styles.link}>Mark All as Read</Text>
          </Pressable>
        )}
      </View>
      <Animated.View
        style={[
          styles.head,
          {
            height: scrollY.interpolate({ inputRange: [SEARCH_H, SEARCH_H + 70], outputRange: [HEAD_H, 0], extrapolate: 'clamp' }),
            opacity: scrollY.interpolate({ inputRange: [SEARCH_H, SEARCH_H + 40], outputRange: [1, 0], extrapolate: 'clamp' }),
          },
        ]}
      >
        <Text style={type.largeTitle}>Inbox</Text>
        <Text style={type.caption}>{unread ? `${unread} unread` : 'All caught up'}</Text>
      </Animated.View>

      <ScrollView
        ref={list}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        onLayout={(e) => setListH(e.nativeEvent.layout.height)}
        contentContainerStyle={{ minHeight: listH + SEARCH_H, paddingBottom: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchWrap}>
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search inbox" autoCorrect={false} autoCapitalize="none" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
          </View>
        </View>

        <View style={styles.list}>
          {shown.map((it, i) => (
            <View key={it.id}>
              {i > 0 && <Separator inset={spacing.md + 36 + spacing.sm + 4} />}
              <SwipeRow read={it.read} onToggle={() => update(it.id, { read: !it.read })}>
              <Pressable onPress={() => open(it)} onLongPress={() => update(it.id, { read: !it.read })} style={[styles.row, !it.read && styles.unread]}>
                <View style={styles.icon}>
                  <Ionicons name={it.icon} size={18} color={it.id === 'sos' ? colors.danger : colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <LinkedText style={[styles.title, !it.read && { fontFamily: fonts.bodyBold }]} text={it.title} />
                  <Text style={type.caption}>{it.body}</Text>
                  {it.invite === 'pending' && (
                    <View style={styles.actions}>
                      <Pressable style={[styles.action, styles.accept]} hitSlop={8} onPress={() => acceptInvite(it)}>
                        <Text style={[styles.actionText, { color: colors.onPrimary }]}>Accept</Text>
                      </Pressable>
                      <Pressable style={styles.action} hitSlop={8} onPress={() => update(it.id, { invite: 'declined', read: true })}>
                        <Text style={styles.actionText}>Decline</Text>
                      </Pressable>
                    </View>
                  )}
                  {it.invite === 'accepted' && <Text style={[type.caption, { color: colors.secure }]}>Joined</Text>}
                  {it.invite === 'declined' && <Text style={type.caption}>Declined · your location wasn't shared</Text>}
                </View>
                <Text style={[type.caption, !it.read && { color: colors.primary, fontFamily: fonts.bodyBold }]}>{it.time}</Text>
              </Pressable>
              </SwipeRow>
            </View>
          ))}
          {shown.length === 0 && <Text style={[type.caption, { padding: spacing.md }]}>No results for “{query}”</Text>}
        </View>
        <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.md }]}>Swipe right on a message to mark it read or unread</Text>
      </ScrollView>

      <PageSheet visible={!!opened} title={opened ? sheetTitle(opened) : ''} onClose={() => setOpenId(null)}>
        {opened && <ItemDetail item={opened} onInvite={(invite) => update(opened.id, { invite })} onClose={() => setOpenId(null)} />}
      </PageSheet>
    </View>
  );
}

// Swipe right past the threshold to toggle read/unread (Mail convention); the row springs back.
function SwipeRow({ read, onToggle, children }: { read: boolean; onToggle: () => void; children: ReactNode }) {
  const x = useRef(new Animated.Value(0)).current;
  const toggle = useRef(onToggle);
  toggle.current = onToggle;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > 10 && g.dx > Math.abs(g.dy) * 2,
      onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(g.dx, 120))),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 70) toggle.current();
        Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
      },
      onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;
  return (
    <View>
      <View style={styles.swipeBack}>
        <Ionicons name={read ? 'mail-unread' : 'mail-open'} size={20} color={colors.onPrimary} />
        <Text style={styles.swipeText}>{read ? 'Unread' : 'Read'}</Text>
      </View>
      <Animated.View style={{ transform: [{ translateX: x }], backgroundColor: colors.surface }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const sheetTitle = (it: InboxItem) =>
  it.open?.bubble ? 'Invite' : it.open?.person ? it.open.person : it.open?.event ? 'Event' : it.open?.pin ? 'Pin' : it.open?.hotspot ? 'Hotspot' : 'Message';

// What an inbox item opens: invite -> Bubble preview, message -> person with reply,
// alert -> hotspot, event -> event, pin -> pin.
// ponytail: "Show on map" just closes the sheet; jumping to the Bubbles tab needs app-level routing.
function ItemDetail({ item, onInvite, onClose }: { item: InboxItem; onInvite: (i: 'accepted' | 'declined') => void; onClose: () => void }) {
  const o = item.open ?? {};
  const person = o.person ? GROUPS.flatMap((g) => g.members).find((m) => m.name === o.person) : undefined;
  if (o.bubble) {
    const g = ALL.find((x) => x.name === o.bubble);
    return (
      <View style={styles.detail}>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Bubble size={120} tint={g ? groupColor(g.id) : colors.primary}>
            <Ionicons name={g?.icon ?? 'people'} size={34} color={g ? groupColor(g.id) : colors.primary} />
          </Bubble>
          <Text style={type.h1}>{o.bubble}</Text>
          <Text style={[type.caption, { textAlign: 'center' }]}>{item.body}</Text>
          <Text style={[type.body, { textAlign: 'center' }]}>{item.title}</Text>
        </View>
        {g && (
          <View style={[styles.card, { marginTop: spacing.lg }]}>
            {g.members.slice(0, 6).map((m, i) => (
              <View key={m.name}>
                {i > 0 && <Separator inset={56} />}
                <View style={styles.memberRow}>
                  <Avatar size={30} initials={initials(m.name)} color={memberColor(m.name)} />
                  <Text style={type.body}>{m.name}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.md }]}>Only members of this Bubble can see your location, pins and photos.</Text>
        {item.invite === 'pending' ? (
          <View style={[styles.actions, { justifyContent: 'center', marginTop: spacing.lg }]}>
            <Pressable style={[styles.action, styles.accept, styles.bigAction]} onPress={() => { onInvite('accepted'); onClose(); }}>
              <Text style={[styles.actionText, { color: colors.onPrimary }]}>Accept</Text>
            </Pressable>
            <Pressable style={[styles.action, styles.bigAction]} onPress={() => { onInvite('declined'); onClose(); }}>
              <Text style={styles.actionText}>Decline</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.md, color: item.invite === 'accepted' ? colors.secure : colors.textMuted }]}>
            {item.invite === 'accepted' ? 'You joined this Bubble' : 'You declined this invite'}
          </Text>
        )}
      </View>
    );
  }
  if (person) return <PersonView member={person} onShowOnMap={onClose} />;
  if (o.event) return <EventView event={EVENTS.find((e) => e.title === o.event) ?? null} />;
  if (o.pin) {
    const hit = allPins().find((p) => p.pin.name === o.pin);
    return hit ? <PinView pin={hit.pin} groupName={hit.group.name} color={groupColor(hit.group.id)} onShowOnMap={onClose} /> : null;
  }
  if (o.hotspot) {
    const h = GROUPS.flatMap((g) => g.hotspots).find((x) => x.name === o.hotspot);
    return h ? <LocationView loc={{ name: h.name, lat: h.lat, lng: h.lng, icon: h.icon }} /> : null;
  }
  return (
    <View style={styles.detail}>
      <Text style={type.body}>{item.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.md, gap: spacing.xs, paddingBottom: spacing.sm, overflow: 'hidden' },
  navTitle: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text },
  nav: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: spacing.md },
  link: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  searchWrap: { height: SEARCH_H, justifyContent: 'center', paddingHorizontal: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 2, height: 36 },
  searchInput: { ...type.body, flex: 1, padding: 0 },
  list: { backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  row: { flexDirection: 'row', gap: spacing.sm + 4, paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.md },
  unread: { backgroundColor: colors.primarySoft },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.body, fontSize: 16, color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  accept: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  bigAction: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  swipeBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.md, backgroundColor: colors.primary },
  swipeText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.onPrimary },
  detail: { padding: spacing.md, gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.sm + 4, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
