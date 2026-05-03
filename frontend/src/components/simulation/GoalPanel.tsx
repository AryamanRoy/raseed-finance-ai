import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import { calculateGoalPlan, type GoalResponse } from "@/services/api";

const GoalPanel: React.FC = () => {
  const [income, setIncome] = useState("");
  const [target, setTarget] = useState("");
  const [months, setMonths] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GoalResponse | null>(null);

  // -----------------------------
  // REQUIRED SAVINGS
  // -----------------------------
  const requiredMonthlySavings = useMemo(() => {
    if (!result) return null;

    const value =
      result.required_monthly_savings ?? result.requiredMonthlySavings;

    return typeof value === "number" ? value : null;
  }, [result]);

  // -----------------------------
  // FIXED: HANDLE OBJECT → ARRAY
  // -----------------------------
  const suggestedCuts = useMemo(() => {
    if (!result) return [];

    const cuts = result.suggested_cuts ?? result.suggestedCuts;

    if (!cuts || typeof cuts !== "object") return [];

    return Object.entries(cuts).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [result]);

  // -----------------------------
  // API CALL
  // -----------------------------
  const handleCalculatePlan = async () => {
    setLoading(true);
    setError(null);

    const incomeValue = Number(income);
    const targetValue = Number(target);
    const monthsValue = Number(months);

    if (incomeValue <= 0 || targetValue <= 0 || monthsValue <= 0) {
      setError("Please enter valid positive values for all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await calculateGoalPlan({
        income: incomeValue,
        target: targetValue,
        months: monthsValue,
      });

      console.log("GOAL RESPONSE:", response); // 🔥 debug (optional)

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Goal calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Goal Planner
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Enter income, target savings, and timeline to calculate a plan.
        </Typography>

        {/* INPUTS */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <TextField
            label="Income"
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Target Savings"
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Months"
            type="number"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          />
        </Box>

        {/* BUTTON */}
        <Button
          variant="contained"
          onClick={handleCalculatePlan}
          disabled={loading}
        >
          {loading ? "Calculating..." : "Calculate Plan"}
        </Button>

        {/* ERROR */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* RESULT */}
        {result && (
          <Box sx={{ mt: 3 }}>
            {/* SAVINGS */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Required Monthly Savings
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "primary.main", mb: 2 }}
            >
              {requiredMonthlySavings !== null
                ? `₹${requiredMonthlySavings.toLocaleString("en-IN")}`
                : "Not available"}
            </Typography>

            {/* CUTS */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Suggested Cuts
            </Typography>

            {suggestedCuts.length > 0 ? (
              <List dense sx={{ pt: 0 }}>
                {suggestedCuts.map(({ category, amount }, index) => (
                  <ListItem key={`${category}-${index}`} sx={{ px: 0 }}>
                    <ListItemText
                      primary={category}
                      secondary={`₹${Number(amount).toLocaleString("en-IN")}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No suggested cuts returned by the API.
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalPanel;