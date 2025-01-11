export interface HistoryTransactions {
    account_number: string;  // Changed from number to string
    destination_account_number: string;  // Changed from number to string
    amount: number;
    date: string;
    hash: string;
}
