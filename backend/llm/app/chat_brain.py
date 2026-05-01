# app/chat_brain.py
from __future__ import annotations
from typing import Dict, Any, List
import json, re

NOTE = "Educational only. Not financial advice. Please research before investing."

# ---- Lightweight in-app memory (no extra API calls) -----------------
def update_memory_summary(prev: str, history: List[Dict[str, str]], max_chars: int = 900) -> str:
    """
    Build/refresh a compact bullet summary from the most recent few turns.
    No LLM call; keeps costs zero. Truncates to ~max_chars.
    """
    # Take the last 6 messages (user/assistant interleaved)
    recent = history[-6:]
    bullets = []
    goals, budgets, tips = [], [], []
    for m in recent:
        txt = m.get("content", "").strip()
        if not txt:
            continue
        if m["role"] == "user":
            # capture goals/budget asks
            if any(k in txt.lower() for k in ["goal", "trip", "save", "invest", "budget"]):
                goals.append(txt)
        else:
            # assistant/model: capture steps/tips lines
            for line in txt.splitlines():
                line = line.strip(" -•\t")
                if not line:
                    continue
                if any(k in line.lower() for k in ["limit", "cap", "reduce", "cut", "allocate", "set aside"]):
                    budgets.append(line)
                if line.endswith("%") or line.startswith("Target"):
                    budgets.append(line)
                if line and len(tips) < 6:
                    tips.append(line)

    if goals:
        bullets.append("Goals: " + "; ".join(goals[-2:]))
    if budgets:
        bullets.append("Budget notes: " + "; ".join(budgets[-3:]))
    if tips:
        bullets.append("Tips: " + "; ".join(tips[-4:]))

    merged = (prev + "\n" + "\n".join(f"- {b}" for b in bullets)).strip()
    # truncate conservatively
    if len(merged) > max_chars:
        merged = "… " + merged[-max_chars:]
    return merged

# ---- Prompt assembly -------------------------------------------------
FORBIDDEN = re.compile(r"(target price|guaranteed return|sure-shot|multibagger|buy now|sell now)", re.I)

def build_context_block(expense_profile: Dict[str, Any], monthly_income: float | None) -> str:
    ctx = {
        "monthly_income": monthly_income,
        "expense_totals": expense_profile,
    }
    return json.dumps(ctx, indent=2)

def user_visible_instructions(query: str) -> str:
    return (
        f"User question:\n{query}\n\n"
        "Rules:\n"
        "- If asked about savings rate or budgets, compute rough guidance using provided income and expense totals.\n"
        "- If income is missing, ask briefly for it before estimating.\n"
        "- Reply as concise bullet points.\n"
        "- Do not name specific funds or stocks. Stick to categories.\n"
        f"- End with: {NOTE}\n"
    )

def craft_parts(history: List[Dict[str, str]], ctx_block: str, query: str, mem_summary: str = "") -> list:
    """
    Build a list for google-generativeai where each element is:
      {"role": "user"|"model", "parts": [text]}
    - We map our 'assistant' role to Gemini's 'model'
    - We prepend DATA + MEMORY inside the new user turn
    """
    parts = []
    # convert previous turns
    for h in history:
        role = "user" if h["role"] == "user" else "model"
        parts.append({"role": role, "parts": [h["content"]]})

    # inject fresh user turn with DATA + MEMORY + instructions
    payload = []
    if mem_summary:
        payload.append(f"MEMORY (summary of past chat):\n{mem_summary}")
    payload.append(f"DATA (financial context):\n{ctx_block}")
    payload.append(user_visible_instructions(query))
    parts.append({"role": "user", "parts": ["\n\n".join(payload)]})
    return parts

def enforce_note(text: str) -> str:
    if NOTE.lower() not in text.lower():
        text += f"\n\n{NOTE}"
    if FORBIDDEN.search(text):
        text = (
            "I can't provide buy/sell calls or guaranteed returns.\n"
            "Here are safer category-level steps:\n"
            "- Build emergency fund (3–6 months) in high-liquidity options.\n"
            "- For 1–3 yr goals: RD/short-duration debt category.\n"
            "- For 5+ yrs: broad-market index exposure.\n"
            "- Consider SGB for diversification if lock-in suits.\n\n"
            f"{NOTE}"
        )
    return text
