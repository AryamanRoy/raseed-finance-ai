import pandas as pd

# -----------------------------
# CONFIG
# -----------------------------
CATEGORY_MAP = {
    "Transport": "Travel",
    "Health": "Medical"
}

# -----------------------------
# PREPROCESSING (shared)
# -----------------------------
def preprocess(df):
    df = df.copy()

    # Clean columns
    df.columns = df.columns.str.strip()

    # Required columns check
    if "Amount" not in df.columns or "category" not in df.columns:
        raise ValueError(f"Missing required columns. Found: {list(df.columns)}")

    # Clean Amount
    df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0)

    # Clean category
    df["category"] = df["category"].astype(str).str.strip()

    # -----------------------------
    # FLEXIBLE DATE PARSING (FIXED)
    # -----------------------------
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(
            df["Date"],
            errors="coerce",
            dayfirst=True
        )

        df = df.dropna(subset=["Date"])

        if df.empty:
            raise ValueError("All dates failed to parse. Check CSV format.")

        df["month"] = df["Date"].dt.to_period("M")
    else:
        df["month"] = "all_time"

    return df


# -----------------------------
# BASE SUMMARY
# -----------------------------
def get_summary(df):
    return df.groupby("category")["Amount"].sum()


def get_monthly_summary(df):
    monthly = (
        df.groupby(["month", "category"])["Amount"]
        .sum()
        .reset_index()
    )

    pivot = monthly.pivot(
        index="month",
        columns="category",
        values="Amount"
    ).fillna(0)

    return pivot


# -----------------------------
# NORMALIZE SCENARIO
# -----------------------------
def normalize_scenario(scenario):
    normalized = {"category_changes": {}, "fixed_changes": {}}

    for cat, val in scenario.get("category_changes", {}).items():
        mapped = CATEGORY_MAP.get(cat, cat)
        normalized["category_changes"][mapped] = val

    for cat, val in scenario.get("fixed_changes", {}).items():
        mapped = CATEGORY_MAP.get(cat, cat)
        normalized["fixed_changes"][mapped] = val

    return normalized


# -----------------------------
# WHAT-IF ENGINE
# -----------------------------
def apply_what_if(df, scenario):
    df = preprocess(df)

    scenario = normalize_scenario(scenario)

    base_total = get_summary(df).astype(float)
    monthly = get_monthly_summary(df).astype(float)

    modified = base_total.copy()

    print("DEBUG - Incoming scenario:", scenario)
    print("DEBUG - Available categories:", list(base_total.index))

    # Apply percentage changes
    for cat, change in scenario.get("category_changes", {}).items():
        if cat in modified:
            modified.loc[cat] = modified.loc[cat] * (1 + change)
        else:
            print(f"WARNING: Category '{cat}' not found in data")

    # Apply fixed changes
    for cat, value in scenario.get("fixed_changes", {}).items():
        if cat in modified:
            modified.loc[cat] = modified.loc[cat] + float(value)
        else:
            print(f"WARNING: Category '{cat}' not found in data")

    return {
        "before": base_total.round(2).to_dict(),
        "after": modified.round(2).to_dict(),
        "monthly": monthly.round(2)
            .rename_axis("month")
            .reset_index()
            .to_dict(orient="records")
    }


# -----------------------------
# GOAL-BASED ENGINE
# -----------------------------
def goal_based_engine(df, income, target, months):
    df = preprocess(df)

    monthly = get_monthly_summary(df)
    avg_spend = monthly.mean().sum()

    current_savings = income - avg_spend
    required = target / months
    gap = required - current_savings

    if gap <= 0:
        return {"message": "Goal already achievable"}

    category_spend = monthly.mean().sort_values(ascending=False)

    cuts = {}
    remaining = gap

    for cat, amount in category_spend.items():
        if cat in ["Bills", "Utilities"]:
            continue

        cut = min(amount * 0.3, remaining)
        cuts[cat] = round(cut, 2)
        remaining -= cut

        if remaining <= 0:
            break

    return {
        "required_monthly_savings": round(required, 2),
        "current_monthly_spend": round(avg_spend, 2),
        "suggested_cuts": cuts,
        "remaining_gap": round(remaining, 2)
    }


# -----------------------------
# FINANCIAL HEALTH SCORE
# -----------------------------
def health_score(df, income):
    df = preprocess(df)

    monthly = get_monthly_summary(df)
    avg_spend = monthly.mean().sum()

    savings = income - avg_spend

    if income <= 0:
        return 0

    savings_rate = savings / income

    score = 0

    # Savings (40 pts)
    score += max(0, min(40, savings_rate * 100))

    # Category concentration (30 pts)
    category_dist = monthly.mean()
    total = category_dist.sum()

    if total > 0:
        max_cat = category_dist.max() / total
        score += max(0, 30 - max_cat * 30)

    # Stability bonus (30 pts)
    volatility = monthly.std().sum()
    score += max(0, 30 - volatility * 0.01)

    # Penalty
    if savings < 0:
        score -= 20

    return int(max(0, min(100, score)))