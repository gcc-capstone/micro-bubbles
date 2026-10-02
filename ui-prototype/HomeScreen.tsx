// Home: floating Bubbles sized by member count. Tapping one collapses them into a bottom row
// and reveals the map; tapping the selected Bubble again opens the info sheet.
import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Bubble, Chip, EventCard, FloatingBubble, MapButton, Segmented } from './components';
import { colors, fonts, radius, shadow, spacing, type } from './theme';
import { ALL, eventsFor, Group, groupColor, initials, Member, memberColor } from './data';
import BubbleMap from './BubbleMap';

const ROW_H = 112;
const RS = 60; // row bubble size
const GAP = 16;
const SHEET_MIN = 72;
const TABS = ['Members', 'Pins', 'Events', 'Places'];

// Field is designed on a 375 x 560 canvas and scaled to fit. Centers are tuned for the
// sizes below; ponytail: hand-placed for 6 Bubbles, needs a packing layout if that grows.
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

export default function HomeScreen() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [mode, setMode] = useState<'field' | 'animating' | 'row'>('field');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const [focus, setFocus] = useState<Member | null>(null);
  const [notify, setNotify] = useState<Record<string, boolean>>({ 'Davis Park': true });
  const p = useRef(new Animated.Value(0)).current;
  const sheetP = useRef(new Animated.Value(0)).current;

  const { w, h } = size;
  const fieldTop = 64;
  const k = Math.min(w / CANVAS.w, (h - fieldTop - 8) / CANVAS.h);
  const offX = (w - CANVAS.w * k) / 2;
  const offY = fieldTop + (h - fieldTop - 8 - CANVAS.h * k) / 2;

  const toggleSheet = (open: boolean) => {
    setSheetOpen(open);
    Animated.timing(sheetP, { toValue: open ? 1 : 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  };

  const select = (i: number) => {
    if (mode === 'row') {
      if (i === selected) return toggleSheet(!sheetOpen);
      setSelected(i);
      setFocus(null);
      return;
    }
    if (mode !== 'field') return;
    setSelected(i);
    setMode('animating');
    Animated.timing(p, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(() => setMode('row'));
  };

  const backToField = () => {
    toggleSheet(false);
    setFocus(null);
    setMode('animating');
    Animated.timing(p, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(() => {
      setMode('field');
      setSelected(null);
    });
  };

  const group: Group | null = selected === null ? null : ALL[selected];
  const color = group ? groupColor(group.id) : colors.primary;
  const sheetMax = (h - ROW_H) * 0.7;

  return (
    <View style={styles.fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* Map, revealed as the bubble panel collapses */}
      {group && (
        <Animated.View style={[styles.mapArea, { opacity: p }]}>
          <BubbleMap
            members={group.members}
            places={group.places}
            pins={group.pins}
            color={color}
            focus={focus}
            bottomInset={SHEET_MIN}
            onMemberPress={setFocus}
          />
          <Pressable style={styles.backPill} onPress={backToField}>
            <Ionicons name="chevron-back" size={16} color={colors.text} />
            <Text style={styles.backText}>All Bubbles</Text>
          </Pressable>
          <View style={[styles.mapControls, { bottom: SHEET_MIN + spacing.md }]}>
            <MapButton icon="scan-outline" onPress={() => setFocus(null)} />
          </View>
        </Animated.View>
      )}

      {/* Info sheet above the row */}
      {group && w > 0 && (
        <Animated.View
          style={[
            styles.sheet,
            { bottom: ROW_H - radius.md, opacity: p, height: sheetP.interpolate({ inputRange: [0, 1], outputRange: [SHEET_MIN + radius.md, sheetMax] }) },
          ]}
        >
          <Pressable onPress={() => toggleSheet(!sheetOpen)} style={styles.sheetHeader}>
            <View style={styles.handle} />
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Bubble size={22} tint={color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{group.name}</Text>
                <Text style={type.caption}>
                  {group.members.length} members · {group.pins.length} pins · {eventsFor(group).length} events
                </Text>
              </View>
              <Ionicons name={sheetOpen ? 'chevron-down' : 'chevron-up'} size={20} color={colors.textMuted} />
            </View>
          </Pressable>
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
            <Segmented options={TABS} value={tab} onChange={setTab} />
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            {tab === 'Members' && (
              <>
                {group.activity && (
                  <View style={[styles.activity, { borderColor: color }]}>
                    <Ionicons name="enter-outline" size={16} color={color} />
                    <Text style={[type.caption, { color: colors.text, flex: 1 }]}>{group.activity}</Text>
                    <Text style={type.caption}>1m</Text>
                  </View>
                )}
                {group.members.map((m, i) => (
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
                      <Text style={type.caption}>{m.updated}</Text>
                      <View style={[styles.row, { gap: 2 }]}>
                        <Ionicons name={m.battery < 30 ? 'battery-dead' : 'battery-half'} size={14} color={m.battery < 30 ? colors.danger : colors.textMuted} />
                        <Text style={type.caption}>{m.battery}%</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            )}

            {tab === 'Pins' &&
              [...group.pins]
                .sort((a, b) => b.rating - a.rating)
                .map((pin, i) => (
                  <View key={pin.name} style={[styles.listRow, i > 0 && styles.divider]}>
                    <View style={[styles.rankCircle, i === 0 && { backgroundColor: colors.primary }]}>
                      <Text style={[styles.rankNum, i === 0 && { color: colors.surface }]}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.rowTitle}>{pin.name}</Text>
                      <View style={styles.row}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Ionicons key={n} name={n <= pin.rating ? 'star' : 'star-outline'} size={13} color={colors.primary} />
                        ))}
                        <Text style={[type.caption, { marginLeft: spacing.xs }]}>by {pin.by}</Text>
                      </View>
                      <Text style={type.caption}>{pin.note}</Text>
                    </View>
                    <Ionicons name={pin.icon} size={20} color={color} />
                  </View>
                ))}

            {tab === 'Events' && (
              <View style={{ gap: spacing.sm }}>
                {eventsFor(group).map((e, i) => (
                  <EventCard
                    key={i}
                    date={e.date}
                    title={e.title}
                    time={e.time}
                    place={e.place}
                    color={groupColor(e.groupId)}
                    groupName={ALL.find((g) => g.id === e.groupId)!.name}
                    going={e.going.map((n) => ({ initials: initials(n), color: memberColor(n) }))}
                  />
                ))}
              </View>
            )}

            {tab === 'Places' &&
              group.places.map((pl, i) => (
                <View key={pl.name} style={[styles.listRow, i > 0 && styles.divider]}>
                  <View style={[styles.placeIcon, { borderColor: color, backgroundColor: color + '1F' }]}>
                    <Ionicons name={pl.icon} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{pl.name}</Text>
                    <Text style={type.caption}>{pl.radius} m radius · arrivals & departures</Text>
                  </View>
                  <Pressable onPress={() => setNotify({ ...notify, [pl.name]: !notify[pl.name] })} hitSlop={8}>
                    <Ionicons
                      name={notify[pl.name] ? 'notifications' : 'notifications-off-outline'}
                      size={22}
                      color={notify[pl.name] ? colors.primary : colors.textMuted}
                    />
                  </Pressable>
                </View>
              ))}

            <View style={{ marginTop: spacing.md }}>
              <Chip icon="lock-closed" color={colors.secure} label="Only this Bubble sees this" />
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Bubble panel: full screen in field mode, shrinks to the bottom row */}
      <Animated.View
        style={[
          styles.panel,
          {
            height: p.interpolate({ inputRange: [0, 1], outputRange: [h || 1, ROW_H] }),
            borderTopLeftRadius: p.interpolate({ inputRange: [0, 1], outputRange: [0, radius.md] }),
            borderTopRightRadius: p.interpolate({ inputRange: [0, 1], outputRange: [0, radius.md] }),
          },
        ]}
      />
      {mode !== 'row' && (
        <Animated.View style={[styles.title, { opacity: p.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] }) }]}>
          <Text style={type.h2}>Your Bubbles</Text>
          <Text style={type.caption}>Tap a Bubble to see where everyone is.</Text>
        </Animated.View>
      )}

      {/* Floating bubbles that fly into the row */}
      {mode !== 'row' && w > 0 &&
        ALL.map((g, i) => {
          const s = bubbleSize(g.members.length) * k;
          const c = CENTERS[i % CENTERS.length];
          const fx = offX + c.x * k - s / 2;
          const fy = offY + c.y * k - s / 2;
          const rx = spacing.md + i * (RS + GAP) + RS / 2 - s / 2;
          const ry = h - ROW_H + 12 + RS / 2 - s / 2;
          return (
            <Animated.View
              key={g.id}
              style={{
                position: 'absolute',
                width: s,
                height: s,
                transform: [
                  { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [fx, rx] }) },
                  { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [fy, ry] }) },
                  { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, RS / s] }) },
                ],
              }}
            >
              <FloatingBubble
                size={s}
                tint={groupColor(g.id)}
                label={g.name}
                sublabel={`${g.members.length} ${g.id === 'everyone' ? 'people' : 'members'}`}
                count={g.unread}
                delay={i * 500}
                onPress={() => select(i)}
                style={{ left: 0, top: 0 }}
              />
            </Animated.View>
          );
        })}

      {/* Scrollable row once collapsed */}
      {mode === 'row' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll} contentContainerStyle={styles.rowContent}>
          {ALL.map((g, i) => (
            <Pressable key={g.id} onPress={() => select(i)} style={{ width: RS, alignItems: 'center' }}>
              <Bubble size={RS} tint={groupColor(g.id)}>
                {g.id === 'everyone' && <Ionicons name="people" size={22} color={groupColor(g.id)} />}
              </Bubble>
              {g.unread > 0 && <Badge count={g.unread} style={{ position: 'absolute', right: -4, top: -2 }} />}
              <Text numberOfLines={2} style={[styles.rowLabel, i === selected && { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                {g.name}
              </Text>
              {i === selected && <View style={styles.selDot} />}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: ROW_H - radius.md },
  backPill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.xs + 2,
    ...shadow,
  },
  backText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  mapControls: { position: 'absolute', right: spacing.sm },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.primarySoft, pointerEvents: 'none', ...shadow },
  title: { position: 'absolute', top: spacing.md, left: spacing.md, pointerEvents: 'none' },
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
  sheetBody: { paddingHorizontal: spacing.md, paddingBottom: radius.md + spacing.md },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 2 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  rankCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontFamily: fonts.heading, fontSize: 14, color: colors.primary },
  placeIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rowScroll: { position: 'absolute', left: 0, right: 0, bottom: 0, height: ROW_H },
  rowContent: { paddingHorizontal: spacing.md, paddingTop: 12, gap: GAP },
  rowLabel: { ...type.caption, fontSize: 11, lineHeight: 13, marginTop: 4, width: RS + GAP, textAlign: 'center' },
  selDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 2 },
});
