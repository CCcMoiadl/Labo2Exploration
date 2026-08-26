import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  IconButton,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  CssBaseline,
  Tabs,
  Tab,
  useMediaQuery
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StraightenIcon from '@mui/icons-material/Straighten';
import OpacityIcon from '@mui/icons-material/Opacity';
import BalanceIcon from '@mui/icons-material/Balance';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import HistoryIcon from '@mui/icons-material/History';
import DeleteOutlineIcon from '@mui/icons-material/CompareArrows';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import RestoreIcon from '@mui/icons-material/Restore';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  // Theme state (dark mode by default or based on system pref)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return prefersDarkMode;
  });

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3f51b5', // indigo
      },
      secondary: {
        main: '#f50057', // pink
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      }
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      h4: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 500,
      }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
          }
        }
      }
    }
  });

  // State
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
    const saved = localStorage.getItem('conversionHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Toggle Dark Mode
  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  // Fetch Categories & Units from Backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) {
          throw new Error('Impossible de charger les catégories de conversion depuis le serveur.');
        }
        const data = await response.json();
        setCategories(data);
        
        // Set default units for default category 'length'
        if (data.length && data.length.units.length >= 2) {
          setFromUnit(data.length.units[3]?.id || data.length.units[0].id); // default 'ft' (pieds) or 'm'
          setToUnit(data.length.units[0].id); // default 'm' (mètres)
        }
        setApiError(null);
      } catch (err) {
        console.error(err);
        setApiError('Le serveur de backend est hors ligne ou inaccessible. Veuillez démarrer le serveur Node.js.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Set units when category changes
  const handleCategoryChange = (event, newCategory) => {
    if (newCategory === null || !categories[newCategory]) return;
    
    setCategory(newCategory);
    setValidationError('');
    setResult(null);
    setFormula('');
    
    const catUnits = categories[newCategory].units;
    if (catUnits && catUnits.length >= 2) {
      if (newCategory === 'length') {
        // pieds -> mètres par défaut
        const ftUnit = catUnits.find(u => u.id === 'ft');
        const mUnit = catUnits.find(u => u.id === 'm');
        setFromUnit(ftUnit ? 'ft' : catUnits[0].id);
        setToUnit(mUnit ? 'm' : catUnits[1].id);
      } else if (newCategory === 'volume') {
        // litres -> gallons par défaut
        const lUnit = catUnits.find(u => u.id === 'l');
        const galUnit = catUnits.find(u => u.id === 'gal');
        setFromUnit(lUnit ? 'l' : catUnits[0].id);
        setToUnit(galUnit ? 'gal' : catUnits[1].id);
      } else if (newCategory === 'weight') {
        // kg -> lb par défaut
        const kgUnit = catUnits.find(u => u.id === 'kg');
        const lbUnit = catUnits.find(u => u.id === 'lb');
        setFromUnit(kgUnit ? 'kg' : catUnits[0].id);
        setToUnit(lbUnit ? 'lb' : catUnits[1].id);
      } else {
        setFromUnit(catUnits[0].id);
        setToUnit(catUnits[1].id);
      }
    }
  };

  // Main Conversion Function
  const performConversion = useCallback(async (valToConvert, cat, from, to) => {
    if (valToConvert === '' || isNaN(valToConvert)) {
      setResult(null);
      setFormula('');
      setValidationError('');
      return;
    }

    const numValue = Number(valToConvert);

    // Validation
    if (cat !== 'temperature' && numValue < 0) {
      setValidationError('Les valeurs négatives ne sont pas autorisées pour cette catégorie.');
      setResult(null);
      setFormula('');
      return;
    }
    setValidationError('');

    try {
      setConverting(true);
      const response = await fetch(`${API_BASE_URL}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: cat,
          fromUnit: from,
          toUnit: to,
          value: numValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la conversion');
      }

      setResult(data.convertedValue);
      setFormula(data.formula);

      // Add to history
      const fromLabel = categories[cat]?.units.find(u => u.id === from)?.label || from;
      const toLabel = categories[cat]?.units.find(u => u.id === to)?.label || to;
      const catName = categories[cat]?.name || cat;

      const newHistoryItem = {
        id: Date.now(),
        category: cat,
        categoryName: catName,
        fromUnit: from,
        toUnit: to,
        fromLabel,
        toLabel,
        originalValue: numValue,
        convertedValue: data.convertedValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setHistory(prev => {
        const updated = [newHistoryItem, ...prev.slice(0, 19)]; // limit to 20 items
        localStorage.setItem('conversionHistory', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error(err);
      setValidationError(err.message || 'Erreur de connexion au serveur.');
    } finally {
      setConverting(false);
    }
  }, [categories]);

  // Debounce/Trigger auto-conversion on input change
  useEffect(() => {
    if (!loading && !apiError && fromUnit && toUnit) {
      const timer = setTimeout(() => {
        performConversion(value, category, fromUnit, toUnit);
      }, 300); // Debounce conversions for 300ms
      return () => clearTimeout(timer);
    }
  }, [value, category, fromUnit, toUnit, loading, apiError, performConversion]);

  // Swap From and To Units
  const handleSwapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    if (result !== null) {
      setValue(result.toString());
    }
  };

  // Restore history item
  const handleRestoreHistory = (item) => {
    setCategory(item.category);
    setFromUnit(item.fromUnit);
    setToUnit(item.toUnit);
    setValue(item.originalValue.toString());
  };

  // Clear all history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('conversionHistory');
  };

  // Get Icon for Category
  const getCategoryIcon = (catId) => {
    switch (catId) {
      case 'length':
        return <StraightenIcon />;
      case 'volume':
        return <OpacityIcon />;
      case 'weight':
        return <BalanceIcon />;
      case 'temperature':
        return <ThermostatIcon />;
      default:
        return <StraightenIcon />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Header Bar */}
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🔄 Super Convertisseur d'Unités
          </Typography>
          <Tooltip title={darkMode ? "Mode Clair" : "Mode Sombre"}>
            <IconButton onClick={handleThemeToggle} color="inherit">
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="textSecondary">Chargement des configurations de conversion...</Typography>
          </Box>
        ) : apiError ? (
          <Box sx={{ mt: 4 }}>
            <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Erreur de connexion</Typography>
              <Typography>{apiError}</Typography>
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.reload()}
                sx={{ px: 4, py: 1.5 }}
              >
                Réessayer la connexion
              </Button>
            </Box>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Main Conversion Panel */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ overflow: 'hidden' }}>
                {/* Category Selector Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: darkMode ? '#252525' : '#fafafa' }}>
                  <Tabs
                    value={category}
                    onChange={handleCategoryChange}
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                    aria-label="categories de conversion"
                  >
                    {Object.entries(categories).map(([key, cat]) => (
                      <Tab
                        key={key}
                        value={key}
                        icon={getCategoryIcon(key)}
                        iconPosition="start"
                        label={cat.name}
                        sx={{ minHeight: 64, fontWeight: 'bold' }}
                      />
                    ))}
                  </Tabs>
                </Box>

                <CardContent sx={{ p: 4 }}>
                  {/* Validation Alerts */}
                  {validationError && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                      {validationError}
                    </Alert>
                  )}

                  {/* Input form */}
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Valeur à convertir"
                        variant="outlined"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Entrez un nombre..."
                        inputProps={{ step: "any" }}
                      />
                    </Grid>

                    <Grid item xs={5} sm={3}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="from-unit-label">De</InputLabel>
                        <Select
                          labelId="from-unit-label"
                          value={fromUnit}
                          onChange={(e) => setFromUnit(e.target.value)}
                          label="De"
                        >
                          {categories[category]?.units.map((unit) => (
                            <MenuItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.label})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={2} sm={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Inverser les unités">
                        <IconButton 
                          onClick={handleSwapUnits} 
                          color="primary"
                          disabled={!fromUnit || !toUnit}
                          sx={{ 
                            bgcolor: darkMode ? '#2d2d2d' : '#f0f2f9',
                            '&:hover': { bgcolor: darkMode ? '#3d3d3d' : '#e2e5f5' }
                          }}
                        >
                          <CompareArrowsIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>

                    <Grid item xs={5} sm={4}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="to-unit-label">Vers</InputLabel>
                        <Select
                          labelId="to-unit-label"
                          value={toUnit}
                          onChange={(e) => setToUnit(e.target.value)}
                          label="Vers"
                        >
                          {categories[category]?.units.map((unit) => (
                            <MenuItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.label})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Results panel */}
                  {(result !== null || converting) && (
                    <Box 
                      sx={{ 
                        mt: 4, 
                        p: 3, 
                        bgcolor: darkMode ? '#2d2d2d' : '#f4f6fc', 
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: darkMode ? '#3d3d3d' : '#e1e5f2',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                    >
                      {converting ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                          <CircularProgress size={30} sx={{ mr: 2 }} />
                          <Typography variant="body1" color="textSecondary">Conversion en cours...</Typography>
                        </Box>
                      ) : (
                        <>
                          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            Résultat de la conversion
                          </Typography>
                          <Typography variant="h4" color="primary" sx={{ my: 1, wordBreak: 'break-all' }}>
                            {value} {categories[category]?.units.find(u => u.id === fromUnit)?.label} = {result} {categories[category]?.units.find(u => u.id === toUnit)?.label}
                          </Typography>
                          {formula && (
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                              Formule appliquée : {formula}
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Paper>
            </Grid>

            {/* History Panel */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon /> Historique récent
                    </Typography>
                    {history.length > 0 && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={handleClearHistory}
                      >
                        Effacer
                      </Button>
                    )}
                  </Box>
                  <Divider />
                  
                  {history.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                      Aucune conversion récente. Vos calculs s'afficheront ici au fur et à mesure.
                    </Typography>
                  ) : (
                    <List sx={{ maxH: 300, overflow: 'auto', p: 0 }}>
                      {history.map((item) => (
                        <ListItem 
                          key={item.id} 
                          divider 
                          sx={{ 
                            px: 1,
                            transition: 'background-color 0.2s',
                            '&:hover': { bgcolor: darkMode ? '#2a2a2a' : '#fcfcfc' }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="medium">
                                {item.originalValue} {item.fromLabel} ➔ {item.convertedValue} {item.toLabel}
                              </Typography>
                            }
                            secondary={`${item.categoryName} • ${item.timestamp}`}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Réappliquer cette conversion">
                              <IconButton edge="end" onClick={() => handleRestoreHistory(item)} color="primary">
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </ThemeProvider>
  );
}
