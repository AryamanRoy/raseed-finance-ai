import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  CheckCircle,
  Description,
} from '@mui/icons-material';
import { useTransactions } from '@/context/TransactionContext';

export const CSVUpload: React.FC = () => {
  const { transactions, uploadCSV, clearData, hasData, isCategorizing } = useTransactions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await uploadCSV(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    clearData();
    setError('');
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Description sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Transaction Data
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {isCategorizing 
                  ? 'Categorizing transactions with AI...' 
                  : 'Upload your bank transaction CSV file'}
              </Typography>
            </Box>
          </Box>
          {hasData && (
            <Chip
              icon={<CheckCircle />}
              label={`${transactions.length} transactions loaded`}
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {hasData && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleClear}
              >
                <Close fontSize="small" />
              </IconButton>
            }
          >
            CSV file loaded successfully! All dashboards are now showing your transaction data.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="csv-upload-input"
          />
          <label htmlFor="csv-upload-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              disabled={isUploading || isCategorizing}
              sx={{
                background: 'linear-gradient(135deg, hsl(215, 50%, 25%), hsl(215, 45%, 35%))',
              }}
            >
              {isCategorizing 
                ? 'Categorizing with AI...' 
                : isUploading 
                ? 'Uploading...' 
                : hasData 
                ? 'Replace CSV File' 
                : 'Upload CSV File'}
            </Button>
          </label>
          {hasData && (
            <Button
              variant="outlined"
              onClick={handleClear}
              color="error"
            >
              Clear Data
            </Button>
          )}
        </Box>

        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 2, display: 'block' }}>
          {isCategorizing 
            ? 'AI is analyzing and categorizing your transactions. This may take a moment...'
            : 'Expected CSV format: Date, Receiver Name, Amount, Mode of Transaction. Categories will be automatically assigned by AI.'}
        </Typography>
      </CardContent>
    </Card>
  );
};


