import { Box, Button, IconButton, List, ListItem, ListItemText, Paper, Tooltip, Typography } from '@mui/material';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import { categoryName, messages } from '../i18n';

export default function HistoryCard({ history, onClear, onRestore, language }) {
  const t = messages[language];
  return (
    <Paper component="section" className="history-card" elevation={0}>
      <Box className="history-heading">
        <Box><Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><HistoryRoundedIcon color="primary" /> {t.history}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t.lastConversions}</Typography></Box>
        {history.length > 0 && <Button size="small" color="inherit" startIcon={<DeleteOutlineRoundedIcon />} onClick={onClear}>{t.clear}</Button>}
      </Box>
      {history.length === 0 ? <Box className="empty-history"><HistoryRoundedIcon /><Typography fontWeight={700}>{t.empty}</Typography><Typography variant="body2" color="text.secondary">{t.next}</Typography></Box>
        : <List disablePadding className="history-list">{history.map((item) => <ListItem key={item.id} className="history-item" secondaryAction={<Tooltip title={t.restore}><IconButton edge="end" onClick={() => onRestore(item)} aria-label={t.restore}><ReplayRoundedIcon /></IconButton></Tooltip>}><Box className="history-icon"><NorthEastRoundedIcon fontSize="small" /></Box><ListItemText primary={<Typography fontWeight={750}>{item.originalValue} {item.fromLabel} <Box component="span" color="text.secondary">→</Box> {item.convertedValue} {item.toLabel}</Typography>} secondary={`${categoryName(item.category, item.categoryName, language)} · ${item.timestamp}`} /></ListItem>)}</List>}
    </Paper>
  );
}
