from sqlalchemy.orm import Session
from .models import BankAccount,Transaction,TransactionType
from .schemas import BankAccountAdd
import requests
from fastapi import HTTPException
import os



USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
BANK_SERVICE_URL = os.getenv('BANK_SERVICE_URL')

def verify_user(token: str):
    try:
        response = requests.get(
            f"{USER_SERVICE_URL}/users/me/",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        user_data = response.json()
        return user_data["id"]
    except requests.HTTPError:
        raise HTTPException(status_code=401, detail="User verification failed")

def get_id_by_username(username:str):
    try:
        response = requests.get(f"{USER_SERVICE_URL}/users/id/{username}")
        response.raise_for_status()
        user=response.json()
        return user['user_id']
    except requests.HTTPError:
        raise HTTPException(status_code=404, detail="Unvalid username")


def validate_bank_account(account_number: str):
    try:
        response = requests.get(f"{BANK_SERVICE_URL}/accounts/{account_number}")
        response.raise_for_status()
        return response.json()
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Bank account does not exist")
        raise HTTPException(status_code=500, detail="Error connecting to Bank Service")



def add_bank_account(db: Session, account: BankAccountAdd, user_id: int):
    bank_account = validate_bank_account(account.account_number)
    new_account = BankAccount(account_number=account.account_number, user_id=user_id)
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account 



def get_all_bank_accounts(db: Session):
    return db.query(BankAccount).all()



def get_bank_accounts_by_user(db: Session, user_id: int):
    return db.query(BankAccount).filter(BankAccount.user_id == user_id).all()



def withdraw_from_sender(account_number: str, amount: float):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    try:
        response = requests.put(
            f"{BANK_SERVICE_URL}/accounts/{account_number}/withdraw/{amount}"
        )
        response.raise_for_status()
        return response.json()["balance"]
    except requests.HTTPError as e:
        raise HTTPException(
            status_code=e.response.status_code, 
            detail=e.response.json().get("detail", "Error processing withdrawal")
        )



def deposit_to_receiver(account_number: str, amount: float):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    try:
        response = requests.put(
            f"{BANK_SERVICE_URL}/accounts/{account_number}/deposit/{amount}"
        )
        response.raise_for_status()
        return response.json()["balance"]
    except requests.HTTPError as e:
        raise HTTPException(
            status_code=e.response.status_code, 
            detail=e.response.json().get("detail", "Error processing deposit")
        )
    

def create_user_to_user_transaction(
    db: Session, sender: BankAccount, receiver: BankAccount, amount: float
):
    if sender.id == receiver.id:
        raise ValueError("Sender and receiver cannot be the same.")
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    withdraw_from_sender(sender.account_number, amount)
    deposit_to_receiver(receiver.account_number, amount)
    transaction = Transaction(
        transaction_type=TransactionType.USER_TO_USER,
        sender_id=sender.id,
        receiver_id=receiver.id,
        amount=amount,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction



def create_user_to_bank_transaction(
    db: Session, sender: BankAccount, receiver_account_number: str, amount: float
):
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    fee = amount * 0.05
    total_amount = amount + fee
    withdraw_from_sender(sender.account_number, total_amount)
    deposit_to_receiver(receiver_account_number,amount)
    transaction = Transaction(
        transaction_type=TransactionType.USER_TO_BANK,
        sender_id=sender.id,
        receiver_account_number=receiver_account_number,
        amount=amount,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction