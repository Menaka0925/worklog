begin;


-- 1) Accounts --------------------------------------------------
create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  account_type text not null default 'Bank account',
  opening_balance numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  balance_configured boolean not null default false,
  payment_methods text[] not null default '{}',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_accounts_name_check check (length(trim(name)) > 0),
  constraint finance_accounts_type_check check (account_type in ('Physical cash','Bank account')),
  constraint finance_accounts_opening_check check (opening_balance >= 0),
  constraint finance_accounts_balance_check check (current_balance >= 0),
  constraint finance_accounts_methods_check check (payment_methods <@ array['Cash','UPI','Bank transfer','Debit card']::text[]),
  constraint finance_accounts_id_user_uq unique (id,user_id)
);
create unique index if not exists finance_accounts_user_name_uq
  on public.finance_accounts(user_id, lower(name));
create index if not exists finance_accounts_user_idx on public.finance_accounts(user_id);


-- 2) Transactions ------------------------------------------------
create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  destination_account_id uuid,
  transaction_type text not null,
  category text not null,
  amount numeric(14,2) not null,
  principal_amount numeric(14,2),
  interest_amount numeric(14,2),
  charges_amount numeric(14,2) not null default 0,
  transaction_date date not null default current_date,
  description text not null,
  party text,
  context text not null default 'Personal',
  payment_method text not null default 'Cash',
  payment_app text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint finance_tx_source_owner_fk foreign key (account_id,user_id)
    references public.finance_accounts(id,user_id),
  constraint finance_tx_destination_owner_fk foreign key (destination_account_id,user_id)
    references public.finance_accounts(id,user_id),
  constraint finance_tx_type_check check (transaction_type in ('Income','Expense','Lending','Borrowing','Repayment','Transfer','Loan payment','Reimbursement')),
  constraint finance_tx_category_check check (length(trim(category)) > 0),
  constraint finance_tx_amount_check check (amount > 0),
  constraint finance_tx_breakdown_check check (
    (principal_amount is null or principal_amount >= 0) and
    (interest_amount is null or interest_amount >= 0) and charges_amount >= 0
  ),
  constraint finance_tx_context_check check (context in ('Personal','Work')),
  constraint finance_tx_method_check check (payment_method in ('Cash','UPI','Bank transfer','Debit card')),
  constraint finance_tx_transfer_check check (
    (transaction_type='Transfer' and destination_account_id is not null and destination_account_id<>account_id)
    or (transaction_type<>'Transfer' and destination_account_id is null)
  ),
  constraint finance_tx_description_check check (length(trim(description)) > 0),
  constraint finance_tx_payment_app_check check (payment_app is null or payment_method='UPI'),
  constraint finance_tx_emi_check check (
    category <> 'EMI Payment' or
    (principal_amount is not null and interest_amount is not null and principal_amount+interest_amount=amount)
  )
);
create index if not exists finance_tx_user_idx on public.finance_transactions(user_id);
create index if not exists finance_tx_date_idx on public.finance_transactions(user_id,transaction_date desc) where deleted_at is null;
create index if not exists finance_tx_type_idx on public.finance_transactions(user_id,transaction_type) where deleted_at is null;
create index if not exists finance_tx_category_idx on public.finance_transactions(user_id,category) where deleted_at is null;
create index if not exists finance_tx_account_idx on public.finance_transactions(user_id,account_id) where deleted_at is null;


-- 3) Common updated_at trigger ---------------------------------
create or replace function public.finance_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists finance_accounts_updated_at on public.finance_accounts;
create trigger finance_accounts_updated_at before update on public.finance_accounts
for each row execute function public.finance_set_updated_at();
drop trigger if exists finance_transactions_updated_at on public.finance_transactions;
create trigger finance_transactions_updated_at before update on public.finance_transactions
for each row execute function public.finance_set_updated_at();


