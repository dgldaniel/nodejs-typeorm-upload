import { getCustomRepository } from 'typeorm';

import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import CategoriesRepository from '../repositories/CategoriesRepository';
import TransactionsRepository from '../repositories/TransactionsRepository';

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
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getCustomRepository(CategoriesRepository);

    const dataFromCSV = await this.loadCSV(csvFilePath);

    const allCategories = await categoryRepository.find();

    const categories = dataFromCSV
      .map(transaction => {
        const categoryFound = allCategories.find(
          category => category.title === transaction.category,
        );

        if (!categoryFound) {
          return transaction.category;
        }

        return null;
      })
      .filter(category => !!category) as string[];

    const categoriesUniq = Array.from(new Set(categories));

    let newCategories = categoriesUniq.map(category => {
      const newCategory = new Category();

      newCategory.title = category;

      return newCategory;
    });

    newCategories = categoryRepository.create(newCategories);

    await categoryRepository.save(newCategories);

    const newAllCategories = await categoryRepository.find();

    let newTransactions = dataFromCSV.map(transaction => {
      const newTransaction = new Transaction();

      const categoryFound = newAllCategories.find(
        category => category.title === transaction.category,
      ) as Category;

      newTransaction.title = transaction.title;
      newTransaction.value = transaction.value;
      newTransaction.type = transaction.type;
      newTransaction.category_id = categoryFound.id;

      return newTransaction;
    });

    newTransactions = transactionRepository.create(newTransactions);
    const newTransactionsSaved = transactionRepository.save(newTransactions);

    return newTransactionsSaved;
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
