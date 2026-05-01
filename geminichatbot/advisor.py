import os
import json
import pandas as pd
from dotenv import load_dotenv, find_dotenv

# Local modules
from app.data_model import load_expense_csv, normalize_expenses, summarize
from app.chat_brain import (
    build_context_block,
    craft_parts,
    enforce_note,
    update_memory_summary,  # memory-lite
)

# Gemini SDK
import google.generativeai as genai

# ------------------------- Init -------------------------
load_dotenv(find_dotenv(), override=False)

SYSTEM = (
    "You are a friendly personal finance copilot for India-focused users.\n"
    "The user uploads a CSV that contains only OUTGOING transactions (expenses). Income is asked separately.\n"
    "Keep responses short, structured, and practical.\n"
    "Strictly avoid naming investment products, funds, stocks or giving buy/sell calls.\n"
    "Suggest ONLY categories (e.g., liquid/savings, RD/short-duration debt, broad-market index exposure, SGB).\n"
    "Always end with this NOTE on a new line:\n"
    "Educational only. Not financial advice. Please research before investing.\n"
)

parts = craft_parts(
        history=st.session_state["history"][:-1],  # prior turns only
        ctx_block=ctx_block,
        query=q,
        mem_summary=st.session_state["mem_summary"]
    )

try:
    model_name = "gemini-2.5-flash"
    model = genai.GenerativeModel(model_name=model_name, system_instruction=SYSTEM)
    resp = model.generate_content(parts)
    answer = (resp.text or "").strip()
    answer = enforce_note(answer)
except Exception as e:
    answer = f"Gemini error: {e}"