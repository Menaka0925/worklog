
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  Filter,
  ChevronDown,
  RefreshCw,
  Loader2,
  ArrowLeftRight,
  AlertCircle,
  Pencil,
  Trash2,
  ArrowDown,
  ArrowUp,
  Plus,
} from 'lucide-react';

import { supabase } from '../../services/supabaseClient';
import AddTransactionModal, {
  type TransactionFormData,
} from '../../components/finance/AddTransactionModal';

type TransactionType =
  | 'Income'
  | 'Expense'
  | 'Lending'
  | 'Borrowing'
  | 'Repayment'
  | 'Transfer'
  | 'Loan payment'
  | 'Reimbursement';

type FinanceAccountRow = {
  id: string;
  name: string;
  account_type: 'Physical cash' | 'Bank account';
  is_archived: boolean;
};

type FinanceTransactionRow = {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id: string | null;
  transaction_type: TransactionType;
  category: string;
  amount: number | string;
  principal_amount: number | string | null;
  interest_amount: number | string | null;
  charges_amount: number | string;
  transaction_date: string;
  description: string;
  party: string | null;
  context: 'Personal' | 'Work';
  payment_method: string;
  payment_app: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Transaction = {
  id: string;
  accountId: string;
  destinationAccountId: string | null;
  date: string;
  description: string;
  party: string;
  category: string;
  type: TransactionType;
  account: string;
  destinationAccount: string;
  paymentMethod: string;
  paymentApp: string;
  amount: number;
  context: 'Personal' | 'Work';
  notes: string;
  principalAmount: number | null;
  interestAmount: number | null;
  chargesAmount: number;
};

type AccountOption = {
  id: string;
  name: string;
  archived: boolean;
};

const PAGE_SIZE = 1000;

const categoryOptions: Record<TransactionType, string[]> = {
  Income: [
    'Salary',
    'Freelance Income',
    'Business Income',
    'Interest Received',
    'Gift Received',
    'Other Income',
  ],
  Expense: [
    'Food',
    'Groceries',
    'Travel',
    'Entertainment',
    'Shopping',
    'Bills',
    'Health',
    'Education',
    'Household',
    'Other Expense',
  ],
  Lending: ['Money Lent'],
  Borrowing: ['Money Borrowed'],
  Repayment: ['Received Repayment', 'Paid Repayment'],
  Transfer: ['Own Account Transfer'],
  'Loan payment': [
    'EMI Payment',
    'Loan Principal Payment',
    'Loan Interest',
    'Loan Charges',
  ],
  Reimbursement: [
    'Travel Reimbursement',
    'Food Reimbursement',
    'Accommodation Reimbursement',
    'Work Expenses',
    'Other Reimbursement',
  ],
};

const transactionTypes: TransactionType[] = [
  'Income',
  'Expense',
  'Lending',
  'Borrowing',
  'Repayment',
  'Transfer',
  'Loan payment',
  'Reimbursement',
];

const formatAmount = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) => {
  if (!date) return '—';

  // Avoid timezone shifts for PostgreSQL DATE values.
  const [year, month, day] = date.split('-').map(Number);

  if (!year || !month || !day) return date;

  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getAmountPrefix = (transaction: Transaction) => {
  if (
    transaction.type === 'Income' ||
    transaction.type === 'Borrowing' ||
    transaction.type === 'Reimbursement'
  ) {
    return '+';
  }

  if (transaction.type === 'Repayment') {
    return transaction.category === 'Received Repayment' ? '+' : '−';
  }

  if (transaction.type === 'Transfer') {
    return '';
  }

  return '−';
};

const getAmountColor = (transaction: Transaction) => {
  const prefix = getAmountPrefix(transaction);

  if (prefix === '+') return 'text-[#28734A]';
  if (prefix === '−') return 'text-[#B45353]';

  return 'text-[#68736B]';
};

const typeStyles: Record<TransactionType, string> = {
  Income: 'bg-green-50 text-green-700',
  Expense: 'bg-red-50 text-red-700',
  Lending: 'bg-amber-50 text-amber-700',
  Borrowing: 'bg-blue-50 text-blue-700',
  Repayment: 'bg-teal-50 text-teal-700',
  Transfer: 'bg-gray-100 text-gray-700',
  'Loan payment': 'bg-purple-50 text-purple-700',
  Reimbursement: 'bg-emerald-50 text-emerald-700',
};

const mapTransaction = (
  row: FinanceTransactionRow,
  accountsById: Map<string, FinanceAccountRow>,
): Transaction => {
  const sourceAccount = accountsById.get(row.account_id);
  const destinationAccount = row.destination_account_id
    ? accountsById.get(row.destination_account_id)
    : undefined;

  return {
    id: row.id,
    accountId: row.account_id,
    destinationAccountId: row.destination_account_id,
    date: row.transaction_date,
    description: row.description ?? '',
    party: row.party ?? '',
    category: row.category ?? '',
    type: row.transaction_type,
    account: sourceAccount?.name ?? 'Unknown account',
    destinationAccount: destinationAccount?.name ?? '',
    paymentMethod: row.payment_method ?? '',
    paymentApp: row.payment_app ?? '',
    amount: Number(row.amount) || 0,
    context: row.context,
    notes: row.notes ?? '',
    principalAmount:
      row.principal_amount === null ? null : Number(row.principal_amount),
    interestAmount:
      row.interest_amount === null ? null : Number(row.interest_amount),
    chargesAmount: Number(row.charges_amount) || 0,
  };
};

const TransactionsHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  // Database records
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  // Loading/error state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search
  const [search, setSearch] = useState('');

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedType, setSelectedType] = useState('All types');
  const [selectedCategory, setSelectedCategory] =
    useState('All categories');
  const [selectedAccount, setSelectedAccount] =
    useState('All accounts');
  const [selectedMethod, setSelectedMethod] =
    useState('All methods');
  const [selectedContext, setSelectedContext] = useState('All');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!supabase) {
      setLoadError(
        'Supabase is not configured. Check your environment variables.',
      );
      setTransactions([]);
      setAccounts([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setLoadError('');

    try {
      // Fetch accounts.
      const { data: accountData, error: accountError } = await supabase
        .from('finance_accounts')
        .select('id, name, account_type, is_archived')
        .order('name', { ascending: true });

      if (accountError) throw accountError;

      const accountRows = (accountData ?? []) as FinanceAccountRow[];

      const accountsById = new Map(
        accountRows.map((account) => [account.id, account]),
      );

      setAccounts(
        accountRows.map((account) => ({
          id: account.id,
          name: account.name,
          archived: account.is_archived,
        })),
      );

      // Fetch all active transaction records in batches.
      const allRows: FinanceTransactionRow[] = [];
      let offset = 0;

      while (true) {
        const { data, error } = await supabase
          .from('finance_transactions')
          .select(
            `
              id,
              user_id,
              account_id,
              destination_account_id,
              transaction_type,
              category,
              amount,
              principal_amount,
              interest_amount,
              charges_amount,
              transaction_date,
              description,
              party,
              context,
              payment_method,
              payment_app,
              notes,
              created_at,
              updated_at
            `,
          )
          .is('deleted_at', null)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;

        const batch = (data ?? []) as FinanceTransactionRow[];

        allRows.push(...batch);

        if (batch.length < PAGE_SIZE) break;

        offset += PAGE_SIZE;
      }

      // Convert UUID references into readable account names.
      const mappedTransactions = allRows.map((row) =>
        mapTransaction(row, accountsById),
      );

      setTransactions(mappedTransactions);
      setLoadError('');
    } catch (error) {
      console.error('Finance history load error:', error);

      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load transaction history. Please try again.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
  };

  const allCategories = useMemo(() => {
    const dbCategories = transactions.map(
      (transaction) => transaction.category,
    );

    const fallbackCategories = Object.values(categoryOptions).flat();

    return [...new Set([...dbCategories, ...fallbackCategories])].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [transactions]);

  const availableCategories = useMemo(() => {
    if (selectedType === 'All types') return allCategories;

    const type = selectedType as TransactionType;

    const dbCategories = transactions
      .filter((transaction) => transaction.type === type)
      .map((transaction) => transaction.category);

    const fallbackCategories = categoryOptions[type] ?? [];

    return [...new Set([...dbCategories, ...fallbackCategories])].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [selectedType, allCategories, transactions]);

  const paymentMethods = useMemo(() => {
    const standardMethods = ['UPI', 'Bank Transfer', 'Debit Card'];

    const savedMethods = transactions
      .map((transaction) => transaction.paymentMethod)
      .filter(Boolean);

    return [...new Set([...standardMethods, ...savedMethods])].sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions
      .filter((transaction) => {
        const matchesSearch =
          !query ||
          transaction.description.toLowerCase().includes(query) ||
          transaction.party.toLowerCase().includes(query) ||
          transaction.category.toLowerCase().includes(query) ||
          transaction.paymentApp.toLowerCase().includes(query) ||
          transaction.account.toLowerCase().includes(query) ||
          transaction.destinationAccount.toLowerCase().includes(query) ||
          transaction.paymentMethod.toLowerCase().includes(query) ||
          transaction.context.toLowerCase().includes(query) ||
          transaction.notes.toLowerCase().includes(query);

        const matchesFromDate =
          !fromDate || transaction.date >= fromDate;

        const matchesToDate =
          !toDate || transaction.date <= toDate;

        const matchesType =
          selectedType === 'All types' ||
          transaction.type === selectedType;

        const matchesCategory =
          selectedCategory === 'All categories' ||
          transaction.category === selectedCategory;

        // Transfers match either the source or destination account.
        const matchesAccount =
          selectedAccount === 'All accounts' ||
          transaction.account === selectedAccount ||
          transaction.destinationAccount === selectedAccount;

        const matchesMethod =
          selectedMethod === 'All methods' ||
          transaction.paymentMethod === selectedMethod;

        const matchesContext =
          selectedContext === 'All' ||
          transaction.context === selectedContext;

        return (
          matchesSearch &&
          matchesFromDate &&
          matchesToDate &&
          matchesType &&
          matchesCategory &&
          matchesAccount &&
          matchesMethod &&
          matchesContext
        );
      })
      .sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);

        if (dateComparison !== 0) return dateComparison;

        return b.id.localeCompare(a.id);
      });
  }, [
    transactions,
    search,
    fromDate,
    toDate,
    selectedType,
    selectedCategory,
    selectedAccount,
    selectedMethod,
    selectedContext,
  ]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    filteredTransactions.forEach((transaction) => {
      const group = groups.get(transaction.date) ?? [];
      group.push(transaction);
      groups.set(transaction.date, group);
    });

    return Array.from(groups.entries()).map(([date, items]) => {
      const received = items.reduce(
        (sum, transaction) =>
          getAmountPrefix(transaction) === '+' ? sum + transaction.amount : sum,
        0,
      );

      const spent = items.reduce(
        (sum, transaction) =>
          getAmountPrefix(transaction) === '−' ? sum + transaction.amount : sum,
        0,
      );

      return { date, items, received, spent };
    });
  }, [filteredTransactions]);

  const getEditFormData = (transaction: Transaction): TransactionFormData => ({
    amount: String(transaction.amount),
    type: transaction.type,
    date: transaction.date,
    description: transaction.description,
    category: transaction.category,
    context: transaction.context,
    party: transaction.party,
    account: transaction.accountId,
    destinationAccount: transaction.destinationAccountId ?? '',
    paymentMethod: transaction.paymentMethod || 'UPI',
    paymentApp: transaction.paymentApp,
    notes: transaction.notes,
    principalAmount:
      transaction.principalAmount === null
        ? ''
        : String(transaction.principalAmount),
    interestAmount:
      transaction.interestAmount === null
        ? ''
        : String(transaction.interestAmount),
  });

  // Open confirmation dialog
  const handleRequestDelete = (transaction: Transaction) => {
    setActionError('');
    setTransactionToDelete(transaction);
  };

  // Confirm and delete selected transaction
  const handleConfirmDelete = async () => {
    if (!supabase || !transactionToDelete) return;

    const transactionId = transactionToDelete.id;

    setActionError('');
    setActionBusyId(transactionId);

    try {
      const { error } = await supabase.rpc('finance_delete_transaction', {
        p_transaction_id: transactionId,
      });

      if (error) throw error;

      // Close dialog after successful deletion
      setTransactionToDelete(null);

      // Reload transaction history
      await loadTransactions();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to delete transaction.',
      );
    } finally {
      setActionBusyId(null);
    }
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedType('All types');
    setSelectedCategory('All categories');
    setSelectedAccount('All accounts');
    setSelectedMethod('All methods');
    setSelectedContext('All');
  };

  const activeFilterCount = [
    fromDate !== '',
    toDate !== '',
    selectedType !== 'All types',
    selectedCategory !== 'All categories',
    selectedAccount !== 'All accounts',
    selectedMethod !== 'All methods',
    selectedContext !== 'All',
  ].filter(Boolean).length;

  const hasActiveFilters = search !== '' || activeFilterCount > 0;

  const selectClass =
    'w-full rounded-lg border border-[#E4E7E1] bg-white px-3 py-2.5 text-sm text-[#344238] outline-none focus:border-[#55765E]';

  const labelClass =
    'mb-1.5 block text-xs font-medium text-[#778178]';

  return (
    <div className="min-h-screen bg-[#F7F8F5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* Page heading */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/finance')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#68736B] transition hover:text-[#244735]"
          >
            <ArrowLeft size={17} />
            Back to Finance
          </button>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#24352A] sm:text-3xl">
                Transaction History
              </h1>

              <p className="mt-1 text-sm text-[#7A847C]">
                Search, review and filter all your financial activity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className="inline-flex items-center justify-center rounded-lg border border-[#E5E9E2] bg-white p-2 text-[#46544A] transition hover:bg-[#F5F7F4] disabled:cursor-not-allowed disabled:opacity-50"
                title="Refresh transaction history"
              >
                {isRefreshing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>

              <div className="inline-flex items-center gap-2 rounded-lg border border-[#E5E9E2] bg-white px-3 py-2 text-xs text-[#68736B]">
                <span>Transactions</span>
                <span className="font-semibold text-[#244735]">
                  [{isLoading ? '—' : filteredTransactions.length}]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {loadError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-800">
                Unable to load finance history
              </p>

              <p className="mt-1 break-words text-sm text-red-700">
                {loadError}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* Search and filters */}
        <div className="space-y-3">

          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA39B]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transactions..."
                className="w-full rounded-lg border border-[#E4E7E1] bg-white py-2 pl-9 pr-3 text-sm text-[#344238] outline-none placeholder:text-[#A0A9A1] focus:border-[#55765E]"
              />
            </div>

            {/* Add transaction */}
            <button
              type="button"
              onClick={() => setIsAddTransactionOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#244735] bg-[#244735] px-2.5 py-2 text-xs font-medium text-white transition hover:bg-[#1B3928]"
              title="Add transaction"
            >
              <Plus size={15} />
              <span>Add</span>
            </button>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setIsFilterOpen((previous) => !previous)}
              className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
                isFilterOpen || activeFilterCount > 0
                  ? 'border-[#244735] bg-[#F0F4EF] text-[#244735]'
                  : 'border-[#E4E7E1] bg-white text-[#46544A] hover:bg-[#F5F7F4]'
              }`}
            >
              <Filter size={15} />
              <span>Filter</span>

              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#244735] px-1 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}

              <ChevronDown
                size={14}
                className={`transition-transform ${
                  isFilterOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Filter dropdown panel */}
          {isFilterOpen && (
            <div className="rounded-xl border border-[#E5E9E2] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-[#2C3D31]">
                    Filter transactions
                  </h2>

                  <p className="mt-0.5 text-xs text-[#89928A]">
                    Narrow down your financial activity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Close filters"
                  className="rounded-lg p-2 text-[#7B867D] transition hover:bg-[#F2F5F0]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {/* From date */}
                <div>
                  <label className={labelClass}>From date</label>

                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFromDate(value);

                      if (toDate && value && toDate < value) {
                        setToDate(value);
                      }
                    }}
                    className={selectClass}
                  />
                </div>

                {/* To date */}
                <div>
                  <label className={labelClass}>To date</label>

                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(event) => setToDate(event.target.value)}
                    className={selectClass}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className={labelClass}>Transaction type</label>

                  <select
                    value={selectedType}
                    onChange={(event) => {
                      setSelectedType(event.target.value);
                      setSelectedCategory('All categories');
                    }}
                    className={selectClass}
                  >
                    <option value="All types">All types</option>

                    {transactionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className={labelClass}>Category</label>

                  <select
                    value={selectedCategory}
                    onChange={(event) =>
                      setSelectedCategory(event.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="All categories">All categories</option>

                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account */}
                <div>
                  <label className={labelClass}>Account</label>

                  <select
                    value={selectedAccount}
                    onChange={(event) =>
                      setSelectedAccount(event.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="All accounts">All accounts</option>

                    {accounts.map((account) => (
                      <option key={account.id} value={account.name}>
                        {account.name}
                        {account.archived ? ' (Archived)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment method */}
                <div>
                  <label className={labelClass}>Payment method</label>

                  <select
                    value={selectedMethod}
                    onChange={(event) =>
                      setSelectedMethod(event.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="All methods">All methods</option>

                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Context */}
                <div>
                  <label className={labelClass}>Finance context</label>

                  <select
                    value={selectedContext}
                    onChange={(event) =>
                      setSelectedContext(event.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="All">All</option>
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                  </select>
                </div>
              </div>

              {/* Filter footer */}
              <div className="mt-4 flex flex-col-reverse gap-2 border-t border-[#EDF0EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                  className="text-sm font-medium text-[#55765E] transition hover:text-[#244735] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear filters
                </button>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="rounded-lg bg-[#244735] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1B3928]"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Active filter summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-xs text-[#7A847C]">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`
                  : 'Search active'}
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  clearFilters();
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#55765E] hover:text-[#244735]"
              >
                <X size={13} />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Transactions table */}
        <div className="overflow-hidden rounded-xl border border-[#E5E9E2] bg-white shadow-sm">

          {/* Table heading */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDF0EB] px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-[#2C3D31]">
                All transactions
              </h2>

              <p className="mt-0.5 text-xs text-[#89928A]">
                Sorted by date, newest first
              </p>
            </div>
          </div>

          <div className="max-h-[650px] overflow-auto">
            <table className="w-full min-w-[1300px] border-collapse text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F8FAF7] text-[11px] font-semibold uppercase tracking-wide text-[#7B867D]">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Spent At</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Payment method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0F2EE]">

                {/* Loading */}
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2
                          size={26}
                          className="animate-spin text-[#55765E]"
                        />
                        <p className="text-sm text-[#7A847C]">
                          Loading transactions...
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Date groups and transaction rows */}
                {!isLoading &&
                  groupedTransactions.map((group) => (
                    <React.Fragment key={group.date}>
                      <tr className="border-y border-[#E6EBE4] bg-[#F5F7F4]">
                        <td colSpan={9} className="px-4 py-3 sm:px-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[#344638]">
                              {formatDate(group.date)}
                            </p>

                            <div className="flex items-center gap-4 text-xs font-semibold tabular-nums">
                              {group.spent > 0 && (
                                <span className="inline-flex items-center gap-1 text-[#B45353]">
                                  <ArrowDown size={14} />
                                  {formatAmount(group.spent)}
                                </span>
                              )}

                              {group.received > 0 && (
                                <span className="inline-flex items-center gap-1 text-[#28734A]">
                                  <ArrowUp size={14} />
                                  {formatAmount(group.received)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {group.items.map((transaction) => {
                        const amountPrefix = getAmountPrefix(transaction);

                        return (
                          <tr
                            key={transaction.id}
                            className="transition hover:bg-[#FAFBF9]"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-[#68736B]">
                              {formatDate(transaction.date)}
                            </td>

                            <td className="min-w-[210px] px-4 py-4">
                              <p className="whitespace-nowrap text-sm font-medium text-[#2C3D31]">
                                {transaction.description}
                              </p>
                              <p className="mt-1 text-xs text-[#939C94]">
                                {transaction.context}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-sm text-[#68736B]">
                              {transaction.party || '—'}
                            </td>

                            <td className="px-4 py-4 text-sm text-[#68736B]">
                              {transaction.category}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${typeStyles[transaction.type]}`}
                              >
                                {transaction.type}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm text-[#68736B]">
                              {transaction.type === 'Transfer' ? (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span>{transaction.account}</span>
                                  <ArrowLeftRight
                                    size={13}
                                    className="shrink-0 text-[#89928A]"
                                  />
                                  <span>
                                    {transaction.destinationAccount ||
                                      'Unknown destination'}
                                  </span>
                                </div>
                              ) : (
                                <span className="whitespace-nowrap">
                                  {transaction.account}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <p className="whitespace-nowrap text-sm text-[#46544A]">
                                {transaction.paymentMethod || '—'}
                              </p>

                              {transaction.paymentApp && (
                                <p className="mt-1 text-xs text-[#939C94]">
                                  {transaction.paymentApp}
                                </p>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold tabular-nums text-[#344238]">
                              <span className={getAmountColor(transaction)}>
                                {amountPrefix}
                                {formatAmount(transaction.amount)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionError('');
                                    setEditingTransaction(transaction);
                                  }}
                                  title="Edit transaction"
                                  aria-label="Edit transaction"
                                  className="rounded-md border border-[#E2E7E1] p-2 text-[#55765E] transition hover:bg-[#F3F6F2] hover:text-[#244735]"
                                >
                                  <Pencil size={15} />
                                </button>

                                {/* Delete - opens confirmation modal */}
                                <button
                                  type="button"
                                  onClick={() => handleRequestDelete(transaction)}
                                  disabled={actionBusyId === transaction.id}
                                  title="Delete transaction"
                                  aria-label="Delete transaction"
                                  className="rounded-md border border-red-100 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  {actionBusyId === transaction.id ? (
                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}

                {/* Empty state */}
                {!isLoading && filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <Search
                          size={26}
                          className="mb-3 text-[#A4ADA5]"
                        />

                        <p className="font-medium text-[#46544A]">
                          {transactions.length === 0
                            ? 'No transactions yet'
                            : 'No transactions found'}
                        </p>

                        <p className="mt-1 text-sm text-[#929B93]">
                          {transactions.length === 0
                            ? 'Your financial activities will appear here once you add transactions.'
                            : 'Try changing your search or filters.'}
                        </p>

                        {transactions.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => navigate('/finance')}
                            className="mt-4 text-sm font-semibold text-[#55765E] hover:text-[#244735]"
                          >
                            Go to Finance
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch('');
                              clearFilters();
                            }}
                            className="mt-4 text-sm font-semibold text-[#55765E] hover:text-[#244735]"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-[#EDF0EB] px-4 py-3 text-xs text-[#89928A] sm:px-5">
            {isLoading
              ? 'Loading transaction records...'
              : `Showing ${filteredTransactions.length} of ${transactions.length} transactions`}
          </div>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      {(isAddTransactionOpen || editingTransaction) && (
        <AddTransactionModal
          transactionId={editingTransaction?.id}
          initialData={
            editingTransaction
              ? getEditFormData(editingTransaction)
              : undefined
          }
          onClose={() => {
            setIsAddTransactionOpen(false);
            setEditingTransaction(null);
          }}
          onSave={async () => {
            setIsAddTransactionOpen(false);
            setEditingTransaction(null);
            await loadTransactions();
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {transactionToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-5"
          onClick={(event) => {
            // Close only when clicking the backdrop, not the dialog itself.
            if (
              event.target === event.currentTarget &&
              actionBusyId !== transactionToDelete.id
            ) {
              setTransactionToDelete(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            className="w-full max-w-sm rounded-2xl border border-[#E5E9E2] bg-white p-5 shadow-xl"
          >

            <h2
              id="delete-transaction-title"
              className="text-base font-semibold text-[#FF0000]"
            >
              Delete transaction?
            </h2>

            <p className="mt-1 text-sm text-[#68736B]">
              Are you sure you want to delete this transaction?
            </p>

            <div className="mt-3 rounded-lg bg-[#F7F8F5] px-3 py-2.5">
              <p className="truncate text-sm font-medium text-[#344238]">
                {transactionToDelete.description ||
                  transactionToDelete.category}
              </p>

              <p className="mt-1 text-sm font-semibold text-[#344238]">
                {formatAmount(transactionToDelete.amount)}
              </p>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#89928A]">
              This will remove it from active history and recalculate the account
              balance.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              {/* Cancel */}
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                disabled={actionBusyId === transactionToDelete.id}
                className="rounded-lg border border-[#E2E7E1] bg-white px-3.5 py-2 text-sm font-medium text-[#46544A] transition hover:bg-[#F5F7F4] disabled:opacity-50"
              >
                Cancel
              </button>

              {/* Confirm Delete */}
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={actionBusyId === transactionToDelete.id}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionBusyId === transactionToDelete.id ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}

                {actionBusyId === transactionToDelete.id
                  ? 'Deleting…'
                  : 'Delete transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsHistoryPage;
