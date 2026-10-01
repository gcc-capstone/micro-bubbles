// Visual source of truth for prototype screens.
// Colors and fonts taken from smithmicro.com / SafePath product pages.

export const colors = {
  primary: '#005BAA', // Smith Micro blue: buttons, header, links
  primaryDark: '#00447F', // pressed states
  accent: '#64BAC4', // SafePath teal: highlights, avatar rings
  secure: '#2E9E6B', // privacy/verified badges (lock, shield)
  primarySoft: '#E6EFF8', // chips, selected tabs, soft fills
  text: '#414142', // charcoal: body text
  textMuted: '#848484', // secondary text, placeholders
  border: '#E3E8EE',
  background: '#F9F9F9',
  surface: '#FFFFFF', // cards, inputs
  danger: '#D64545', // SOS / errors
};

export const fonts = {
  heading: 'Montserrat_700Bold',
  subheading: 'Montserrat_600SemiBold',
  body: 'Lato_400Regular',
  bodyBold: 'Lato_700Bold',
};

export const type = {
  h1: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34, color: colors.text },
  h2: { fontFamily: fonts.subheading, fontSize: 20, lineHeight: 26, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  button: { fontFamily: fonts.bodyBold, fontSize: 16 },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 10, md: 20, pill: 999 };

// Each Bubble (group) gets one of these for its bubble, map circle and chips.
// ponytail: reuses the brand palette; widen when there are more Bubbles than colors.
export const bubbleColors = [colors.primary, colors.accent, colors.secure, colors.primaryDark];

// Soft drop shadow for cards, floating bubbles and map pins.
export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
