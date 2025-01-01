from sqlalchemy import Column, Integer, String, Float
from .database import Base

class BlockchainTransaction(Base):
    __tablename__ = "blockchain_transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, index=True)
    tx_hash = Column(String, index=True)
    eth_amount = Column(Float)
    user_wallet_address = Column(String)
