# Expense Copilot — Streamlit Chatbot (Gemini)

Chat-only personal finance copilot for **expense-only** CSVs using **google-generativeai**.
- Upload CSV of **outgoing transactions only**
- App asks for **monthly income**
- Conversational tips + optional charts
- **NOTE:** Educational only. Not financial advice. Please research before investing.

## Run
```bash
pip install -r requirements.txt
# Provide the key (one way)
copy .env.example .env   # Windows
# then edit .env and set GOOGLE_API_KEY=your_key

streamlit run streamlit_app.py
```
