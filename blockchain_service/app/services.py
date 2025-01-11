import requests
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

ACCOUNTS_SERVICE_URL = "http://localhost:8003"
BANK_SERVICE_URL = "http://localhost:8002"

def verify_and_deduct_balance(token: str, amount: float):
    # Step 1: Get user's bank accounts
    headers = {"Authorization": f"Bearer {token}"}
    accounts_url = f"{ACCOUNTS_SERVICE_URL}/my-bank-accounts"
    accounts_response = requests.get(accounts_url, headers=headers)

    if accounts_response.status_code != 200:
        raise HTTPException(status_code=404, detail="Failed to retrieve bank accounts")

    accounts = accounts_response.json()
    if not accounts:
        raise HTTPException(status_code=404, detail="No bank accounts found for this user")

    # Assuming the user has one main account; modify logic if multiple accounts exist
    account_number = accounts.get("account_number")

    # Step 2: Check account balance
    balance_url = f"{BANK_SERVICE_URL}/accounts/{account_number}/balance"
    balance_response = requests.get(balance_url)

    if balance_response.status_code != 200:
        raise HTTPException(status_code=404, detail="Account not found")

    balance = balance_response.json().get("balance")
    if balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Step 3: Deduct balance
    withdraw_url = f"{BANK_SERVICE_URL}/accounts/{account_number}/withdraw/{amount}"
    withdraw_response = requests.put(withdraw_url)

    if withdraw_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to deduct balance")

    return {"message": "Transaction successful", "account_number": account_number, "remaining_balance": withdraw_response.json().get("balance")}
