// Shared UI building blocks for Bubbles screens. All values come from theme.ts.
import { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, useWindowDimensions, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, spacing, type } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
type Style = StyleProp<ViewStyle>;

/* ---------- Bubbles ---------- */

// Realistic soap bubble: clear film, slightly darker rim, white reflections.
export function Bubble({ size, tint = colors.primary, children }: { size: number; tint?: string; children?: ReactNode }) {
  const r = size / 2;
  const inset = (f: number) => ({ top: size * f, left: size * f, right: size * f, bottom: size * f });
  return (
    <View style={[s.bubble, { width: size, height: size, borderRadius: r, backgroundColor: tint + '12', borderColor: tint + '59', shadowColor: tint }]}>
      {/* rim depth */}
      <View style={[s.fill, s.noTouch, { borderRadius: r, borderWidth: Math.max(2, size * 0.06), borderColor: tint + '1A' }]} />
      {/* curved window reflection, top-left */}
      <View
        style={[s.fill, s.noTouch, inset(0.08), s.arc, { borderRadius: r, borderWidth: Math.max(1.5, size * 0.035), borderTopColor: 'rgba(255,255,255,0.95)' }]}
      />
      {/* faint bounce light, bottom-right */}
      <View
        style={[s.fill, s.noTouch, inset(0.12), s.arc, { borderRadius: r, borderWidth: Math.max(1, size * 0.02), borderBottomColor: 'rgba(255,255,255,0.7)' }]}
      />
      {/* glint */}
      <View style={[s.glint, s.noTouch, { width: size * 0.08, height: size * 0.08, top: size * 0.26, left: size * 0.26 }]} />
      {children}
    </View>
  );
}

// Bubble that floats and sways; springs bigger when selected.
// still: no floating (reduced motion).
export function FloatingBubble({ size, tint, label, sublabel, count = 0, delay = 0, selected, still, onPress, style }: {
  size: number; tint: string; label: string; sublabel?: string; count?: number; delay?: number; selected?: boolean; still?: boolean;
  onPress?: () => void; style?: Style;
}) {
  const t = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    t.setValue(0);
    if (still) return;
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: 4200 + delay, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [t, delay, still]);
  useEffect(() => {
    Animated.spring(scale, { toValue: selected ? 1.15 : 1, friction: 3, tension: 120, useNativeDriver: false }).start();
  }, [scale, selected]);
  const wave = (a: number, b: number) => t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, a, 0, b, 0] });

  return (
    <Animated.View style={[{ position: 'absolute', transform: [{ translateY: wave(-12, 8) }, { translateX: wave(5, -5) }, { scale }] }, style]}>
      <Pressable onPress={onPress}>
        <Bubble size={size} tint={tint}>
          <Text numberOfLines={2} style={[s.bubbleLabel, { color: colors.text, fontSize: size > 130 ? 17 : size > 105 ? 15 : 13, maxWidth: size * 0.78 }]}>{label}</Text>
          {sublabel && <Text style={[s.bubbleSub, { color: colors.textMuted }]}>{sublabel}</Text>}
        </Bubble>
        {count > 0 && <Badge count={count} style={{ position: 'absolute', right: size * 0.08, top: size * 0.04 }} />}
      </Pressable>
    </Animated.View>
  );
}

/* ---------- People ---------- */

