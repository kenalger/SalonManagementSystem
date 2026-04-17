import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer,
  List, ListItem, ListItemIcon, ListItemText, Avatar, Menu,
  MenuItem, Card, CardContent, Grid, Divider, Chip, useTheme,
  useMediaQuery, ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon, ContentCut, Dashboard, CalendarMonth,
  People, Spa, BarChart, Settings, Logout, AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard /> },
  { label: 'Appointments', icon: <CalendarMonth /> },
  { label: 'Clients', icon: <People /> },
  { label: 'Services', icon: <Spa /> },
  { label: 'Reports', icon: <BarChart /> },
  { label: 'Settings', icon: <Settings /> },
];

const statCards = [
  { label: "Today's Appointments", value: '—', color: '#667eea' },
  { label: 'Active Clients', value: '—', color: '#764ba2' },
  { label: 'Services Offered', value: '—', color: '#43a89b' },
  { label: "Today's Revenue", value: '—', color: '#f86ca7' },
];

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, organization, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ContentCut sx={{ color: 'primary.main', fontSize: 28 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            {organization?.name || 'SalonMS'}
          </Typography>
          {organization?.location && (
            <Typography variant="caption" color="text.secondary">
              {organization.location}
            </Typography>
          )}
        </Box>
      </Box>
      <Divider />
      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map(({ label, icon }) => (
          <ListItem key={label} disablePadding>
            <ListItemButton
              selected={activeNav === label}
              onClick={() => { setActiveNav(label); setMobileOpen(false); }}
              sx={{
                mx: 1, borderRadius: 2, mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Signed in as
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {user?.fullName}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            {activeNav}
          </Typography>
          <Chip
            label={organization?.name || 'No Organization'}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.fullName?.[0] ?? '?'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          p: 3,
          mt: 8,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={0.5}>
          Welcome back, {user?.fullName?.split(' ')[0]}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Here&apos;s what&apos;s happening at {organization?.name || 'your salon'} today.
        </Typography>

        <Grid container spacing={3}>
          {statCards.map(({ label, value, color }) => (
            <Grid key={label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: 2, bgcolor: color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5,
                    }}
                  >
                    <AccountCircle sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="h4" fontWeight={700}>{value}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ mt: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={1}>
              Getting Started
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your salon management system is ready. Start by adding your services and
              inviting staff members to your organization.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