-- 4) Recalculate account balance from active ledger records ------
-- This makes edits/deletions reverse old effects and apply new effects
-- automatically. Transfers debit one account and credit the other.
create or replace function public.finance_recalculate_account(p_account_id uuid,p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_balance numeric(14,2);
begin
  select a.opening_balance + coalesce(sum(
    case
      when t.transaction_type='Transfer' and t.account_id=a.id then -t.amount
      when t.transaction_type='Transfer' and t.destination_account_id=a.id then t.amount
      when t.account_id=a.id and t.transaction_type in ('Income','Borrowing','Reimbursement') then t.amount
      when t.account_id=a.id and t.transaction_type='Repayment' and t.category='Received Repayment' then t.amount
      when t.account_id=a.id and t.transaction_type in ('Expense','Lending','Loan payment') then -t.amount
      when t.account_id=a.id and t.transaction_type='Repayment' then -t.amount
      else 0
    end
  ),0)
  into v_balance
  from public.finance_accounts a
  left join public.finance_transactions t
    on t.user_id=a.user_id and t.deleted_at is null
    and (t.account_id=a.id or t.destination_account_id=a.id)
  where a.id=p_account_id and a.user_id=p_user_id
  group by a.id,a.opening_balance;

  if v_balance is null then raise exception 'Account not found'; end if;
  if v_balance < 0 then raise exception 'This change would make the account balance negative'; end if;
  update public.finance_accounts
  set current_balance=v_balance
  where id=p_account_id and user_id=p_user_id;
end;
$$;


-- 5) Ledger trigger recalculates affected account balances --------
create or replace function public.finance_ledger_recalculate_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='INSERT' then
    perform public.finance_recalculate_account(new.account_id,new.user_id);
    if new.destination_account_id is not null then
      perform public.finance_recalculate_account(new.destination_account_id,new.user_id);
    end if;
    return new;
  elsif tg_op='DELETE' then
    perform public.finance_recalculate_account(old.account_id,old.user_id);
    if old.destination_account_id is not null then
      perform public.finance_recalculate_account(old.destination_account_id,old.user_id);
    end if;
    return old;
  else
    -- Recalculate all accounts affected by either the old or new version.
    perform public.finance_recalculate_account(old.account_id,old.user_id);
    if old.destination_account_id is not null then
      perform public.finance_recalculate_account(old.destination_account_id,old.user_id);
    end if;
    if new.account_id is distinct from old.account_id then
      perform public.finance_recalculate_account(new.account_id,new.user_id);
    end if;
    if new.destination_account_id is distinct from old.destination_account_id and new.destination_account_id is not null then
      perform public.finance_recalculate_account(new.destination_account_id,new.user_id);
    end if;
    return new;
  end if;
end;
$$;
drop trigger if exists finance_tx_balance_trigger on public.finance_transactions;
create trigger finance_tx_balance_trigger after insert or update or delete on public.finance_transactions
for each row execute function public.finance_ledger_recalculate_trigger();


-- 6) CASH account creation for new and existing users ------------
create or replace function public.finance_create_default_cash_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.finance_accounts(user_id,name,account_type,opening_balance,current_balance,balance_configured,payment_methods)
  values (new.id,'CASH','Physical cash',0,0,false,array['Cash'])
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists finance_create_cash_after_signup on auth.users;
create trigger finance_create_cash_after_signup after insert on auth.users
for each row execute function public.finance_create_default_cash_account();
insert into public.finance_accounts(user_id,name,account_type,opening_balance,current_balance,balance_configured,payment_methods)
select u.id,'CASH','Physical cash',0,0,false,array['Cash']
from auth.users u
where not exists (select 1 from public.finance_accounts a where a.user_id=u.id and lower(a.name)='cash');


-- 7) Create account ---------------------------------------------
create or replace function public.finance_create_account(p_name text,p_initial_balance numeric,p_account_type text default 'Bank account')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_id uuid; v_name text := trim(coalesce(p_name,''));
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if v_name='' then raise exception 'Account name is required'; end if;
  if p_initial_balance is null or p_initial_balance<0 then raise exception 'Initial balance must be zero or greater'; end if;
  if p_account_type not in ('Bank account','Physical cash') then raise exception 'Invalid account type'; end if;
  insert into public.finance_accounts(user_id,name,account_type,opening_balance,current_balance,balance_configured,payment_methods)
  values(v_uid,upper(v_name),p_account_type,p_initial_balance,p_initial_balance,true,
    case when p_account_type='Physical cash' then array['Cash'] else array['UPI','Bank transfer','Debit card'] end)
  returning id into v_id;
  return v_id;
end;
$$;


-- 8) Edit account name / supported payment methods ----------------
create or replace function public.finance_update_account(p_account_id uuid,p_name text,p_payment_methods text[] default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_name text:=upper(trim(coalesce(p_name,''))); v_methods text[];
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if v_name='' then raise exception 'Account name is required'; end if;
  if p_payment_methods is not null and not (p_payment_methods <@ array['Cash','UPI','Bank transfer','Debit card']::text[]) then
    raise exception 'Invalid payment method';
  end if;
  update public.finance_accounts
  set name=v_name,payment_methods=coalesce(p_payment_methods,payment_methods)
  where id=p_account_id and user_id=v_uid and is_archived=false;
  if not found then raise exception 'Active account not found'; end if;
end;
$$;


-- 9) Set opening balance only when no active ledger activity exists ---
create or replace function public.finance_set_initial_balance(p_account_id uuid,p_balance numeric)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_balance is null or p_balance<0 then raise exception 'Balance must be zero or greater'; end if;
  if exists(select 1 from public.finance_transactions t where t.user_id=v_uid and t.deleted_at is null and (t.account_id=p_account_id or t.destination_account_id=p_account_id)) then
    raise exception 'Account has ledger activity. Use a balance adjustment transaction instead.';
  end if;
  update public.finance_accounts set opening_balance=p_balance,balance_configured=true
  where id=p_account_id and user_id=v_uid and is_archived=false;
  if not found then raise exception 'Account not found'; end if;
  perform public.finance_recalculate_account(p_account_id,v_uid);
