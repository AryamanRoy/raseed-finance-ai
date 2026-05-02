import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Button,
  Chip,
  Alert,
} from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { simulateScenario, type SimulationResponse } from "@/services/api";

const CATEGORY_NAMES = ["Food", "Shopping", "Transport", "Bills", "Health"];

type SliderState = Record<string, number>;

const SimulationPanel: React.FC = () => {
  const [categoryChanges, setCategoryChanges] = useState<SliderState>(
    CATEGORY_NAMES.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as SliderState)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResponse | null>(null);

  const comparisonData = useMemo(() => {
    if (!result) {
      return [];
    }

    const categorySet = new Set<string>([
      ...Object.keys(result.before),
      ...Object.keys(result.after),
    ]);

    return Array.from(categorySet).map((category) => ({
      category,
      before: result.before[category] ?? 0,
      after: result.after[category] ?? 0,
    }));
  }, [result]);

  const monthlyTrendData = useMemo(() => {
    if (!result?.monthly?.length) {
      return [];
    }

    return result.monthly.map((point) => {
      const total = Object.entries(point).reduce((sum, [key, value]) => {
        if (key === "month") {
          return sum;
        }
        return sum + (typeof value === "number" ? value : 0);
      }, 0);

      return {
        month: point.month,
        total,
      };
    });
  }, [result]);

  const handleSliderChange = (category: string, value: number | number[]) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;
    setCategoryChanges((prev) => ({
      ...prev,
      [category]: normalizedValue,
    }));
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        scenario: {
          category_changes: Object.fromEntries(
            Object.entries(categoryChanges).map(([category, percent]) => [
              category,
              percent / 100,
            ])
          ),
        },
      };
      const response = await simulateScenario(payload);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Simulation
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Adjust each category from -50% to +50%, then run simulation.
          </Typography>

          <Box sx={{ display: "grid", gap: 2.5 }}>
            {CATEGORY_NAMES.map((category) => (
              <Box key={category}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {category}
                  </Typography>
                  <Chip
                    label={`${categoryChanges[category]}%`}
                    size="small"
                    color={categoryChanges[category] === 0 ? "default" : "primary"}
                    variant={categoryChanges[category] === 0 ? "outlined" : "filled"}
                  />
                </Box>
                <Slider
                  value={categoryChanges[category]}
                  onChange={(_, value) => handleSliderChange(category, value)}
                  min={-50}
                  max={50}
                  step={5}
                  marks={[
                    { value: -50, label: "-50%" },
                    { value: 0, label: "0%" },
                    { value: 50, label: "50%" },
                  ]}
                />
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleRunSimulation}
              disabled={loading}
            >
              {loading ? "Running..." : "Run Simulation"}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 420px", minHeight: 420 }}>
            <Card sx={{ height: 420 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Before vs After
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString("en-IN")}`,
                        "Amount",
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="before" fill="hsl(215, 50%, 25%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" fill="hsl(142, 69%, 58%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 420px", minHeight: 420 }}>
            <Card sx={{ height: 420 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Monthly Trend
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString("en-IN")}`,
                        "Total",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(0, 72%, 51%)"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SimulationPanel;
