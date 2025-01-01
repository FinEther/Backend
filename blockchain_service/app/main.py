from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from . import blockchain, database, services
from .schemas import TransactionRequest

app = FastAPI()

@app.post("/convert-to-ethereum/")
def convert_to_ethereum(
    token: str,  # Authorization token
    user_wallet_address: str,  # Ethereum wallet address
    amount: float,  # Amount in USD or another currency to convert
    db: Session = Depends(database.get_db),
):  
    """
    Convert the user's virtual balance to Ethereum and transfer to their wallet address.

    Args:
    - token (str): Authorization token for user.
    - user_wallet_address (str): The Ethereum wallet address of the user.
    - amount (float): The amount to transfer.

    Returns:
    - dict: Transaction details.
    """
    # Step 1: Verify account balance and deduct
    balance_response = services.verify_and_deduct_balance(token, amount)

    # Step 2: Perform the blockchain transaction
    transaction_details = blockchain.transfer_to_ethereum(amount, user_wallet_address)

    return {
        "message": "Transfer successful",
        "account_number": balance_response["account_number"],
        "remaining_balance": balance_response["remaining_balance"],
        "transaction_details": transaction_details,
    }

@app.post("/send-eth")
def send_eth_endpoint(request: TransactionRequest):
    """
    FastAPI POST method to send Ethereum.
    """
    result = blockchain.send_eth(
        from_address=request.from_address,
        to_address=request.to_address,
        amount_in_eth=request.amount_in_eth,
        private_key=request.private_key
    )
    return result