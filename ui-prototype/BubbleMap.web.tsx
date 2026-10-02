// Browser stand-in for BubbleMap.tsx (react-native-maps has no web support).
// ponytail: flat lat/lng projection on a drawn backdrop; good enough for previewing layout.
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EventPin, LocationCircle, MapPin, MemberPin, YouDot } from './components';
import { colors } from './theme';
import { initials, memberColor, ME } from './data';
import type { BubbleMapProps } from './BubbleMap';

const SIDE = 50;

export default function BubbleMap({ members, places, pins, color, focus, topInset, bottomInset, onMemberPress, onPinPress, events = [], onEventPress, radiusMi }: BubbleMapProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const r = (radiusMi ?? 0) / 69;
  const pts = focus ? [focus] : radiusMi ? [{ lat: ME.lat - r, lng: ME.lng }, { lat: ME.lat + r, lng: ME.lng }] : members;
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const cLat = (Math.max(...lats) + Math.min(...lats)) / 2;
  const cLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
  const cos = Math.cos((cLat * Math.PI) / 180);
  const spanY = Math.max(Math.max(...lats) - Math.min(...lats), 0.004);
  const spanX = Math.max((Math.max(...lngs) - Math.min(...lngs)) * cos, 0.004);
  const boxW = size.w - SIDE * 2;
  const boxH = size.h - topInset - 40 - bottomInset - 40;
  const scale = Math.min(boxW / spanX, boxH / spanY); // px per degree of latitude
  const x = (lng: number) => size.w / 2 + (lng - cLng) * cos * scale;
  const y = (lat: number) => topInset + 40 + boxH / 2 - (lat - cLat) * scale;

  return (
    <View style={styles.map} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={[styles.road, { top: '30%', left: -20, right: -20, transform: [{ rotate: '-6deg' }] }]} />
      <View style={[styles.road, { top: -20, bottom: -20, left: '55%', width: 14, transform: [{ rotate: '10deg' }] }]} />
      <View style={[styles.road, { top: '62%', left: -20, right: -20, height: 8, transform: [{ rotate: '3deg' }] }]} />
      {size.w > 0 && (
        <>
          {places.map((p) => {
            const d = Math.min(Math.max(((p.radius * 2) / 111000) * scale, 60), 600);
            return <LocationCircle key={p.name} size={d} color={color} icon={p.icon} label={p.name} style={{ left: x(p.lng) - d / 2, top: y(p.lat) - d / 2 }} />;
          })}
          {pins.map((pin) => (
            <Pressable key={pin.name} onPress={() => onPinPress?.(pin)} style={{ position: 'absolute', left: x(pin.lng) - 15, top: y(pin.lat) - 44 }}>
              <MapPin color={color} icon={pin.icon} style={{ position: 'relative' }} />
            </Pressable>
          ))}
          {events.map((e) => (
            <Pressable key={e.key} onPress={() => onEventPress?.(e.key)} style={{ position: 'absolute', left: x(e.lng) - 70, top: y(e.lat) - 48, zIndex: 5 }}>
              <EventPin title={e.title} when={e.when} color={e.color} style={{ position: 'relative' }} />
            </Pressable>
          ))}
          <YouDot style={{ left: x(ME.lng) - 20, top: y(ME.lat) - 20 }} />
          {members.map((m) => (
            <Pressable
              key={m.name}
              onPress={() => onMemberPress(m)}
              style={{ position: 'absolute', left: x(m.lng) - 18, top: y(m.lat) - 18, zIndex: focus?.name === m.name ? 10 : 1 }}
            >
              <MemberPin
                color={memberColor(m.name)}
                initials={initials(m.name)}
                status={m.moving ? 'moving' : undefined}
                tag={focus?.name === m.name ? m.name.split(' ')[0] : undefined}
                style={{ position: 'relative' }}
              />
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFill, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  road: { position: 'absolute', height: 14, backgroundColor: colors.surface },
});
