# streamlit_app.py
import os
import json
import pandas as pd
import streamlit as st
from dotenv import load_dotenv, find_dotenv

# Local modules
from backend.llm.app.data_model import load_expense_csv, normalize_expenses, summarize
from backend.llm.app.chat_brain import (
    build_context_block,
    craft_parts,
    enforce_note,
    update_memory_summary,  # memory-lite
)

# Gemini SDK
import google.generativeai as genai

# ------------------------- Init -------------------------
load_dotenv(find_dotenv(), override=False)

def configure_gemini() -> str:
    """Configure API key and return a working model name."""
    key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GOOGLE_API_KEY not set. Put it in .env or environment.")
    genai.configure(api_key=key)

    try:
        names = [
            m.name for m in genai.list_models()
            if "generateContent" in getattr(m, "supported_generation_methods", [])
        ]
    except Exception:
        names = []

    preferred = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b"]
    return next((m for m in preferred if m in names), (names[0] if names else "gemini-1.5-flash"))

SYSTEM = (
    "You are a friendly personal finance copilot for India-focused users.\n"
    "The user uploads a CSV that contains only OUTGOING transactions (expenses). Income is asked separately.\n"
    "Keep responses short, structured, and practical.\n"
    "Strictly avoid naming investment products, funds, stocks or giving buy/sell calls.\n"
    "Suggest ONLY categories (e.g., liquid/savings, RD/short-duration debt, broad-market index exposure, SGB).\n"
    "Always end with this NOTE on a new line:\n"
    "Educational only. Not financial advice. Please research before investing.\n"
)

st.set_page_config(page_title="Expense Copilot — Gemini", page_icon="💬", layout="wide")
st.title("💬 Expense Copilot — Gemini")
st.caption("_NOTE: Educational only. Not financial advice. Please research before investing._")

# ------------------------- Sidebar -------------------------
with st.sidebar:
    st.header("Setup")
    uploaded = st.file_uploader("Upload expense-only CSV", type=["csv"])
    show_charts = st.toggle("Show Charts", value=False)
    st.write("API key loaded:", bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")))

# ------------------------- Session State -------------------------
if "history" not in st.session_state: st.session_state["history"] = []   # [{role: 'user'|'assistant', content: str}]
if "profile" not in st.session_state: st.session_state["profile"] = None
if "income" not in st.session_state: st.session_state["income"] = None
if "mem_summary" not in st.session_state: st.session_state["mem_summary"] = ""  # memory-lite summary text

# ------------------------- CSV Load -------------------------
if uploaded is not None:
    df = load_expense_csv(uploaded.getvalue())
    dfn, cols = normalize_expenses(df)
    profile = summarize(dfn, cols)
    st.session_state["profile"] = profile

    st.success(f"Loaded {len(dfn)} rows. Total outflow: ₹{profile['total_outflow']:,.0f}")

    # Ask for monthly income if missing (since CSV has only expenses)
    if st.session_state["income"] is None:
        inc = st.number_input("Enter your monthly income (₹)", min_value=0, step=1000)
        if st.button("Save income"):
            st.session_state["income"] = float(inc)
            st.success("Income saved.")
else:
    st.info("Upload your expenses CSV to start.")

# ------------------------- Charts -------------------------
if uploaded is not None and st.session_state["profile"] and show_charts:
    st.subheader("Charts")
    prof = st.session_state["profile"]

    by_month = pd.DataFrame(prof["by_month"])
    if not by_month.empty:
        st.line_chart(by_month.set_index("__month")["spend"])

    by_cat = pd.DataFrame(prof["by_category"])
    if not by_cat.empty:
        st.bar_chart(by_cat.set_index("category")["spend"].head(15))

st.markdown("---")
st.subheader("Chat")

# Render history so far
for msg in st.session_state["history"]:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

disabled = st.session_state["profile"] is None
q = st.chat_input("Ask about spending, budgets, or suggestions…", disabled=disabled)

# ------------------------- Handle a new turn -------------------------
if q and not disabled:
    # Show + store user message
    st.session_state["history"].append({"role": "user", "content": q})
    with st.chat_message("user"):
        st.markdown(q)

    # Build context block from current profile + income
    ctx_block = build_context_block(st.session_state["profile"], st.session_state["income"])

    # Memory-lite: refresh summary every ~5 turns (after a new user msg)
    turns = [m for m in st.session_state["history"] if m["role"] in ("user", "assistant")]
    if len(turns) % 5 == 1:
        st.session_state["mem_summary"] = update_memory_summary(
            st.session_state["mem_summary"],
            st.session_state["history"],
            max_chars=900
        )

    # Build Gemini content parts (roles limited to 'user'/'model')
    parts = craft_parts(
        history=st.session_state["history"][:-1],  # prior turns only
        ctx_block=ctx_block,
        query=q,
        mem_summary=st.session_state["mem_summary"]
    )

    # Call Gemini
    try:
        model_name = "gemini-2.5-pro"
        model = genai.GenerativeModel(model_name=model_name, system_instruction=SYSTEM)
        resp = model.generate_content(parts)
        answer = (resp.text or "").strip()
        answer = enforce_note(answer)
    except Exception as e:
        answer = f"Gemini error: {e}"

    # Show + store assistant message
    st.session_state["history"].append({"role": "assistant", "content": answer})
    with st.chat_message("assistant"):
        st.markdown(answer)
