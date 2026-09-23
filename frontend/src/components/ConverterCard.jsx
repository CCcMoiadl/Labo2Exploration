import { Alert, Box, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import DeviceThermostatRoundedIcon from '@mui/icons-material/DeviceThermostatRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { messages, unitName } from '../i18n';

const categoryIcons = { length: <StraightenRoundedIcon />, volume: <WaterDropRoundedIcon />, weight: <ScaleRoundedIcon />, temperature: <DeviceThermostatRoundedIcon /> };

export default function ConverterCard({ categories, category, value, fromUnit, toUnit, result, formula, converting, validationError, language, onCategoryChange, onValueChange, onFromChange, onToChange, onSwap }) {
  const t = messages[language];
  const units = categories[category]?.units ?? [];
  const fromLabel = units.find((unit) => unit.id === fromUnit)?.label;
  const toLabel = units.find((unit) => unit.id === toUnit)?.label;
  return (
    <Paper component="section" className="converter-card" elevation={0}>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}><Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.12em' }}>{t.measurement}</Typography></Box>
      <Tabs value={category} onChange={onCategoryChange} variant="scrollable" scrollButtons="auto" aria-label={t.categories} sx={{ px: { xs: 1, sm: 2 }, mt: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        {Object.entries(categories).map(([key, item]) => <Tab key={key} value={key} icon={categoryIcons[key]} iconPosition="start" label={t.categoryNames[key] ?? item.name} />)}
      </Tabs>
      <Box sx={{ p: { xs: 2, sm: 3.5 } }}>
        {validationError && <Alert severity="warning" sx={{ mb: 3 }}>{validationError}</Alert>}
        <Box className="conversion-grid">
          <TextField fullWidth type="number" label={t.value} value={value} onChange={(event) => onValueChange(event.target.value)} placeholder="0" slotProps={{ htmlInput: { step: 'any' } }} />
          <FormControl fullWidth><InputLabel id="from-unit-label">{t.from}</InputLabel><Select labelId="from-unit-label" value={fromUnit} onChange={(event) => onFromChange(event.target.value)} label={t.from}>{units.map((unit) => <MenuItem key={unit.id} value={unit.id}>{unitName(unit, language)} · {unit.label}</MenuItem>)}</Select></FormControl>
          <Tooltip title={t.swap}><span className="swap-wrap"><IconButton className="swap-button" onClick={onSwap} disabled={!fromUnit || !toUnit} aria-label={t.swap}><SwapHorizRoundedIcon /></IconButton></span></Tooltip>
          <FormControl fullWidth><InputLabel id="to-unit-label">{t.to}</InputLabel><Select labelId="to-unit-label" value={toUnit} onChange={(event) => onToChange(event.target.value)} label={t.to}>{units.map((unit) => <MenuItem key={unit.id} value={unit.id}>{unitName(unit, language)} · {unit.label}</MenuItem>)}</Select></FormControl>
        </Box>
        <Box className="result-panel" aria-live="polite">
          {converting ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, minHeight: 92 }}><CircularProgress size={24} /><Typography color="text.secondary">{t.converting}</Typography></Box>
            : result !== null ? <><Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.12em' }}>{t.result}</Typography><Typography variant="h2" className="result-value">{result} <Box component="span">{toLabel}</Box></Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{value} {fromLabel} {t.equals} {result} {toLabel}</Typography>{formula && <Box component="code" className="formula">{formula}</Box>}</>
              : <Box sx={{ minHeight: 92, display: 'grid', placeItems: 'center' }}><Typography color="text.secondary">{t.enterValue}</Typography></Box>}
        </Box>
      </Box>
    </Paper>
  );
}
