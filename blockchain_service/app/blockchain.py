from web3 import Web3
import requests
from fastapi import HTTPException

WEB3_PROVIDER = "https://sepolia.infura.io/v3/43a3ba8d63244b2282f9ce50292466a0"  # Replace with your provider

web3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER))


def get_eth_usd_rate():
    # Use a reliable API to get the ETH/USD exchange rate
    url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    response = requests.get(url)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch ETH/USD exchange rate")
    return response.json()["ethereum"]["usd"]


def transfer_to_ethereum(amount: float, user_wallet_address: str):
    eth_usd_rate = get_eth_usd_rate()

    eth_amount = amount / eth_usd_rate

    tx = {
        'to': user_wallet_address,
        'value': web3.to_wei(eth_amount,'ether'),
        'gas': 21000,
        'gasPrice': web3.eth.gas_price,
        'nonce': web3.eth.get_transaction_count(user_wallet_address),
    }
    print(web3.eth.gas_price)

    # Sign and send transaction
    signed_tx = web3.eth.account.sign_transaction(tx, private_key="6551ce65240d2626efda770a54f1f75163adc7ac13216a3d42c313069f93d00f")  # Replace securely
    tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)

    return {"tx_hash": web3.to_hex(tx_hash), "eth_amount": eth_amount}

def send_eth(from_address: str, to_address: str, amount_in_eth: float, private_key: str):

    # Build the transaction
    tx = {
        'to': to_address,
        'value': web3.to_wei(amount_in_eth, 'ether'),
        'gas': 21000,
        'gasPrice': web3.eth.gas_price,
        'nonce': web3.eth.get_transaction_count(from_address),
    }

    # Sign the transaction
    signed_tx = web3.eth.account.sign_transaction(tx, private_key=private_key)

    # Send the transaction
    tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)

    return {"tx_hash": web3.to_hex(tx_hash), "amount_sent": amount_in_eth}


contrat_adress="0x6bdd9e31e3141af47fd611202f40edf6fdb8e19e"
contract_ABI = [
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
      },

]
contrat_adress = Web3.to_checksum_address(contrat_adress)
contracts = web3.eth.contract(address=contrat_adress, abi=contract_ABI)

def get_user_balance(address: str):
    balance = contracts.functions.getBalance(address).call()
    return web3.from_wei(balance, 'ether')

def get_sepolia_eth_balance(address: str):
    balance = web3.eth.get_balance(address)
    return web3.from_wei(balance, 'ether')

