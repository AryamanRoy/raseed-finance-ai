export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
}

export const parseCSV = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row and map known aliases.
  const headerColumns = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/[\s_]+/g, ' '));

  const getHeaderIndex = (aliases: string[]) =>
    headerColumns.findIndex((h) => aliases.includes(h));

  const dateIdx = getHeaderIndex(['date', 'transaction date', 'txn date']);
  const descIdx = getHeaderIndex(['receiver name', 'description', 'merchant', 'narration']);
  const amountIdx = getHeaderIndex(['amount', 'transaction amount', 'debit amount']);
  const paymentIdx = getHeaderIndex(['mode of transaction', 'payment method', 'mode']);
  const categoryIdx = getHeaderIndex(['category']);

  // Skip header row
  const dataLines = lines.slice(1);
  const transactions: Transaction[] = [];

  const parseDate = (value: string): Date | null => {
    const raw = value.trim();
    if (!raw) return null;

    // Try native parser first (handles yyyy-mm-dd etc.)
    const native = new Date(raw);
    if (!isNaN(native.getTime())) return native;

    // Handle dd-mm-yyyy / dd/mm/yyyy
    const parts = raw.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  dataLines.forEach((line, index) => {
    // Handle CSV parsing with quotes and commas
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim()); // Push last column

    const dateStr =
      dateIdx >= 0 ? columns[dateIdx] : columns[0];
    const description =
      descIdx >= 0 ? columns[descIdx] : columns[1] || '';
    const amountStr =
      amountIdx >= 0 ? columns[amountIdx] : columns[2] || '0';
    const paymentMethod =
      paymentIdx >= 0 ? columns[paymentIdx] : columns[3] || 'Unknown';
    const category =
      categoryIdx >= 0 ? columns[categoryIdx] : columns[4] || 'Other';

    const date = parseDate(dateStr || '');
    const cleanAmountStr = (amountStr || '').trim().replace(/[,\s]/g, '');
    const amount = Math.abs(parseFloat(cleanAmountStr) || 0);

    if (date && !isNaN(amount) && amount > 0) {
      transactions.push({
        id: `txn-${index}-${Date.now()}`,
        date,
        description: description.trim(),
        amount,
        category: category.trim() || 'Other',
        paymentMethod: paymentMethod.trim() || 'Unknown',
      });
    }
  });

  return transactions;
};

export const getTransactionsForMonth = (
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] => {
  return transactions.filter(txn => {
    const txnMonth = txn.date.getMonth();
    const txnYear = txn.date.getFullYear();
    return txnMonth === month && txnYear === year;
  });
};

export const getTransactionsByCategory = (transactions: Transaction[]) => {
  const categoryMap = new Map<string, number>();
  
  transactions.forEach(txn => {
    const current = categoryMap.get(txn.category) || 0;
    categoryMap.set(txn.category, current + txn.amount);
  });

  return Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));
};

// Determine if a transaction is income based on description
const isIncome = (description: string): boolean => {
  const incomeKeywords = ['salary', 'income', 'refund'];
  // Check for "Company Salary" or similar patterns
  const lowerDesc = description.toLowerCase();
  return incomeKeywords.some(keyword => lowerDesc.includes(keyword)) ||
         (lowerDesc.includes('company') && lowerDesc.includes('salary'));
};

export const getTotalIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter(txn => isIncome(txn.description))
    .reduce((sum, txn) => sum + txn.amount, 0);
};

export const getTotalExpenses = (transactions: Transaction[]): number => {
  return transactions
    .filter(txn => !isIncome(txn.description))
    .reduce((sum, txn) => sum + txn.amount, 0);
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Food: '#FF6B6B',
    Groceries: '#96CEB4',
    Entertainment: '#45B7D1',
    Shopping: '#FFEAA7',
    Utilities: '#4ECDC4',
    Travel: '#DDA0DD',
    Bills: '#FFA07A',
    Fuel: '#F4A460',
    Other: '#A0A0A0',
  };
  return colors[category] || '#A0A0A0';
};

