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
