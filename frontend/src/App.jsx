import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Container, CssBaseline, ThemeProvider, Typography, useMediaQuery } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AppHeader from './components/AppHeader';
import Hero from './components/Hero';
import ConverterCard from './components/ConverterCard';
import HistoryCard from './components/HistoryCard';
import { createAppTheme } from './theme';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';
const defaultUnits = { length: ['ft', 'm'], volume: ['l', 'gal'], weight: ['kg', 'lb'], temperature: ['C', 'F'] };

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === null ? prefersDarkMode : saved === 'true';
  });
  const theme = useMemo(() => createAppTheme(darkMode ? 'dark' : 'light'), [darkMode]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [category, setCategory] = useState('length');
  const [value, setValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [result, setResult] = useState(null);
  const [formula, setFormula] = useState('');
  const [converting, setConverting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('conversionHistory')) ?? []; }
    catch { return []; }
  });

  const setUnitsForCategory = useCallback((categoryId, data) => {
    const units = data[categoryId]?.units ?? [];
    const [preferredFrom, preferredTo] = defaultUnits[categoryId] ?? [];
    setFromUnit(units.some((unit) => unit.id === preferredFrom) ? preferredFrom : units[0]?.id ?? '');
    setToUnit(units.some((unit) => unit.id === preferredTo) ? preferredTo : units[1]?.id ?? units[0]?.id ?? '');
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Impossible de charger les catégories.');
        const data = await response.json();
        setCategories(data);
        setUnitsForCategory('length', data);
        setApiError(null);
      } catch {
        setApiError('Le serveur est hors ligne ou inaccessible. Vérifiez que le backend Node.js est démarré.');
      } finally { setLoading(false); }
    };
    fetchCategories();
  }, [setUnitsForCategory]);

  const performConversion = useCallback(async (inputValue, categoryId, from, to) => {
    if (inputValue === '' || Number.isNaN(Number(inputValue))) {
      setResult(null); setFormula(''); setValidationError(''); return;
    }
    const numericValue = Number(inputValue);
    if (categoryId !== 'temperature' && numericValue < 0) {
      setValidationError('Les valeurs négatives ne sont pas autorisées pour cette catégorie.');
      setResult(null); setFormula(''); return;
    }
    setValidationError('');
    try {
      setConverting(true);
      const response = await fetch(`${API_BASE_URL}/convert`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryId, fromUnit: from, toUnit: to, value: numericValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la conversion.');
      setResult(data.convertedValue); setFormula(data.formula);
      const units = categories[categoryId]?.units ?? [];
      const historyItem = {
        id: Date.now(), category: categoryId, categoryName: categories[categoryId]?.name ?? categoryId,
        fromUnit: from, toUnit: to,
        fromLabel: units.find((unit) => unit.id === from)?.label ?? from,
        toLabel: units.find((unit) => unit.id === to)?.label ?? to,
        originalValue: numericValue, convertedValue: data.convertedValue,
        timestamp: new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setHistory((previous) => {
        const updated = [historyItem, ...previous.slice(0, 19)];
        localStorage.setItem('conversionHistory', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      setValidationError(error.message || 'Erreur de connexion au serveur.');
    } finally { setConverting(false); }
  }, [categories]);

  useEffect(() => {
    if (loading || apiError || !fromUnit || !toUnit) return undefined;
    const timer = setTimeout(() => performConversion(value, category, fromUnit, toUnit), 300);
    return () => clearTimeout(timer);
  }, [value, category, fromUnit, toUnit, loading, apiError, performConversion]);

  const handleThemeToggle = () => setDarkMode((current) => {
    localStorage.setItem('darkMode', String(!current)); return !current;
  });
  const handleCategoryChange = (_event, nextCategory) => {
    if (!nextCategory || !categories[nextCategory]) return;
    setCategory(nextCategory); setResult(null); setFormula(''); setValidationError('');
    setUnitsForCategory(nextCategory, categories);
  };
  const handleSwap = () => {
    setFromUnit(toUnit); setToUnit(fromUnit);
    if (result !== null) setValue(String(result));
  };
  const handleRestore = (item) => {
    setCategory(item.category); setFromUnit(item.fromUnit); setToUnit(item.toUnit); setValue(String(item.originalValue));
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };
  const handleClear = () => { setHistory([]); localStorage.removeItem('conversionHistory'); };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-shell">
        <AppHeader darkMode={darkMode} onThemeToggle={handleThemeToggle} />
        <Container component="main" maxWidth="lg">
          <Hero />
          {loading ? <Box className="loading-state"><CircularProgress /><Typography color="text.secondary">Préparation du convertisseur…</Typography></Box>
            : apiError ? <Alert severity="error" className="connection-alert" action={<Button color="inherit" size="small" startIcon={<RefreshRoundedIcon />} onClick={() => window.location.reload()}>Réessayer</Button>}>{apiError}</Alert>
              : <Box className="content-grid">
                <ConverterCard categories={categories} category={category} value={value} fromUnit={fromUnit} toUnit={toUnit} result={result} formula={formula} converting={converting} validationError={validationError} onCategoryChange={handleCategoryChange} onValueChange={setValue} onFromChange={setFromUnit} onToChange={setToUnit} onSwap={handleSwap} />
                <HistoryCard history={history} onClear={handleClear} onRestore={handleRestore} />
              </Box>}
        </Container>
        <Typography component="footer" variant="body2" color="text.secondary" align="center" sx={{ py: 5 }}>Unitly · Des conversions simples et précises</Typography>
      </Box>
    </ThemeProvider>
  );
}
