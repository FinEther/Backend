from fastapi import FastAPI, HTTPException
from web3 import Web3
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

# Connect to Sepolia using Infura or another provider
INFURA_URL = "https://sepolia.infura.io/v3/43a3ba8d63244b2282f9ce50292466a0"
web3 = Web3(Web3.HTTPProvider(INFURA_URL))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200","http://192.168.68.133:4200"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Deposit",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "_to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "_to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "transferFromContract",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getContractBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_address",
                "type": "address"
            }
        ],
        "name": "getBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]
CONTRACT_ADDRESS = Web3.to_checksum_address("0x7ea444006e2b60fb322a78b3382f2c3e4246c09f")
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Pydantic model for transaction data
class TransactionRequest(BaseModel):
    to: str
    amount: int  # In Wei
    signed_tx: str  # Signed transaction data from Angular

@app.get("/native-balance/{address}")
async def get_native_balance(address: str):
    try:
        # Convert the address to checksum format
        checksum_address = Web3.to_checksum_address(address)
        
        # Get the balance in Wei
        balance_wei = web3.eth.get_balance(checksum_address)
        
        # Convert the balance from Wei to Ether
        balance_ether = Web3.from_wei(balance_wei, 'ether')
        
        return {
            "address": checksum_address,
            "balance_wei": balance_wei,
            "balance_ether": balance_ether  # Convert to string to avoid precision issues
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/contract-balance")
async def get_contract_balance():
    try:
        balance = contract.functions.getContractBalance().call()
        return {"contract_balance": balance}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/send-transaction")
async def send_transaction(tx_request: TransactionRequest):
    try:
        # Ensure recipient address is a checksum address
        tx_request.to = Web3.to_checksum_address(tx_request.to)

        # Process the signed transaction
        tx_hash = web3.eth.send_raw_transaction(tx_request.signed_tx)
        return {"transaction_hash": tx_hash.hex()}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class SignedTransaction(BaseModel):
    signed_tx: str  # Signed transaction data from the frontend

@app.post("/broadcast-transaction")
async def broadcast_transaction(tx: SignedTransaction):
    try:
        # Send the raw signed transaction
        tx_hash = web3.eth.send_raw_transaction(tx.signed_tx)
        return {"transaction_hash": tx_hash.hex()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))