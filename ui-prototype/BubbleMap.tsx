// Native map (Apple Maps on iOS, Google Maps on Android). BubbleMap.web.tsx is the browser stand-in.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Cluster, EventPin, MapPin, MemberPin, YouDot } from './components';
import { groupNearby } from './cluster';
import { colors, fonts, radius, spacing } from './theme';
import { initials, Member, memberColor, ME, Pin, Place } from './data';

export type Focus = { name: string; lat: number; lng: number };
export type MapEvent = { key: string; title: string; when: string; color: string; lat: number; lng: number };

// Below this zoom (degrees of latitude on screen) nothing is grouped, so people at the same spot stay tappable.
const GROUP_UNTIL = 0.003;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

type Item = { key: string; lat: number; lng: number; kind: 'member' | 'pin' | 'event'; member?: Member; pin?: Pin; event?: MapEvent };

export type BubbleMapProps = {
  members: Member[];
  places: Place[];
  pins: Pin[];
  color: string;
  focus: Focus | null; // a member or "You" to zoom to; null fits everyone
  topInset: number; // status bar + overlay buttons, kept clear when fitting
  bottomInset: number; // space covered by the sheet/row, kept clear when fitting
  onMemberPress: (m: Member) => void;
  onPinPress?: (p: Pin) => void;
  events?: MapEvent[];
  onEventPress?: (key: string) => void;
  radiusMi?: number; // when set (and nothing is focused), center on you and show this radius
};

export default function BubbleMap({ members, places, pins, color, focus, topInset, bottomInset, onMemberPress, onPinPress, events = [], onEventPress, radiusMi }: BubbleMapProps) {
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
  const toPx = (it: Item) => ({
    x: ((it.lng - (region!.longitude - region!.longitudeDelta / 2)) / region!.longitudeDelta) * size.w,
    y: ((region!.latitude + region!.latitudeDelta / 2 - it.lat) / region!.latitudeDelta) * size.h,
  });
  const multi = grouping ? groupNearby(items.filter((it) => !(it.member && it.member.name === focus?.name)), toPx).filter((g) => g.length > 1) : [];
  const hidden = new Set(multi.flat().map((it) => it.key));
  // ponytail: iOS react-native-maps can leave markers on screen after they unmount, so every marker
  // stays mounted: grouped ones turn invisible, and group bubbles come from a fixed pool.

  const renderItem = (it: Item) => {
    const off = hidden.has(it.key);
    if (it.pin) {
      const pin = it.pin;
      return (
        <Marker key={it.key} coordinate={{ latitude: pin.lat, longitude: pin.lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges onPress={() => !off && onPinPress?.(pin)}>
          <MapPin color={color} icon={pin.icon} style={{ position: 'relative', opacity: off ? 0 : 1 }} />
        </Marker>
      );
    }
    if (it.event) {
      const e = it.event;
      return (
        <Marker key={it.key} coordinate={{ latitude: e.lat, longitude: e.lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges onPress={() => !off && onEventPress?.(e.key)} zIndex={5}>
          <EventPin title={e.title} when={e.when} color={e.color} style={{ position: 'relative', opacity: off ? 0 : 1 }} />
        </Marker>
      );
    }
    const m = it.member!;
    return (
      <Marker key={it.key} coordinate={{ latitude: m.lat, longitude: m.lng }} anchor={{ x: 0.5, y: 0.3 }} onPress={() => !off && onMemberPress(m)} zIndex={focus?.name === m.name ? 10 : 1}>
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

  const fit = () => {
    if (!ready.current) return;
    if (focus) {
      map.current?.animateToRegion({ latitude: focus.lat, longitude: focus.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 500);
    } else if (radiusMi) {
      const d = (radiusMi * 2.2) / 69; // degrees of latitude spanning the radius, with a little margin
      map.current?.animateToRegion({ latitude: ME.lat, longitude: ME.lng, latitudeDelta: d, longitudeDelta: d / Math.cos((ME.lat * Math.PI) / 180) }, 500);
    } else {
      map.current?.fitToCoordinates(
        members.map((m) => ({ latitude: m.lat, longitude: m.lng })),
        { edgePadding: { top: 40, right: 60, bottom: 40, left: 60 }, animated: true },
      );
    }
  };
  useEffect(fit, [members, focus, topInset, bottomInset, radiusMi]);

  return (
    // Native compass appears only while rotated (platform convention); mapPadding keeps it and the
    // legal label clear of the status bar and sheet.
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      mapPadding={{ top: topInset, right: 0, bottom: bottomInset, left: 0 }}
      zoomEnabled // pinch to zoom
      rotateEnabled
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onRegionChangeComplete={setRegion}
      onMapReady={() => {
        ready.current = true;
        fit();
      }}>
      {places.map((p) => (
        <Circle
          key={p.name}
          center={{ latitude: p.lat, longitude: p.lng }}
          radius={p.radius}
          strokeColor="transparent" // iOS draws a default black outline otherwise
          strokeWidth={0}
          fillColor={color + '38'} // shaded area only, no outline
        />
      ))}
      {places.map((p) => (
        <Marker key={'tag-' + p.name} coordinate={{ latitude: p.lat, longitude: p.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[styles.placeTag, { backgroundColor: color }]}>
            <Ionicons name={p.icon} size={11} color={colors.surface} />
            <Text style={styles.placeTagText}>{p.name}</Text>
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
            <Cluster count={g?.length ?? 0} style={{ position: 'relative', opacity: g ? 1 : 0 }} />
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  placeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  placeTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.surface },
});
