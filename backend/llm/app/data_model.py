# app/data_model.py
from __future__ import annotations
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

COMMON_DATE = ["date","txn_date","transaction_date","posted_date"]
COMMON_AMT  = ["amount","amt","transaction_amount","debit","debit_amount","inr_amount"]
COMMON_CAT  = ["category","cat","bucket"]
COMMON_DESC = ["description","narration","merchant","details","remarks"]

def detect_columns(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    cols = {c.lower().strip(): c for c in df.columns}
    def pick(cands):
        for c in cands:
            if c in cols: return cols[c]
        return None
    return {
        "date": pick(COMMON_DATE),
        "amount": pick(COMMON_AMT),
        "category": pick(COMMON_CAT),
        "description": pick(COMMON_DESC),
    }

def load_expense_csv(file_bytes: bytes) -> pd.DataFrame:
    from io import BytesIO
    df = pd.read_csv(BytesIO(file_bytes))
    return df

def normalize_expenses(df: pd.DataFrame) -> pd.DataFrame:
    # Ensure amounts are negative outflows internally
    cols = detect_columns(df)
    amt = cols["amount"]
    if amt is None:
        # try debit/credit columns
        lower = {c.lower(): c for c in df.columns}
        dr = lower.get("debit") or lower.get("debit_amount")
        cr = lower.get("credit") or lower.get("credit_amount")
        if dr and cr:
            df["__amount"] = pd.to_numeric(df[dr], errors="coerce").fillna(0) * -1.0
            amt = "__amount"
        else:
            df["__amount"] = 0.0
            amt = "__amount"
    else:
        df[amt] = pd.to_numeric(df[amt], errors="coerce")
        # if mostly positive, make them negative (expense-only file)
        if (df[amt] > 0).mean() > 0.5:
            df[amt] = -df[amt].abs()

    # dates
    dcol = cols["date"]
    if dcol:
        df[dcol] = pd.to_datetime(df[dcol], errors="coerce")
    else:
        df["__date"] = pd.NaT
        dcol = "__date"

    # month key
    df["__month"] = df[dcol].dt.to_period("M").astype(str) if df[dcol].notna().any() else "Unknown"
    # category
    ccol = cols["category"] or "__category"
    if ccol not in df.columns:
        df["__category"] = "Uncategorized"
        ccol = "__category"

    # description
    desc = cols["description"] or "__desc"
    if desc not in df.columns:
        df["__desc"] = ""
        desc = "__desc"

    return df, {"amount": amt, "date": dcol, "month": "__month", "category": ccol, "description": desc}

def summarize(df: pd.DataFrame, cols: Dict[str,str]) -> Dict[str, Any]:
    amt = cols["amount"]; month = cols["month"]; cat = cols["category"]; desc = cols["description"]
    # totals
    total_outflow = float(-df[amt].sum())  # positive number
    months = df.groupby(month)[amt].sum().mul(-1.0).rename("spend").reset_index()
    cats = df.groupby(cat)[amt].sum().mul(-1.0).rename("spend").reset_index().sort_values("spend", ascending=False)
    # recurring merchants (heuristic: >=3 occurrences)
    rec = df.groupby(desc)[amt].agg(["count","sum"]).reset_index().sort_values("count", ascending=False)
    rec = rec[rec["count"]>=3].head(20).rename(columns={"sum":"total_spend","count":"occurrences"})
    rec["total_spend"] = rec["total_spend"].mul(-1.0)

    # essentials/discretionary tagging from category keywords
    def tag(s: str)->str:
        s=str(s).lower()
        ess = ["rent","utility","electric","water","gas","grocery","fuel","insurance","emi","loan","medical","health","bill","tuition","fees"]
        disc = ["swiggy","zomato","restaurant","food","shopping","entertainment","uber","ola","travel","electronics","gaming","amazon","flipkart","myntra"]
        if any(k in s for k in ess): return "Essentials"
        if any(k in s for k in disc): return "Discretionary"
        return "Other"
    tmp = cats.copy()
    tmp["bucket"] = tmp[cat].apply(tag)
    ess = tmp.groupby("bucket")["spend"].sum().reset_index()

    return {
        "total_outflow": total_outflow,
        "by_month": months.to_dict(orient="records"),
        "by_category": cats.to_dict(orient="records"),
        "ess_disc": ess.to_dict(orient="records"),
        "recurring": rec.to_dict(orient="records"),
    }