end;
$$;


-- 10) Archive an account (preserves its history) ----------------
create or replace function public.finance_archive_account(p_account_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if lower((select name from public.finance_accounts where id=p_account_id and user_id=v_uid))='cash' then
    raise exception 'The CASH account cannot be archived';
  end if;
  update public.finance_accounts set is_archived=true
  where id=p_account_id and user_id=v_uid and is_archived=false;
  if not found then raise exception 'Account not found or already archived'; end if;
end;
$$;


-- 11) Create transaction -----------------------------------------
create or replace function public.finance_create_transaction(
  p_account_id uuid,p_transaction_type text,p_category text,p_amount numeric,
  p_transaction_date date default current_date,p_description text default null,
  p_context text default 'Personal',p_party text default null,p_destination_account_id uuid default null,
  p_payment_method text default 'Cash',p_payment_app text default null,p_notes text default null,
  p_principal_amount numeric default null,p_interest_amount numeric default null,p_charges_amount numeric default 0
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_id uuid; v_src_balance numeric;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'Amount must be greater than zero'; end if;
  if trim(coalesce(p_description,''))='' or trim(coalesce(p_category,''))='' then raise exception 'Description and category are required'; end if;
  if p_transaction_type not in ('Income','Expense','Lending','Borrowing','Repayment','Transfer','Loan payment','Reimbursement') then raise exception 'Invalid transaction type'; end if;
  if p_context not in ('Personal','Work') then raise exception 'Invalid context'; end if;
  if p_payment_method not in ('Cash','UPI','Bank transfer','Debit card') then raise exception 'Invalid payment method'; end if;
  if coalesce(p_charges_amount,0)<0 or coalesce(p_principal_amount,0)<0 or coalesce(p_interest_amount,0)<0 then raise exception 'Breakdown amounts cannot be negative'; end if;
  if p_category='EMI Payment' and (p_principal_amount is null or p_interest_amount is null or p_principal_amount+p_interest_amount<>p_amount) then raise exception 'EMI principal and interest must equal amount'; end if;
  if p_payment_method<>'UPI' and nullif(trim(coalesce(p_payment_app,'')),'') is not null then raise exception 'Payment app is only valid for UPI'; end if;

  select current_balance into v_src_balance from public.finance_accounts
  where id=p_account_id and user_id=v_uid and is_archived=false and balance_configured=true for update;
  if not found then raise exception 'Source account not found or balance not configured'; end if;
  if p_transaction_type='Transfer' then
    if p_destination_account_id is null or p_destination_account_id=p_account_id then raise exception 'Choose a different destination account'; end if;
    perform 1 from public.finance_accounts where id=p_destination_account_id and user_id=v_uid and is_archived=false and balance_configured=true for update;
    if not found then raise exception 'Destination account not found or balance not configured'; end if;
  elsif p_destination_account_id is not null then raise exception 'Destination account is only valid for transfers'; end if;

  insert into public.finance_transactions(user_id,account_id,destination_account_id,transaction_type,category,amount,
    principal_amount,interest_amount,charges_amount,transaction_date,description,party,context,payment_method,payment_app,notes)
  values(v_uid,p_account_id,case when p_transaction_type='Transfer' then p_destination_account_id else null end,
    p_transaction_type,trim(p_category),p_amount,p_principal_amount,p_interest_amount,coalesce(p_charges_amount,0),coalesce(p_transaction_date,current_date),trim(p_description),
    nullif(trim(coalesce(p_party,'')),''),p_context,p_payment_method,
    case when p_payment_method='UPI' then nullif(trim(coalesce(p_payment_app,'')),'') else null end,
    nullif(trim(coalesce(p_notes,'')),'')) returning id into v_id;
  return v_id;
end;
$$;


-- 12) Edit transaction (trigger recalculates/reverses old and applies new) --
create or replace function public.finance_update_transaction(
  p_transaction_id uuid,p_account_id uuid,p_transaction_type text,p_category text,p_amount numeric,
  p_transaction_date date,p_description text,p_context text,p_party text,p_destination_account_id uuid,
  p_payment_method text,p_payment_app text,p_notes text,p_principal_amount numeric,p_interest_amount numeric,p_charges_amount numeric default 0
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'Amount must be greater than zero'; end if;
  if trim(coalesce(p_description,''))='' or trim(coalesce(p_category,''))='' then raise exception 'Description and category are required'; end if;
  if p_transaction_type not in ('Income','Expense','Lending','Borrowing','Repayment','Transfer','Loan payment','Reimbursement') then raise exception 'Invalid transaction type'; end if;
  if p_context not in ('Personal','Work') then raise exception 'Invalid context'; end if;
  if p_payment_method not in ('Cash','UPI','Bank transfer','Debit card') then raise exception 'Invalid payment method'; end if;
  if coalesce(p_charges_amount,0)<0 or coalesce(p_principal_amount,0)<0 or coalesce(p_interest_amount,0)<0 then raise exception 'Breakdown amounts cannot be negative'; end if;
  if p_category='EMI Payment' and (p_principal_amount is null or p_interest_amount is null or p_principal_amount+p_interest_amount<>p_amount) then raise exception 'EMI principal and interest must equal amount'; end if;
  if (p_transaction_type='Transfer' and (p_destination_account_id is null or p_destination_account_id=p_account_id)) or (p_transaction_type<>'Transfer' and p_destination_account_id is not null) then raise exception 'Invalid transfer accounts'; end if;
  update public.finance_transactions set account_id=p_account_id,destination_account_id=case when p_transaction_type='Transfer' then p_destination_account_id else null end,
    transaction_type=p_transaction_type,category=trim(p_category),amount=p_amount,principal_amount=p_principal_amount,interest_amount=p_interest_amount,
    charges_amount=coalesce(p_charges_amount,0),transaction_date=p_transaction_date,description=trim(p_description),party=nullif(trim(coalesce(p_party,'')),''),
    context=p_context,payment_method=p_payment_method,payment_app=case when p_payment_method='UPI' then nullif(trim(coalesce(p_payment_app,'')),'') else null end,
    notes=nullif(trim(coalesce(p_notes,'')), '')
  where id=p_transaction_id and user_id=v_uid and deleted_at is null;
  if not found then raise exception 'Transaction not found'; end if;
end;
$$;


-- 13) Soft-delete transaction -----------------------------------
create or replace function public.finance_delete_transaction(p_transaction_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  update public.finance_transactions set deleted_at=now()
  where id=p_transaction_id and user_id=v_uid and deleted_at is null;
  if not found then raise exception 'Transaction not found'; end if;
end;
$$;


-- 14) RLS: users may only read their own rows ------------------
alter table public.finance_accounts enable row level security;
alter table public.finance_transactions enable row level security;
drop policy if exists finance_accounts_select_own on public.finance_accounts;
create policy finance_accounts_select_own on public.finance_accounts for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists finance_transactions_select_own on public.finance_transactions;
create policy finance_transactions_select_own on public.finance_transactions for select to authenticated using (user_id=(select auth.uid()) and deleted_at is null);


