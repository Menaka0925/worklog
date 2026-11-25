import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddTransactionModal, {
  type TransactionFormData,
} from '../../components/finance/AddTransactionModal';
import { supabase } from '../../services/supabaseClient';
import {
  Wallet,
  Landmark,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Smartphone,
  Pencil,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

type FinanceAccountRow = {
  id: string;
  name: string;
  account_type: string;
  opening_balance: number;
  current_balance: number;
  balance_configured: boolean;
  payment_methods: string[];
  is_archived: boolean;
};

type FinanceTransactionRow = {
  id: string;
  account_id: string;
  destination_account_id: string | null;
  transaction_type: string;
  category: string;
  amount: number | string;
  principal_amount: number | string | null;
  interest_amount: number | string | null;
  charges_amount: number | string;
  transaction_date: string;
  description: string;
  party: string | null;
  context: string;
  payment_method: string;
  payment_app: string | null;
  notes: string | null;
};

type FinanceAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  balanceConfigured: boolean;
  received: number;
  spent: number;
  lent: number;
  borrowed: number;
  transferred: number;
  paymentMethods: string[];
  openingBalance: number;
  isArchived: boolean;
};

type FinanceTransaction = FinanceTransactionRow;


const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

const getCurrentMonth = () =>
  new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

const getMonthStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

const mapAccount = (row: FinanceAccountRow): FinanceAccount => ({
  id: row.id,
  name: row.name,
  type: row.account_type,
  balance: toNumber(row.current_balance),
  balanceConfigured: row.balance_configured,
  received: 0,
  spent: 0,
  lent: 0,
  borrowed: 0,
  transferred: 0,
  paymentMethods: row.payment_methods ?? [],
  openingBalance: toNumber(row.opening_balance),
  isArchived: row.is_archived,
});

