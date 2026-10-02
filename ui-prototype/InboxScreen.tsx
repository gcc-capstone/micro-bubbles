// Inbox: invites, quick messages, place alerts, new pins and events. Unread rows are shaded.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing, type } from './theme';
import { INBOX, InboxItem } from './data';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InboxItem[]>(INBOX);
  const update = (id: string, change: Partial<InboxItem>) => setItems(items.map((it) => (it.id === id ? { ...it, ...change } : it)));
  const unread = items.filter((it) => !it.read).length;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.titleRow}>
        <Text style={type.largeTitle}>Inbox</Text>
        {unread > 0 && (
          <Pressable onPress={() => setItems(items.map((it) => ({ ...it, read: true })))} hitSlop={8}>
            <Text style={styles.link}>Mark all read</Text>
          </Pressable>
        )}
      </View>
      <Text style={type.caption}>{unread ? `${unread} unread` : 'All caught up'}</Text>

      <View style={styles.list}>
        {items.map((it, i) => (
          <Pressable key={it.id} onPress={() => update(it.id, { read: true })} style={[styles.row, i > 0 && styles.divider, !it.read && styles.unread]}>
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
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={type.caption}>{it.time}</Text>
              {!it.read && <View style={styles.dot} />}
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  link: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary, marginBottom: 6 },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm + 4, padding: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  unread: { backgroundColor: colors.primarySoft },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.body, fontSize: 16, color: colors.text },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  accept: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
});
