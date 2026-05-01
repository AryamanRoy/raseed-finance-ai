import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  Psychology,
  Receipt,
  Inventory,
  Assessment,
  ArrowForward,
  Login,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <TrendingUp />,
      title: 'Expense Visualization',
      description: 'Interactive charts and graphs to visualize your spending patterns and trends.',
      color: 'primary.main',
    },
    {
      icon: <Assessment />,
      title: 'Financial Insights',
      description: 'AI-powered analysis of your financial health with personalized recommendations.',
      color: 'success.main',
    },
    {
      icon: <Psychology />,
      title: 'AI Financial Advisor',
      description: 'Get personalized financial advice powered by artificial intelligence.',
      color: 'warning.main',
    },
    {
      icon: <Receipt />,
      title: 'Expense Tracker',
      description: 'Track and categorize your daily expenses with smart automation.',
      color: 'info.main',
    },
    {
      icon: <Inventory />,
      title: 'Inventory Management',
      description: 'Manage your business assets and inventory with automated alerts.',
      color: 'secondary.main',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(215, 50%, 25%) 0%, hsl(215, 45%, 35%) 50%, hsl(215, 40%, 45%) 100%)',
      }}
    >
      {/* Navigation */}
      <Box sx={{ py: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  mr: 2,
                  width: 40,
                  height: 40,
                }}
              >
                <AccountBalance />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                Raseed
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Login />}
                onClick={() => navigate('/login')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: 'white',
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            Smart Financial Management
            <br />
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Powered by AI</span>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Take control of your finances with our comprehensive dashboard featuring
            AI-powered insights, expense tracking, and intelligent recommendations.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              View Demo
            </Button>
          </Box>
        </Box>

        {/* Features Grid */}
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            color: 'white',
            mb: 6,
          }}
        >
          Comprehensive Financial Tools
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {features.map((feature, index) => (
            <Box key={index} sx={{ flex: '1 1 300px', maxWidth: '350px', minWidth: '280px' }}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: feature.color,
                      width: 56,
                      height: 56,
                      mb: 3,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            mt: 8,
            textAlign: 'center',
            p: 6,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 2 }}>
            Ready to Transform Your Finances?
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
            Join thousands of users who have taken control of their financial future.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
            <Chip label="Free Trial" sx={{ bgcolor: 'success.main', color: 'white' }} />
            <Chip label="No Credit Card Required" sx={{ bgcolor: 'info.main', color: 'white' }} />
            <Chip label="Cancel Anytime" sx={{ bgcolor: 'warning.main', color: 'white' }} />
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.2rem',
              fontWeight: 600,
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            Get Started Now
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Index;