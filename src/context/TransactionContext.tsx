import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction, parseCSV } from '@/lib/csvParser';

interface TransactionContextType {
  transactions: Transaction[];
  uploadCSV: (file: File) => Promise<void>;
  clearData: () => void;
  hasData: boolean;
  isCategorizing: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const uploadCSV = async (file: File) => {
    try {
      setIsCategorizing(true);
      
      // First, send the file to the backend for categorization
      const formData = new FormData();
      formData.append('file', file);

      // Call the categorization API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/api/categorize`, {
        method: 'POST',
        body: formData,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      if (!response.ok) {
        let errorMessage = `Failed to categorize transactions: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          const errorText = await response.text().catch(() => '');
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Get the categorized CSV file
      const categorizedText = await response.text();
      const parsed = parseCSV(categorizedText);
      if (parsed.length === 0) {
        throw new Error(
          'CSV was uploaded but no transactions could be parsed. Please verify headers like Date, Receiver Name, Amount, Mode of Transaction.',
        );
      }
      
      console.log('Parsed transactions:', parsed.length);
      if (parsed.length > 0) {
        console.log('First transaction:', parsed[0]);
        console.log('Date range:', {
          earliest: parsed[0].date,
          latest: parsed[parsed.length - 1].date
        });
      }
      setTransactions(parsed);
    } catch (error) {
      console.error('Error processing CSV:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to process CSV file');
    } finally {
      setIsCategorizing(false);
    }
  };

  const clearData = () => {
    setTransactions([]);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        uploadCSV,
        clearData,
        hasData: transactions.length > 0,
        isCategorizing,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
};

