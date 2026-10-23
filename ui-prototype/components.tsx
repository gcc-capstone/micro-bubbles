// Shared UI building blocks for Bubbles screens. All values come from theme.ts.
import { ComponentProps, ReactNode, useEffect, useId, useRef, useState } from 'react';
import {
  Alert, Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, useWindowDimensions, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, CONTROL, CONTROL_SLOP, FIXED_TEXT, fonts, radius, shadow, spacing, type } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
type Style = StyleProp<ViewStyle>;

/* ---------- Bubbles ---------- */

// SVG arc path around (c, c) with radius rad, from angle a to b (radians, clockwise from 3 o'clock).
const arc = (c: number, rad: number, a: number, b: number) =>
  `M ${c + rad * Math.cos(a)} ${c + rad * Math.sin(a)} A ${rad} ${rad} 0 0 1 ${c + rad * Math.cos(b)} ${c + rad * Math.sin(b)}`;

// Soap bubble drawn with SVG gradients, in one tint: a nearly clear center, film that thickens
// toward the rim, a soft window reflection top-left with a sharp glint, and rim highlights.
export function Bubble({ size, tint = colors.primary, children }: { size: number; tint?: string; children?: ReactNode }) {
  const id = useId().replace(/:/g, '');
  const r = size / 2;
  const rim = Math.max(1, size * 0.018);
  const pad = 6;
  return (
    <View style={[s.bubble, { width: size, height: size, borderRadius: r, shadowColor: tint }]}>
      {/* ponytail: canvas padded past the bubble; iOS clipped the rim at the canvas edge while it swayed */}
      <Svg width={size + pad * 2} height={size + pad * 2} style={[s.abs, s.noTouch, { left: -pad, top: -pad }]}>
        <G transform={`translate(${pad} ${pad})`}>
        <Defs>
          <RadialGradient id={`film${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0.55" stopColor={tint} stopOpacity={0.03} />
            <Stop offset="0.86" stopColor={tint} stopOpacity={0.12} />
            <Stop offset="1" stopColor={tint} stopOpacity={0.42} />
          </RadialGradient>
          <RadialGradient id={`window${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r - rim} fill={`url(#film${id})`} />
        <Circle cx={r} cy={r} r={r - rim / 2} fill="none" stroke={tint} strokeOpacity={0.55} strokeWidth={rim} />
        {/* window reflection and glint */}
        <Ellipse cx={size * 0.33} cy={size * 0.26} rx={size * 0.21} ry={size * 0.12} fill={`url(#window${id})`} transform={`rotate(-38 ${size * 0.33} ${size * 0.26})`} />
        <Circle cx={size * 0.28} cy={size * 0.24} r={Math.max(1, size * 0.035)} fill="#FFFFFF" fillOpacity={0.95} />
        {/* bright curve along the top-left rim, fainter bounce light bottom-right */}
        <Path d={arc(r, r - size * 0.09, 3.55, 4.45)} fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={Math.max(1.5, size * 0.04)} strokeLinecap="round" />
        <Path d={arc(r, r - size * 0.1, 0.25, 1.6)} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={Math.max(1, size * 0.025)} strokeLinecap="round" />
        </G>
      </Svg>
      {children}
    </View>
  );
}

// Bubble that floats and sways; springs bigger when selected.
// still: no floating (reduced motion).
export function FloatingBubble({ size, tint, label, sublabel, icon, count = 0, delay = 0, selected, still, onPress, onLongPress, style }: {
  size: number; tint: string; label: string; sublabel?: string; icon?: IconName; count?: number; delay?: number; selected?: boolean; still?: boolean;
  onPress?: () => void; onLongPress?: () => void; style?: Style;
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
      <Pressable onPress={onPress} onLongPress={onLongPress}>
        <Bubble size={size} tint={tint}>
          {icon && size > 70 && <Ionicons name={icon} size={size * 0.16} color={tint} style={{ marginBottom: 2 }} />}
          <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={2} style={[s.bubbleLabel, { color: colors.text, fontSize: size > 130 ? 17 : size > 105 ? 15 : 13, maxWidth: size * 0.78 }]}>{label}</Text>
          {sublabel && <Text maxFontSizeMultiplier={FIXED_TEXT} style={[s.bubbleSub, { color: colors.textMuted }]}>{sublabel}</Text>}
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
      <Text maxFontSizeMultiplier={FIXED_TEXT} style={[s.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

export function Badge({ count, style }: { count: number; style?: Style }) {
  return (
    <View style={[s.badge, style]}>
      <Text maxFontSizeMultiplier={FIXED_TEXT} style={s.badgeText}>{count}</Text>
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
        <Avatar color={color} initials={initials} size={36} ring={'white'} />
        {status === 'moving' && (
          <View style={s.movingBadge}><Ionicons name="navigate" size={9} color={colors.onPrimary} /></View>
        )}
      </View>
      {(tag || sos) && (
        <View style={[s.tag, sos && { backgroundColor: colors.danger }]}>
          <Text maxFontSizeMultiplier={FIXED_TEXT} style={[s.tagText, sos && { color: 'white' }]}>{sos ? 'SOS' : tag}</Text>
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
          {label && <Text maxFontSizeMultiplier={FIXED_TEXT} style={s.tagText}>{label}</Text>}
        </View>
      )}
      <View style={[s.pinHead, { backgroundColor: color }]}>
        <View style={{ transform: [{ rotate: '-45deg' }] }}>
          <Ionicons name={icon} size={14} color={'white'} />
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
        <Ionicons name={icon} size={11} color={'white'} />
        <Text maxFontSizeMultiplier={FIXED_TEXT} style={s.placeTagText}>{label}</Text>
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

// Group marker. With faces: a short stack of people, then "+n" for the rest of the group.
export function Cluster({ count, faces = [], style }: { count: number; faces?: { initials: string; color: string }[]; style?: Style }) {
  if (faces.length === 0)
    return (
      <View style={[s.abs, s.cluster, style]}>
        <Text maxFontSizeMultiplier={FIXED_TEXT} style={s.clusterText}>{count}</Text>
      </View>
    );
  return (
    // wrapped in a white (black in Dark Mode) pill so it reads as one group, not separate people
    <View style={[s.abs, s.row, s.groupPill, style]}>
      {faces.map((f, i) => (
        <View key={i} style={[s.cluster, s.inPill, { backgroundColor: f.color, marginLeft: i ? -12 : 0 }]}>
          <Text maxFontSizeMultiplier={FIXED_TEXT} style={s.clusterText}>{f.initials}</Text>
        </View>
      ))}
      <View style={[s.cluster, s.inPill, { marginLeft: -12 }]}>
        <Text maxFontSizeMultiplier={FIXED_TEXT} style={s.clusterText}>+{count - faces.length}</Text>
      </View>
    </View>
  );
}

// Marker on the map's edge for someone off screen: their face, and just outside it a small, quiet
// isosceles triangle pointing their way.
const EDGE_BOX = 84;
export function EdgeMarker({ initials, color, angle, count = 1, style }: { initials: string; color: string; angle: number; count?: number; style?: Style }) {
  return (
    <View style={[s.abs, s.center, { width: EDGE_BOX, height: EDGE_BOX }, style]} pointerEvents="box-none">
      <View style={[s.abs, s.center, { width: EDGE_BOX, height: EDGE_BOX, transform: [{ rotate: `${angle}rad` }] }]} pointerEvents="none">
        <View style={[s.edgeArrow, { left: EDGE_BOX / 2 + 22 }]} />
      </View>
      <View style={[s.cluster, { width: 36, height: 36, borderWidth: 3, backgroundColor: color }]}>
        <Text maxFontSizeMultiplier={FIXED_TEXT} style={[s.clusterText, { fontSize: 12 }]}>{initials}</Text>
      </View>
      {count > 1 && <Badge count={count} style={{ position: 'absolute', top: EDGE_BOX / 2 - 26, left: EDGE_BOX / 2 - 26, backgroundColor: colors.primary }} />}
    </View>
  );
}

export function MapButton({ icon, onPress }: { icon: IconName; onPress?: () => void }) {
  return (
    <Pressable style={s.mapButton} onPress={onPress} hitSlop={CONTROL_SLOP}>
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
      <Text maxFontSizeMultiplier={FIXED_TEXT} style={variant === 'soft' ? s.chipSoftText : s.tagText}>{label}</Text>
    </View>
  );
}

// Apple Calendar-style event row: colored left edge, title over place, time on the right.
export function EventRow({ time, title, place, groupName, color, onPress }: {
  time: string; title: string; place: ReactNode; groupName: string; color: string; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.eventRow}>
      <View style={[s.eventEdge, { backgroundColor: color }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={s.eventTitle}>{title}</Text>
        {/* one line on narrow phones: place keeps priority, Bubble name truncates */}
        <View style={s.row}>
          <View style={{ flexShrink: 0, maxWidth: '70%' }}>{typeof place === 'string' ? <Text numberOfLines={1} style={type.caption}>{place}</Text> : place}</View>
          <Text numberOfLines={1} style={[type.caption, { flexShrink: 1 }]}> · {groupName}</Text>
        </View>
      </View>
      <Text style={s.eventTime}>{time}</Text>
    </Pressable>
  );
}

// Thin, dimmed list separator, inset from the left like iOS lists.
export function Separator({ inset = spacing.md }: { inset?: number }) {
  return <View style={[s.separator, { marginLeft: inset }]} />;
}

// Menu that looks like iOS pull-down and context menus, built in React Native (the real UIMenu
// needs a native module Expo Go doesn't have): a translucent rounded card that springs out of
// its anchor, 44 pt rows with the label leading and the icon trailing, checkmarks in a leading
// column, destructive items red and grouped after a thicker gap, an optional small title.
// anchor: the button's rect, or a touch point (w = h = 0). dim: darken behind it (context menus).
export type MenuAnchor = { x: number; y: number; w: number; h: number };
const MENU_W = 250;
const ROW = 44;
export function PopMenu({ visible, anchor, title, options, icons, destructive = [], selected = [], multi, dim, onSelect, onClose }: {
  visible: boolean; anchor: MenuAnchor | null; title?: string; options: string[]; icons?: Record<string, IconName>; destructive?: string[];
  selected?: string[]; multi?: boolean; dim?: boolean; onSelect: (o: string) => void; onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (visible) {
      setShown(true);
      v.setValue(0);
      Animated.spring(v, { toValue: 1, damping: 18, stiffness: 260, mass: 0.7, useNativeDriver: true }).start();
    } else if (shown) {
      Animated.timing(v, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setShown(false));
    }
  }, [visible]);
  if (!shown || !anchor) return null;

  const groups = [options.filter((o) => !destructive.includes(o)), options.filter((o) => destructive.includes(o))].filter((g) => g.length);
  const checks = multi || selected.length > 0;
  const est = (title ? 34 : 0) + options.length * ROW + (groups.length - 1) * 8;
  const below = anchor.y + anchor.h + 8 + est < height - 24;
  const mid = anchor.x + anchor.w / 2;
  const side = mid < width / 3 ? 'left' : mid > (width * 2) / 3 ? 'right' : 'center';
  const left = Math.max(8, Math.min(width - MENU_W - 8, side === 'left' ? anchor.x : side === 'right' ? anchor.x + anchor.w - MENU_W : mid - MENU_W / 2));
  const pos = below ? { top: anchor.y + anchor.h + 8 } : { bottom: height - anchor.y + 8 };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        {dim && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.18)', opacity: v }]} />}
      </Pressable>
      <Animated.View
        style={[
          s.popMenu,
          pos,
          { left, opacity: v.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }) },
          { transformOrigin: `${below ? 'top' : 'bottom'} ${side}`, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] },
        ]}
      >
        <View style={s.popClip}>
        {title && <Text style={s.menuTitle}>{title}</Text>}
        {groups.map((g, gi) => (
          <View key={gi} style={gi > 0 && s.menuGap}>
            {g.map((o, i) => {
              const bad = destructive.includes(o);
              const tint = bad ? colors.danger : colors.text;
              return (
                <Pressable
                  key={o}
                  onPress={() => {
                    onSelect(o);
                    if (!multi) onClose();
                  }}
                  style={({ pressed }) => [s.menuRow, (i > 0 || (gi === 0 && !!title)) && s.menuSep, pressed && { backgroundColor: colors.text + '14' }]}
                >
                  {checks && <View style={{ width: 22 }}>{selected.includes(o) && <Ionicons name="checkmark" size={17} color={colors.text} />}</View>}
                  <Text maxFontSizeMultiplier={FIXED_TEXT} numberOfLines={1} style={[s.menuText, { color: tint }]}>{o}</Text>
                  {icons?.[o] && <Ionicons name={icons[o]} size={19} color={tint} />}
                </Pressable>
              );
            })}
          </View>
        ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

// Button that opens a PopMenu. selected items get a checkmark; multi keeps it open for several.
// plain is an icon-only trigger; icons show on the right of items; destructive items are red.
// trigger/triggerStyle replace the default button look (e.g. the map's + button).
export function MenuButton({ icon, label, options, selected = [], onSelect, multi, active, plain, icons, destructive = [], trigger, triggerStyle }: {
  icon: IconName; label?: string; options: string[]; selected?: string[]; onSelect: (o: string) => void; multi?: boolean; active?: boolean;
  plain?: boolean; icons?: Record<string, IconName>; destructive?: string[]; trigger?: ReactNode; triggerStyle?: Style;
}) {
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<View>(null);
  const show = () =>
    ref.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setOpen(true);
    });
  return (
    <>
      <Pressable ref={ref} onPress={show} hitSlop={plain ? 10 : 9} style={trigger ? triggerStyle : plain ? null : [s.menuBtn, active && s.menuBtnOn]}>
        {trigger ?? (
          <>
            <Ionicons name={icon} size={plain ? 24 : 15} color={plain ? colors.textMuted : active ? colors.primary : colors.text} />
            {label && <Text style={[s.menuBtnText, active && { color: colors.primary }]}>{label}</Text>}
          </>
        )}
      </Pressable>
      <PopMenu
        visible={open}
        anchor={anchor}
        options={options}
        icons={icons}
        destructive={destructive}
        selected={selected}
        multi={multi}
        onSelect={onSelect}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

// Full-height iOS page sheet (swipe down to close) for details, editing and creating.
// cancel: a create/edit form, with Cancel at the leading edge (asks first when dirty); otherwise a
// view-only sheet with Done (trailing, or leading when `right` holds the sheet's own actions).
export function PageSheet({ visible, title, onClose, right, cancel, dirty, children }: {
  visible: boolean; title: string; onClose: () => void; right?: ReactNode; cancel?: boolean; dirty?: boolean; children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const close = () =>
    cancel && dirty
      ? Alert.alert('Discard Changes?', undefined, [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ])
      : onClose();
  const done = (
    <Pressable onPress={onClose} hitSlop={10}>
      <Text style={[s.pageAction, { fontFamily: fonts.bodyBold }]}>Done</Text>
    </Pressable>
  );
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={[s.page, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
        <View style={s.pageHeader}>
          <View style={{ minWidth: 60 }}>
            {cancel ? (
              <Pressable onPress={close} hitSlop={10}>
                <Text style={s.pageAction}>Cancel</Text>
              </Pressable>
            ) : (
              right && done
            )}
          </View>
          <Text numberOfLines={1} style={s.pageTitle}>{title}</Text>
          <View style={{ minWidth: 60, alignItems: 'flex-end' }}>{right ?? (!cancel && done)}</View>
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

// Centered pill of tabs in a frosted "liquid glass" capsule (like Telegram's Members / Media bar):
// a translucent track with a bright rim, and a raised glass lozenge behind the selected tab.
// ponytail: no real blur (that needs a native view); the tint and rim carry the glass look.
export function GlassTabs({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.glassTrack}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={[s.glassTab, o === value && s.glassTabOn]} hitSlop={4}>
          <Text maxFontSizeMultiplier={FIXED_TEXT} style={[s.glassText, o === value && { color: colors.text }]}>{o}</Text>
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
      <Text style={[type.button, { color: primary ? colors.onPrimary : colors.primary }]}>{title}</Text>
    </Pressable>
  );
}

export function Checkbox({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable style={[s.row, { gap: spacing.sm, paddingVertical: spacing.xs }]} onPress={() => onChange(!value)}>
      <View style={[s.checkbox, value && s.checkboxOn]}>
        {value && <Ionicons name="checkmark" size={16} color={colors.onPrimary} />}
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
export type Tab = { icon: IconName; label: string; action?: boolean; badge?: number };

// Paints down behind the home indicator; content stays above it.
export function TabBar({ tabs, active, onPress }: { tabs: Tab[]; active: number; onPress?: (i: number) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab, i) => (
        <Pressable key={i} style={s.tab} onPress={() => onPress?.(i)}>
          {tab.action ? (
            <View style={s.tabAction}><Ionicons name={tab.icon} size={24} color={colors.primary} /></View>
          ) : (
            <>
              {/* filled glyph for the selected tab, outline for the rest (iOS tab bars) */}
              <Ionicons name={(i === active ? tab.icon.replace('-outline', '') : tab.icon) as IconName} size={24} color={i === active ? colors.primary : colors.textMuted} />
              {!!tab.badge && <Badge count={tab.badge} style={{ position: 'absolute', top: 0, left: '55%' }} />}
              <Text maxFontSizeMultiplier={FIXED_TEXT} style={[s.tabLabel, i === active && { color: colors.primary }]}>{tab.label}</Text>
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
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bubbleLabel: { fontFamily: fonts.bodyBold, textAlign: 'center' },
  bubbleSub: { fontFamily: fonts.body, fontSize: 11, opacity: 0.8 },

  avatarText: { color: 'white', fontFamily: fonts.bodyBold },
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
  badgeText: { color: 'white', fontFamily: fonts.bodyBold, fontSize: 11 },

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
    borderColor: 'white',
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
    borderColor: 'white',
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
  placeTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: 'white' },
  youPulse: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '33', alignItems: 'center', justifyContent: 'center' },
  youDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, borderWidth: 3, borderColor: 'white' },
  cluster: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  // triangle from borders: a flat wedge, 12 pt base and 6 pt tall, pointing right (rotated by the parent)
  edgeArrow: { position: 'absolute', top: EDGE_BOX / 2 - 6, width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 6, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: colors.text, opacity: 0.45 },
  groupPill: { padding: 3, borderRadius: radius.pill, backgroundColor: colors.surface, ...shadow, shadowOpacity: 0.18 },
  inPill: { borderColor: colors.surface, shadowOpacity: 0 }, // rings match the pill; the pill carries the shadow
  clusterText: { fontFamily: fonts.bodyBold, fontSize: 12, color: 'white' },
  mapButton: { width: CONTROL, height: CONTROL, borderRadius: CONTROL / 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.pill },
  chipSoft: { backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  chipSoftText: { ...type.caption, fontSize: 12 },
  chipOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },

  eventTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  eventEdge: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  eventTime: { ...type.caption, color: colors.text },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  menuBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm + 2, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.background },
  menuBtnOn: { backgroundColor: colors.primarySoft },
  menuBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  // shadow on the outer view; the inner one clips rows to the rounded corners (clipping would hide the shadow)
  popMenu: { position: 'absolute', width: MENU_W, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 28, shadowOffset: { width: 0, height: 10 } },
  popClip: { borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surface + 'F7', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  menuTitle: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.md, paddingVertical: 9 },
  menuRow: { height: ROW, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  menuSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  menuGap: { borderTopWidth: 8, borderTopColor: colors.text + '12' }, // iOS groups menu sections with a thicker band
  menuText: { flex: 1, fontFamily: fonts.body, fontSize: 17 },
  page: { flex: 1, backgroundColor: colors.background },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 6 },
  pageTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text },
  pageAction: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  glassTrack: {
    alignSelf: 'center',
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.text + '0D',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  glassTab: { minWidth: 88, height: 28, paddingHorizontal: spacing.md, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  glassTabOn: {
    backgroundColor: colors.surface + 'E6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  glassText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted },
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
  input: { ...type.input, flex: 1, padding: 0 },
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
  // subtle round + between tabs: tinted, not a loud filled button
  tabAction: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { ...type.caption, fontSize: 11, fontFamily: fonts.bodyBold },
});
