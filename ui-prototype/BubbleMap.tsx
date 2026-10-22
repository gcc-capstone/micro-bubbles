// Native map (Apple Maps on iOS, Google Maps on Android). BubbleMap.web.tsx is the browser stand-in.
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Cluster, EdgeMarker, EventPin, MapPin, MemberPin, YouDot } from './components';
import { corePoints, edgeSpot, spread, toScreen, visibleLabels } from './mapFit';
import { groupNearby } from './cluster';
import { FIXED_TEXT, fonts, radius, spacing } from './theme';
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
  onCenterChange?: (c: { lat: number; lng: number }) => void; // after the user pans (Drop Pin) // when set (and nothing is focused), center on you and show this radius
};

export default function BubbleMap({ members, hotspots, pins, color, focus, topInset, bottomInset, onMemberPress, onPinPress, onPlacePress, events = [], onEventPress, radiusMi, onCenterChange, hideEdges }: BubbleMapProps) {
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
          const e = edgeSpot(region, size, { top: topInset, bottom: bottomInset }, m, 42); // room for the arrow
          if (!e) return acc;
          const sector = (Math.round(e.angle / (Math.PI / 2)) + 4) % 4;
          (acc[sector] ??= []).push({ m, ...e, d: Math.hypot(m.lat - region.latitude, m.lng - region.longitude) });
          return acc;
        }, {}),
      ).map((g) => g.sort((a, b) => a.d - b.d))
    : [];

  const fit = () => {
    if (!ready.current) return;
    if (focus) {
      map.current?.animateToRegion({ latitude: focus.lat, longitude: focus.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 500);
    } else if (radiusMi) {
      const d = (radiusMi * 2.2) / 69; // degrees of latitude spanning the radius, with a little margin
      map.current?.animateToRegion({ latitude: ME.lat, longitude: ME.lng, latitudeDelta: d, longitudeDelta: d / Math.cos((ME.lat * Math.PI) / 180) }, 500);
    } else {
      // frame the main crowd; far-off people get edge markers instead of zooming way out
      map.current?.fitToCoordinates(
        corePoints(members).map((m) => ({ latitude: m.lat, longitude: m.lng })),
        { edgePadding: { top: 40, right: 84, bottom: 40, left: 60 }, animated: true }, // right: clear of the map buttons
      );
    }
  };
  useEffect(fit, [members, focus, topInset, bottomInset, radiusMi]);

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
      onRegionChangeComplete={(r) => {
        setRegion(r);
        onCenterChange?.({ lat: r.latitude, lng: r.longitude });
      }}
      onMapReady={() => {
        ready.current = true;
        fit();
      }}>
      {hotspots.map((p) => (
        <Circle
          key={p.name}
          center={{ latitude: p.lat, longitude: p.lng }}
          radius={p.radius}
          strokeColor="transparent" // iOS draws a default black outline otherwise
          strokeWidth={0}
          fillColor={color + '38'} // shaded area only, no outline
        />
      ))}
      {hotspots.map((p, i) => (
        // hidden names stay mounted (see the note on markers below) and just turn invisible
        <Marker key={'tag-' + p.name} coordinate={{ latitude: p.lat, longitude: p.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges onPress={() => tagShown[i] && onPlacePress?.(p)}>
          <View style={[styles.placeTag, { backgroundColor: color, opacity: tagShown[i] ? 1 : 0 }]}>
            <Ionicons name={p.icon} size={11} color={'white'} />
            <Text maxFontSizeMultiplier={FIXED_TEXT} style={styles.placeTagText}>{p.name}</Text>
          </View>
        </Marker>
      ))}
      <Marker coordinate={{ latitude: ME.lat, longitude: ME.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
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
    {edges.map((g) => {
      const e = g[0];
      // keep clear of the search button (top right) and the locate / + / Drop Pin column (bottom right)
      const right = e.x > size.w - 80;
      const x = right && (e.y > size.h - bottomInset - 190 || e.y < topInset + 40) ? size.w - 104 : e.x;
      return (
        <Pressable key={e.m.name} onPress={() => onMemberPress(e.m)} style={{ position: 'absolute', left: x - 42, top: e.y - 42, zIndex: 20 }}>
          <EdgeMarker initials={initials(e.m.name)} color={memberColor(e.m.name)} angle={e.angle} count={g.length} style={{ position: 'relative' }} />
        </Pressable>
      );
    })}
    </View>
  );
}

const styles = StyleSheet.create({
  placeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  placeTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: 'white' },
});
