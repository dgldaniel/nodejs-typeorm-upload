import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  path: string;
}

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  public async execute({ path: csvFilePath }: Request): Promise<Transaction[]> {
    const createTransaction = new CreateTransactionService();

    const dataFromCSV = await this.loadCSV(csvFilePath);

    const transactions = dataFromCSV.map(transaction =>
      createTransaction.execute(transaction),
    );

    const newTransactions = await Promise.all(transactions);

    return newTransactions;
  }

  private async loadCSV(filePath: string): Promise<TransactionCSV[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      ltrim: true,
      rtrim: true,
      columns: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: TransactionCSV[] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return lines;
  }
}

export default ImportTransactionsService;