-- 15) Lock down direct table writes; client writes only via RPCs --
revoke all on public.finance_accounts from anon,authenticated;
revoke all on public.finance_transactions from anon,authenticated;
grant select on public.finance_accounts,public.finance_transactions to authenticated;

-- Remove default/public execution from RPCs and grant only authenticated users.
revoke all on function public.finance_create_account(text,numeric,text) from public,anon;
revoke all on function public.finance_update_account(uuid,text,text[]) from public,anon;
revoke all on function public.finance_set_initial_balance(uuid,numeric) from public,anon;
revoke all on function public.finance_archive_account(uuid) from public,anon;
revoke all on function public.finance_create_transaction(uuid,text,text,numeric,date,text,text,text,uuid,text,text,text,numeric,numeric,numeric) from public,anon;
revoke all on function public.finance_update_transaction(uuid,uuid,text,text,numeric,date,text,text,text,uuid,text,text,text,numeric,numeric,numeric) from public,anon;
revoke all on function public.finance_delete_transaction(uuid) from public,anon;
grant execute on function public.finance_create_account(text,numeric,text) to authenticated;
grant execute on function public.finance_update_account(uuid,text,text[]) to authenticated;
grant execute on function public.finance_set_initial_balance(uuid,numeric) to authenticated;
grant execute on function public.finance_archive_account(uuid) to authenticated;
grant execute on function public.finance_create_transaction(uuid,text,text,numeric,date,text,text,text,uuid,text,text,text,numeric,numeric,numeric) to authenticated;
grant execute on function public.finance_update_transaction(uuid,uuid,text,text,numeric,date,text,text,text,uuid,text,text,text,numeric,numeric,numeric) to authenticated;
grant execute on function public.finance_delete_transaction(uuid) to authenticated;

commit;
