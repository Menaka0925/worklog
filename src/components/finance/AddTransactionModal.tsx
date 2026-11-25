import React, { useEffect, useState } from 'react';
import { X, CalendarDays, IndianRupee } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export type FinanceTransactionType =
  | 'Income'
  | 'Expense'
  | 'Lending'
  | 'Borrowing'
  | 'Repayment'
  | 'Transfer'
  | 'Loan payment'
  | 'Reimbursement';

export type TransactionFormData = {
  amount: string;
  type: FinanceTransactionType;
  date: string;
  description: string;
  category: string;
  context: 'Personal' | 'Work';
  party: string;
  account: string; // Source account UUID
  destinationAccount: string; // Destination account UUID
  paymentMethod: string;
  paymentApp: string;
  notes: string;
  principalAmount: string;
  interestAmount: string;
};

type FinanceAccountOption = {
  id: string;
  name: string;
  account_type: string;
  balance_configured: boolean;
  is_archived: boolean;
};

type AddTransactionModalProps = {
  onClose: () => void;
  onSave: (data: TransactionFormData) => void;
};

const transactionTypes: FinanceTransactionType[] = [
  'Expense',
  'Income',
  'Lending',
  'Borrowing',
  'Repayment',
  'Transfer',
  'Loan payment',
  'Reimbursement',
];

