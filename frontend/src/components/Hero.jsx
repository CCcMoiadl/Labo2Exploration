import { Box, Chip, Typography } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import heroImage from '../assets/hero.png';
import { messages } from '../i18n';

export default function Hero({ language }) {
  const t = messages[language];
  return (
    <Box className="hero" component="section">
      <Box className="hero-copy">
        <Chip icon={<BoltRoundedIcon />} label={t.instant} className="hero-chip" />
        <Typography component="h1" variant="h1">{t.heroTitle}<Box component="span" className="gradient-text">{t.heroAccent}</Box></Typography>
        <Typography color="text.secondary" sx={{ mt: 2.5, maxWidth: 580, fontSize: { xs: '1rem', md: '1.12rem' }, lineHeight: 1.7 }}>
          {t.heroDescription}
        </Typography>
      </Box>
      <Box className="hero-art" aria-hidden="true">
        <Box className="hero-glow" />
        <Box className="hero-illustration" sx={{ '--hero-image': `url(${heroImage})` }} />
      </Box>
    </Box>
  );
}
