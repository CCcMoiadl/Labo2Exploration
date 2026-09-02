import { alpha, createTheme, darken, lighten } from '@mui/material/styles';

export const createAppTheme = (mode, accentColor = '#6d4aff') => {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: accentColor },
      secondary: { main: accentColor },
      background: {
        default: dark ? darken(accentColor, 0.88) : lighten(accentColor, 0.93),
        paper: dark ? darken(accentColor, 0.78) : lighten(accentColor, 0.975),
      },
      text: { primary: dark ? '#f7f5ff' : '#19152b', secondary: dark ? '#aaa4c1' : '#6c6680' },
    },
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: 'Inter, "Segoe UI", sans-serif',
      h1: { fontSize: 'clamp(2.35rem, 7vw, 4.7rem)', fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.98 },
      h2: { fontSize: 'clamp(1.55rem, 3vw, 2rem)', fontWeight: 750, letterSpacing: '-0.035em' },
      h6: { fontWeight: 700, letterSpacing: '-0.02em' },
      button: { fontWeight: 700 },
    },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { minWidth: 320 }, '::selection': { background: alpha(accentColor, 0.3) } } },
      MuiPaper: { styleOverrides: { root: {
        backgroundImage: `linear-gradient(145deg, ${alpha(accentColor, dark ? 0.1 : 0.055)}, transparent 58%)`,
        border: `1px solid ${alpha(accentColor, dark ? 0.3 : 0.18)}`,
      } } },
      MuiButton: { styleOverrides: { root: { borderRadius: 12, textTransform: 'none' } } },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiOutlinedInput: { styleOverrides: { root: {
        borderRadius: 14, transition: 'box-shadow 180ms ease, background-color 180ms ease',
        background: dark ? alpha(accentColor, 0.1) : alpha(accentColor, 0.045),
        '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(accentColor, 0.14)}` },
      } } },
      MuiTab: { styleOverrides: { root: {
        borderRadius: '12px 12px 0 0',
        '&.Mui-selected': { background: alpha(accentColor, dark ? 0.16 : 0.09) },
      } } },
      MuiChip: { styleOverrides: { root: {
        background: alpha(accentColor, dark ? 0.2 : 0.1),
        border: `1px solid ${alpha(accentColor, 0.2)}`,
      } } },
      MuiTooltip: { defaultProps: { arrow: true } },
    },
  });
};
