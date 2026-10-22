import { StyleSheet } from 'react-native';

// Design tokens for the Bubbles app. Shared components live in components.tsx.
// UI uses one teal family (from SafePath's teal); Bubbles get their own playful palette below.

// Light values. applyTheme() switches every token for Dark Mode and the chosen app color.
// Text and icons on Bubble/member colors (avatars, map markers, badges) use the literal 'white',
// which never changes; text on accent fills (buttons, selected chips) uses onPrimary.
export const colors = {
  primary: '#1B7582', // app teal: buttons, links, tabs, toggles (4.5:1 on white and on primarySoft)
  primaryDark: '#165E68', // pressed states
  accent: '#64BAC4', // light teal: decorative highlights, rings
  primarySoft: '#E6F5F6', // teal tint: chips, selected states, unread rows
  onPrimary: '#FFF', // text/icons on primary fills (3-digit so it never collides with surface below)
  secure: '#25856F', // teal-green: privacy and "joined" states
  text: '#414142', // charcoal: body text
  textMuted: '#6B6B70', // secondary text, placeholders, dimmed icons (4.7:1 on the unread tint)
  border: '#E3E8EE',
  background: '#F9F9F9',
  surface: '#FFFFFF', // cards, inputs
  danger: '#D64545', // SOS, badges, destructive actions
};
type Tokens = typeof colors;
const LIGHT: Omit<Tokens, 'primary' | 'primaryDark' | 'primarySoft'> = { ...colors };
const DARK: typeof LIGHT = {
  accent: '#4FA3AD',
  onPrimary: '#0E1113', // accents are lighter in Dark Mode, so text on them goes dark
  secure: '#4CB596',
  text: '#E8E8EA',
  textMuted: '#A1A1A6',
  border: '#38383A',
  background: '#000000',
  surface: '#1C1C1E',
  danger: '#FF6B61',
};

export const fonts = {
  heading: 'Montserrat_700Bold',
  subheading: 'Montserrat_600SemiBold',
  body: 'Lato_400Regular',
  bodyBold: 'Lato_700Bold',
};

export const type = {
  largeTitle: { fontFamily: fonts.heading, fontSize: 34, lineHeight: 41, color: colors.text }, // SwiftUI-style screen title
  h1: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34, color: colors.text },
  h2: { fontFamily: fonts.subheading, fontSize: 20, lineHeight: 26, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  button: { fontFamily: fonts.bodyBold, fontSize: 16 },
};

// Text inside fixed-height layouts (calendar grid, bubble row, map markers, the low sheet) grows
// with Dynamic Type only this far, so it can't clip; everything else grows freely.
export const FIXED_TEXT = 1.3;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 10, md: 20, pill: 999 };

// Each Bubble (group) and avatar gets one of these. Only Bubbles are colorful; the UI stays teal.
export const bubbleColors = ['#3E8ED0', '#2F9AA6', '#3E9E70', '#8C6BC8', '#D9822F', '#D9638A'];

// Soft drop shadow for cards and map pins.
export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

// App accent (Profile > App color). Each option has a button/link color, a pressed shade and a
// soft tint for light mode, and lighter versions for Dark Mode. All link colors reach 4.5:1 on
// their tint and on the card color. Teal is the default brand look.
export const ACCENTS = [
  { name: 'Teal', primary: '#1B7582', dark: '#165E68', soft: '#E6F5F6', night: '#55A2AD', nightDark: '#488A93', nightSoft: '#1D3135' },
  { name: 'Blue', primary: '#2E6CAB', dark: '#255689', soft: '#E7F0FA', night: '#6F9AC8', nightDark: '#5E83AA', nightSoft: '#202D3B' },
  { name: 'Green', primary: '#2C7852', dark: '#236042', soft: '#E6F3EC', night: '#65A184', nightDark: '#568970', nightSoft: '#20302A' },
  { name: 'Purple', primary: '#7556B8', dark: '#5E4593', soft: '#F0EBFA', night: '#9F8ACF', nightDark: '#8775B0', nightSoft: '#2E283D' },
  { name: 'Orange', primary: '#9E571A', dark: '#7E4615', soft: '#FBEEE2', night: '#CA8B55', nightDark: '#AC7648', nightSoft: '#3B2B1E' },
  { name: 'Pink', primary: '#AD466C', dark: '#8A3856', soft: '#FAE8EF', night: '#CE7D9A', nightDark: '#AF6A83', nightSoft: '#3B252F' },
];

// ponytail: every StyleSheet registers itself so applyTheme can swap colors in place; a real app
// would read colors from a theme context instead.
type Sheet = Record<string, Record<string, unknown>>;
const sheets: Sheet[] = [type as unknown as Sheet];
// StyleSheet.create is an identity function apart from dev-mode freezing, which would block the swap.
(StyleSheet as { create: unknown }).create = <T extends object>(s: T): T => {
  sheets.push(s as unknown as Sheet);
  return s;
};

export let isDark = false;

// Recolor everything for a color scheme and app accent: each current token value becomes its new
// value in every registered style (also with an alpha suffix, e.g. primary + '33').
// ponytail: matching by value means no two tokens may share a hex string (hence onPrimary '#FFF').
export function applyTheme(scheme: 'light' | 'dark', accent: number) {
  const a = ACCENTS[accent] ?? ACCENTS[0];
  const dark = scheme === 'dark';
  const next: Tokens = {
    ...(dark ? DARK : LIGHT),
    primary: dark ? a.night : a.primary,
    primaryDark: dark ? a.nightDark : a.dark,
    primarySoft: dark ? a.nightSoft : a.soft,
  };
  const map: Record<string, string> = {};
  for (const k in colors) map[colors[k as keyof Tokens]] = next[k as keyof Tokens];
  const swap = (v: unknown) => {
    if (typeof v !== 'string') return v;
    if (map[v]) return map[v];
    const base = v.slice(0, 7);
    return v.length === 9 && map[base] ? map[base] + v.slice(7) : v;
  };
  // style objects get frozen in dev once sent to native, so replace them rather than edit
  for (const sheet of sheets)
    for (const name in sheet) sheet[name] = Object.fromEntries(Object.entries(sheet[name]).map(([k, v]) => [k, swap(v)]));
  Object.assign(colors, next);
  isDark = dark;
}
