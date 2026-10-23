// Native map (Apple Maps on iOS, Google Maps on Android). BubbleMap.web.tsx is the browser stand-in.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Cluster, EdgeMarker, EventPin, MapPin, MemberPin, YouDot } from './components';
import { aroundMe, edgeSpot, scaleBar, spread, toScreen, visibleLabels } from './mapFit';
import { groupNearby } from './cluster';
import { colors, FIXED_TEXT, fonts, isDark, radius, spacing } from './theme';
import { initials, Member, memberColor, ME, minutesAgo, Pin, Hotspot } from './data';

export type Focus = { name: string; lat: number; lng: number };
export type MapEvent = { key: string; title: string; when: string; color: string; lat: number; lng: number };

// Below this zoom (degrees of latitude on screen) nothing is grouped, so people at the same spot stay tappable.
const GROUP_UNTIL = 0.003;
const GROUP_MIN = 5; // smaller overlaps stay as individual markers
const FACES_UNTIL = 10; // groups this small show a couple of faces, then +n
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

type Item = { key: string; lat: number; lng: number; kind: 'member' | 'pin' | 'event'; member?: Member; pin?: Pin; event?: MapEvent };

export type BubbleMapProps = {
  members: Member[];
  hotspots: Hotspot[];
  pins: Pin[];
  color: string;
  focus: Focus | null; // a member or "You" to zoom to; null fits everyone
  topInset: number; // status bar + overlay buttons, kept clear when fitting
  bottomInset: number; // space covered by the sheet/row, kept clear when fitting
  onMemberPress: (m: Member) => void;
  onPinPress?: (p: Pin) => void;
  onPlacePress?: (p: Hotspot) => void;
  events?: MapEvent[];
  onEventPress?: (key: string) => void;
  radiusMi?: number;
  hideEdges?: boolean; // hide off-screen markers (e.g. while a panel covers the map)
  recenter?: number; // bump to return to the default view (locate button)
  dropped?: { lat: number; lng: number } | null; // a long-pressed spot, shown as a pin
  onLongPress?: (c: { lat: number; lng: number; x: number; y: number }) => void; // long-press on the map; x/y = touch point on the map view
  onCenterChange?: (c: { lat: number; lng: number }) => void; // after the user pans (Drop Pin) // when set (and nothing is focused), center on you and show this radius
};

