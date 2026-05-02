import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import os
import sys
import time
import json

load_dotenv()

# -----------------------------
# CONFIG
# -----------------------------
CACHE_FILE = "merchant_cache.json"

# -----------------------------
# NORMALIZATION (CRITICAL)
# -----------------------------
def normalize_name(x):
    return (
        str(x)
        .lower()
        .replace("'", "")
        .replace('"', "")
        .replace(".", "")
        .replace(",", "")
        .strip()
    )

# -----------------------------
# RULE-BASED ENGINE (FAST)
# -----------------------------
RULES = {
    "domino": "Food",
    "swiggy": "Food",
    "zomato": "Food",
    "uber": "Travel",
    "ola": "Travel",
    "irctc": "Travel",
    "netflix": "Entertainment",
    "spotify": "Entertainment",
    "amazon": "Shopping",
    "flipkart": "Shopping",
    "ajio": "Shopping",
    "big bazaar": "Groceries",
    "reliance": "Shopping",
    "tata power": "Utilities",
    "airtel": "Utilities",
    "jio": "Utilities",
}

def rule_classify(name):
    for key, value in RULES.items():
        if key in name:
            return value
    return None

# -----------------------------
# LOAD CSV
# -----------------------------
input_file = sys.argv[1] if len(sys.argv) > 1 else "Bank_transaction.csv"
df = pd.read_csv(input_file)

df.columns = df.columns.str.strip()

df["Receiver Name"] = df["Receiver Name"].fillna("").astype(str).str.strip()
df["Receiver Name Clean"] = df["Receiver Name"].apply(normalize_name)

merchants = df["Receiver Name Clean"].unique().tolist()

# -----------------------------
# LOAD CACHE
# -----------------------------
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "r") as f:
        cache = json.load(f)
else:
    cache = {}

# -----------------------------
# RULE + CACHE FILTER
# -----------------------------
to_classify = []
results = {}

for m in merchants:
    # 1. Rule-based
    rule_result = rule_classify(m)
    if rule_result:
        results[m] = rule_result
        continue

    # 2. Cache
    if m in cache:
        results[m] = cache[m]
        continue

    # 3. Needs LLM
    to_classify.append(m)

print(f"[INFO] Rule+Cache handled: {len(results)}")
print(f"[INFO] Sending to LLM: {len(to_classify)}")

# -----------------------------
# LLM INIT
# -----------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0
)

prompt = PromptTemplate(
    input_variables=["merchant_list"],
    template="""
You are a finance assistant that categorizes merchants.

Categories:
Food, Fuel, Shopping, Utilities, Bills, Medical, Entertainment, Travel, Groceries, Other

Return ONLY CSV:
merchant,category

Merchants:
{merchant_list}
"""
)

chain = prompt | llm

# -----------------------------
# BATCHING
# -----------------------------
def chunk_list(data, size=150):
    for i in range(0, len(data), size):
        yield data[i:i + size]

# -----------------------------
# PARSE RESPONSE
# -----------------------------
def parse_response(text):
    rows = {}

    for line in text.split("\n"):
        line = line.strip()

        if "," not in line:
            continue

        parts = line.split(",", 1)
        if len(parts) != 2:
            continue

        merchant, category = parts

        merchant = normalize_name(merchant)
        category = category.strip()

        rows[merchant] = category

    return rows

# -----------------------------
# LLM PROCESS
# -----------------------------
for batch in chunk_list(to_classify):
    merchant_text = "\n".join(batch)

    try:
        response = chain.invoke({"merchant_list": merchant_text})
        text = getattr(response, "content", str(response))

        parsed = parse_response(text)

        # Store results
        for k, v in parsed.items():
            results[k] = v
            cache[k] = v

    except Exception as e:
        print("Batch failed:", e)
        time.sleep(2)

# -----------------------------
# SAVE CACHE
# -----------------------------
with open(CACHE_FILE, "w") as f:
    json.dump(cache, f, indent=2)

# -----------------------------
# MAP BACK
# -----------------------------
df["category"] = df["Receiver Name Clean"].map(results)

# Fill missing
df["category"] = df["category"].fillna("Other")

# -----------------------------
# SAVE OUTPUT
# -----------------------------
output_file = "Bank_transaction_categorized.csv"
df.drop(columns=["Receiver Name Clean"], inplace=True)
df.to_csv(output_file, index=False)

print("\nCategorization complete!")
print(f"[INFO] Output: {output_file}")
print(f"[INFO] Total rows: {len(df)}")