export function Avatar({ initials = 'MN', color = colors.primary, size = 44, ring }: { initials?: string; color?: string; size?: number; ring?: string }) {
  return (
    <View style={[s.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, ring ? { borderWidth: 3, borderColor: ring } : null]}>
      <Text style={[s.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

export function Badge({ count, style }: { count: number; style?: Style }) {
  return (
    <View style={[s.badge, style]}>
      <Text style={s.badgeText}>{count}</Text>
    </View>
  );
}

/* ---------- Map ---------- */

// Member on the map; status adds a moving arrow or an SOS ring, tag shows a label under it.
export function MemberPin({ color, initials, status, tag, style }: {
  color: string; initials?: string; status?: 'moving' | 'sos'; tag?: string; style?: Style;
}) {
  const sos = status === 'sos';
  return (
    <View style={[s.abs, s.centerX, style]}>
      <View style={[s.round, sos && s.sosRing]}>
        <Avatar color={color} initials={initials} size={36} ring={colors.surface} />
        {status === 'moving' && (
          <View style={s.movingBadge}><Ionicons name="navigate" size={9} color={colors.surface} /></View>
        )}
      </View>
      {(tag || sos) && (
        <View style={[s.tag, sos && { backgroundColor: colors.danger }]}>
          <Text style={[s.tagText, sos && { color: colors.surface }]}>{sos ? 'SOS' : tag}</Text>
        </View>
      )}
    </View>
  );
}

// Teardrop pin for dropped places; rank shows its place in the Bubble's ranking.
export function MapPin({ color, icon, rank, label, style }: { color: string; icon: IconName; rank?: number; label?: string; style?: Style }) {
  return (
    <View style={[s.abs, s.centerX, style]}>
      {(label || rank) && (
        <View style={[s.tag, s.row, { gap: 4, marginBottom: 4 }]}>
          {rank && <Text style={s.rank}>#{rank}</Text>}
          {label && <Text style={s.tagText}>{label}</Text>}
        </View>
      )}
      <View style={[s.pinHead, { backgroundColor: color }]}>
        <View style={{ transform: [{ rotate: '-45deg' }] }}>
          <Ionicons name={icon} size={14} color={colors.surface} />
        </View>
      </View>
      <View style={[s.pinGround, { borderColor: color }]} />
    </View>
  );
}

// Upcoming event on the map: rounded tag with the Bubble's color edge and a pointer at the spot.
export function EventPin({ title, when, color, style }: { title: string; when: string; color: string; style?: Style }) {
  return (
    <View style={[s.abs, s.centerX, style]}>
      <View style={s.eventTag}>
        <View style={[s.eventTagEdge, { backgroundColor: color }]} />
        <Ionicons name="calendar" size={14} color={colors.primary} />
        <View>
          <Text numberOfLines={1} style={s.eventTagTitle}>{title}</Text>
          <Text style={s.eventTagWhen}>{when}</Text>
        </View>
      </View>
      <View style={s.eventTagPointer} />
    </View>
  );
}

// Geofenced place: a shaded area, no outline. faint (dashed) = belongs to a Bubble that isn't selected.
export function LocationCircle({ size, color, icon, label, dashed, style }: {
  size: number; color: string; icon: IconName; label: string; dashed?: boolean; style?: Style;
}) {
  return (
    <View style={[s.geofence, { width: size, height: size, backgroundColor: color + (dashed ? '1F' : '38') }, style]}>
      <View style={[s.placeTag, { backgroundColor: color }]}>
        <Ionicons name={icon} size={11} color={colors.surface} />
        <Text style={s.placeTagText}>{label}</Text>
      </View>
    </View>
  );
}

export function YouDot({ style }: { style?: Style }) {
  return (
    <View style={[s.abs, s.youPulse, style]}>
      <View style={s.youDot} />
    </View>
  );
}

export function Cluster({ count, style }: { count: number; style?: Style }) {
  return (
    <View style={[s.abs, s.cluster, style]}>
      <Text style={s.clusterText}>{count}</Text>
    </View>
  );
}

export function MapButton({ icon, onPress }: { icon: IconName; onPress?: () => void }) {
  return (
    <Pressable style={s.mapButton} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

/* ---------- Surfaces ---------- */

export function Card({ children, style }: { children: ReactNode; style?: Style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

// soft = filled pill (privacy, status); outline = bordered pill (filters, legend).
export function Chip({ icon, label, color = colors.textMuted, variant = 'soft' }: { icon?: IconName; label: string; color?: string; variant?: 'soft' | 'outline' }) {
  return (
    <View style={[s.chip, variant === 'outline' ? s.chipOutline : s.chipSoft]}>
      {icon && <Ionicons name={icon} size={variant === 'soft' ? 11 : 14} color={color} />}
      <Text style={variant === 'soft' ? s.chipSoftText : s.tagText}>{label}</Text>
    </View>
  );
}

// Apple Calendar-style event row: colored left edge, title over place, time on the right.
export function EventRow({ time, title, place, groupName, color, onPress }: {
  time: string; title: string; place: string; groupName: string; color: string; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.eventRow}>
      <View style={[s.eventEdge, { backgroundColor: color }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.eventTitle}>{title}</Text>
        <Text style={type.caption}>{place} · {groupName}</Text>
      </View>
      <Text style={s.eventTime}>{time}</Text>
    </Pressable>
  );
}

// Thin, dimmed list separator, inset from the left like iOS lists.
export function Separator({ inset = spacing.md }: { inset?: number }) {
  return <View style={[s.separator, { marginLeft: inset }]} />;
}

// Button that opens a small popover menu (iOS-style). multi keeps it open for toggling filters;
// plain is an icon-only trigger; icons show on the right of items; destructive items are red.
export function MenuButton({ icon, label, options, selected = [], onSelect, multi, active, plain, icons, destructive = [] }: {
  icon: IconName; label?: string; options: string[]; selected?: string[]; onSelect: (o: string) => void; multi?: boolean; active?: boolean;
  plain?: boolean; icons?: Record<string, IconName>; destructive?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ right: number; top?: number; bottom?: number }>({ right: 0, top: 0 });
  const ref = useRef<View>(null);
  const { width, height } = useWindowDimensions();
  const show = () =>
    ref.current?.measureInWindow((x, y, w, h) => {
      // open upward when there isn't room below (e.g. buttons near the bottom of the screen)
      const fitsBelow = y + h + 6 + options.length * 50 < height - 24;
      setPos(fitsBelow ? { right: width - x - w, top: y + h + 6 } : { right: width - x - w, bottom: height - y + 6 });
      setOpen(true);
    });
  return (
    <>
      <Pressable ref={ref} onPress={show} hitSlop={plain ? 10 : 0} style={plain ? null : [s.menuBtn, active && s.menuBtnOn]}>
        <Ionicons name={icon} size={plain ? 24 : 15} color={plain ? colors.textMuted : active ? colors.primary : colors.text} />
        {label && <Text style={[s.menuBtnText, active && { color: colors.primary }]}>{label}</Text>}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
          <View style={[s.popover, pos]}>
            {options.map((o, i) => (
              <Pressable
                key={o}
                style={[s.popItem, i > 0 && s.popDivider]}
                onPress={() => {
                  onSelect(o);
                  if (!multi) setOpen(false);
                }}
              >
                <Text style={[type.body, { flex: 1 }, destructive.includes(o) && { color: colors.danger }]}>{o}</Text>
                {selected.includes(o) && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                {icons?.[o] && <Ionicons name={icons[o]} size={18} color={destructive.includes(o) ? colors.danger : colors.text} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// Full-height iOS page sheet (swipe down to close) for details, editing and creating.
export function PageSheet({ visible, title, onClose, right, children }: {
  visible: boolean; title: string; onClose: () => void; right?: ReactNode; children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.page, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
        <View style={s.pageHeader}>
          <Pressable onPress={onClose} hitSlop={10} style={{ minWidth: 60 }}>
            <Text style={s.pageAction}>Close</Text>
          </Pressable>
          <Text numberOfLines={1} style={s.pageTitle}>{title}</Text>
          <View style={{ minWidth: 60, alignItems: 'flex-end' }}>{right}</View>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Simple text tabs with an underline on the active one.
export function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.segmented}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={[s.segment, o === value && s.segmentOn]}>
          <Text style={[s.segmentText, o === value && { color: colors.primary }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- Controls ---------- */

export function Button({ title, variant = 'primary', onPress }: { title: string; variant?: 'primary' | 'secondary'; onPress?: () => void }) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.button, primary ? s.buttonPrimary : s.buttonSecondary, pressed && (primary ? { backgroundColor: colors.primaryDark } : { opacity: 0.7 })]}
    >
      <Text style={[type.button, { color: primary ? colors.surface : colors.primary }]}>{title}</Text>
    </Pressable>
  );
}

export function Checkbox({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable style={[s.row, { gap: spacing.sm, paddingVertical: spacing.xs }]} onPress={() => onChange(!value)}>
      <View style={[s.checkbox, value && s.checkboxOn]}>
        {value && <Ionicons name="checkmark" size={16} color={colors.surface} />}
      </View>
      <Text style={type.body}>{label}</Text>
    </Pressable>
  );
}

export function TextField({ label, icon, ...props }: { label: string; icon?: IconName } & TextInputProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} />}
        <TextInput style={s.input} placeholderTextColor={colors.textMuted} {...props} />
      </View>
    </View>
  );
}

// ponytail: toggled list instead of a picker library; swap for a native picker if needed.
export function Dropdown({ label, icon, options, value, onChange }: {
  label: string; icon?: IconName; options: string[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={s.label}>{label}</Text>
      <Pressable style={s.inputWrap} onPress={() => setOpen(!open)}>
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} />}
        <Text style={[type.body, { flex: 1 }]}>{value}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {open && (
        <View style={s.menu}>
          {options.map((o) => (
            <Pressable key={o} style={[s.row, s.menuItem]} onPress={() => { onChange(o); setOpen(false); }}>
              <Text style={[type.body, { flex: 1 }, o === value && { color: colors.primary, fontFamily: fonts.bodyBold }]}>{o}</Text>
              {o === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/* ---------- Navigation ---------- */

// A tab with `action: true` renders as the raised center button.
export type Tab = { icon: IconName; label: string; action?: boolean };

// Paints down behind the home indicator; content stays above it.
export function TabBar({ tabs, active, onPress }: { tabs: Tab[]; active: number; onPress?: (i: number) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab, i) => (
        <Pressable key={i} style={s.tab} onPress={() => onPress?.(i)}>
          {tab.action ? (
            <View style={s.tabAction}><Ionicons name={tab.icon} size={28} color={colors.surface} /></View>
          ) : (
            <>
              <Ionicons name={tab.icon} size={24} color={i === active ? colors.primary : colors.textMuted} />
              <Text style={[s.tabLabel, i === active && { color: colors.primary }]}>{tab.label}</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  centerX: { alignItems: 'center' },
  abs: { position: 'absolute' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  noTouch: { pointerEvents: 'none' },
  round: { borderRadius: radius.pill, ...shadow },

  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  arc: { borderColor: 'transparent', transform: [{ rotate: '-45deg' }] },
  glint: { position: 'absolute', borderRadius: radius.pill, backgroundColor: colors.surface },
  bubbleLabel: { fontFamily: fonts.bodyBold, textAlign: 'center' },
  bubbleSub: { fontFamily: fonts.body, fontSize: 11, opacity: 0.8 },

  avatarText: { color: colors.surface, fontFamily: fonts.bodyBold },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { color: colors.surface, fontFamily: fonts.bodyBold, fontSize: 11 },

  tag: { marginTop: -4, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, ...shadow },
  tagText: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold },
  rank: { fontFamily: fonts.heading, fontSize: 12, color: colors.primary },
  movingBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosRing: { borderWidth: 3, borderColor: colors.danger, padding: 2, backgroundColor: colors.danger + '33' },
  pinHead: {
    width: 30,
    height: 30,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow,
  },
  pinGround: { width: 22, height: 7, borderRadius: 4, borderWidth: 2, marginTop: 3 },
  geofence: {
    position: 'absolute',
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingLeft: spacing.sm + 4,
    paddingRight: spacing.sm + 2,
    paddingVertical: 5,
    overflow: 'hidden',
    ...shadow,
  },
  eventTagEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  eventTagTitle: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text },
  eventTagWhen: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary },
  eventTagPointer: {
    width: 10,
    height: 10,
    marginTop: -5,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  placeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
  placeTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.surface },
  youPulse: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '33', alignItems: 'center', justifyContent: 'center' },
  youDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.surface },
  cluster: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  clusterText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.surface },
  mapButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.pill },
  chipSoft: { backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  chipSoftText: { ...type.caption, fontSize: 12 },
  chipOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },

  eventTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.md },
  eventEdge: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  eventTime: { ...type.caption, color: colors.text },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  menuBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm + 2, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.background },
  menuBtnOn: { backgroundColor: colors.primarySoft },
  menuBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  popover: { position: 'absolute', minWidth: 210, backgroundColor: colors.surface, borderRadius: radius.sm + 4, ...shadow, shadowOpacity: 0.18, shadowRadius: 20 },
  popItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  popDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  page: { flex: 1, backgroundColor: colors.background },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 6 },
  pageTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text },
  pageAction: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  segmented: { flexDirection: 'row', gap: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  segment: { paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  segmentOn: { borderBottomColor: colors.primary },
  segmentText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textMuted },

  button: { borderRadius: radius.pill, paddingVertical: spacing.md - 2, alignItems: 'center' },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.primarySoft },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { ...type.caption, color: colors.text, fontFamily: fonts.bodyBold },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  input: { ...type.body, flex: 1, padding: 0 },
  menu: { backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },

  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabAction: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { ...type.caption, fontSize: 11, fontFamily: fonts.bodyBold },
});