export default function FinanceOverviewPage() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isAddTransactionOpen, setIsAddTransactionOpen] =
    useState(false);

  const [isAddAccountOpen, setIsAddAccountOpen] =
    useState(false);

  const [editingAccount, setEditingAccount] =
    useState<FinanceAccount | null>(null);

  const [editedBalance, setEditedBalance] = useState('');

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');


  const loadFinanceData = useCallback(async () => {
    if (!supabase) {
      setError(
        'Supabase is not configured. Check your environment variables.',
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch all accounts belonging to the authenticated user.
      // RLS restricts the returned rows to the current user.
      const { data: accountData, error: accountError } = await supabase
        .from('finance_accounts')
        .select(
          'id, name, account_type, opening_balance, current_balance, balance_configured, payment_methods, is_archived',
        )
        .order('created_at', { ascending: true });

      if (accountError) throw accountError;

      // Fetch active ledger transactions.
      const { data: transactionData, error: transactionError } =
        await supabase
          .from('finance_transactions')
          .select(
            'id, account_id, destination_account_id, transaction_type, category, amount, principal_amount, interest_amount, charges_amount, transaction_date, description, party, context, payment_method, payment_app, notes',
          )
          .is('deleted_at', null)
          .order('transaction_date', { ascending: false });

      if (transactionError) throw transactionError;

      const dbAccounts = (accountData ?? []) as FinanceAccountRow[];
      const dbTransactions = (transactionData ?? []) as FinanceTransaction[];

      const mappedAccounts = dbAccounts.map(mapAccount);

      // Calculate account activity metrics for the current month.
      const monthStart = getMonthStart();

      const currentMonthTransactions = dbTransactions.filter(
        (transaction) => transaction.transaction_date >= monthStart,
      );

      for (const account of mappedAccounts) {
        const accountTransactions = currentMonthTransactions.filter(
          (transaction) =>
            transaction.account_id === account.id ||
            transaction.destination_account_id === account.id,
        );

        for (const transaction of accountTransactions) {
          const amount = toNumber(transaction.amount);
          const isSource = transaction.account_id === account.id;
          const isDestination =
            transaction.destination_account_id === account.id;

          if (transaction.transaction_type === 'Transfer') {
            account.transferred += amount;
            continue;
          }

          if (!isSource) continue;

          switch (transaction.transaction_type) {
            case 'Income':
            case 'Borrowing':
            case 'Reimbursement':
              account.received += amount;
              break;

            case 'Expense':
            case 'Loan payment':
              account.spent += amount;
              break;

            case 'Lending':
              account.lent += amount;
              break;

            case 'Repayment':
              if (transaction.category === 'Received Repayment') {
                account.received += amount;
              } else {
                account.spent += amount;
              }
              break;
          }
        }
      }

      setAccounts(mappedAccounts);
      setTransactions(dbTransactions);
    } catch (err) {
      console.error('Finance data loading error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load Finance data.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinanceData();
  }, [loadFinanceData]);


  const cashAccount = accounts.find(
    (account) =>
      account.type === 'Physical cash' ||
      account.name.toUpperCase() === 'CASH',
  );

  const bankAccounts = accounts.filter(
    (account) =>
      account.id !== cashAccount?.id &&
      account.type === 'Bank account' &&
      !account.isArchived,
  );

  const activeAccounts = accounts.filter(
    (account) => !account.isArchived,
  );

  const cashBalanceConfigured =
    cashAccount?.balanceConfigured === true;

  const bankBalancesConfigured =
    bankAccounts.length > 0 &&
    bankAccounts.every((account) => account.balanceConfigured);

  const canAddTransaction =
    cashBalanceConfigured && bankBalancesConfigured;

  const getBalanceSetupMessage = () => {
    if (!cashBalanceConfigured && bankAccounts.length === 0) {
      return 'Please enter your Cash balance and add at least one bank account with its available balance before adding transactions.';
    }

    if (!cashBalanceConfigured) {
      return 'Please enter your Cash available balance before adding transactions.';
    }

    if (bankAccounts.length === 0) {
      return 'Please add at least one bank account and enter its available balance before adding transactions.';
    }

    if (!bankBalancesConfigured) {
      return 'Please enter the available balance for all your bank accounts before adding transactions.';
    }

    return '';
  };


  const monthTransactions = useMemo(() => {
    const monthStart = getMonthStart();

    return transactions.filter(
      (transaction) => transaction.transaction_date >= monthStart,
    );
  }, [transactions]);

  const totalBalance = activeAccounts.reduce(
    (total, account) => total + account.balance,
    0,
  );

  // Income and reimbursement are separate types in the database.
  // Borrowing is not income.
  const totalIncome = monthTransactions.reduce((total, transaction) => {
    if (transaction.transaction_type === 'Income') {
      return total + toNumber(transaction.amount);
    }

    return total;
  }, 0);

  // Expense + loan interest/charges are included here as cash outflows.
  // Lending is not counted as an expense.
  const totalExpenses = monthTransactions.reduce((total, transaction) => {
    if (
      transaction.transaction_type === 'Expense' ||
      transaction.transaction_type === 'Loan payment'
    ) {
      return total + toNumber(transaction.amount);
    }

    if (
      transaction.transaction_type === 'Repayment' &&
      transaction.category === 'Paid Repayment'
    ) {
      return total + toNumber(transaction.amount);
    }

    return total;
  }, 0);


  const handleEditAccount = (account: FinanceAccount) => {
    setError('');
    setSuccessMessage('');
    setEditingAccount(account);
    setEditedBalance(String(account.openingBalance));
  };

  const handleUpdateBalance = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!supabase || !editingAccount) return;

    const balance = Number(editedBalance);

    if (!Number.isFinite(balance) || balance < 0) {
      setError('Enter a valid balance of zero or greater.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error: rpcError } = await supabase.rpc(
        'finance_set_initial_balance',
        {
          p_account_id: editingAccount.id,
          p_balance: balance,
        },
      );

      if (rpcError) throw rpcError;

      setEditingAccount(null);
      setEditedBalance('');

      await loadFinanceData();

      setSuccessMessage('Initial balance saved successfully.');
    } catch (err) {
      console.error('Balance update error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update balance.',
      );
    } finally {
      setSaving(false);
    }
  };


  const handleAddAccount = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!supabase) return;

    const name = newAccountName.trim();
    const balance = Number(newAccountBalance);

    if (!name || !Number.isFinite(balance) || balance < 0) {
      setError('Enter a valid account name and balance.');
      return;
    }

    const accountExists = accounts.some(
      (account) => account.name.toLowerCase() === name.toLowerCase(),
    );

    if (accountExists) {
      setError('An account with this name already exists.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // The SQL function creates the account with a UUID.
      // It also sets the opening and current balances.
      const { error: rpcError } = await supabase.rpc(
        'finance_create_account',
        {
          p_name: name,
          p_initial_balance: balance,
          p_account_type: 'Bank account',
        },
      );

      if (rpcError) throw rpcError;

      setNewAccountName('');
      setNewAccountBalance('');
      setIsAddAccountOpen(false);

      await loadFinanceData();

      setSuccessMessage('Account added successfully.');
    } catch (err) {
      console.error('Account creation error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create account.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTransaction = async (
    _data: TransactionFormData,
  ) => {
    setError('');
    setSuccessMessage('');

    setIsAddTransactionOpen(false);

    await loadFinanceData();

    setSuccessMessage('Transaction saved successfully.');
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#54715E]">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Loading Finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#244735]">
            Finance
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your money, accounts and financial activities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadFinanceData()}
          disabled={loading}
          title="Refresh finance data"
          className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 transition hover:bg-[#F5F3E9] hover:text-[#244735] disabled:opacity-50"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
            className="shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Main balance */}
      <section className="rounded-2xl bg-[#244735] p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-white/70">
              Total available balance
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {formatCurrency(totalBalance)}
            </h2>

            <p className="mt-2 text-xs text-white/60">
              Across {activeAccounts.length} active accounts
            </p>
          </div>

          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white">
            {getCurrentMonth()}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ArrowDownLeft size={16} />
              Income this month
            </div>

            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ArrowUpRight size={16} />
              Expenses this month
            </div>

            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </section>

      {/* Finance Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/finance/history')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-[#244735] transition hover:bg-[#F5F3E9]"
          >
            <History size={17} />
            History
          </button>

          <button
            type="button"
            onClick={() => {
              if (canAddTransaction) {
                setIsAddTransactionOpen(true);
              }
            }}
            disabled={!canAddTransaction}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#244735] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b3628] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={17} />
            Add transaction
          </button>
        </div>

        {!canAddTransaction && (
          <p className="text-xs text-amber-700">
            {getBalanceSetupMessage()}
          </p>
        )}
      </div>

      {/* Accounts */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              My accounts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track money movement across your accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError('');
              setIsAddAccountOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#244735]/20 bg-white px-4 py-2.5 text-sm font-medium text-[#244735] transition hover:bg-[#F5F3E9]"
          >
            <Plus size={17} />
            Add account
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {activeAccounts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No accounts found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeAccounts.map((account) => {
                const Icon =
                  account.type === 'Physical cash' ? Wallet : Landmark;

                return (
                  <div key={account.id} className="p-4 sm:p-5">
                    {/* Account header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-[#F5F3E9] p-2.5 text-[#244735]">
                          <Icon size={21} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold uppercase text-gray-800">
                            {account.name}
                          </h3>

                          <p className="text-xs text-gray-500">
                            {account.type}
                          </p>

                          {account.paymentMethods.length > 0 && (
                            <p className="mt-1 text-xs text-[#54715E]">
                              Linked methods:{' '}
                              {account.paymentMethods.join(' · ')}
                            </p>
                          )}

                          {!account.balanceConfigured && (
                            <p className="mt-1 text-xs text-amber-700">
                              Initial balance not set
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Available balance
                          </p>

                          <p className="mt-1 text-lg font-semibold text-[#244735]">
                            {formatCurrency(account.balance)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEditAccount(account)}
                          title={`Edit ${account.name} initial balance`}
                          aria-label={`Edit ${account.name} initial balance`}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-[#244735]/30 hover:bg-[#F5F3E9] hover:text-[#244735]"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Account activity metrics */}
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
                      <AccountMetric
                        label="Received"
                        amount={account.received}
                        color="text-green-700"
                      />

                      <AccountMetric
                        label="Spent"
                        amount={account.spent}
                        color="text-gray-800"
                      />

                      <AccountMetric
                        label="Lent"
                        amount={account.lent}
                        color="text-gray-800"
                      />

                      <AccountMetric
                        label="Borrowed"
                        amount={account.borrowed}
                        color="text-gray-800"
                      />

                      <AccountMetric
                        label="Transfers"
                        amount={account.transferred}
                        color="text-gray-800"
                      />

                      <AccountMetric
                        label="Balance"
                        amount={account.balance}
                        color="text-[#244735]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment method note */}
        <div className="flex items-start gap-2 rounded-lg bg-[#F5F3E9] p-3 text-xs text-[#54715E]">
          <Smartphone size={16} className="mt-0.5 shrink-0" />

          <p>
            UPI is tracked as a payment method linked to your bank
            account, not as an additional account balance. You can
            select the bank account used for each UPI payment.
          </p>
        </div>
      </section>

      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#244735]">
                  Add bank account
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter an account name and its current balance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-account-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Account name
                </label>

                <input
                  id="new-account-name"
                  type="text"
                  required
                  autoFocus
                  maxLength={60}
                  value={newAccountName}
                  onChange={(event) => setNewAccountName(event.target.value)}
                  placeholder="e.g. SBI Savings, Canara Bank"
                  className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 outline-none transition focus:border-[#244735] focus:ring-2 focus:ring-[#244735]/10"
                />

                {accounts.some(
                  (account) =>
                    account.name.toLowerCase() ===
                    newAccountName.trim().toLowerCase(),
                ) && (
                  <p className="mt-1.5 text-xs text-red-600">
                    An account with this name already exists.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="new-account-balance"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Available balance
                </label>

                <div className="flex items-center rounded-lg border border-gray-200 px-3 focus-within:border-[#244735] focus-within:ring-2 focus-within:ring-[#244735]/10">
                  <span className="text-sm text-gray-500">₹</span>

                  <input
                    id="new-account-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newAccountBalance}
                    onChange={(event) => setNewAccountBalance(event.target.value)}
                    placeholder="Enter available balance"
                    className="w-full border-0 bg-transparent px-2 py-3 text-sm text-gray-800 outline-none focus:ring-0"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddAccountOpen(false);
                    setNewAccountName('');
                    setNewAccountBalance('');
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !newAccountName.trim() ||
                    !newAccountBalance.trim() ||
                    Number(newAccountBalance) < 0 ||
                    accounts.some(
                      (account) =>
                        account.name.toLowerCase() ===
                        newAccountName.trim().toLowerCase(),
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[#244735] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b3628] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Add account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#244735]">
                  Edit {editingAccount.name}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Set the initial balance for this account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBalance} className="mt-6">
              <label
                htmlFor="account-balance"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Initial balance
              </label>

              <div className="flex items-center rounded-lg border border-gray-200 px-3 focus-within:border-[#244735] focus-within:ring-2 focus-within:ring-[#244735]/10">
                <span className="text-sm text-gray-500">₹</span>

                <input
                  id="account-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  autoFocus
                  value={editedBalance}
                  onChange={(event) => setEditedBalance(event.target.value)}
                  placeholder="Enter initial balance"
                  className="w-full border-0 bg-transparent px-2 py-3 text-sm text-gray-800 outline-none focus:ring-0"
                />
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <p className="mt-3 text-xs leading-5 text-gray-500">
                You can only change the initial balance if the account
                has no transaction history. Once transactions exist, the
                balance is maintained by the ledger.
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !editedBalance.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#244735] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b3628] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddTransactionOpen && (
        <AddTransactionModal
          onClose={() => setIsAddTransactionOpen(false)}
          onSave={handleSaveTransaction}
        />
      )}
    </div>
  );
}

function AccountMetric({
  label,
  amount,
  color,
}: {
  label: string;
  amount: number;
  color: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>

      <p className={`mt-1 truncate text-sm font-semibold ${color}`}>
        {formatCurrency(amount)}
      </p>
  </div>
  );
}