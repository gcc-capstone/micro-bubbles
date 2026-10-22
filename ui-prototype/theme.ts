import { StyleSheet } from 'react-native';

// Design tokens for the Bubbles app. Shared components live in components.tsx.
// UI uses one teal family (from SafePath's teal); Bubbles get their own playful palette below.

export const colors = {
  primary: '#1F8592', // app teal: buttons, links, tabs, toggles (white text stays readable)
  primaryDark: '#176A75', // pressed states
  accent: '#64BAC4', // light teal: decorative highlights, rings
  primarySoft: '#E6F5F6', // teal tint: chips, selected states, unread rows
  secure: '#25856F', // teal-green: privacy and "joined" states
  text: '#414142', // charcoal: body text
  textMuted: '#848484', // secondary text, placeholders, dimmed icons
  border: '#E3E8EE',
  background: '#F9F9F9',
  surface: '#FFFFFF', // cards, inputs
  danger: '#D64545', // SOS, badges, destructive actions
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

// App accent (Profile > Edit > App color). Each option is a readable button color, a pressed
// shade and a soft tint. Teal is the default brand look.
export const ACCENTS = [
  { name: 'Teal', primary: '#1F8592', dark: '#176A75', soft: '#E6F5F6' },
  { name: 'Blue', primary: '#2F6FB0', dark: '#245A8F', soft: '#E7F0FA' },
  { name: 'Green', primary: '#2E8058', dark: '#236647', soft: '#E6F3EC' },
  { name: 'Purple', primary: '#7556B8', dark: '#5E4496', soft: '#F0EBFA' },
  { name: 'Orange', primary: '#B8661F', dark: '#94511A', soft: '#FBEEE2' },
  { name: 'Pink', primary: '#B84A72', dark: '#963B5C', soft: '#FAE8EF' },
];

// ponytail: every StyleSheet registers itself so setAccent can swap colors in place; a real app
// would read the accent from a theme context instead.
type Sheet = Record<string, Record<string, unknown>>;
const sheets: Sheet[] = [];
// StyleSheet.create is an identity function apart from dev-mode freezing, which would block the swap.
(StyleSheet as { create: unknown }).create = <T extends object>(s: T): T => {
  sheets.push(s as unknown as Sheet);
  return s;
};

export function setAccent(i: number) {
  const a = ACCENTS[i] ?? ACCENTS[0];
  const map: Record<string, string> = { [colors.primary]: a.primary, [colors.primaryDark]: a.dark, [colors.primarySoft]: a.soft };
  const swap = (v: unknown) => {
    if (typeof v !== 'string') return v;
    if (map[v]) return map[v];
    const base = v.slice(0, 7); // also colors with an alpha suffix, e.g. primary + '33'
    return v.length === 9 && map[base] ? map[base] + v.slice(7) : v;
  };
  // style objects get frozen in dev once sent to native, so replace them rather than edit
  for (const sheet of sheets)
    for (const name in sheet) sheet[name] = Object.fromEntries(Object.entries(sheet[name]).map(([k, v]) => [k, swap(v)]));
  Object.assign(colors, { primary: a.primary, primaryDark: a.dark, primarySoft: a.soft });
}
