import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Receipt,
  TrendingUp,
  TrendingDown,
  Search,
} from '@mui/icons-material';
import { useTransactions } from '@/context/TransactionContext';
import { CSVUpload } from '@/components/CSVUpload';
import { getCategoryColor, getTransactionsForMonth } from '@/lib/csvParser';

interface Expense {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
}

const ExpenseTracker: React.FC = () => {
  const { transactions, hasData } = useTransactions();
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Get the most recent month from the data
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const getMostRecentMonth = useMemo(() => {
    if (!hasData || transactions.length === 0) return { month: currentMonth, year: currentYear };
    
    const latestDate = transactions.reduce((latest, txn) => {
      return txn.date > latest ? txn.date : latest;
    }, transactions[0].date);
    
    return { month: latestDate.getMonth(), year: latestDate.getFullYear() };
  }, [transactions, hasData, currentMonth, currentYear]);

  const isIncome = (desc: string) => {
    const incomeKeywords = ['salary', 'income', 'refund'];
    const lowerDesc = desc.toLowerCase();
    return incomeKeywords.some(keyword => lowerDesc.includes(keyword)) ||
           (lowerDesc.includes('company') && lowerDesc.includes('salary'));
  };

  const csvExpenses = useMemo(() => {
    if (!hasData) return [];
    const monthTransactions = getTransactionsForMonth(transactions, getMostRecentMonth.month, getMostRecentMonth.year);
    return monthTransactions
      .filter(t => !isIncome(t.description))
      .map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        paymentMethod: t.paymentMethod,
      }));
  }, [transactions, getMostRecentMonth.month, getMostRecentMonth.year, hasData]);

  // Get unique categories from CSV data
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    csvExpenses.forEach(exp => uniqueCategories.add(exp.category));
    return Array.from(uniqueCategories).map(cat => ({
      value: cat,
      label: cat,
      color: getCategoryColor(cat),
    }));
  }, [csvExpenses]);

  const handleOpen = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        date: expense.date.toISOString().split('T')[0],
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: '',
        category: categories[0]?.value || '',
        paymentMethod: 'UPI',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = () => {
    // Note: This would typically update the CSV data or send to backend
    // For now, we'll just show a message that CSV data is read-only
    handleClose();
  };

  const filteredExpenses = csvExpenses.filter(expense => {
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryColor = (category: string) => getCategoryColor(category);
  const categoryLabel = (category: string) => category;

  return (
    <Box>
      {/* CSV Upload */}
      <CSVUpload />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Expense Tracker
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {hasData && csvExpenses.length > 0
              ? `Track and manage your expenses for ${new Date(getMostRecentMonth.year, getMostRecentMonth.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
              : hasData
              ? 'Upload a CSV file with transaction data to track your expenses'
              : 'Upload a CSV file to track your expenses'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          disabled={!hasData}
          sx={{
            background: 'linear-gradient(135deg, hsl(215, 50%, 25%), hsl(215, 45%, 35%))',
          }}
        >
          Add Expense
        </Button>
      </Box>

      {!hasData ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              No data available
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Upload your bank transaction CSV file to see your expenses.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
            <Box sx={{ flex: '1 1 250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Expenses
                    </Typography>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <TrendingDown />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                    ₹{totalExpenses.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    {filteredExpenses.length} transactions
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Average per Day
                    </Typography>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Receipt />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    ₹{(totalExpenses / new Date(currentYear, currentMonth + 1, 0).getDate()).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    Based on current month
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 250px' }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Most Frequent
                    </Typography>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <TrendingUp />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {categories.length > 0 && filteredExpenses.length > 0
                      ? (() => {
                          const categoryCounts = new Map<string, number>();
                          filteredExpenses.forEach(exp => {
                            categoryCounts.set(exp.category, (categoryCounts.get(exp.category) || 0) + 1);
                          });
                          const mostFrequent = Array.from(categoryCounts.entries())
                            .sort((a, b) => b[1] - a[1])[0];
                          return mostFrequent ? mostFrequent[0] : 'N/A';
                        })()
                      : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    {categories.length > 0 && filteredExpenses.length > 0
                      ? (() => {
                          const categoryTotals = new Map<string, number>();
                          filteredExpenses.forEach(exp => {
                            categoryTotals.set(exp.category, (categoryTotals.get(exp.category) || 0) + exp.amount);
                          });
                          const total = Array.from(categoryTotals.values()).reduce((a, b) => a + b, 0);
                          const mostFrequent = Array.from(categoryTotals.entries())
                            .sort((a, b) => b[1] - a[1])[0];
                          return mostFrequent 
                            ? `${Math.round((mostFrequent[1] / total) * 100)}% of total`
                            : '';
                        })()
                      : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Filters and Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          No expenses found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} hover>
                        <TableCell>
                          {expense.date.toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={categoryLabel(expense.category)}
                            size="small"
                            sx={{
                              bgcolor: categoryColor(expense.category),
                              color: 'white',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {expense.paymentMethod}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                          ₹{expense.amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(expense)}
                            sx={{ mr: 1 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            disabled
                            title="CSV data is read-only"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Add/Edit Dialog */}
          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingExpense ? 'View Expense' : 'Add New Expense'}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, mt: 1 }}>
                Note: CSV data is read-only. To modify expenses, update your CSV file and re-upload.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!!editingExpense}
                />
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  InputProps={{ startAdornment: '₹' }}
                  disabled={!!editingExpense}
                />
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  disabled={!!editingExpense}
                />
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    label="Category"
                    disabled={!!editingExpense}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    label="Payment Method"
                    disabled={!!editingExpense}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Credit Card">Credit Card</MenuItem>
                    <MenuItem value="Debit Card">Debit Card</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Net Banking">Net Banking</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Close</Button>
              {!editingExpense && (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={!formData.description || !formData.amount || !formData.category}
                >
                  Add Expense
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ExpenseTracker;
