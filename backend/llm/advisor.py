import os
from dotenv import load_dotenv, find_dotenv

# Local modules
from backend.llm.app.data_model import summarize
from backend.llm.app.chat_brain import (
    build_context_block,
    enforce_note,
    update_memory_summary,
)

# Gemini SDK
import google.generativeai as genai

# ------------------------- Init -------------------------
load_dotenv(find_dotenv(), override=False)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

SYSTEM = (
    "You are a friendly personal finance copilot for India-focused users.\n"
    "The user uploads a CSV that contains only OUTGOING transactions (expenses). Income is asked separately.\n"
    "Keep responses short, structured, and practical.\n"
    "Strictly avoid naming investment products, funds, stocks or giving buy/sell calls.\n"
    "Suggest ONLY categories (e.g., liquid/savings, RD/short-duration debt, broad-market index exposure, SGB).\n"
    "Always end with this NOTE on a new line:\n"
    "Educational only. Not financial advice. Please research before investing.\n"
)

MODEL_NAME = "gemini-2.5-flash"

# ------------------------- Chat Function -------------------------
def run_advisor_query(q, df, session_state):
    """
    Main advisor function
    """

    # -------------------------
    # Build expense summary
    # -------------------------
    try:
        expense_profile = summarize(df)
    except Exception:
        expense_profile = {}

    monthly_income = session_state.get("income", None)

    # -------------------------
    # Build context (FIXED)
    # -------------------------
    ctx_block = build_context_block(expense_profile, monthly_income)

    mem_summary = session_state.get("mem_summary", "")
    history = session_state.get("history", [])

    # -------------------------
    # Build prompt
    # -------------------------
    history_text = ""
    if history:
        recent = history[-3:]
        history_text = "\n".join(
            [f"User: {h['q']}\nAssistant: {h['a']}" for h in recent]
        )

    prompt = f"""
SYSTEM:
{SYSTEM}

MEMORY:
{mem_summary}

CONTEXT:
{ctx_block}

RECENT HISTORY:
{history_text}

USER QUERY:
{q}

INSTRUCTIONS:
- Give a short, structured answer
- Be practical
- Do not hallucinate numbers
- Suggest actionable steps
"""

    # -------------------------
    # Gemini Chat
    # -------------------------
    try:
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        chat = model.start_chat(history=[])

        response = chat.send_message(prompt)

        answer = (response.text or "").strip()
        answer = enforce_note(answer)

    except Exception as e:
        return f"Gemini error: {e}"

    # -------------------------
    # Update history (FIXED STRUCTURE)
    # -------------------------
    session_state.setdefault("history", [])
    session_state["history"].append({"role": "user", "content": q})
    session_state["history"].append({"role": "assistant", "content": answer})

    # -------------------------
    # Update memory (FIXED CALL)
    # -------------------------
    try:
        session_state["mem_summary"] = update_memory_summary(
            mem_summary,
            session_state["history"]
        )
    except Exception:
        pass

    return answer