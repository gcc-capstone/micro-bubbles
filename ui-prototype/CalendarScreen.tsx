// Calendar (report Task 15), Apple Calendar-style drill-down in one tab:
// Year → tap a month → Month → tap a day → Week (week strip + that day's events).
// Back buttons go up a level; "Today" jumps to today's week. Filter by Bubble at the top.
import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Bubble, EventRow, Separator } from './components';
import { EventDetail, LinkedText } from './Details';
import { colors, fonts, radius, spacing, type } from './theme';
import { ALL, BubbleEvent, EVENTS, groupColor, TODAY } from './data';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
// Cells for a month grid: leading blanks, then 1..days.
const monthCells = (y: number, m: number) => [
  ...Array<null>(new Date(y, m, 1).getDay()).fill(null),
  ...Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => i + 1),
];

type Level = 'year' | 'month' | 'week';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [level, setLevel] = useState<Level>('month');
  const [day, setDay] = useState(TODAY); // selected day; month/year views follow it
  const [filter, setFilter] = useState('everyone');
  const [open, setOpen] = useState<BubbleEvent | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  const sel = parse(day);
  const y = sel.getFullYear();
  const m = sel.getMonth();
  const events = EVENTS.filter((e) => filter === 'everyone' || e.groupId === filter);
  const on = (date: string) => events.filter((e) => e.date === date);

  const go = (next: Level, nextDay = day) => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    setLevel(next);
    setDay(nextDay);
  };
  // Nav bar: back button to the level above, title, Today.
  const back = level === 'month' ? `${y}` : level === 'week' ? MONTHS[m] : null;
  const title = level === 'year' ? `${y}` : level === 'month' ? MONTHS[m] : `${WEEKDAY_NAMES[sel.getDay()]}, ${MONTHS[m].slice(0, 3)} ${sel.getDate()}`;

  const weekStart = addDays(day, -sel.getDay());
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayEvents = on(day);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={styles.nav}>
        {back ? (
          <Pressable onPress={() => go(level === 'week' ? 'month' : 'year')} hitSlop={10} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={styles.navText}>{back}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={() => go(level === 'year' ? 'month' : level, TODAY)} hitSlop={10}>
          <Text style={styles.navText}>Today</Text>
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <Text style={[type.largeTitle, { flex: 1 }, level !== 'week' && { color: colors.primary }]}>{title}</Text>
        {level !== 'week' && (
          <View style={styles.titleArrows}>
            <Pressable onPress={() => go(level, level === 'year' ? `${y - 1}-${day.slice(5)}` : iso(new Date(y, m - 1, 1)))} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => go(level, level === 'year' ? `${y + 1}-${day.slice(5)}` : iso(new Date(y, m + 1, 1)))} hitSlop={10}>
              <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Bubble filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.filters}>
        {ALL.map((g) => (
          <Pressable key={g.id} onPress={() => setFilter(g.id)} style={[styles.filter, filter === g.id && styles.filterOn]}>
            <Bubble size={14} tint={groupColor(g.id)} />
            <Text style={[styles.filterText, filter === g.id && { color: colors.primary }]}>{g.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Animated.View style={{ flex: 1, opacity: fade }}>
        {level === 'year' && (
          <ScrollView contentContainerStyle={styles.yearGrid}>
            {MONTHS.map((name, mi) => (
              <Pressable key={name} style={{ width: (width - spacing.md * 2 - spacing.md * 2) / 3 }} onPress={() => go('month', iso(new Date(y, mi, 1)))}>
                <Text style={[styles.miniName, mi === parse(TODAY).getMonth() && y === parse(TODAY).getFullYear() && { color: colors.primary }]}>{name.slice(0, 3)}</Text>
                <View style={styles.miniGrid}>
                  {monthCells(y, mi).map((d, i) => {
                    const date = d ? iso(new Date(y, mi, d)) : '';
                    const busy = !!d && on(date).length > 0;
                    return (
                      <View key={i} style={[styles.miniCell, date === TODAY && styles.miniToday]}>
                        <Text style={[styles.miniDay, busy && { color: colors.primary, fontFamily: fonts.bodyBold }, date === TODAY && { color: colors.surface }]}>{d ?? ''}</Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {level === 'month' && (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <View style={styles.grid}>
                {WEEKDAYS.map((d, i) => (
                  <Text key={i} style={[styles.cell, styles.weekday]}>{d}</Text>
                ))}
                {monthCells(y, m).map((d, i) => {
                  if (d === null) return <View key={i} style={styles.cell} />;
                  const date = iso(new Date(y, m, d));
                  return (
                    <Pressable key={i} style={styles.cell} onPress={() => go('week', date)}>
                      <View style={[styles.dayCircle, date === TODAY && styles.todayCircle]}>
                        <Text style={[styles.dayText, date === TODAY && { color: colors.surface }]}>{d}</Text>
                      </View>
                      <View style={styles.dots}>
                        {on(date).slice(0, 3).map((e, n) => (
                          <View key={n} style={[styles.dot, { backgroundColor: groupColor(e.groupId) }]} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Text style={[type.caption, { textAlign: 'center' }]}>Tap a day to see its events</Text>
          </ScrollView>
        )}

        {level === 'week' && (
          <ScrollView contentContainerStyle={styles.content}>
            {/* Week strip */}
            <View style={styles.card}>
              <View style={styles.weekRow}>
                <Pressable onPress={() => go('week', addDays(day, -7))} hitSlop={8}>
                  <Ionicons name="chevron-back" size={20} color={colors.text} />
                </Pressable>
                {week.map((date, i) => {
                  const d = parse(date);
                  const isSel = date === day;
                  return (
                    <Pressable key={date} style={styles.weekCell} onPress={() => setDay(date)}>
                      <Text style={styles.weekday}>{WEEKDAYS[i]}</Text>
                      <View style={[styles.dayCircle, date === TODAY && styles.todayRing, isSel && styles.todayCircle]}>
                        <Text style={[styles.dayText, isSel && { color: colors.surface }]}>{d.getDate()}</Text>
                      </View>
                      <View style={styles.dots}>
                        {on(date).slice(0, 3).map((e, n) => (
                          <View key={n} style={[styles.dot, { backgroundColor: groupColor(e.groupId) }]} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
                <Pressable onPress={() => go('week', addDays(day, 7))} hitSlop={8}>
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </Pressable>
              </View>
            </View>

            {dayEvents.length === 0 ? (
              <Text style={[type.caption, { textAlign: 'center', paddingVertical: spacing.lg }]}>No events</Text>
            ) : (
              <View style={styles.list}>
                {dayEvents.map((e, i) => (
                  <View key={i}>
                    {i > 0 && <Separator inset={spacing.md + 16} />}
                    <EventRow
                      time={e.time}
                      title={e.title}
                      place={<LinkedText style={type.caption} text={e.place} />}
                      groupName={ALL.find((g) => g.id === e.groupId)?.name ?? ''}
                      color={groupColor(e.groupId)}
                      onPress={() => setOpen(e)}
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </Animated.View>

      <EventDetail event={open} onClose={() => setOpen(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, height: 44 },
  navBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: -6 },
  navText: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  titleArrows: { flexDirection: 'row', gap: spacing.lg },
  filters: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
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
  content: { padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  weekday: { ...type.caption, fontFamily: fonts.bodyBold, textAlign: 'center' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: colors.primary },
  todayRing: { borderWidth: 2, borderColor: colors.primary },
  dayText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  dots: { flexDirection: 'row', gap: 2, height: 6, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  weekRow: { flexDirection: 'row', alignItems: 'center' },
  weekCell: { flex: 1, alignItems: 'center', gap: 4 },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', paddingVertical: spacing.xs },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  yearNav: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: -spacing.sm },
  miniName: { fontFamily: fonts.subheading, fontSize: 17, color: colors.text, marginBottom: 4 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  miniCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 99 },
  miniToday: { backgroundColor: colors.primary },
  miniDay: { fontSize: 9, fontFamily: fonts.body, color: colors.text },
});
