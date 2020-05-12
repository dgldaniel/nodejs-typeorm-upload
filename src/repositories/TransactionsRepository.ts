import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface SumValue {
  sum: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const incomeList = await this.find({ where: { type: 'income' } });
    const outcomeList = await this.find({ where: { type: 'outcome' } });

    const income = incomeList.reduce((acc, next) => acc + next.value, 0);
    const outcome = outcomeList.reduce((acc, next) => acc + next.value, 0);

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
