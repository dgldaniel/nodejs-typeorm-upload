import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getCustomRepository(CategoriesRepository);

    if (type === 'outcome') {
      const { total } = await transactionRepository.getBalance();

      if (value > total) {
        throw new AppError('Extrapolou');
      }
    }

    let currentCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!currentCategory) {
      currentCategory = categoryRepository.create({ title: category });

      await categoryRepository.save(currentCategory);
    }

    const newTransaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: currentCategory.id,
    });

    await transactionRepository.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
