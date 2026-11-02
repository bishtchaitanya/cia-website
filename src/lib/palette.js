/*
 * Brand palette (hex values supplied by the brand team).
 * Where the brand sheet's RGB and hex disagreed, the hex value is used:
 * Medium Blue #276EF1, Medium Tonal Gray #D7D7D4, Dark Tonal Gray #B7B7B7,
 * Light Green #DCFAE6.
 */
export const BRAND = {
  unitedBlue: '#1414D2',
  darkBlue: '#051464',
  lightTonalGray: '#F7F4F2',
  white: '#FFFFFF',
  black: '#000000',
  mediumTonalGray: '#D7D7D4',
  darkTonalGray: '#B7B7B7',
  darkGray: '#242424',
  mediumGray: '#555555',
  lightGray: '#878787',
};

/*
 * Sub-team color families from the secondary palette.
 *  mark      dot / line color on light backgrounds (>= 3:1 vs #F7F4F2)
 *  markDark  dot / line color on dark-blue backgrounds (>= 3:1 vs #051464)
 *  tint      light fill used behind avatars and cards
 *  ink       text/initials color on the tint (>= 4.5:1)
 *  deep      darkest step, used for art accents
 * Colors are always shown next to the sub-team name, never as body text.
 */
export const TEAM_COLORS = {
  brand: { label: 'United Blue', mark: '#1414D2', markDark: '#A5EBFF', tint: '#1414D2', ink: '#FFFFFF', deep: '#051464' },
  blue: { label: 'Blue', mark: '#276EF1', markDark: '#276EF1', tint: '#A5EBFF', ink: '#051464', deep: '#051464' },
  red: { label: 'Red', mark: '#FF4B4B', markDark: '#FF4B4B', tint: '#FFE6DC', ink: '#242424', deep: '#7D283C' },
  purple: { label: 'Purple', mark: '#695FE6', markDark: '#695FE6', tint: '#D7D2FF', ink: '#551E5F', deep: '#551E5F' },
  yellow: { label: 'Yellow', mark: '#696E28', markDark: '#FFDC8C', tint: '#FFF0D7', ink: '#696E28', deep: '#696E28', bright: '#FFDC8C' },
  burgundy: { label: 'Burgundy', mark: '#7D283C', markDark: '#D7AAAA', tint: '#FADCE1', ink: '#7D283C', deep: '#7D283C', bright: '#D7AAAA' },
  green: { label: 'Green', mark: '#2D4637', markDark: '#5AD28C', tint: '#DCFAE6', ink: '#2D4637', deep: '#2D4637', bright: '#5AD28C' },
};

/** Sub-team colors an editor may choose ("brand" is reserved for Leadership). */
export const SUBTEAM_COLOR_KEYS = ['blue', 'red', 'purple', 'yellow', 'burgundy', 'green'];

export const ART_TYPES = ['sparkline', 'wave', 'bars', 'dots', 'funnel', 'rings'];
