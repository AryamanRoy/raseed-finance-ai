import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import os
import sys

load_dotenv()

# Load CSV
input_file = sys.argv[1] if len(sys.argv) > 1 else "Bank_transaction.csv"
df = pd.read_csv(input_file)

# Unique merchant names (cleaned)
merchants = (
    df["Receiver Name"]
    .fillna("")
    .astype(str)
    .str.strip()
    .unique()
    .tolist()
)

# Initialize Gemini
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

# Prompt template
prompt = PromptTemplate(
    input_variables=["merchant_list"],
    template="""
You are a finance assistant that categorizes bank transaction merchants into one of:
Food, Fuel, Shopping, Utilities, Bills, Medical, Entertainment, Travel, Groceries, Other

Return STRICTLY in CSV format:
merchant,category

No explanations. No extra text.

Merchants:
{merchant_list}
"""
)

chain = prompt | llm

# Prepare merchant text
merchant_text = "\n".join([f"- {m}" for m in merchants if m])

# Call LLM
response = chain.invoke({"merchant_list": merchant_text})

# ✅ Extract content safely
response_text = getattr(response, "content", str(response))

print("LLM Output:\n", response_text)

# ✅ Parse response safely
lines = [
    x.strip()
    for x in response_text.split("\n")
    if "," in x and not x.lower().startswith("merchant")
]

parsed_rows = []
for line in lines:
    parts = line.split(",", 1)  # only split on first comma
    if len(parts) == 2:
        merchant, category = parts
        parsed_rows.append([merchant.strip(), category.strip()])

df_map = pd.DataFrame(parsed_rows, columns=["Receiver Name", "category"])

# ✅ Normalize before merge (VERY IMPORTANT)
df["Receiver Name"] = df["Receiver Name"].astype(str).str.strip()
df_map["Receiver Name"] = df_map["Receiver Name"].astype(str).str.strip()

# Merge
df_final = df.merge(df_map, on="Receiver Name", how="left")

# Fill missing categories
df_final["category"] = df_final["category"].fillna("Other")

# Save output
output_file = "Bank_transaction_categorized.csv"
df_final.to_csv(output_file, index=False)

print("\nCategorization complete!")
print(f"Output file: {output_file}")