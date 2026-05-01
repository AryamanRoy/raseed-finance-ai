import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Alert,
  LinearProgress,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Inventory,
  Warning,
  CheckCircle,
  TrendingDown,
  Search,
  FilterList,
} from '@mui/icons-material';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  totalValue: number;
  supplier: string;
  lastUpdated: Date;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

const categories = [
  'Office Supplies',
  'Electronics',
  'Furniture',
  'Software Licenses',
  'Maintenance Items',
  'Food & Beverages',
  'Other',
];

const initialInventory: InventoryItem[] = [
  {
    id: 1,
    name: 'Laptop - Dell XPS 13',
    category: 'Electronics',
    quantity: 5,
    minQuantity: 3,
    unitPrice: 1200,
    totalValue: 6000,
    supplier: 'Tech Solutions Inc.',
    lastUpdated: new Date('2024-01-10'),
    status: 'in-stock',
  },
  {
    id: 2,
    name: 'Office Chair - Ergonomic',
    category: 'Furniture',
    quantity: 2,
    minQuantity: 5,
    unitPrice: 250,
    totalValue: 500,
    supplier: 'Office Furniture Co.',
    lastUpdated: new Date('2024-01-08'),
    status: 'low-stock',
  },
  {
    id: 3,
    name: 'Printer Paper - A4',
    category: 'Office Supplies',
    quantity: 0,
    minQuantity: 10,
    unitPrice: 25,
    totalValue: 0,
    supplier: 'Supply Store',
    lastUpdated: new Date('2024-01-05'),
    status: 'out-of-stock',
  },
  {
    id: 4,
    name: 'Coffee Machine',
    category: 'Food & Beverages',
    quantity: 1,
    minQuantity: 1,
    unitPrice: 300,
    totalValue: 300,
    supplier: 'Kitchen Supplies Ltd.',
    lastUpdated: new Date('2024-01-12'),
    status: 'in-stock',
  },
];

const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    minQuantity: '',
    unitPrice: '',
    supplier: '',
  });

  const handleOpen = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity.toString(),
        minQuantity: item.minQuantity.toString(),
        unitPrice: item.unitPrice.toString(),
        supplier: item.supplier,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        quantity: '',
        minQuantity: '',
        unitPrice: '',
        supplier: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const getItemStatus = (quantity: number, minQuantity: number): InventoryItem['status'] => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= minQuantity) return 'low-stock';
    return 'in-stock';
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.quantity || !formData.unitPrice) return;

    const quantity = parseInt(formData.quantity);
    const minQuantity = parseInt(formData.minQuantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice);

    const itemData = {
      name: formData.name,
      category: formData.category,
      quantity,
      minQuantity,
      unitPrice,
      totalValue: quantity * unitPrice,
      supplier: formData.supplier,
      lastUpdated: new Date(),
      status: getItemStatus(quantity, minQuantity),
    };

    if (editingItem) {
      setInventory(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...itemData }
          : item
      ));
    } else {
      const newItem: InventoryItem = {
        id: Math.max(...inventory.map(i => i.id)) + 1,
        ...itemData,
      };
      setInventory(prev => [newItem, ...prev]);
    }

    handleClose();
  };

  const handleDelete = (id: number) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = inventory.filter(item => item.status === 'low-stock').length;
  const outOfStockItems = inventory.filter(item => item.status === 'out-of-stock').length;

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock': return 'success';
      case 'low-stock': return 'warning';
      case 'out-of-stock': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Inventory Management
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Track and manage your business inventory and assets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{
            background: 'linear-gradient(135deg, hsl(215, 50%, 25%), hsl(215, 45%, 35%))',
          }}
        >
          Add Item
        </Button>
      </Box>

      {/* Alerts for Low/Out of Stock */}
      {(lowStockItems > 0 || outOfStockItems > 0) && (
        <Box sx={{ mb: 3 }}>
          {outOfStockItems > 0 && (
            <Alert severity="error" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {outOfStockItems} item{outOfStockItems !== 1 ? 's' : ''} out of stock
              </Typography>
              Immediate restocking required for continuous operations.
            </Alert>
          )}
          {lowStockItems > 0 && (
            <Alert severity="warning">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {lowStockItems} item{lowStockItems !== 1 ? 's' : ''} running low
              </Typography>
              Consider restocking soon to avoid stockouts.
            </Alert>
          )}
        </Box>
      )}

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total Items
                </Typography>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Inventory />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {inventory.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Items in inventory
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total Value
                </Typography>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>₹</Typography>
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                ₹{totalValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Asset value
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Low Stock
                </Typography>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Warning />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {lowStockItems}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Items need restocking
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Out of Stock
                </Typography>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <TrendingDown />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {outOfStockItems}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Items unavailable
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterList sx={{ color: 'primary.main' }} />
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
            </Box>
            <Box sx={{ flex: '0 1 200px', minWidth: '150px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {item.name}
                  </TableCell>
                  <TableCell>
                    {item.category}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.quantity}
                      </Typography>
                      {item.quantity <= item.minQuantity && (
                        <LinearProgress
                          variant="determinate"
                          value={(item.quantity / item.minQuantity) * 100}
                          color={item.quantity === 0 ? 'error' : 'warning'}
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    ₹{item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    ₹{item.totalValue.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {item.supplier}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(item)}
                      sx={{ mr: 1 }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: '1 1 250px' }}>
              <TextField
                fullWidth
                label="Item Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
              <TextField
                fullWidth
                label="Minimum Quantity"
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                InputProps={{ startAdornment: '$' }}
              />
            </Box>
            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.category || !formData.quantity || !formData.unitPrice}
          >
            {editingItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add item"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, hsl(215, 50%, 25%), hsl(215, 45%, 35%))',
        }}
        onClick={() => handleOpen()}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default InventoryManagement;