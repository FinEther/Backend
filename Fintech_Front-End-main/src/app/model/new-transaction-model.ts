export interface NewTransactionModel { //post data format
    type: string,   //facture ou transfert
    montant: number,
    numCompteDest: number,
    ifFactureData: string[] //autre data si le type est facture
}
