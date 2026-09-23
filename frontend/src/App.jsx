import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Container, CssBaseline, ThemeProvider, Typography, useMediaQuery } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AppHeader from './components/AppHeader';
import Hero from './components/Hero';
import ConverterCard from './components/ConverterCard';
import HistoryCard from './components/HistoryCard';
import { createAppTheme } from './theme';
import './App.css';
import { requestConversion, validateConversion } from './conversion';
import { messages } from './i18n';

const API_BASE_URL = '/api';
const DEFAULT_ACCENT_COLOR = '#6d4aff';
const defaultUnits = { length: ['ft', 'm'], volume: ['l', 'gal'], weight: ['kg', 'lb'], temperature: ['C', 'F'] };
const isHexColor = (color) => /^#[0-9a-f]{6}$/i.test(color);

export default function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') === 'en' ? 'en' : 'fr');
  const t = messages[language];
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === null ? prefersDarkMode : saved === 'true';
  });
  const [accentColor, setAccentColor] = useState(() => {
    const saved = localStorage.getItem('accentColor');
    return isHexColor(saved) ? saved : DEFAULT_ACCENT_COLOR;
  });
  const theme = useMemo(() => createAppTheme(darkMode ? 'dark' : 'light', accentColor), [darkMode, accentColor]);
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
        if (!response.ok) throw new Error('categories');
        const data = await response.json();
        setCategories(data);
        setUnitsForCategory('length', data);
        setApiError(null);
      } catch {
        setApiError('offline');
      } finally { setLoading(false); }
    };
    fetchCategories();
  }, [setUnitsForCategory]);

  const performConversion = useCallback(async (inputValue, categoryId, from, to, signal) => {
    const error = validateConversion(inputValue, categoryId, from, to, categories, language);
    setResult(null); setFormula('');
    if (error) {
      setValidationError(error); setConverting(false); return;
    }
    const numericValue = Number(inputValue);
    setValidationError('');
    try {
      setConverting(true);
      const data = await requestConversion({ category: categoryId, fromUnit: from, toUnit: to, value: numericValue }, signal, language);
      if (signal.aborted) return;
      setResult(data.convertedValue); setFormula(data.formula);
      const units = categories[categoryId]?.units ?? [];
      const historyItem = {
        id: Date.now(), category: categoryId, categoryName: categories[categoryId]?.name ?? categoryId,
        fromUnit: from, toUnit: to,
        fromLabel: units.find((unit) => unit.id === from)?.label ?? from,
        toLabel: units.find((unit) => unit.id === to)?.label ?? to,
        originalValue: numericValue, convertedValue: data.convertedValue,
        timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setHistory((previous) => {
        const updated = [historyItem, ...previous.slice(0, 19)];
        localStorage.setItem('conversionHistory', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      if (signal.aborted) return;
      setResult(null); setFormula('');
      setValidationError(error.message || t.connection);
    } finally { if (!signal.aborted) setConverting(false); }
  }, [categories, language, t.connection]);

  useEffect(() => {
    if (loading || apiError || !fromUnit || !toUnit) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => performConversion(value, category, fromUnit, toUnit, controller.signal), 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, category, fromUnit, toUnit, loading, apiError, performConversion]);

  const handleThemeToggle = () => setDarkMode((current) => {
    localStorage.setItem('darkMode', String(!current)); return !current;
  });
  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem('language', nextLanguage);
    document.documentElement.lang = nextLanguage;
  };
  const handleAccentChange = (color) => {
    if (!isHexColor(color)) return;
    setAccentColor(color);
    localStorage.setItem('accentColor', color);
  };
  const handleAccentReset = () => handleAccentChange(DEFAULT_ACCENT_COLOR);
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
      <Box className="app-shell" style={{ '--theme-color': accentColor }}>
        <AppHeader darkMode={darkMode} accentColor={accentColor} language={language} onLanguageChange={handleLanguageChange} onThemeToggle={handleThemeToggle} onAccentChange={handleAccentChange} onAccentReset={handleAccentReset} />
        <Container component="main" maxWidth="lg">
          <Hero language={language} />
          {loading ? <Box className="loading-state"><CircularProgress /><Typography color="text.secondary">{t.preparing}</Typography></Box>
            : apiError ? <Alert severity="error" className="connection-alert" action={<Button color="inherit" size="small" startIcon={<RefreshRoundedIcon />} onClick={() => window.location.reload()}>{t.retry}</Button>}>{apiError === 'offline' ? t.offline : t.loadCategories}</Alert>
              : <Box className="content-grid">
                <ConverterCard categories={categories} category={category} value={value} fromUnit={fromUnit} toUnit={toUnit} result={result} formula={formula} converting={converting} validationError={validationError} language={language} onCategoryChange={handleCategoryChange} onValueChange={setValue} onFromChange={setFromUnit} onToChange={setToUnit} onSwap={handleSwap} />
                <HistoryCard history={history} onClear={handleClear} onRestore={handleRestore} language={language} />
              </Box>}
        </Container>
        <Typography component="footer" variant="body2" color="text.secondary" align="center" sx={{ py: 5 }}>{t.footer}</Typography>
      </Box>
    </ThemeProvider>
  );
}