export default function BubbleMap({ members, hotspots, pins, color, focus, topInset, bottomInset, onMemberPress, onPinPress, onPlacePress, events = [], onEventPress, radiusMi, onCenterChange, hideEdges, recenter, onLongPress, dropped }: BubbleMapProps) {
  const map = useRef<MapView>(null);
  const ready = useRef(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });

  // Everything that can be grouped; the focused person always stands alone.
  const items: Item[] = [
    ...members.map((m) => ({ key: 'm-' + m.name, lat: m.lat, lng: m.lng, kind: 'member' as const, member: m })),
    ...pins.map((pn) => ({ key: 'p-' + pn.name, lat: pn.lat, lng: pn.lng, kind: 'pin' as const, pin: pn })),
    ...events.map((e) => ({ key: 'e-' + e.key, lat: e.lat, lng: e.lng, kind: 'event' as const, event: e })),
  ];
  const grouping = region && region.latitudeDelta > GROUP_UNTIL;
  const toPx = (it: Item) => toScreen(region!, size, { top: topInset, bottom: bottomInset }, it);
  const multi = grouping ? groupNearby(items.filter((it) => !(it.member && it.member.name === focus?.name)), toPx).filter((g) => g.length >= GROUP_MIN) : [];
  const hidden = new Set(multi.flat().map((it) => it.key));

  // Nudge whatever still overlaps on screen (people, pins, events) apart, a short way at most; your
  // dot, group counts and the focused person stay put. Hotspot names then hide where they'd collide.
  // Circles approximate each marker's footprint.
  // ponytail: centerOffset is iOS-only in react-native-maps; Android would need anchor math instead.
  const nudge = new Map<string, { x: number; y: number }>();
  let tagShown = hotspots.map(() => true);
  if (region) {
    const solid = [
      ...items
        .filter((it) => !hidden.has(it.key))
        .map((it) => {
          const p = toPx(it);
          // anchors differ: pins and events hang above their point, member pins sit slightly below
          const lift = it.kind === 'member' ? 8 : -22;
          return { key: it.key, x: p.x, y: p.y + lift, r: it.kind === 'event' ? 34 : it.kind === 'pin' ? 21 : 24, fixed: it.member?.name === focus?.name };
        }),
      { key: 'you', ...toPx({ key: '', kind: 'pin', lat: ME.lat, lng: ME.lng }), r: 12, fixed: true },
      ...multi.map((g, i) => ({ key: 'group-' + i, ...toPx({ key: '', kind: 'pin', lat: avg(g.map((it) => it.lat)), lng: avg(g.map((it) => it.lng)) }), r: 22, fixed: true })),
    ];
    const moved = spread(solid);
    moved.forEach((o, i) => (o.dx || o.dy) && nudge.set(solid[i].key, { x: o.dx, y: o.dy }));
    tagShown = visibleLabels(
      hotspots.map((h) => ({ ...toPx({ key: '', kind: 'pin', lat: h.lat, lng: h.lng }), w: 30 + h.name.length * 6.5, h: 20 })),
      solid.map((m, i) => ({ x: m.x + moved[i].dx, y: m.y + moved[i].dy, w: m.r * 2, h: m.r * 2 })),
    );
  }

  // ponytail: iOS react-native-maps can leave markers on screen after they unmount, so every marker
  // stays mounted: grouped ones turn invisible, and group bubbles come from a fixed pool.

  const renderItem = (it: Item) => {
    const off = hidden.has(it.key);
    if (it.pin) {
      const pin = it.pin;
      return (
        <Marker key={it.key} coordinate={{ latitude: pin.lat, longitude: pin.lng }} centerOffset={nudge.get(it.key)} anchor={{ x: 0.5, y: 1 }} tracksViewChanges onPress={() => !off && onPinPress?.(pin)}>
          <MapPin color={color} icon={pin.icon} style={{ position: 'relative', opacity: off ? 0 : 1 }} />
        </Marker>
      );
    }
    if (it.event) {
      const e = it.event;
      return (
        <Marker key={it.key} coordinate={{ latitude: e.lat, longitude: e.lng }} centerOffset={nudge.get(it.key)} anchor={{ x: 0.5, y: 1 }} tracksViewChanges onPress={() => !off && onEventPress?.(e.key)} zIndex={5}>
          <EventPin title={e.title} when={e.when} color={e.color} style={{ position: 'relative', opacity: off ? 0 : 1 }} />
        </Marker>
      );
    }
    const m = it.member!;
    return (
      <Marker key={it.key} coordinate={{ latitude: m.lat, longitude: m.lng }} centerOffset={nudge.get(it.key)} anchor={{ x: 0.5, y: 0.3 }} onPress={() => !off && onMemberPress(m)} zIndex={focus?.name === m.name ? 10 : 1}>
        <MemberPin
          color={memberColor(m.name)}
          initials={initials(m.name)}
          status={m.moving ? 'moving' : undefined}
          tag={focus?.name === m.name ? m.name.split(' ')[0] : undefined}
          style={{ position: 'relative', opacity: off ? 0 : 1 }}
        />
      </Marker>
    );
  };

  // Two freshest people in a small group, by last location update.
  const faces = (g: Item[]) =>
    g.length > FACES_UNTIL
      ? []
      : g
          .filter((it) => it.member)
          .sort((a, b) => minutesAgo(a.member!.updated) - minutesAgo(b.member!.updated))
          .slice(0, 2)
          .map((it) => ({ initials: initials(it.member!.name), color: memberColor(it.member!.name) }));

  // Off-screen people, pinned to the nearest edge; ones landing on the same spot share a marker.
  // Off-screen people: one marker per side of the screen, showing the nearest person that way and
  // how many there are, so a zoomed-in map doesn't get ringed with faces.
  const edges = region && !hideEdges
    ? Object.values(
        members.reduce<Record<number, { m: Member; x: number; y: number; angle: number; d: number }[]>>((acc, m) => {
          // markers may sit right up to the top (just under the status bar), not only below the top buttons
          const e = edgeSpot(region, size, { top: topInset, bottom: bottomInset }, m, 30, { top: topInset - 52, bottom: bottomInset });
          if (!e) return acc;
          const sector = (Math.round(e.angle / (Math.PI / 2)) + 4) % 4;
          (acc[sector] ??= []).push({ m, ...e, d: Math.hypot(m.lat - region.latitude, m.lng - region.longitude) });
          return acc;
        }, {}),
      ).map((g) => g.sort((a, b) => a.d - b.d))
    : [];

  const scale = useRef<{ show: (r: Region) => void; settle: () => void }>(null);

  const fit = () => {
    if (!ready.current) return;
    if (focus) {
      map.current?.animateToRegion({ latitude: focus.lat, longitude: focus.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 500);
    } else if (radiusMi) {
      const d = (radiusMi * 2.2) / 69; // degrees of latitude spanning the radius, with a little margin
      map.current?.animateToRegion({ latitude: ME.lat, longitude: ME.lng, latitudeDelta: d, longitudeDelta: d / Math.cos((ME.lat * Math.PI) / 180) }, 500);
    } else {
      // centered on you, zoomed to your nearest people: who you could get to matters most;
      // everyone farther away gets an edge marker
      map.current?.animateToRegion(aroundMe(ME, members), 500);
    }
  };
  useEffect(fit, [members, focus, topInset, bottomInset, radiusMi, recenter]);

  return (
    // Native compass appears only while rotated (platform convention); mapPadding keeps it and the
    // legal label clear of the status bar and sheet.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      mapPadding={{ top: topInset, right: 0, bottom: bottomInset, left: 0 }}
      zoomEnabled // pinch to zoom
      rotateEnabled
      showsPointsOfInterests={false} // Apple's shops and places compete with people; street names stay
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      // ponytail: edge markers update when panning stops; onRegionChange would re-render every frame
      onLongPress={(e) => onLongPress?.({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude, x: e.nativeEvent.position.x, y: e.nativeEvent.position.y })}
      // scale shows whenever the map moves, zooms or pinches (and when it frames a view), then fades
      onRegionChange={(r) => scale.current?.show(r)}
      onRegionChangeComplete={(r) => {
        scale.current?.show(r);
        scale.current?.settle();
        setRegion(r);
        onCenterChange?.({ lat: r.latitude, lng: r.longitude });
      }}
      onMapReady={() => {
        ready.current = true;
        fit();
      }}>
      {hotspots.map((p) => (
        // the whole area: a gentle tint with a thin dashed edge
        <Circle
          key={p.name}
          center={{ latitude: p.lat, longitude: p.lng }}
          radius={p.radius}
          strokeColor={color + '99'}
          strokeWidth={1.5}
          lineDashPattern={[6, 5]}
          fillColor={color + '24'}
        />
      ))}
      {hotspots.map((p, i) => {
        // Big enough on screen: the name is written across the area, large and see-through. Small:
        // a name tag at the center, hidden where it would collide (hidden ones stay mounted).
        const rPx = region ? (p.radius / 111000 / region.latitudeDelta) * (size.h - topInset - bottomInset) : 0;
        const big = rPx > 48;
        return (
          <Marker key={'tag-' + p.name} coordinate={{ latitude: p.lat, longitude: p.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges onPress={() => onPlacePress?.(p)}>
            {big ? (
              <View style={{ width: rPx * 1.6, alignItems: 'center' }}>
                <Ionicons name={p.icon} size={Math.min(28, rPx * 0.22)} color={color} style={{ opacity: 0.55 }} />
                <Text
                  maxFontSizeMultiplier={FIXED_TEXT}
                  numberOfLines={2}
                  style={[styles.areaName, { color, fontSize: Math.max(13, Math.min(30, rPx * 0.24)) }]}
                >
                  {p.name}
                </Text>
              </View>
            ) : (
              <View style={[styles.placeTag, { backgroundColor: color, opacity: tagShown[i] ? 1 : 0 }]}>
                <Ionicons name={p.icon} size={11} color={'white'} />
                <Text maxFontSizeMultiplier={FIXED_TEXT} style={styles.placeTagText}>{p.name}</Text>
              </View>
            )}
          </Marker>
        );
      })}
      {dropped && (
        // a long-pressed spot, until you make something there or close its sheet
        <Marker coordinate={{ latitude: dropped.lat, longitude: dropped.lng }} anchor={{ x: 0.5, y: 1 }} zIndex={12}>
          <MapPin color={colors.danger} icon="location" style={{ position: 'relative' }} />
        </Marker>
      )}
      {/* you always draw on top of people, pins, groups and labels */}
      <Marker coordinate={{ latitude: ME.lat, longitude: ME.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} zIndex={100}>
        <YouDot style={{ position: 'relative' }} />
      </Marker>
      {items.map(renderItem)}
      {items.map((_, i) => {
        const g = multi[i];
        return (
          // Group of nearby markers: tap to zoom in until they separate. Unused pool slots are invisible.
          <Marker
            key={'group-' + i}
            coordinate={g ? { latitude: avg(g.map((it) => it.lat)), longitude: avg(g.map((it) => it.lng)) } : { latitude: 0, longitude: 0 }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={8}
            onPress={() =>
              g &&
              map.current?.fitToCoordinates(
                g.map((it) => ({ latitude: it.lat, longitude: it.lng })),
                { edgePadding: { top: 120, right: 80, bottom: 120, left: 80 }, animated: true },
              )
            }
          >
            <Cluster count={g?.length ?? 0} faces={g ? faces(g) : []} style={{ position: 'relative', opacity: g ? 1 : 0 }} />
          </Marker>
        );
      })}
    </MapView>
    <ScaleBar ref={scale} width={size.w} top={topInset - 44} />
    {edges.map((g) => {
      const e = g[0];
      // keep clear of the corner buttons at the top and the location arrow at the bottom right
      const x =
        e.y < topInset ? Math.max(76, Math.min(size.w - 120, e.x)) : e.x > size.w - 80 && e.y > size.h - bottomInset - 90 ? size.w - 70 : e.x;
      return (
        <Pressable
          key={e.m.name}
          // tap: zoom out just enough to show you and the people that way
          onPress={() =>
            map.current?.fitToCoordinates([...g.map(({ m }) => ({ latitude: m.lat, longitude: m.lng })), { latitude: ME.lat, longitude: ME.lng }], {
              edgePadding: { top: 60, right: 50, bottom: 60, left: 50 },
              animated: true,
            })
          }
          accessibilityLabel={`${g.length} ${g.length === 1 ? 'person' : 'people'} off screen, nearest ${e.m.name}`}
          style={{ position: 'absolute', left: x - 42, top: e.y - 42, zIndex: 20 }}
        >
          <EdgeMarker initials={initials(e.m.name)} color={memberColor(e.m.name)} angle={e.angle} count={g.length} style={{ position: 'relative' }} />
        </Pressable>
      );
    })}
    </View>
  );
}

// Map scale in Apple's style: a thin bar of alternating dark and light halves, outlined, with the
// distance in small gray text with a halo. Lives apart from the map so it can follow every frame
// of a pan or pinch without re-rendering the markers.
const ScaleBar = forwardRef<{ show: (r: Region) => void; settle: () => void }, { width: number; top: number }>(({ width, top }, ref) => {
  const [r, setR] = useState<Region | null>(null);
  const o = useRef(new Animated.Value(0)).current;
  const hide = useRef<ReturnType<typeof setTimeout>>(undefined);
  useImperativeHandle(ref, () => ({
    show: (next) => {
      setR(next);
      clearTimeout(hide.current);
      o.stopAnimation();
      Animated.timing(o, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    },
    settle: () => {
      clearTimeout(hide.current);
      hide.current = setTimeout(() => Animated.timing(o, { toValue: 0, duration: 400, useNativeDriver: true }).start(), 1500);
    },
  }));
  if (!r || width < 2) return null;
  const bar = scaleBar(r, width);
  const ink = isDark ? '#EBEBF5' : '#3C3C43'; // Apple's label gray
  const paper = isDark ? '#1C1C1E' : '#FFFFFF';
  return (
    <Animated.View pointerEvents="none" style={[styles.scale, { top, opacity: o }]}>
      <View style={{ width: bar.pt, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[styles.scaleText, { color: ink, textShadowColor: paper }]}>0</Text>
        <Text style={[styles.scaleText, { color: ink, textShadowColor: paper }]}>{bar.label}</Text>
      </View>
      <View style={[styles.scaleBar, { width: bar.pt, borderColor: ink + '99' }]}>
        <View style={{ flex: 1, backgroundColor: ink }} />
        <View style={{ flex: 1, backgroundColor: paper }} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  scale: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 2 }, // top center, between the corner buttons
  scaleText: { fontFamily: fonts.bodyBold, fontSize: 10, textShadowRadius: 2, textShadowOffset: { width: 0, height: 0 } },
  scaleBar: { height: 4, flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderRadius: 1, overflow: 'hidden' },
  placeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  areaName: { fontFamily: fonts.heading, textAlign: 'center', opacity: 0.6 },
  placeTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: 'white' },
});
