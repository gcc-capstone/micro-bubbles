// Calendar (report Task 15), Apple Calendar-style drill-down in one tab:
//   Year  - endless vertical scroll of years, months in two columns. Tap a month →
//   Month - endless vertical scroll of month grids (7 columns), any year. Tap a day →
//   Week  - week strip that pages a week at a time + endless day-by-day event list; the strip
//           follows the list (top day when scrolling down, bottom day when scrolling up).
// Lists are virtualized over a wide but fixed range with known row heights, so jumps are instant.
import { useMemo, useRef, useState } from 'react';
import { Animated, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Bubble, EventRow } from './components';
import { EventDetail, LinkedText } from './Details';
import { colors, fonts, radius, spacing, type } from './theme';
import { ALL, BubbleEvent, EVENTS, groupColor, TODAY } from './data';
import { addMonths, dayNum, daysIn, leadBlanks, monthStart, offsets, parts, startOfWeek, weekRows } from './calendarMath';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const T = dayNum(TODAY);
const TP = parts(T);
// Range of each endless list (items either side of today).
const YR = 100; // years
const MR = 600; // months
const WR = 520; // weeks

// Fixed row heights (must match styles below) so getItemLayout is exact.
const YEAR_HEAD = 56;
const MINI_NAME = 24;
const MINI_ROW = 17;
const MINI_GAP = 14;
const MINI_H = MINI_NAME + 6 * MINI_ROW + MINI_GAP;
const YEAR_H = YEAR_HEAD + 6 * MINI_H;
const MONTH_HEAD = 48;
const CELL = 56;
const MONTH_PAD = spacing.sm + 4; // side padding in month view
const DAY_HEAD = 30;
const EVT_H = 54;
const DAY_PAD = 6;
const WEEK_PAD = spacing.md + 4; // side padding for the week strip and its dividers

type Level = 'year' | 'month' | 'week';

