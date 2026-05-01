import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Psychology,
  Receipt,
  Inventory,
  Assessment,
  ArrowForward,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/context/TransactionContext';
import { CSVUpload } from '@/components/CSVUpload';
import { 
  getTransactionsForMonth, 
  getTransactionsByCategory, 
  getTotalIncome, 
  getTotalExpenses,
  getCategoryColor 
} from '@/lib/csvParser';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { transactions, hasData } = useTransactions();
  const navigate = useNavigate();
  
  // Get the most recent month from the data, or current month if no data
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Find the most recent month in the data
  const getMostRecentMonth = useMemo(() => {
    if (!hasData || transactions.length === 0) return { month: currentMonth, year: currentYear };
    
    const latestDate = transactions.reduce((latest, txn) => {
      return txn.date > latest ? txn.date : latest;
    }, transactions[0].date);
    
    return { month: latestDate.getMonth(), year: latestDate.getFullYear() };
  }, [transactions, hasData, currentMonth, currentYear]);
  
  const monthTransactions = useMemo(() => {
    if (!hasData) return [];
    return getTransactionsForMonth(transactions, getMostRecentMonth.month, getMostRecentMonth.year);
  }, [transactions, getMostRecentMonth.month, getMostRecentMonth.year, hasData]);

  // Calculate metrics
  const isIncome = (desc: string) => {
    const incomeKeywords = ['salary', 'income', 'refund'];
    const lowerDesc = desc.toLowerCase();
    return incomeKeywords.some(keyword => lowerDesc.includes(keyword)) ||
           (lowerDesc.includes('company') && lowerDesc.includes('salary'));
  };

  const income = useMemo(() => {
    return monthTransactions
      .filter(t => isIncome(t.description))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const expenses = useMemo(() => {
    return monthTransactions
      .filter(t => !isIncome(t.description))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const balance = income - expenses;

  // Category breakdown
  const expenseTransactions = useMemo(() => {
    return monthTransactions.filter(t => !isIncome(t.description));
  }, [monthTransactions]);

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    expenseTransactions.forEach(txn => {
      const current = categoryMap.get(txn.category) || 0;
      categoryMap.set(txn.category, current + Math.abs(txn.amount));
    });
    
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        color: getCategoryColor(category),
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenseTransactions]);

  // Daily spending data for the month
  const dailyData = useMemo(() => {
    const dayMap = new Map<number, number>();
    expenseTransactions.forEach(txn => {
      const day = txn.date.getDate();
      const current = dayMap.get(day) || 0;
      dayMap.set(day, current + Math.abs(txn.amount));
    });
    
    return Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => {
      const day = i + 1;
      return {
        day: day.toString(),
        amount: dayMap.get(day) || 0,
      };
    });
  }, [expenseTransactions, currentMonth, currentYear]);

  // Savings percentage
  const savingsPercentage = income > 0 ? Math.round((balance / income) * 100) : 0;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* CSV Upload */}
      <CSVUpload />

      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back! 👋
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {hasData && monthTransactions.length > 0
            ? `Here's an overview of your financial health for ${new Date(getMostRecentMonth.year, getMostRecentMonth.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`
            : hasData 
            ? 'Upload a CSV file with transaction data to see your financial dashboard.'
            : 'Upload a CSV file to see your financial dashboard with real data.'}
        </Typography>
      </Box>

      {!hasData ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              No data available
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Upload your bank transaction CSV file to see insights and visualizations.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
            <Box sx={{ flex: '1 1 200px' }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, hsl(142, 69%, 58%) 0%, hsl(142, 65%, 48%) 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <TrendingUp />
                    </Avatar>
                    <Chip 
                      label={savingsPercentage >= 0 ? `+${savingsPercentage}%` : `${savingsPercentage}%`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                    ₹{balance.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Net Balance
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px' }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, hsl(215, 50%, 25%) 0%, hsl(215, 45%, 35%) 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <AccountBalance />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                    ₹{income.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Monthly Income
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px' }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, hsl(0, 72%, 51%) 0%, hsl(0, 68%, 41%) 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <TrendingDown />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                    ₹{expenses.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Monthly Expenses
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px' }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, hsl(43, 96%, 56%) 0%, hsl(43, 92%, 46%) 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <Assessment />
                    </Avatar>
                    <Chip 
                      label={savingsPercentage >= 20 ? "On Track" : savingsPercentage >= 0 ? "Needs Work" : "Over Budget"} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                    {savingsPercentage}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Savings Rate
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Charts Section */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
            <Box sx={{ flex: '2 1 500px' }}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Daily Spending Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                      <Line type="monotone" dataKey="amount" stroke="hsl(0, 72%, 51%)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 300px' }}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Expense Breakdown
                  </Typography>
                  {categoryData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
                        {categoryData.slice(0, 4).map((item, index) => (
                          <Chip
                            key={index}
                            label={`${item.name}: ₹${item.value.toLocaleString('en-IN')}`}
                            size="small"
                            sx={{ 
                              bgcolor: item.color, 
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No expense data for this month
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '2 1 500px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    AI Financial Insights
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {categoryData.length > 0 && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 32, height: 32 }}>
                            <Psychology sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="body2">
                            Your largest expense category is {categoryData[0].name} (₹{categoryData[0].value.toLocaleString('en-IN')}). 
                            Consider reviewing this category for potential savings.
                          </Typography>
                        </Box>
                        {savingsPercentage >= 20 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 32, height: 32 }}>
                              <Psychology sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography variant="body2">
                              Excellent savings rate of {savingsPercentage}%! You're on track for your financial goals.
                            </Typography>
                          </Box>
                        )}
                        {savingsPercentage < 20 && savingsPercentage >= 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'warning.main', mr: 2, width: 32, height: 32 }}>
                              <Psychology sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography variant="body2">
                              Your savings rate is {savingsPercentage}%. Aim for at least 20% to build a strong financial foundation.
                            </Typography>
                          </Box>
                        )}
                        {savingsPercentage < 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'error.main', mr: 2, width: 32, height: 32 }}>
                              <Psychology sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography variant="body2">
                              You're spending more than you earn. Review your expenses and create a budget to get back on track.
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                  <Button 
                    variant="contained" 
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/insights')}
                    sx={{ mt: 2 }}
                  >
                    Get More Insights
                  </Button>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 300px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Receipt />}
                      onClick={() => navigate('/tracker')}
                      sx={{ py: 2, flexDirection: 'column', height: 80 }}
                    >
                      Track Expense
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingUp />}
                      onClick={() => navigate('/expenses')}
                      sx={{ py: 2, flexDirection: 'column', height: 80 }}
                    >
                      View Reports
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Psychology />}
                      onClick={() => navigate('/advisor')}
                      sx={{ py: 2, flexDirection: 'column', height: 80 }}
                    >
                      Ask AI
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Inventory />}
                      onClick={() => navigate('/inventory')}
                      sx={{ py: 2, flexDirection: 'column', height: 80 }}
                    >
                      Inventory
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
