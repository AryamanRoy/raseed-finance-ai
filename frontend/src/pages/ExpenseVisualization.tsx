import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Button,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Download } from '@mui/icons-material';
import { useTransactions } from '@/context/TransactionContext';
import { CSVUpload } from '@/components/CSVUpload';
import { 
  getTransactionsForMonth, 
  getCategoryColor 
} from '@/lib/csvParser';

const ExpenseVisualization: React.FC = () => {
  const { transactions, hasData } = useTransactions();
  const [timeFilter, setTimeFilter] = useState('this-month');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  // Get transactions based on time filter
  const filteredTransactions = useMemo(() => {
    if (!hasData) return [];
    
    let targetMonth = getMostRecentMonth.month;
    let targetYear = getMostRecentMonth.year;
    
    if (timeFilter === 'last-month') {
      targetMonth = targetMonth === 0 ? 11 : targetMonth - 1;
      targetYear = targetMonth === 11 ? targetYear - 1 : targetYear;
    }
    
    const monthTransactions = getTransactionsForMonth(transactions, targetMonth, targetYear);
    return monthTransactions.filter(t => !isIncome(t.description));
  }, [transactions, getMostRecentMonth, timeFilter, hasData]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredTransactions.forEach(txn => {
      const current = categoryMap.get(txn.category) || 0;
      categoryMap.set(txn.category, current + txn.amount);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
    
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        color: getCategoryColor(category),
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Daily spending pattern
  const dailySpending = useMemo(() => {
    const dayMap = new Map<number, number>();
    filteredTransactions.forEach(txn => {
      const day = txn.date.getDate();
      const current = dayMap.get(day) || 0;
      dayMap.set(day, current + txn.amount);
    });

    const targetMonth = timeFilter === 'last-month' 
      ? (getMostRecentMonth.month === 0 ? 11 : getMostRecentMonth.month - 1)
      : getMostRecentMonth.month;
    const targetYear = timeFilter === 'last-month' && getMostRecentMonth.month === 0
      ? getMostRecentMonth.year - 1
      : getMostRecentMonth.year;
    
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        day: day.toString(),
        amount: dayMap.get(day) || 0,
      };
    });
  }, [filteredTransactions, getMostRecentMonth, timeFilter]);

  // Monthly trend (last 6 months from most recent month)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const baseMonth = getMostRecentMonth.month;
    const baseYear = getMostRecentMonth.year;
    
    for (let i = 5; i >= 0; i--) {
      let month = baseMonth - i;
      let year = baseYear;
      
      if (month < 0) {
        month += 12;
        year -= 1;
      }
      
      const monthTransactions = getTransactionsForMonth(transactions, month, year);
      const expenses = monthTransactions
        .filter(t => !isIncome(t.description))
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({
        month: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' }),
        amount: expenses,
        budget: expenses * 1.1, // 10% buffer as budget
      });
    }
    return months;
  }, [transactions, getMostRecentMonth]);

  const totalExpenses = categoryData.reduce((sum, item) => sum + item.value, 0);
  const averageDaily = totalExpenses / dailySpending.length;
  const largestCategory = categoryData[0];

  return (
    <Box>
      {/* CSV Upload */}
      <CSVUpload />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Expense Visualization
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Analyze your spending patterns with interactive charts and insights
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Download />} disabled={!hasData}>
          Export Report
        </Button>
      </Box>

      {!hasData ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              No data available
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Upload your bank transaction CSV file to see visualizations.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  label="Time Period"
                >
                  <MenuItem value="this-month">This Month</MenuItem>
                  <MenuItem value="last-month">Last Month</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categoryData.map((cat) => (
                    <MenuItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
            <Box sx={{ flex: '1 1 250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Expenses
                    </Typography>
                    <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
                      <TrendingDown sx={{ fontSize: 16 }} />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                    ₹{totalExpenses.toLocaleString('en-IN')}
                  </Typography>
                  <Chip 
                    label={`${filteredTransactions.length} transactions`} 
                    size="small" 
                    color="error" 
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Average Daily
                    </Typography>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    ₹{averageDaily.toFixed(2)}
                  </Typography>
                  <Chip 
                    label={`${dailySpending.length} days`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Largest Category
                    </Typography>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                        #1
                      </Typography>
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                    {largestCategory?.name || 'N/A'}
                  </Typography>
                  <Chip 
                    label={largestCategory ? `${largestCategory.percentage}% of total` : ''} 
                    size="small" 
                    color="warning" 
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Charts */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
            {/* Category Breakdown */}
            <Box sx={{ flex: '1 1 400px', minHeight: 500 }}>
              <Card sx={{ height: 500 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Expense by Category
                  </Typography>
                  {categoryData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                        {categoryData.map((item, index) => (
                          <Chip
                            key={index}
                            label={`${item.name}: ${item.percentage}%`}
                            size="small"
                            sx={{ 
                              bgcolor: item.color, 
                              color: 'white',
                              '& .MuiChip-label': { fontSize: '0.75rem' }
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No expense data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Monthly Trend */}
            <Box sx={{ flex: '1 1 400px', minHeight: 500 }}>
              <Card sx={{ height: 500 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Monthly Spending Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} />
                      <Area 
                        type="monotone" 
                        dataKey="budget" 
                        stackId="1"
                        stroke="hsl(215, 15%, 55%)" 
                        fill="hsl(215, 15%, 55%)"
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stackId="2"
                        stroke="hsl(0, 72%, 51%)" 
                        fill="hsl(0, 72%, 51%)"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Category Comparison */}
            <Box sx={{ flex: '1 1 400px', minHeight: 400 }}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Category Comparison
                  </Typography>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                        <Bar dataKey="value" fill="hsl(215, 50%, 25%)" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Daily Spending Pattern */}
            <Box sx={{ flex: '1 1 400px', minHeight: 400 }}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Daily Spending Pattern
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySpending}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(142, 69%, 58%)" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(142, 69%, 58%)', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ExpenseVisualization;
