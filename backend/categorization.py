import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import os
import sys
import time

load_dotenv()

# -----------------------------
# Load CSV
# -----------------------------
input_file = sys.argv[1] if len(sys.argv) > 1 else "Bank_transaction.csv"
df = pd.read_csv(input_file)

# -----------------------------
# Clean merchant names
# -----------------------------
df["Receiver Name"] = df["Receiver Name"].fillna("").astype(str).str.strip()

merchants = df["Receiver Name"].unique().tolist()
merchants = [m for m in merchants if m]  # remove empty

# -----------------------------
# Initialize Gemini (LangChain)
# -----------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0  # deterministic output
)

# -----------------------------
# Prompt
# -----------------------------
prompt = PromptTemplate(
    input_variables=["merchant_list"],
    template="""
You are a finance assistant that categorizes bank transaction merchants.

Categories:
Food, Fuel, Shopping, Utilities, Bills, Medical, Entertainment, Travel, Groceries, Other

STRICT RULES:
- Output ONLY CSV
- Format: merchant,category
- No explanations
- No extra text

Merchants:
{merchant_list}
"""
)

chain = prompt | llm

# -----------------------------
# Chunking (IMPORTANT)
# -----------------------------
def chunk_list(data, size=50):
    for i in range(0, len(data), size):
        yield data[i:i + size]

# -----------------------------
# LLM call with retry
# -----------------------------
def classify_batch(batch, retries=3):
    merchant_text = "\n".join([f"- {m}" for m in batch])

    for attempt in range(retries):
        try:
            response = chain.invoke({"merchant_list": merchant_text})
            response_text = getattr(response, "content", str(response))
            return response_text
        except Exception as e:
            print(f"Retry {attempt+1} failed: {e}")
            time.sleep(2)

    print("Failed batch, skipping...")
    return ""

# -----------------------------
# Parse CSV safely
# -----------------------------
def parse_response(text):
    rows = []
    for line in text.split("\n"):
        line = line.strip()

        if "," not in line:
            continue

        if line.lower().startswith("merchant"):
            continue

        parts = line.split(",", 1)
        if len(parts) != 2:
            continue

        merchant, category = parts
        rows.append([merchant.strip(), category.strip()])

    return rows

# -----------------------------
# Process all batches
# -----------------------------
all_rows = []

for batch in chunk_list(merchants, size=50):
    print(f"Processing batch of {len(batch)} merchants...")
    result = classify_batch(batch)
    parsed = parse_response(result)
    all_rows.extend(parsed)

# -----------------------------
# Create mapping dataframe
# -----------------------------
df_map = pd.DataFrame(all_rows, columns=["Receiver Name", "category"])

# Normalize again (safety)
df_map["Receiver Name"] = df_map["Receiver Name"].astype(str).str.strip()

# -----------------------------
# Merge
# -----------------------------
df_final = df.merge(df_map, on="Receiver Name", how="left")

# Fill missing
df_final["category"] = df_final["category"].fillna("Other")

# -----------------------------
# Save
# -----------------------------
output_file = "Bank_transaction_categorized.csv"
df_final.to_csv(output_file, index=False)

print("\nCategorization complete!")
print(f"Output file: {output_file}")