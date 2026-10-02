// Inbox: invites, quick messages, place alerts, new pins and events. Edge-to-edge list like Mail;
// unread rows are shaded and bold. Pull down at the top to reveal search.
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Separator } from './components';
import { colors, fonts, radius, spacing, type } from './theme';
import { INBOX, InboxItem } from './data';

const SEARCH_H = 52;

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InboxItem[]>(INBOX);
  const [query, setQuery] = useState('');
  const [listH, setListH] = useState(0);
  const list = useRef<ScrollView>(null);
  const update = (id: string, change: Partial<InboxItem>) => setItems(items.map((it) => (it.id === id ? { ...it, ...change } : it)));
  const unread = items.filter((it) => !it.read).length;
  const q = query.trim().toLowerCase();
  const shown = items.filter((it) => !q || `${it.title} ${it.body}`.toLowerCase().includes(q));

  // Keep search tucked above the list until pulled down (iOS convention).
  useEffect(() => {
    if (listH) list.current?.scrollTo({ y: SEARCH_H, animated: false });
  }, [listH]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <Text style={type.largeTitle}>Inbox</Text>
          {unread > 0 && (
            <Pressable onPress={() => setItems(items.map((it) => ({ ...it, read: true })))} hitSlop={8}>
              <Text style={styles.link}>Mark all read</Text>
            </Pressable>
          )}
        </View>
        <Text style={type.caption}>{unread ? `${unread} unread` : 'All caught up'}</Text>
      </View>

      <ScrollView
        ref={list}
        onLayout={(e) => setListH(e.nativeEvent.layout.height)}
        contentContainerStyle={{ minHeight: listH + SEARCH_H, paddingBottom: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchWrap}>
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search inbox" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
          </View>
        </View>

        <View style={styles.list}>
          {shown.map((it, i) => (
            <View key={it.id}>
              {i > 0 && <Separator inset={spacing.md + 36 + spacing.sm + 4} />}
              <Pressable onPress={() => update(it.id, { read: true })} style={[styles.row, !it.read && styles.unread]}>
                <View style={styles.icon}>
                  <Ionicons name={it.icon} size={18} color={it.id === 'sos' ? colors.danger : colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.title, !it.read && { fontFamily: fonts.bodyBold }]}>{it.title}</Text>
                  <Text style={type.caption}>{it.body}</Text>
                  {it.invite === 'pending' && (
                    <View style={styles.actions}>
                      <Pressable style={[styles.action, styles.accept]} onPress={() => update(it.id, { invite: 'accepted', read: true })}>
                        <Text style={[styles.actionText, { color: colors.surface }]}>Accept</Text>
                      </Pressable>
                      <Pressable style={styles.action} onPress={() => update(it.id, { invite: 'declined', read: true })}>
                        <Text style={styles.actionText}>Decline</Text>
                      </Pressable>
                    </View>
                  )}
                  {it.invite === 'accepted' && <Text style={[type.caption, { color: colors.secure }]}>Joined</Text>}
                  {it.invite === 'declined' && <Text style={type.caption}>Declined · your location wasn't shared</Text>}
                </View>
                <Text style={[type.caption, !it.read && { color: colors.primary, fontFamily: fonts.bodyBold }]}>{it.time}</Text>
              </Pressable>
            </View>
          ))}
          {shown.length === 0 && <Text style={[type.caption, { padding: spacing.md }]}>No messages match "{query}".</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.md, gap: spacing.xs, paddingBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  link: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary, marginBottom: 6 },
  searchWrap: { height: SEARCH_H, justifyContent: 'center', paddingHorizontal: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 2, height: 36 },
  searchInput: { ...type.body, flex: 1, padding: 0 },
  list: { backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  row: { flexDirection: 'row', gap: spacing.sm + 4, paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.md },
  unread: { backgroundColor: colors.primarySoft },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.body, fontSize: 16, color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  accept: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
});
