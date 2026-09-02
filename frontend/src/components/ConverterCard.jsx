import { Alert, Box, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import DeviceThermostatRoundedIcon from '@mui/icons-material/DeviceThermostatRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';

const categoryIcons = { length: <StraightenRoundedIcon />, volume: <WaterDropRoundedIcon />, weight: <ScaleRoundedIcon />, temperature: <DeviceThermostatRoundedIcon /> };

export default function ConverterCard({ categories, category, value, fromUnit, toUnit, result, formula, converting, validationError, onCategoryChange, onValueChange, onFromChange, onToChange, onSwap }) {
  const units = categories[category]?.units ?? [];
  const fromLabel = units.find((unit) => unit.id === fromUnit)?.label;
  const toLabel = units.find((unit) => unit.id === toUnit)?.label;
  return (
    <Paper component="section" className="converter-card" elevation={0}>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}><Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.12em' }}>Type de mesure</Typography></Box>
      <Tabs value={category} onChange={onCategoryChange} variant="scrollable" scrollButtons="auto" aria-label="Catégories de conversion" sx={{ px: { xs: 1, sm: 2 }, mt: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        {Object.entries(categories).map(([key, item]) => <Tab key={key} value={key} icon={categoryIcons[key]} iconPosition="start" label={item.name} />)}
      </Tabs>
      <Box sx={{ p: { xs: 2, sm: 3.5 } }}>
        {validationError && <Alert severity="warning" sx={{ mb: 3 }}>{validationError}</Alert>}
        <Box className="conversion-grid">
          <TextField fullWidth type="number" label="Valeur à convertir" value={value} onChange={(event) => onValueChange(event.target.value)} placeholder="0" slotProps={{ htmlInput: { step: 'any' } }} />
          <FormControl fullWidth><InputLabel id="from-unit-label">Unité de départ</InputLabel><Select labelId="from-unit-label" value={fromUnit} onChange={(event) => onFromChange(event.target.value)} label="Unité de départ">{units.map((unit) => <MenuItem key={unit.id} value={unit.id}>{unit.name} · {unit.label}</MenuItem>)}</Select></FormControl>
          <Tooltip title="Inverser les unités"><span className="swap-wrap"><IconButton className="swap-button" onClick={onSwap} disabled={!fromUnit || !toUnit} aria-label="Inverser les unités"><SwapHorizRoundedIcon /></IconButton></span></Tooltip>
          <FormControl fullWidth><InputLabel id="to-unit-label">Unité d’arrivée</InputLabel><Select labelId="to-unit-label" value={toUnit} onChange={(event) => onToChange(event.target.value)} label="Unité d’arrivée">{units.map((unit) => <MenuItem key={unit.id} value={unit.id}>{unit.name} · {unit.label}</MenuItem>)}</Select></FormControl>
        </Box>
        <Box className="result-panel" aria-live="polite">
          {converting ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, minHeight: 92 }}><CircularProgress size={24} /><Typography color="text.secondary">Conversion en cours…</Typography></Box>
            : result !== null ? <><Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.12em' }}>Résultat</Typography><Typography variant="h2" className="result-value">{result} <Box component="span">{toLabel}</Box></Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{value} {fromLabel} équivaut à {result} {toLabel}</Typography>{formula && <Box component="code" className="formula">{formula}</Box>}</>
              : <Box sx={{ minHeight: 92, display: 'grid', placeItems: 'center' }}><Typography color="text.secondary">Entrez une valeur pour voir le résultat.</Typography></Box>}
        </Box>
      </Box>
    </Paper>
  );
}