export default function CalendarScreen({ weekStart, reduceMotion }: { weekStart: number; reduceMotion: boolean }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cellW = Math.floor((width - 2 * MONTH_PAD) / 7); // exact pixels; % widths can wrap the 7th column
  const [level, setLevel] = useState<Level>('month');
  const [sel, setSel] = useState(T); // selected day (week view) and anchor for other views
  const selRef = useRef(sel);
  selRef.current = sel;
  const [visYear, setVisYear] = useState(TP.y);
  const [visMonth, setVisMonth] = useState({ y: TP.y, m: TP.m });
  const [filter, setFilter] = useState('everyone');
  const [open, setOpen] = useState<BubbleEvent | null>(null);

  const yearList = useRef<FlatList<number>>(null);
  const monthList = useRef<FlatList<number>>(null);
  const dayList = useRef<FlatList<number>>(null);
  const strip = useRef<FlatList<number>>(null);

  // Callbacks handed to FlatList are created once, so they read settings through refs.
  const weekStartRef = useRef(weekStart);
  weekStartRef.current = weekStart;
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;

  // Events by day number for the chosen Bubble.
  const byDay = useMemo(() => {
    const map = new Map<number, BubbleEvent[]>();
    EVENTS.filter((e) => filter === 'everyone' || e.groupId === filter).forEach((e) => {
      const n = dayNum(e.date);
      map.set(n, [...(map.get(n) ?? []), e]);
    });
    return map;
  }, [filter]);

  /* ---------- index math ---------- */
  const yearOf = (i: number) => TP.y + i - YR;
  const monthOf = (i: number) => addMonths(TP.y, TP.m, i - MR);
  const monthIndex = (y: number, m: number) => y * 12 + m - (TP.y * 12 + TP.m) + MR;
  const baseWeek = startOfWeek(T, weekStart);
  const weekOf = (i: number) => baseWeek + 7 * (i - WR);
  const weekIndex = (n: number) => (startOfWeek(n, weekStart) - baseWeek) / 7 + WR;

  const monthOffsets = useMemo(
    () => offsets(Array.from({ length: 2 * MR + 1 }, (_, i) => MONTH_HEAD + weekRows(monthOf(i).y, monthOf(i).m, weekStart) * CELL)),
    [weekStart],
  );
  // Week view list shows only days that have events.
  const eventDays = useMemo(() => [...byDay.keys()].sort((a, b) => a - b), [byDay]);
  const dayH = (n: number) => DAY_HEAD + (byDay.get(n)?.length ?? 0) * EVT_H + DAY_PAD;
  const dayOffsets = useMemo(() => offsets(eventDays.map(dayH)), [eventDays]);
  // Index of the first event day on or after n (or the last one), for jumping the list.
  const listIndex = (n: number) => {
    let lo = 0;
    let hi = eventDays.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (eventDays[mid] < n) lo = mid + 1;
      else hi = mid;
    }
    return Math.min(lo, eventDays.length - 1);
  };
  const scrollList = (n: number, animated: boolean) => {
    if (eventDays.length) dayList.current?.scrollToIndex({ index: listIndex(n), animated });
  };

  /* ---------- level transitions ---------- */
  const lv = useRef(new Animated.Value(1)).current;
  const from = useRef(new Animated.Value(1)).current; // starting scale for the current transition
  const dir = useRef(1);
  const go = (next: Level, anchor: number) => {
    const order = ['year', 'month', 'week'];
    dir.current = order.indexOf(next) - order.indexOf(level) || 1;
    setSel(anchor);
    const p = parts(anchor);
    setVisYear(p.y);
    setVisMonth({ y: p.y, m: p.m });
    if (next === 'week') {
      hold();
      stripWeekRef.current = weekIndex(anchor);
      setStripWeek(stripWeekRef.current);
    }
    setLevel(next);
    from.setValue(dir.current > 0 ? 0.9 : 1.1);
    lv.setValue(reduceMotion ? 1 : 0);
    // JS driver: the list re-renders during the transition, which would strand a native-driven value.
    // start after the new view's first frame so mounting doesn't eat the animation
    if (!reduceMotion) requestAnimationFrame(() => Animated.spring(lv, { toValue: 1, useNativeDriver: false, damping: 22, stiffness: 220, mass: 0.8 }).start());
  };
  // Zooming in starts slightly small, zooming out starts slightly large (Apple Calendar feel).
  const levelStyle = useRef({
    flex: 1,
    opacity: lv,
    // scale = from + (1 - from) * lv
    transform: [{ scale: Animated.add(from, Animated.multiply(Animated.subtract(1, from), lv)) }],
  }).current;

  /* ---------- week view sync ---------- */
  const [stripWeek, setStripWeek] = useState(weekIndex(T));
  const stripWeekRef = useRef(stripWeek);
  const programmatic = useRef(false);
  const lastY = useRef(0);
  const scrollingDown = useRef(true);
  const hold = () => {
    programmatic.current = true;
    setTimeout(() => (programmatic.current = false), 700);
  };
  const selectDay = (n: number) => {
    hold();
    setSel(n);
    const w = weekIndex(n);
    if (w !== stripWeekRef.current) {
      stripWeekRef.current = w;
      setStripWeek(w);
      strip.current?.scrollToIndex({ index: w, animated: !reduceMotion });
    }
    scrollList(n, !reduceMotion);
  };
  // Swiping the strip pages a week; keep the same weekday selected and move the list there.
  const onStripEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const w = Math.round(e.nativeEvent.contentOffset.x / width);
    if (w === stripWeekRef.current) return;
    const n = weekOf(w) + (sel - startOfWeek(sel, weekStart));
    stripWeekRef.current = w;
    setStripWeek(w);
    hold();
    setSel(n);
    scrollList(weekOf(w), false); // first event on or after this week
  };
  const onDayViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (programmatic.current || !viewableItems.length) return;
    const days = viewableItems.map((v) => v.item as number).sort((a, b) => a - b);
    const n = scrollingDown.current ? days[0] : days[days.length - 1];
    setSel(n);
    const ws = weekStartRef.current;
    const w = (startOfWeek(n, ws) - startOfWeek(T, ws)) / 7 + WR;
    if (w !== stripWeekRef.current) {
      stripWeekRef.current = w;
      setStripWeek(w);
      strip.current?.scrollToIndex({ index: w, animated: !reduceMotionRef.current });
    }
  }).current;

  const onYearViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setVisYear(TP.y + (viewableItems[0].index ?? YR) - YR);
  }).current;
  const onMonthViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setVisMonth(addMonths(TP.y, TP.m, (viewableItems[0].index ?? MR) - MR));
  }).current;

  const today = () => {
    if (level === 'year') yearList.current?.scrollToIndex({ index: YR, animated: !reduceMotion });
    if (level === 'month') monthList.current?.scrollToIndex({ index: MR, animated: !reduceMotion });
    if (level === 'week') selectDay(T);
  };

  /* ---------- nav ---------- */
  const selP = parts(sel);
  const back =
    level === 'month'
      ? { label: `${visMonth.y}`, to: () => go('year', monthStart(visMonth.y, visMonth.m)) }
      : level === 'week'
        ? { label: MONTHS[selP.m], to: () => go('month', sel) }
        : null;
  const title = level === 'year' ? `${visYear}` : level === 'month' ? MONTHS[visMonth.m] : `${DOW_NAMES[selP.dow]}, ${MONTHS[selP.m].slice(0, 3)} ${selP.d}`;
  const dows = Array.from({ length: 7 }, (_, i) => DOW[(i + weekStart) % 7]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={styles.nav}>
        {back ? (
          <Pressable onPress={back.to} hitSlop={10} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={styles.navText}>{back.label}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={today} hitSlop={10}>
          <Text style={styles.navText}>Today</Text>
        </Pressable>
      </View>
      <Text style={[type.largeTitle, styles.title, level !== 'week' && { color: colors.primary }]}>{title}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.filters}>
        {ALL.map((g) => (
          <Pressable key={g.id} onPress={() => setFilter(g.id)} style={[styles.filter, filter === g.id && styles.filterOn]}>
            <Bubble size={14} tint={groupColor(g.id)} />
            <Text style={[styles.filterText, filter === g.id && { color: colors.primary }]}>{g.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Animated.View style={levelStyle}>
        {level === 'year' && (
          <FlatList
            ref={yearList}
            data={YEARS}
            keyExtractor={(i) => `${i}`}
            initialScrollIndex={visYear - TP.y + YR}
            // then nudge to the row of the month we came from, so zooming out keeps your place
            onLayout={() => {
              const offset = YEAR_H * (visYear - TP.y + YR) + YEAR_HEAD + Math.floor(visMonth.m / 2) * MINI_H;
              setTimeout(() => yearList.current?.scrollToOffset({ offset, animated: false }), 50); // after first render
            }}
            initialNumToRender={2}
            getItemLayout={(_, i) => ({ length: YEAR_H, offset: YEAR_H * i, index: i })}
            onViewableItemsChanged={onYearViewable}
            viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
            windowSize={5}
            renderItem={({ index }) => {
              const y = yearOf(index);
              return (
                <View style={{ height: YEAR_H, paddingHorizontal: spacing.md + 6 }}>
                  <Text style={styles.yearHead}>{y}</Text>
                  <View style={styles.yearGrid}>
                    {MONTHS.map((name, m) => (
                      <Pressable key={name} style={styles.mini} onPress={() => go('month', monthStart(y, m))}>
                        <Text style={[styles.miniName, y === TP.y && m === TP.m && { color: colors.primary }]}>{name}</Text>
                        <View style={styles.miniGrid}>
                          {Array.from({ length: 42 }, (_, c) => {
                            const d = c - leadBlanks(y, m, weekStart) + 1;
                            const n = monthStart(y, m) + d - 1;
                            const real = d >= 1 && d <= daysIn(y, m);
                            return (
                              <View key={c} style={[styles.miniCell, real && n === T && styles.miniToday]}>
                                <Text style={[styles.miniDay, real && byDay.has(n) && styles.miniBusy, real && n === T && { color: colors.surface }]}>
                                  {real ? d : ''}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            }}
          />
        )}

        {level === 'month' && (
          <>
            <View style={[styles.dowRow, { paddingHorizontal: MONTH_PAD }]}>
              {dows.map((d, i) => (
                <Text key={i} style={[styles.dow, { width: cellW }]}>{d}</Text>
              ))}
            </View>
            <FlatList
              ref={monthList}
              data={MONTH_IDX}
              contentContainerStyle={{ paddingHorizontal: MONTH_PAD }}
              keyExtractor={(i) => `${i}`}
              initialScrollIndex={monthIndex(visMonth.y, visMonth.m)}
              getItemLayout={(_, i) => ({ length: monthOffsets[i + 1] - monthOffsets[i], offset: monthOffsets[i], index: i })}
              onViewableItemsChanged={onMonthViewable}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              windowSize={7}
              renderItem={({ index }) => {
                const { y, m } = monthOf(index);
                const lead = leadBlanks(y, m, weekStart);
                const rows = weekRows(y, m, weekStart);
                return (
                  <View style={{ height: MONTH_HEAD + rows * CELL }}>
                    {/* month name sits above the column of its 1st, like Apple Calendar */}
                    <Text style={[styles.monthHead, { marginLeft: lead * cellW, width: cellW }, y === TP.y && m === TP.m && { color: colors.primary }]}>
                      {MONTHS[m].slice(0, 3)}
                    </Text>
                    <View style={styles.grid}>
                      {Array.from({ length: rows * 7 }, (_, c) => {
                        const d = c - lead + 1;
                        if (d < 1 || d > daysIn(y, m)) return <View key={c} style={[styles.cell, { width: cellW }]} />;
                        const n = monthStart(y, m) + d - 1;
                        return (
                          <Pressable key={c} style={[styles.cell, styles.cellLine, { width: cellW }]} onPress={() => go('week', n)}>
                            <View style={[styles.dayCircle, n === T && styles.todayCircle]}>
                              <Text style={[styles.dayText, n === T && { color: colors.surface }]}>{d}</Text>
                            </View>
                            <View style={styles.dots}>
                              {(byDay.get(n) ?? []).slice(0, 3).map((e, k) => (
                                <View key={k} style={[styles.dot, { backgroundColor: groupColor(e.groupId) }]} />
                              ))}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              }}
            />
          </>
        )}

        {level === 'week' && (
          <>
            {/* Week strip: pages one week at a time */}
            <View style={styles.divider} />
            <View style={styles.stripWrap}>
              <View style={[styles.dowRow, { borderBottomWidth: 0, paddingHorizontal: WEEK_PAD }]}>
                {dows.map((d, i) => (
                  <Text key={i} style={[styles.cellW, styles.dow]}>{d}</Text>
                ))}
              </View>
              <FlatList
                ref={strip}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={WEEK_IDX}
                keyExtractor={(i) => `${i}`}
                initialScrollIndex={stripWeek}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                onMomentumScrollEnd={onStripEnd}
                windowSize={3}
                extraData={sel}
                renderItem={({ index }) => (
                  <View style={[styles.weekRow, { width, paddingHorizontal: WEEK_PAD }]}>
                    {Array.from({ length: 7 }, (_, k) => {
                      const n = weekOf(index) + k;
                      const isSel = n === sel;
                      return (
                        <Pressable key={k} style={styles.weekCell} onPress={() => selectDay(n)}>
                          <View style={[styles.dayCircle, n === T && !isSel && styles.todayRing, isSel && styles.todayCircle]}>
                            <Text style={[styles.dayText, n === T && !isSel && { color: colors.primary }, isSel && { color: colors.surface }]}>{parts(n).d}</Text>
                          </View>
                          <View style={styles.dots}>
                            {(byDay.get(n) ?? []).slice(0, 3).map((e, j) => (
                              <View key={j} style={[styles.dot, { backgroundColor: groupColor(e.groupId) }]} />
                            ))}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </View>

            <View style={styles.divider} />
            {/* fixed gap under the strip (padding inside the list would scroll away) */}
            <View style={{ height: spacing.sm + 4 }} />
            {/* Endless day-by-day event list */}
            <FlatList
              ref={dayList}
              data={eventDays}
              keyExtractor={(n) => `${n}`}
              initialScrollIndex={eventDays.length ? listIndex(sel) : undefined}
              // initialScrollIndex can land a few points off; snap to the exact offset once laid out
              onLayout={() => {
                if (!eventDays.length) return;
                const index = listIndex(selRef.current);
                hold(); // don't let the settling list change the selected day
                setTimeout(() => dayList.current?.scrollToIndex({ index, viewPosition: 0, animated: false }), 50);
              }}
              // room after the last event so any day can scroll to the top (otherwise the list stops short)
              ListFooterComponent={<View style={{ height: 600 }} />}
              ListEmptyComponent={<Text style={[styles.empty, { padding: spacing.md }]}>No events in this Bubble</Text>}
              getItemLayout={(_, i) => ({ length: dayOffsets[i + 1] - dayOffsets[i], offset: dayOffsets[i], index: i })}
              onScroll={(e) => {
                const y = e.nativeEvent.contentOffset.y;
                scrollingDown.current = y >= lastY.current;
                lastY.current = y;
              }}
              scrollEventThrottle={32}
              onViewableItemsChanged={onDayViewable}
              viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
              windowSize={9}
              renderItem={({ item: n }) => {
                const p = parts(n);
                const evs = byDay.get(n) ?? [];
                return (
                  <View style={{ height: dayH(n), paddingHorizontal: spacing.md }}>
                    <Text style={[styles.dayHead, n === T && { color: colors.primary }]}>
                      {DOW_NAMES[p.dow]}, {MONTHS[p.m]} {p.d}
                      {p.y !== TP.y ? `, ${p.y}` : ''}
                      {n === T ? ' · Today' : ''}
                    </Text>
                      <View style={styles.list}>
                        {evs.map((e, i) => (
                          <View key={i} style={{ height: EVT_H, justifyContent: 'center' }}>
                            {i > 0 && <View style={styles.sep} />}
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
                  </View>
                );
              }}
            />
          </>
        )}
      </Animated.View>

      <EventDetail event={open} onClose={() => setOpen(null)} />
    </View>
  );
}

// List data is just item indexes (day numbers for the day list); content comes from index math.
const YEARS = Array.from({ length: 2 * YR + 1 }, (_, i) => i);
const MONTH_IDX = Array.from({ length: 2 * MR + 1 }, (_, i) => i);
const WEEK_IDX = Array.from({ length: 2 * WR + 1 }, (_, i) => i);

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, height: 44 },
  navBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: -6 },
  navText: { fontFamily: fonts.body, fontSize: 17, color: colors.primary },
  title: { paddingHorizontal: spacing.md },
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

  yearHead: { height: YEAR_HEAD, fontFamily: fonts.heading, fontSize: 28, color: colors.text, paddingTop: spacing.sm },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  mini: { width: '47%', height: MINI_H },
  miniName: { height: MINI_NAME, fontFamily: fonts.subheading, fontSize: 17, color: colors.text },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  miniCell: { width: `${100 / 7}%`, height: MINI_ROW, alignItems: 'center', justifyContent: 'center', borderRadius: 99 },
  miniToday: { backgroundColor: colors.primary },
  miniDay: { fontSize: 10, fontFamily: fonts.body, color: colors.text },
  miniBusy: { color: colors.primary, fontFamily: fonts.bodyBold },

  dowRow: { flexDirection: 'row', paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  cellW: { width: `${100 / 7}%` },
  dow: { ...type.caption, fontFamily: fonts.bodyBold, textAlign: 'center' },
  monthHead: { height: MONTH_HEAD, paddingTop: 14, width: `${100 / 7}%`, textAlign: 'center', fontFamily: fonts.subheading, fontSize: 18, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: CELL, alignItems: 'center', paddingTop: 4 },
  cellLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: colors.primary },
  todayRing: { borderWidth: 2, borderColor: colors.primary },
  dayText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  dots: { flexDirection: 'row', gap: 2, height: 6, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  // same background as the page; slim inset dividers above and below mark the strip
  stripWrap: { paddingTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: WEEK_PAD },
  weekRow: { flexDirection: 'row', paddingVertical: spacing.sm },
  weekCell: { flex: 1, alignItems: 'center' },
  dayHead: { height: DAY_HEAD, paddingTop: spacing.sm + 2, fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted },
  empty: { ...type.caption, textAlign: 'center' },
  list: { backgroundColor: colors.surface, borderRadius: radius.sm + 2, overflow: 'hidden' }, // tighter corners echo the color bar
  sep: { position: 'absolute', top: 0, left: spacing.md + 16, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
