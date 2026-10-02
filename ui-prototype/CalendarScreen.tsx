// Calendar: month grid of every Bubble's shared events, filterable by Bubble (report Task 15).
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Bubble, EventCard } from './components';
import { colors, fonts, radius, spacing, type } from './theme';
import { ALL, EVENTS, groupColor, initials, memberColor, TODAY } from './data';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export default function CalendarScreen() {
  const [month, setMonth] = useState({ y: 2026, m: 9 }); // October 2026
  const [day, setDay] = useState(TODAY);
  const [filter, setFilter] = useState('everyone');
  const insets = useSafeAreaInsets();

  const events = EVENTS.filter((e) => filter === 'everyone' || e.groupId === filter);
  const first = new Date(month.y, month.m, 1).getDay();
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const shift = (n: number) => {
    const d = new Date(month.y, month.m + n, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };
  const dayEvents = events.filter((e) => e.date === day);
  const [, dm, dd] = day.split('-').map(Number);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={type.largeTitle}>Calendar</Text>

      {/* Bubble filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {ALL.map((g) => (
          <Pressable key={g.id} onPress={() => setFilter(g.id)} style={[styles.filter, filter === g.id && styles.filterOn]}>
            <Bubble size={14} tint={groupColor(g.id)} />
            <Text style={[styles.filterText, filter === g.id && { color: colors.primary }]}>{g.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Month grid */}
      <View style={styles.card}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => shift(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={type.h2}>{MONTH_NAMES[month.m]} {month.y}</Text>
          <Pressable onPress={() => shift(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={[styles.cell, styles.weekday]}>{d}</Text>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <View key={i} style={styles.cell} />;
            const date = iso(month.y, month.m, d);
            const dots = events.filter((e) => e.date === date).slice(0, 3);
            const isSel = date === day;
            return (
              <Pressable key={i} style={styles.cell} onPress={() => setDay(date)}>
                <View style={[styles.dayCircle, date === TODAY && styles.today, isSel && styles.daySel]}>
                  <Text style={[styles.dayText, isSel && { color: colors.surface }]}>{d}</Text>
                </View>
                <View style={styles.dots}>
                  {dots.map((e, n) => (
                    <View key={n} style={[styles.dot, { backgroundColor: groupColor(e.groupId) }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected day */}
      <Text style={type.h2}>
        {MONTH_NAMES[dm - 1]} {dd}
        {day === TODAY ? ' · Today' : ''}
      </Text>
      {dayEvents.length === 0 ? (
        <Text style={type.caption}>Nothing planned in this Bubble. Pick a day with a dot.</Text>
      ) : (
        dayEvents.map((e, i) => (
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
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  filterText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  weekday: { ...type.caption, fontFamily: fonts.bodyBold, textAlign: 'center' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 2, borderColor: colors.primary },
  daySel: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  dots: { flexDirection: 'row', gap: 2, height: 6, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
