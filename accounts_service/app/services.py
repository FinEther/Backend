from sqlalchemy.orm import Session
from .models import BankAccount,Transaction,TransactionType
from .schemas import BankAccountAdd
import requests
from fastapi import HTTPException
import os
from collections import defaultdict



USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
BANK_SERVICE_URL = os.getenv('BANK_SERVICE_URL')
Notification_URL = os.getenv('NOTIFICATION_URL')

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
        raise HTTPException(status_code=401, detail="User not authentified")

def get_id_by_username(username:str):
    try:
        response = requests.get(f"{USER_SERVICE_URL}/users/id/{username}")
        response.raise_for_status()
        user=response.json()
        return user['user_id']
    except requests.HTTPError:
        raise HTTPException(status_code=404, detail="Unvalid username")
def show_notification(user_id):
    try:
        response = requests.get(f"{Notification_URL}/received_notifications/{user_id}")
        response.raise_for_status()
        print("Notifications retreived successfully")
        return response.json()
    except requests.ConnectionError:
        print("Connection error: Unable to reach notification service")
    except requests.Timeout:
        print("Timeout error: Notification service is not responding")
    except requests.RequestException as e:
        print(f"Unexpected error: {e}")

def send_notification(id,titre,objet):
    notification_data = {
        "user_id": id,
        "titre": titre,
        "objet": objet,
    }
    try:
        response = requests.post(f"{Notification_URL}/send_notification", json=notification_data)
        response.raise_for_status()
        print("Notification sent successfully")
        return response.json()
    except requests.ConnectionError:
        print("Connection error: Unable to reach notification service")
    except requests.Timeout:
        print("Timeout error: Notification service is not responding")
    except requests.RequestException as e:
        print(f"Unexpected error: {e}")   

'''def validate_bank_account(account_number: str):
    try:
        response = requests.get(f"{BANK_SERVICE_URL}/accounts/{account_number}")
        response.raise_for_status()
        return response.json()
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Bank account does not exist")
        raise HTTPException(status_code=500, detail="Error connecting to Bank Service")'''

def validate_bank_account(account_number: str, cvv: str, expiry_date: str):
    try:
         response = requests.get(f"{BANK_SERVICE_URL}/bank_accounts/{account_number}/{cvv}/-/{expiry_date}")
         response.raise_for_status()
         return response.json()
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Bank account does not exist")
        raise HTTPException(status_code=500, detail="Error connecting to Bank Service")

def add_bank_account(db: Session, account: BankAccountAdd, user_id: int):
    bank_account= validate_bank_account(account.account_number,account.cvv,account.expiry_date)
    new_account=BankAccount(account_number=account.account_number,expiry_date=account.expiry_date,card_type=bank_account["card_type"],currency=bank_account["currency"],user_id=user_id)
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

'''def add_bank_account(db: Session, account: BankAccountAdd, user_id: int):
    bank_account = validate_bank_account(account.account_number)
    new_account = BankAccount(account_number=account.account_number, user_id=user_id)
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account '''



def get_all_bank_accounts(db: Session):
    return db.query(BankAccount).all()

def check_bank_account(db:Session,account_number):
    return db.query(BankAccount).filter(BankAccount.account_number == account_number).first()

def get_bank_accounts_by_user(db: Session, user_id: int):
    return db.query(BankAccount).filter(BankAccount.user_id == user_id).first()

def get_user_id_by_account_id(db: Session, account_id: int):
    account = db.query(BankAccount.user_id).filter(BankAccount.id == account_id).first()
    if account:
        return account.user_id
    return None


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

def transaction_simple(db: Session, sender: BankAccount, receiver_account_number: str, amount: float,date:str):
    if sender.account_number==receiver_account_number:
        raise ValueError("Sender and receiver cannot be the same.")
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    receiver_account = check_bank_account(db, receiver_account_number)

    if receiver_account:
        withdraw_from_sender(sender.account_number, amount)
        deposit_to_receiver(receiver_account_number, amount)
        transaction = Transaction(
            transaction_type=TransactionType.USER_TO_USER,
            sender_id=sender.id,
            receiver_id=receiver_account.id,
            receiver_account_number=receiver_account_number,
            amount=amount,
            transaction_date=date
        )
    else:
        fee = amount * 0.05
        total_amount = amount + fee
        withdraw_from_sender(sender.account_number, total_amount)
        deposit_to_receiver(receiver_account_number, amount)
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

def get_user_transactions(user_id: int, db: Session):
    bank_account = db.query(BankAccount).filter(BankAccount.user_id == user_id).first()
    
    if bank_account:
        transactions = []
        for tx in bank_account.sent_transactions:
            transactions.append({
                "account_number": tx.receiver_account_number,
                "amount": tx.amount,
                "date": tx.transaction_date,
                "transaction_type": "credit"
            })
        for tx in bank_account.received_transactions:
            transactions.append({
                "account_number": db.query(BankAccount).get(tx.sender_id).account_number,
                "amount": tx.amount,
                "date": tx.transaction_date,
                "transaction_type": "debit"
            })
        
        
        return transactions
    return None



def get_user_transactions_summary(user_id: int, db: Session):
    bank_account = db.query(BankAccount).filter(BankAccount.user_id == user_id).first()  
    if not bank_account:
        return None   
    transaction_summary = defaultdict(lambda: {"debit": 0, "credit": 0})
    for tx in bank_account.sent_transactions:
        transaction_date = tx.transaction_date
        transaction_summary[transaction_date]["credit"] += tx.amount  
    for tx in bank_account.received_transactions:
        transaction_date = tx.transaction_date
        transaction_summary[transaction_date]["debit"] += tx.amount
    transactions_list = [
        {"date": date, "debit": data["debit"], "credit": data["credit"]}
        for date, data in sorted(transaction_summary.items())
    ]
    
    return transactions_list
