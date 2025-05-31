import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  EvStation,
  Schedule,
  Person,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 280;

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const getActiveTab = () => {
    if (location.pathname.includes('/chargers')) return 0;
    if (location.pathname.includes('/reservations')) return 1;
    if (location.pathname.includes('/profile')) return 2;
    return 0;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/chargers');
        break;
      case 1:
        navigate('/reservations');
        break;
      case 2:
        navigate('/profile');
        break;
    }
  };

  const navigationItems = [
    { label: 'Find Chargers', icon: <EvStation />, path: '/chargers', index: 0 },
    { label: 'Reservations', icon: <Schedule />, path: '/reservations', index: 1 },
    { label: 'Profile', icon: <Person />, path: '/profile', index: 2 },
  ];

  const isActiveNavItem = (index: number) => getActiveTab() === index;

  const sidebarContent = (
    <Box sx={{ p: 3 }}>
      {/* Logo/Brand */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <EvStation sx={{ mr: 2, color: '#4CAF50', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
          EV Finder
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ px: 0 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1.5,
                backgroundColor: isActiveNavItem(item.index) ? '#f0f8f0' : 'transparent',
                '&:hover': {
                  backgroundColor: isActiveNavItem(item.index) ? '#f0f8f0' : '#f5f5f5',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActiveNavItem(item.index) ? '#4CAF50' : '#666',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: isActiveNavItem(item.index) ? 600 : 400,
                    color: isActiveNavItem(item.index) ? '#4CAF50' : '#333',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              borderRight: '1px solid #e0e0e0',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Top App Bar - Mobile */}
        {isMobile && (
          <AppBar position="static" elevation={1}>
            <Toolbar>
              <EvStation sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                EV Finder
              </Typography>
              
              {/* User Profile */}
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="profile-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar
                  src={user?.picture}
                  alt={user?.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        {/* Desktop Top Bar */}
        {!isMobile && (
          <Box sx={{ display: 'none' }}>
            {/* User avatar removed - Profile accessible via sidebar */}
          </Box>
        )}

        {/* Profile Menu */}
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
            <Person sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} />
            Sign Out
          </MenuItem>
        </Menu>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Outlet />
        </Box>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <>
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
              <BottomNavigation
                value={getActiveTab()}
                onChange={handleTabChange}
                showLabels
                sx={{
                  '& .MuiBottomNavigationAction-root': {
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#4CAF50',
                    },
                  },
                }}
              >
                <BottomNavigationAction
                  label="Find Chargers"
                  icon={<EvStation />}
                />
                <BottomNavigationAction
                  label="Reservations"
                  icon={<Schedule />}
                />
                <BottomNavigationAction
                  label="Profile"
                  icon={<Person />}
                />
              </BottomNavigation>
            </Paper>
            {/* Add padding to prevent content from being hidden behind bottom nav */}
            <Box sx={{ height: 56 }} />
          </>
        )}
      </Box>
    </Box>
  );
};

export default MainLayout; 