import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Psychology,
  Send,
  Lightbulb,
  TrendingUp,
  AccountBalance,
  Savings,
  Timeline,
  QuestionAnswer,
} from '@mui/icons-material';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "How can I improve my credit score?",
  "What's the best way to pay off my debt?",
  "Should I invest in stocks or bonds?",
  "How much should I save for retirement?",
  "What are some ways to reduce my expenses?",
  "Is it a good time to buy a house?",
];

const AIAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI Financial Advisor. I've analyzed your categorized financial data. Ask me anything about your spending, savings, or investments!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ handleSendMessage calls FastAPI backend /chat endpoint
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage.content,
          file_id: "latest", // ✅ backend will use latest categorized CSV
          history: messages.map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      // Check if response is ok before parsing
      if (!res.ok) {
        let errorMessage = `Failed to get response (${res.status}): ${res.statusText}`;
        let errorDetail = '';
        
        try {
          const errorData = await res.json();
          errorDetail = errorData.detail || errorData.message || errorData.error || '';
          if (errorDetail) {
            errorMessage = errorDetail;
          }
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await res.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            // If we can't read the response, use the status text
            console.error('Could not parse error response:', parseError, textError);
          }
        }
        
        // Provide helpful messages based on status code
        if (res.status === 404) {
          if (errorMessage.includes('categorized files') || errorMessage.includes('file not found')) {
            errorMessage = 'No categorized transaction file found. Please upload and categorize a CSV file first.';
          } else if (!errorDetail) {
            errorMessage = 'Endpoint not found. Please make sure the backend server is running on port 8000.';
          }
        } else if (res.status === 500) {
          if (errorMessage.includes('API key')) {
            errorMessage = 'Gemini API key is missing. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.';
          }
        }
        
        const errorMsg: Message = {
          id: messages.length + 2,
          type: 'ai',
          content: `⚠️ Error: ${errorMessage}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      const data = await res.json();

      const aiResponse: Message = {
        id: messages.length + 2,
        type: 'ai',
        content:
          data.response ||
          data.error ||
          data.detail ||
          '⚠️ Could not get a response. Please check the backend.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat request failed:', error);
      const errorMsg: Message = {
        id: messages.length + 2,
        type: 'ai',
        content:
          error instanceof Error
            ? `⚠️ Connection error: ${error.message}. Please make sure FastAPI backend is running on port 8000.`
            : '⚠️ Connection error. Please make sure FastAPI backend is running on port 8000.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Clicking a suggested question fills the textbox
  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          AI Financial Advisor
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Get personalized financial advice powered by AI analysis of your financial data
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Chat Section */}
        <Box sx={{ flex: '1 1 60%', minWidth: '300px' }}>
          <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Messages */}
            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', maxHeight: 'calc(70vh - 120px)' }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      maxWidth: '70%',
                      flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: message.type === 'user' ? 'primary.main' : 'success.main',
                        width: 36,
                        height: 36,
                        mx: 1,
                        background: message.type === 'user'
                          ? 'linear-gradient(135deg, hsl(215, 50%, 25%), hsl(215, 45%, 35%))'
                          : 'linear-gradient(135deg, hsl(142, 69%, 58%), hsl(142, 65%, 48%))',
                      }}
                    >
                      {message.type === 'user' ? '👤' : <Psychology />}
                    </Avatar>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: message.type === 'user' ? 'primary.main' : 'background.paper',
                        color: message.type === 'user' ? 'white' : 'text.primary',
                        borderRadius: 2,
                        border: message.type === 'ai' ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                          textAlign: message.type === 'user' ? 'right' : 'left'
                        }}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Input Section */}
            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask me anything about your finances..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  sx={{
                    minWidth: 'auto',
                    px: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, hsl(215, 50%, 25%), hsl(215, 45%, 35%))',
                  }}
                >
                  <Send />
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px' }}>
          {/* Suggested Questions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <QuestionAnswer sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Suggested Questions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {suggestedQuestions.map((question, index) => (
                  <Chip
                    key={index}
                    label={question}
                    variant="outlined"
                    onClick={() => handleSuggestedQuestion(question)}
                    sx={{
                      justifyContent: 'flex-start',
                      height: 'auto',
                      py: 1,
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        textAlign: 'left',
                      },
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Quick Insights */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lightbulb sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Quick Insights
                </Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Spending improved"
                    secondary="8% decrease this month"
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <AccountBalance sx={{ color: 'primary.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Emergency fund"
                    secondary="2.3 months coverage"
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <Savings sx={{ color: 'warning.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Savings rate"
                    secondary="Currently at 8%"
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <Timeline sx={{ color: 'info.main', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Investment potential"
                    secondary="₹2,000 in low-yield savings"
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default AIAdvisor;