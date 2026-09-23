import { Box, Button, Container, IconButton, MenuItem, Popover, Select, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import { messages } from '../i18n';

const presetColors = ['#6d4aff', '#2563eb', '#0891b2', '#059669', '#ea580c', '#e11d48'];
const isHexColor = (color) => /^#[0-9a-f]{6}$/i.test(color);

export default function AppHeader({ darkMode, accentColor, language, onLanguageChange, onThemeToggle, onAccentChange, onAccentReset }) {
  const t = messages[language];
  const [colorAnchor, setColorAnchor] = useState(null);
  const [hexValue, setHexValue] = useState(accentColor);
  const [hexError, setHexError] = useState(false);
  const pickerOpen = Boolean(colorAnchor);

  const selectAccentColor = (color) => {
    setHexValue(color);
    setHexError(false);
    onAccentChange(color);
  };

  const applyHexColor = () => {
    const normalizedColor = hexValue.startsWith('#') ? hexValue : `#${hexValue}`;
    if (!isHexColor(normalizedColor)) {
      setHexError(true);
      return;
    }
    setHexError(false);
    setHexValue(normalizedColor.toLowerCase());
    onAccentChange(normalizedColor);
  };

  return (
    <Box component="header" sx={{ pt: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box className="brand-mark"><AutoAwesomeRoundedIcon fontSize="small" /></Box>
            <Typography variant="h6">Unitly</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Select size="small" value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label={t.language} sx={{ minWidth: 112, bgcolor: 'background.paper' }}>
              <MenuItem value="fr"><Box component="span" aria-hidden="true" sx={{ mr: 1 }}>🇫🇷</Box> Français</MenuItem><MenuItem value="en"><Box component="span" aria-hidden="true" sx={{ mr: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 16, border: '1px solid', borderColor: 'divider', borderRadius: '2px', fontSize: '0.65rem', fontWeight: 800, lineHeight: 1 }}>EN</Box> English</MenuItem>
            </Select>
            <Tooltip title={t.themeTooltip}>
              <IconButton onClick={(event) => setColorAnchor(event.currentTarget)} aria-label={t.themeAria} aria-haspopup="dialog" aria-expanded={pickerOpen} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'primary.main' }}>
                <PaletteRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={darkMode ? t.light : t.dark}>
              <IconButton onClick={onThemeToggle} aria-label={darkMode ? t.lightAria : t.darkAria} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                {darkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          <Popover open={pickerOpen} anchorEl={colorAnchor} onClose={() => setColorAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { mt: 1, p: 2, width: 270 } } }}>
            <Typography fontWeight={750}>{t.themeColor}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 1.5 }}>{t.themeHelp}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box component="label" className="color-picker-label" title={t.openColor}>
                <Box component="input" className="color-picker-input" type="color" value={accentColor} onChange={(event) => selectAccentColor(event.target.value)} aria-label={t.customColor} />
              </Box>
              <TextField
                value={hexValue}
                onChange={(event) => { setHexValue(event.target.value); setHexError(false); }}
                onBlur={applyHexColor}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    applyHexColor();
                    event.currentTarget.blur();
                  }
                }}
                error={hexError}
                helperText={hexError ? t.hexError : t.editable}
                label={t.hexLabel}
                size="small"
                slotProps={{ htmlInput: { maxLength: 7, spellCheck: false } }}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1.75 }}>
              {presetColors.map((color) => <IconButton key={color} onClick={() => selectAccentColor(color)} aria-label={t.chooseColor(color)} className="color-preset" sx={{ bgcolor: color, outline: color === accentColor ? '3px solid' : 'none', outlineColor: 'text.primary' }} />)}
            </Box>
            <Button size="small" onClick={() => { setHexValue('#6d4aff'); setHexError(false); onAccentReset(); }}>{t.resetPurple}</Button>
          </Popover>
        </Box>
      </Container>
    </Box>
  );
}
