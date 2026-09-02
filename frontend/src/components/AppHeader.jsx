import { Box, Button, Container, IconButton, Popover, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';

const presetColors = ['#6d4aff', '#2563eb', '#0891b2', '#059669', '#ea580c', '#e11d48'];
const isHexColor = (color) => /^#[0-9a-f]{6}$/i.test(color);

export default function AppHeader({ darkMode, accentColor, onThemeToggle, onAccentChange, onAccentReset }) {
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
            <Tooltip title="Personnaliser la couleur du thème">
              <IconButton onClick={(event) => setColorAnchor(event.currentTarget)} aria-label="Choisir la couleur du thème" aria-haspopup="dialog" aria-expanded={pickerOpen} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'primary.main' }}>
                <PaletteRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={darkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}>
              <IconButton onClick={onThemeToggle} aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                {darkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          <Popover open={pickerOpen} anchorEl={colorAnchor} onClose={() => setColorAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { mt: 1, p: 2, width: 270 } } }}>
            <Typography fontWeight={750}>Couleur du thème</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 1.5 }}>Cliquez sur la couleur pour ouvrir la roue.</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box component="label" className="color-picker-label" title="Ouvrir la roue de couleur">
                <Box component="input" className="color-picker-input" type="color" value={accentColor} onChange={(event) => selectAccentColor(event.target.value)} aria-label="Couleur personnalisée du thème" />
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
                helperText={hexError ? 'Format attendu : #RRGGBB' : 'Modifiable'}
                label="Valeur hexadécimale"
                size="small"
                slotProps={{ htmlInput: { maxLength: 7, spellCheck: false } }}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1.75 }}>
              {presetColors.map((color) => <IconButton key={color} onClick={() => selectAccentColor(color)} aria-label={`Choisir la couleur ${color}`} className="color-preset" sx={{ bgcolor: color, outline: color === accentColor ? '3px solid' : 'none', outlineColor: 'text.primary' }} />)}
            </Box>
            <Button size="small" onClick={() => { setHexValue('#6d4aff'); setHexError(false); onAccentReset(); }}>Rétablir le violet</Button>
          </Popover>
        </Box>
      </Container>
    </Box>
  );
}
