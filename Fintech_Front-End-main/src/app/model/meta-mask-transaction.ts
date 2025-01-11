export interface MetaMaskTransaction {
    hash: string;              // Transaction hash
    nonce: number;            // Number of transactions sent from this address
    blockHash: string;        // Hash of the block containing this transaction
    blockNumber: number;      // Block number where this transaction was
    transactionIndex: number; // Integer of the transaction's position in the block
    from: string;            // Address of the sender
    to: string;              // Address of the recipient
    value: string;           // Amount transferred in wei
    gas: number;             // Gas provided by the sender
    gasPrice: string;        // Gas price provided by the sender in wei
    input: string;           // The data sent along with the transaction
    timestamp?: number;      // Block timestamp (needs to be queried separately)
  
    // Additional fields if the transaction is confirmed
    status: boolean;         // true if successful, false if failed
    effectiveGasPrice: string; // Actual gas price used
    gasUsed: number;        // Actual gas used
    cumulativeGasUsed: number; // Total gas used in the block up to this tx
  }