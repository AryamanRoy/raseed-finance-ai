const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type SimulationScenario = {
  category_changes: Record<string, number>;
};

export type SimulationRequest = {
  scenario: SimulationScenario;
};

export type SimulationMonthlyPoint = {
  month: string;
  [category: string]: string | number;
};

export type SimulationResponse = {
  before: Record<string, number>;
  after: Record<string, number>;
  monthly: SimulationMonthlyPoint[];
};

export type GoalRequest = {
  income: number;
  target: number;
  months: number;
};

export type GoalResponse = {
  required_monthly_savings?: number;
  requiredMonthlySavings?: number;
  suggested_cuts?: string[];
  suggestedCuts?: string[];
  [key: string]: unknown;
};

async function postJson<TResponse, TRequest>(
  endpoint: string,
  payload: TRequest
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export function simulateScenario(
  payload: SimulationRequest
): Promise<SimulationResponse> {
  return postJson<SimulationResponse, SimulationRequest>("/simulate", payload);
}

export function calculateGoalPlan(payload: GoalRequest): Promise<GoalResponse> {
  return postJson<GoalResponse, GoalRequest>("/goal", payload);
}
