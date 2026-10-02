// Native map (Apple Maps on iOS, Google Maps on Android). BubbleMap.web.tsx is the browser stand-in.
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { MapPin, MemberPin, YouDot } from './components';
import { colors, fonts, radius, spacing } from './theme';
import { initials, Member, memberColor, ME, Pin, Place } from './data';

export type Focus = { name: string; lat: number; lng: number };

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
};

export default function BubbleMap({ members, places, pins, color, focus, topInset, bottomInset, onMemberPress, onPinPress }: BubbleMapProps) {
  const map = useRef<MapView>(null);
  const ready = useRef(false);

  const fit = () => {
    if (!ready.current) return;
    if (focus) {
      map.current?.animateToRegion({ latitude: focus.lat, longitude: focus.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 500);
    } else {
      map.current?.fitToCoordinates(
        members.map((m) => ({ latitude: m.lat, longitude: m.lng })),
        { edgePadding: { top: 40, right: 60, bottom: 40, left: 60 }, animated: true },
      );
    }
  };
  useEffect(fit, [members, focus, topInset, bottomInset]);

  return (
    // Native compass appears only while rotated (platform convention); mapPadding keeps it and the
    // legal label clear of the status bar and sheet.
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      mapPadding={{ top: topInset, right: 0, bottom: bottomInset, left: 0 }}
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
      {pins.map((pin) => (
        <Marker key={'pin-' + pin.name} coordinate={{ latitude: pin.lat, longitude: pin.lng }} anchor={{ x: 0.5, y: 1 }} onPress={() => onPinPress?.(pin)}>
          <MapPin color={color} icon={pin.icon} style={{ position: 'relative' }} />
        </Marker>
      ))}
      <Marker coordinate={{ latitude: ME.lat, longitude: ME.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <YouDot style={{ position: 'relative' }} />
      </Marker>
      {members.map((m) => (
        <Marker
          key={m.name}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          anchor={{ x: 0.5, y: 0.3 }}
          onPress={() => onMemberPress(m)}
          zIndex={focus?.name === m.name ? 10 : 1}
        >
          <MemberPin
            color={memberColor(m.name)}
            initials={initials(m.name)}
            status={m.moving ? 'moving' : undefined}
            tag={focus?.name === m.name ? m.name.split(' ')[0] : undefined}
            style={{ position: 'relative' }}
          />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  placeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  placeTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.surface },
});
