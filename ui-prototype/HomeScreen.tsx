// Home: floating Bubbles sized by member count. Tapping one collapses them into a compact row
// under a full-bleed map; the selected Bubble's sheet sits on top of the row.
// Re-tapping the Bubbles tab (resetKey) returns to the floating view.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Bubble, Chip, FloatingBubble, MapButton, Segmented } from './components';
import { colors, fonts, radius, shadow, spacing, type } from './theme';
import { ALL, Group, groupColor, initials, ME, memberColor } from './data';
import BubbleMap, { Focus } from './BubbleMap';

const RS = 44; // row bubble size
const GAP = 12;
const ROW_H = 78;
const SHEET_MIN = 66;
const MAX_ROW = 11; // more than this many Bubbles shows a "More bubbles..." bubble
const TABS = ['Activity', 'Members'];

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

export default function HomeScreen({ resetKey }: { resetKey: number }) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [mode, setMode] = useState<'field' | 'animating' | 'row'>('field');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [toast, setToast] = useState('');
  const p = useRef(new Animated.Value(0)).current;
  const sheetP = useRef(new Animated.Value(0)).current;

  const { w, h } = size;
  const fieldTop = insets.top + 64;
  const k = Math.min(w / CANVAS.w, (h - fieldTop - 8) / CANVAS.h);
  const offX = (w - CANVAS.w * k) / 2;
  const offY = fieldTop + (h - fieldTop - 8 - CANVAS.h * k) / 2;
  const overflow = ALL.length > MAX_ROW;
  const rowGroups = overflow ? ALL.slice(0, MAX_ROW - 1) : ALL;

  const toggleSheet = (open: boolean) => {
    setSheetOpen(open);
    Animated.timing(sheetP, { toValue: open ? 1 : 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
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

  useEffect(() => {
    if (resetKey && mode === 'row') backToField();
  }, [resetKey]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const group: Group | null = selected === null ? null : ALL[selected];
  const color = group ? groupColor(group.id) : colors.primary;
  const sheetMax = (h - ROW_H - insets.top) * 0.75;

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
          <ScrollView contentContainerStyle={styles.sheetBody}>
            {tab === 'Activity' &&
              group.activity.map((a, i) => (
                <View key={i} style={[styles.listRow, i > 0 && styles.divider]}>
                  <View style={[styles.activityIcon, { backgroundColor: color + '1F' }]}>
                    <Ionicons name={a.icon} size={18} color={color} />
                  </View>
                  <Text style={[type.body, { flex: 1 }]}>{a.text}</Text>
                  <Text style={type.caption}>{a.time}</Text>
                </View>
              ))}

            {tab === 'Members' &&
              group.members.map((m, i) => (
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

            <View style={{ marginTop: spacing.md }}>
              <Chip icon="lock-closed" color={colors.secure} label="Only this Bubble sees this" />
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Bubble panel: full screen in field mode, shrinks into the row strip */}
      <Animated.View
        style={[
          styles.panel,
          {
            height: p.interpolate({ inputRange: [0, 1], outputRange: [h || 1, ROW_H] }),
            backgroundColor: p.interpolate({ inputRange: [0, 1], outputRange: [colors.primarySoft, colors.surface] }),
          },
        ]}
      />
      {mode !== 'row' && (
        <Animated.Text style={[type.largeTitle, styles.title, { top: insets.top + spacing.sm, opacity: p.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] }) }]}>
          Your Bubbles
        </Animated.Text>
      )}

      {/* Floating bubbles that fly into the row */}
      {mode !== 'row' && w > 0 &&
        ALL.map((g, i) => {
          const s = bubbleSize(g.members.length) * k;
          const c = CENTERS[i % CENTERS.length];
          const slot = Math.min(i, MAX_ROW - 1);
          const fx = offX + c.x * k - s / 2;
          const fy = offY + c.y * k - s / 2;
          const rx = spacing.md + slot * (RS + GAP) + RS / 2 - s / 2;
          const ry = h - ROW_H + spacing.sm + RS / 2 - s / 2;
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

      {/* Compact scrollable row once collapsed */}
      {mode === 'row' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll} contentContainerStyle={styles.rowContent}>
          {rowGroups.map((g, i) => (
            <Pressable key={g.id} onPress={() => select(i)} style={styles.rowItem}>
              <Bubble size={RS} tint={groupColor(g.id)}>
                {g.id === 'everyone' && <Ionicons name="people" size={18} color={groupColor(g.id)} />}
              </Bubble>
              {g.unread > 0 && <Badge count={g.unread} style={styles.rowBadge} />}
              <Text numberOfLines={1} style={[styles.rowLabel, i === selected && { color: colors.primary, fontFamily: fonts.bodyBold }]}>
                {g.name}
              </Text>
            </Pressable>
          ))}
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
  sheetBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 2 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  activityIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