const categoryOptions: Record<FinanceTransactionType, string[]> = {
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

const paymentMethods = [
  'Cash',
  'UPI',
  'Bank transfer',
  'Debit card',
];

const paymentApps = [
  'Google Pay',
  'PhonePe',
  'Paytm',
  'Other UPI app',
];

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialForm = (): TransactionFormData => ({
  amount: '',
  type: 'Expense',
  date: today(),
  description: '',
  category: '',
  context: 'Personal',
  party: '',
  account: '',
  destinationAccount: '',
  paymentMethod: 'UPI',
  paymentApp: 'Google Pay',
  notes: '',
  principalAmount: '',
  interestAmount: '',
});

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<TransactionFormData>(initialForm());
  const [accounts, setAccounts] = useState<FinanceAccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch real accounts from Supabase.
  useEffect(() => {
    const loadAccounts = async () => {
      if (!supabase) {
        setError('Supabase is not configured. Check your environment variables.');
        setAccountsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('finance_accounts')
        .select(
          'id, name, account_type, balance_configured, is_archived',
        )
        .eq('is_archived', false)
        .order('created_at', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setAccountsLoading(false);
        return;
      }

      const fetchedAccounts = (data ?? []) as FinanceAccountOption[];
      setAccounts(fetchedAccounts);

      const usableAccounts = fetchedAccounts.filter(
        (account) => account.balance_configured,
      );

      setForm((previous) => ({
        ...previous,
        account: previous.account || usableAccounts[0]?.id || '',
        destinationAccount:
          previous.destinationAccount ||
          usableAccounts.find((a) => a.id !== usableAccounts[0]?.id)?.id ||
          usableAccounts[0]?.id ||
          '',
      }));

      setAccountsLoading(false);
    };

    void loadAccounts();
  }, []);

  const updateField = <K extends keyof TransactionFormData>(
    field: K,
    value: TransactionFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError('');
  };

  const isTransfer = form.type === 'Transfer';
  const isUPI = form.paymentMethod === 'UPI';
  const isEMI = form.category === 'EMI Payment';
  const isLoanPayment = form.type === 'Loan payment';

  const configuredAccounts = accounts.filter(
    (account) => account.balance_configured && !account.is_archived,
  );

  const sourceAccount = accounts.find((account) => account.id === form.account);
  const destinationAccount = accounts.find(
    (account) => account.id === form.destinationAccount,
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }

    if (!form.description.trim() || !form.category) {
      setError('Description and category are required.');
      return;
    }

    if (!form.account) {
      setError('Please select an account.');
      return;
    }

    if (!sourceAccount?.balance_configured) {
      setError('The selected account balance has not been configured.');
      return;
    }

    if (isTransfer) {
      if (!form.destinationAccount) {
        setError('Please select a destination account.');
        return;
      }

      if (form.account === form.destinationAccount) {
        setError('Choose two different accounts for a transfer.');
        return;
      }

      if (!destinationAccount?.balance_configured) {
        setError('The destination account balance is not configured.');
        return;
      }
    }

    let principal: number | null = null;
    let interest: number | null = null;

    if (isEMI) {
      principal = Number(form.principalAmount);
      interest = Number(form.interestAmount);

      if (
        !Number.isFinite(principal) ||
        !Number.isFinite(interest) ||
        principal < 0 ||
        interest < 0 ||
        Math.round((principal + interest) * 100) !==
          Math.round(amount * 100)
      ) {
        setError('EMI principal and interest must add up to the total EMI amount.');
        return;
      }
    }

    if (form.paymentMethod !== 'UPI' && form.paymentApp) {
      // Payment apps should only be stored for UPI.
    }

    const payload: TransactionFormData = {
      ...form,
      amount: amount.toFixed(2),
      description: form.description.trim(),
      party: form.party.trim(),
      notes: form.notes.trim(),
      principalAmount: isEMI ? principal!.toFixed(2) : '',
      interestAmount: isEMI ? interest!.toFixed(2) : '',
    };

    setSaving(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'finance_create_transaction',
        {
          p_account_id: form.account,
          p_transaction_type: form.type,
          p_category: form.category,
          p_amount: amount,
          p_transaction_date: form.date,
          p_description: form.description.trim(),
          p_context: form.context,
          p_party: form.party.trim() || null,
          p_destination_account_id: isTransfer
            ? form.destinationAccount
            : null,
          p_payment_method: isTransfer ? 'Cash' : form.paymentMethod,
          p_payment_app:
            !isTransfer && isUPI ? form.paymentApp || null : null,
          p_notes: form.notes.trim() || null,
          p_principal_amount: isEMI ? principal : null,
          p_interest_amount: isEMI ? interest : null,
          p_charges_amount: 0,
        },
      );

      if (rpcError) {
        throw rpcError;
      }

      if (!data) {
        throw new Error('The database did not return a transaction ID.');
      }

      // RPC succeeded. Notify the parent so it can close/refresh.
      onSave(payload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save transaction.';

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[#E2E7E1] bg-white px-3 py-2.5 text-sm text-[#344238] outline-none transition placeholder:text-[#A2AAA3] focus:border-[#55765E] focus:ring-2 focus:ring-[#55765E]/10';

  const labelClass =
    'mb-1.5 block text-xs font-semibold text-[#68756B]';

  const sectionTitle =
    'mb-3 text-sm font-semibold text-[#2D4032]';

  const emiBreakdownTotal =
    Number(form.principalAmount || 0) +
    Number(form.interestAmount || 0);

  const emiBreakdownValid =
    form.principalAmount !== '' &&
    form.interestAmount !== '' &&
    Math.round(emiBreakdownTotal * 100) ===
      Math.round(Number(form.amount) * 100);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17251B]/45 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-transaction-title"
        className="flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-[#E6EAE4] bg-[#FCFDFC] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E9EDE7] px-5 py-4 sm:px-6">
          <div>
            <h2
              id="add-transaction-title"
              className="text-lg font-semibold text-[#24372A]"
            >
              Add Transaction
            </h2>
            <p className="mt-0.5 text-xs text-[#879188]">
              Record your income, expenses and other money activity.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-[#7B867D] transition hover:bg-[#F0F3EF] hover:text-[#344238] disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {/* Transaction details */}
            <section>
              <h3 className={sectionTitle}>Transaction details</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Transaction type *</label>
                  <select
                    value={form.type}
                    onChange={(event) => {
                      const type = event.target.value as FinanceTransactionType;
                      setForm((previous) => ({
                        ...previous,
                        type,
                        category: '',
                        principalAmount: '',
                        interestAmount: '',
                      }));
                    }}
                    className={inputClass}
                  >
                    {transactionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Amount (₹) *</label>
                  <div className="relative">
                    <IndianRupee
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C978E]"
                    />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={form.amount}
                      onChange={(event) => updateField('amount', event.target.value)}
                      placeholder="Enter amount"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Date *</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(event) => updateField('date', event.target.value)}
                      onClick={(event) => {
                        const input = event.currentTarget;
                        if (typeof input.showPicker === 'function') {
                          try {
                            input.showPicker();
                          } catch {
                            // Native date picker fallback.
                          }
                        }
                      }}
                      className={`${inputClass} cursor-pointer pr-10`}
                    />
                    <CalendarDays
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8C978E]"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Category *</label>
                  <select
                    required
                    value={form.category}
                    onChange={(event) => {
                      setForm((previous) => ({
                        ...previous,
                        category: event.target.value,
                        principalAmount: '',
                        interestAmount: '',
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    {categoryOptions[form.type].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  {form.type === 'Repayment' && (
                    <p className="mt-1.5 text-xs leading-5 text-[#879188]">
                      Received Repayment means someone returned money you lent.
                      Paid Repayment means you returned money you borrowed.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Description *</label>
                  <input
                    required
                    value={form.description}
                    onChange={(event) =>
                      updateField('description', event.target.value)
                    }
                    placeholder="e.g. Movie tickets, monthly salary, groceries..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* EMI breakdown */}
              {isEMI && (
                <div className="mt-4 rounded-xl border border-[#E2E7E1] bg-[#F5F7F3] p-4">
                  <h4 className="text-sm font-semibold text-[#2D4032]">
                    EMI breakdown
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-[#7B867D]">
                    Enter the principal and interest portions. Both must add up to
                    the EMI amount.
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Principal amount (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={form.principalAmount}
                        onChange={(event) =>
                          updateField('principalAmount', event.target.value)
                        }
                        placeholder="e.g. 4000"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Interest amount (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={form.interestAmount}
                        onChange={(event) =>
                          updateField('interestAmount', event.target.value)
                        }
                        placeholder="e.g. 1000"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#68756B]">Principal + Interest</span>
                    <span className="font-semibold text-[#344238]">
                      ₹{emiBreakdownTotal.toFixed(2)}
                    </span>
                  </div>

                  {form.amount && (
                    <p
                      className={`mt-2 text-xs ${
                        emiBreakdownValid ? 'text-[#386B47]' : 'text-red-600'
                      }`}
                    >
                      {emiBreakdownValid
                        ? 'EMI breakdown matches the total amount.'
                        : `The breakdown must equal ₹${Number(form.amount).toFixed(2)}.`}
                    </p>
                  )}
                </div>
              )}

              {isLoanPayment &&
                form.category === 'Loan Principal Payment' && (
                  <p className="mt-3 rounded-lg bg-[#F2F5F0] px-3 py-2 text-xs leading-5 text-[#68766A]">
                    This payment reduces your outstanding loan principal. It is not
                    counted as an ordinary expense.
                  </p>
                )}

              {isLoanPayment && form.category === 'Loan Interest' && (
                <p className="mt-3 rounded-lg bg-[#F2F5F0] px-3 py-2 text-xs leading-5 text-[#68766A]">
                  Interest paid is recorded as a financial expense.
                </p>
              )}
            </section>

            <div className="border-t border-[#EAEDE8]" />

            {/* Account and payment */}
            <section>
              <h3 className={sectionTitle}>Account and payment details</h3>

              {accountsLoading ? (
                <p className="text-sm text-gray-500">Loading your accounts...</p>
              ) : configuredAccounts.length === 0 ? (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  No configured accounts found. Please configure your account
                  balances in Finance before adding a transaction.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      {isTransfer ? 'From account *' : 'Account *'}
                    </label>
                    <select
                      required
                      value={form.account}
                      onChange={(event) =>
                        updateField('account', event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select account</option>
                      {configuredAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isTransfer ? (
                    <div>
                      <label className={labelClass}>To account *</label>
                      <select
                        required
                        value={form.destinationAccount}
                        onChange={(event) =>
                          updateField('destinationAccount', event.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Select destination</option>
                        {configuredAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className={labelClass}>Payment method *</label>
                      <select
                        value={form.paymentMethod}
                        onChange={(event) => {
                          const paymentMethod = event.target.value;
                          setForm((previous) => ({
                            ...previous,
                            paymentMethod,
                            paymentApp:
                              paymentMethod === 'UPI'
                                ? previous.paymentApp || 'Google Pay'
                                : '',
                          }));
                        }}
                        className={inputClass}
                      >
                        {paymentMethods.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isTransfer && isUPI && (
                    <div>
                      <label className={labelClass}>UPI app</label>
                      <select
                        value={form.paymentApp}
                        onChange={(event) =>
                          updateField('paymentApp', event.target.value)
                        }
                        className={inputClass}
                      >
                        {paymentApps.map((app) => (
                          <option key={app} value={app}>
                            {app}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {isTransfer && form.account === form.destinationAccount && (
                <p className="mt-2 text-xs text-red-600">
                  Choose two different accounts for a transfer.
                </p>
              )}

              {!isTransfer && (
                <p className="mt-3 rounded-lg bg-[#F2F5F0] px-3 py-2 text-xs leading-5 text-[#68766A]">
                  The account records where the money is held. The payment method
                  records how you paid. UPI linked to your bank will not create a
                  separate account balance.
                </p>
              )}
            </section>

            <div className="border-t border-[#EAEDE8]" />

            {/* People and context */}
            <section>
              <h3 className={sectionTitle}>People and context</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Person / Organisation</label>
                  <input
                    value={form.party}
                    onChange={(event) => updateField('party', event.target.value)}
                    placeholder="e.g. PVR Cinemas, Arun, Company"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Transaction context</label>
                  <select
                    value={form.context}
                    onChange={(event) =>
                      updateField(
                        'context',
                        event.target.value as 'Personal' | 'Work',
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <label className={labelClass}>Additional notes (optional)</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Add any additional details..."
                className={`${inputClass} resize-y`}
              />
            </section>

            {/* Backend errors */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-2 border-t border-[#E9EDE7] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#DDE3DC] px-5 py-2.5 text-sm font-medium text-[#59665C] transition hover:bg-[#F7F9F6] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                accountsLoading ||
                configuredAccounts.length === 0 ||
                !form.account ||
                (isTransfer &&
                  (!form.destinationAccount ||
                    form.account === form.destinationAccount)) ||
                (isEMI && !emiBreakdownValid)
              }
              className="rounded-lg bg-[#244735] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B3928] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;