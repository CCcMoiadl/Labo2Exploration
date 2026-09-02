import { Box, Container, IconButton, Tooltip, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';

export default function AppHeader({ darkMode, onThemeToggle }) {
  return (
    <Box component="header" sx={{ pt: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box className="brand-mark"><AutoAwesomeRoundedIcon fontSize="small" /></Box>
            <Typography variant="h6">Unitly</Typography>
          </Box>
          <Tooltip title={darkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}>
            <IconButton onClick={onThemeToggle} aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              {darkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Container>
    </Box>
  );
}
