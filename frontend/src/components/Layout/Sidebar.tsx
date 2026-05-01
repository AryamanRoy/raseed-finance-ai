import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  TrendingUp,
  Psychology,
  Receipt,
  Inventory,
  Assessment,
  AccountBalance,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onItemClick?: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: Dashboard, path: '/dashboard' },
  { text: 'Expense Visualization', icon: TrendingUp, path: '/expenses' },
  { text: 'Financial Insights', icon: Assessment, path: '/insights' },
  { text: 'AI Financial Advisor', icon: Psychology, path: '/advisor' },
  { text: 'Expense Tracker', icon: Receipt, path: '/tracker' },
  { text: 'Inventory Management', icon: Inventory, path: '/inventory' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand Section */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: 'primary.main',
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, hsl(215, 50%, 25%), hsl(215, 45%, 35%))',
          }}
        >
          <AccountBalance />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Raseed
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Smart Financial Management
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 1, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive 
                      ? 'primary.dark' 
                      : 'action.hover',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.contrastText' : 'primary.main',
                    minWidth: 40,
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Footer Section */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © 2024 Raseed
        </Typography>
      </Box>
    </Box>
  );
};