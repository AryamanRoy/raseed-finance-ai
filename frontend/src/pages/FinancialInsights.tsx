import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  GpsFixed,
  Lightbulb,
  Warning,
  CheckCircle,
  Timeline,
  PieChart,
  BarChart,
  Psychology,
  AccountBalance,
} from '@mui/icons-material';
import { useTransactions } from '@/context/TransactionContext';
import { CSVUpload } from '@/components/CSVUpload';
import { getTransactionsForMonth, getCategoryColor } from '@/lib/csvParser';

const FinancialInsights: React.FC = () => {
  const { transactions, hasData } = useTransactions();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isIncome = (desc: string) => {
    const incomeKeywords = ['salary', 'income', 'refund'];
    const lowerDesc = desc.toLowerCase();
    return incomeKeywords.some(keyword => lowerDesc.includes(keyword)) ||
           (lowerDesc.includes('company') && lowerDesc.includes('salary'));
  };

  // Get the most recent month from the data
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

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const categoryMap = new Map<string, number>();
    monthTransactions
      .filter(t => !isIncome(t.description))
      .forEach(txn => {
        const current = categoryMap.get(txn.category) || 0;
        categoryMap.set(txn.category, current + txn.amount);
      });
    return categoryMap;
  }, [monthTransactions]);

  // Calculate financial health score (0-100)
  const financialHealthScore = useMemo(() => {
    if (income === 0) return 0;
    
    const savingsRate = ((income - expenses) / income) * 100;
    let score = 50; // Base score

    // Savings rate contribution (0-30 points)
    if (savingsRate >= 20) score += 30;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate >= 0) score += 10;
    else score -= 10; // Negative savings

    // Expense diversity (0-10 points) - having multiple categories is good
    const categoryCount = categoryTotals.size;
    if (categoryCount >= 5) score += 10;
    else if (categoryCount >= 3) score += 5;

    // Income stability (0-10 points) - having income is good
    if (income > 0) score += 10;

    return Math.min(100, Math.max(0, score));
  }, [income, expenses, categoryTotals.size]);

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const savingsAmount = income - expenses;

  // Budget performance (using 20% rule for expenses)
  const budgetCategories = useMemo(() => {
    const totalExpenses = Array.from(categoryTotals.values()).reduce((a, b) => a + b, 0);
    const averageCategoryBudget = totalExpenses / Math.max(categoryTotals.size, 1);
    
    return Array.from(categoryTotals.entries())
      .map(([category, amount]) => {
        const budget = averageCategoryBudget * 1.2; // 20% buffer
        const percentage = (amount / budget) * 100;
        return {
          category,
          amount,
          budget,
          percentage: Math.min(percentage, 150), // Cap at 150% for display
          isOverBudget: percentage > 100,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [categoryTotals]);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* CSV Upload */}
      <CSVUpload />

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Financial Insights
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {hasData 
            ? 'AI-powered analysis of your financial health and personalized recommendations'
            : 'Upload a CSV file to see your financial insights'}
        </Typography>
      </Box>

      {!hasData ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              No data available
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Upload your bank transaction CSV file to see financial insights and recommendations.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Financial Health Score */}
          <Card sx={{ mb: 4, background: 'linear-gradient(135deg, hsl(215, 50%, 25%) 0%, hsl(215, 45%, 35%) 100%)' }}>
            <CardContent sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 48, height: 48 }}>
                      <Psychology sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Financial Health Score
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Based on your spending patterns, savings rate, and financial goals
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Overall Score</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{financialHealthScore}/100</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={financialHealthScore} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'white',
                          borderRadius: 4,
                        }
                      }} 
                    />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {financialHealthScore >= 80 
                      ? 'Excellent financial health! Keep up the great work.' 
                      : financialHealthScore >= 60
                      ? 'Good financial health! Focus on increasing your savings rate to reach excellent status.'
                      : financialHealthScore >= 40
                      ? 'Fair financial health. Review your spending habits and create a budget to improve.'
                      : 'Your financial health needs attention. Focus on reducing expenses and increasing savings.'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
                    {financialHealthScore}
                  </Typography>
                  <Chip 
                    label={getScoreLabel(financialHealthScore)} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 600 
                    }} 
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: savingsRate >= 0 ? 'success.main' : 'error.main', mr: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Savings Rate
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {savingsRate >= 0 
                      ? `You're saving ${savingsRate.toFixed(1)}% of your income this month`
                      : `You're spending ${Math.abs(savingsRate).toFixed(1)}% more than you earn`}
                  </Typography>
                  <Chip 
                    label={savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : savingsRate >= 0 ? "Needs Improvement" : "Critical"} 
                    color={savingsRate >= 20 ? "success" : savingsRate >= 10 ? "primary" : savingsRate >= 0 ? "warning" : "error"} 
                    size="small" 
                  />
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <GpsFixed />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Savings Goal
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Target: 20% savings rate
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (savingsRate / 20) * 100)} 
                      sx={{ height: 6, borderRadius: 3 }} 
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Current: {savingsRate.toFixed(1)}% | Target: 20%
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: categoryTotals.size >= 5 ? 'success.main' : 'warning.main', mr: 2 }}>
                      <AccountBalance />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Expense Diversity
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {categoryTotals.size} expense categories this month
                  </Typography>
                  <Chip 
                    label={categoryTotals.size >= 5 ? "Well Diversified" : categoryTotals.size >= 3 ? "Moderate" : "Limited"} 
                    color={categoryTotals.size >= 5 ? "success" : categoryTotals.size >= 3 ? "primary" : "warning"} 
                    size="small" 
                  />
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* AI Recommendations */}
            <Box sx={{ flex: '2 1 500px', minWidth: '400px' }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Lightbulb />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      AI Recommendations
                    </Typography>
                  </Box>

                  {savingsRate < 20 && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        High Priority Action
                      </Typography>
                      <Typography variant="body2">
                        Your savings rate is {savingsRate.toFixed(1)}%, below the recommended 20%. 
                        {savingsRate >= 0 
                          ? ` Aim to save an additional ₹${((income * 0.2) - savingsAmount).toFixed(0)} this month.`
                          : ' Focus on reducing expenses to achieve a positive savings rate.'}
                      </Typography>
                    </Alert>
                  )}

                  <List>
                    {categoryTotals.size > 0 && (() => {
                      const topCategory = Array.from(categoryTotals.entries())
                        .sort((a, b) => b[1] - a[1])[0];
                      return (
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle sx={{ color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Top spending category: ${topCategory[0]}`}
                            secondary={`You spent ₹${topCategory[1].toLocaleString('en-IN')} on ${topCategory[0]}. Consider reviewing this category for potential savings.`}
                          />
                        </ListItem>
                      );
                    })()}
                    
                    <Divider />
                    
                    {savingsRate < 20 && savingsRate >= 0 && (
                      <>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingUp sx={{ color: 'primary.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Increase savings rate"
                            secondary={`You're currently saving ${savingsRate.toFixed(1)}%. Increase by ${(20 - savingsRate).toFixed(1)}% to reach the recommended 20% savings rate.`}
                          />
                        </ListItem>
                        <Divider />
                      </>
                    )}
                    
                    {savingsRate < 0 && (
                      <>
                        <ListItem>
                          <ListItemIcon>
                            <Warning sx={{ color: 'error.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Critical: Spending exceeds income"
                            secondary={`You're spending ${Math.abs(savingsRate).toFixed(1)}% more than you earn. Create an emergency budget and reduce non-essential expenses immediately.`}
                          />
                        </ListItem>
                        <Divider />
                      </>
                    )}
                    
                    <ListItem>
                      <ListItemIcon>
                        <GpsFixed sx={{ color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Set up automatic savings"
                        secondary="Automate 20% of your income to savings to reach your financial goals faster."
                      />
                    </ListItem>
                    <Divider />
                    
                    <ListItem>
                      <ListItemIcon>
                        <BarChart sx={{ color: 'info.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Review monthly trends"
                        secondary="Track your spending patterns over time to identify areas for improvement."
                      />
                    </ListItem>
                  </List>

                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    View Detailed Action Plan
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* Budget Performance */}
            <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Budget Performance
                  </Typography>
                  
                  {budgetCategories.length > 0 ? (
                    budgetCategories.slice(0, 4).map((cat, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{cat.category}</Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: cat.isOverBudget ? 'error.main' : 'success.main', 
                              fontWeight: 600 
                            }}
                          >
                            {cat.percentage.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={cat.percentage} 
                          color={cat.isOverBudget ? "error" : "success"}
                          sx={{ height: 6, borderRadius: 3, mb: 1 }} 
                        />
                        <Typography variant="caption" sx={{ color: cat.isOverBudget ? 'error.main' : 'success.main' }}>
                          ₹{cat.amount.toLocaleString('en-IN')} {cat.isOverBudget ? 'over budget' : 'under budget'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No expense data available
                    </Typography>
                  )}

                  <Button variant="outlined" fullWidth>
                    Adjust Budgets
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default FinancialInsights;
