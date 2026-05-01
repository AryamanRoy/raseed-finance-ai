import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import os

load_dotenv()
# Load CSV
import sys

input_file = sys.argv[1] if len(sys.argv) > 1 else "Bank_transaction.csv"
df = pd.read_csv(input_file)


# Unique merchant names
merchants = df["Receiver Name"].fillna("").unique().tolist()

# Initialize Gemini
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

# Prompt template
prompt = PromptTemplate(
    input_variables=["merchant_list"],
    template="""
                You are a finance assistant that categorizes bank transaction merchants into one of:
                Food, Fuel, Shopping, Utilities, Bills, Medical, Entertainment, Travel, Groceries, Other

                For each merchant below, return CSV format as:
                merchant,category

                Merchants:
                {merchant_list}
            """
            )

chain = prompt | llm

# Prepare merchant text chunk
merchant_text = "\n".join([f"- {m}" for m in merchants])

# Get classified response
response = chain.invoke({"merchant_list": merchant_text})
response_text = response.content
print("LLM Output:\n", response_text)

# Convert model output to dataframe
lines = [x.strip() for x in response.split("\n") if "," in x]
df_map = pd.DataFrame([line.split(",") for line in lines], columns=["Receiver Name","category"])

# Merge with original
df_final = df.merge(df_map, on="Receiver Name", how="left")

# Save new CSV
df_final.to_csv("Bank_transaction_categorized.csv", index=False)

print("\nCategorization complete!")
print("Output file: Bank_transaction_categorized.csv")
