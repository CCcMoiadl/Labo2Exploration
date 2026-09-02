import { alpha, createTheme } from '@mui/material/styles';

export const createAppTheme = (mode) => {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#a78bfa' : '#6d4aff' },
      secondary: { main: '#c44cff' },
      background: { default: dark ? '#090812' : '#f7f5ff', paper: dark ? '#151321' : '#ffffff' },
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
      MuiCssBaseline: { styleOverrides: { body: { minWidth: 320 }, '::selection': { background: alpha('#8b5cf6', 0.3) } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', border: `1px solid ${dark ? alpha('#c4b5fd', 0.12) : alpha('#5b3fd6', 0.1)}` } } },
      MuiButton: { styleOverrides: { root: { borderRadius: 12, textTransform: 'none' } } },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiOutlinedInput: { styleOverrides: { root: {
        borderRadius: 14, transition: 'box-shadow 180ms ease, background-color 180ms ease',
        background: dark ? alpha('#ffffff', 0.035) : alpha('#ffffff', 0.75),
        '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha('#8b5cf6', 0.14)}` },
      } } },
      MuiTooltip: { defaultProps: { arrow: true } },
    },
  });
};
