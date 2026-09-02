-- Revize edilen sözleşmeler için eski imzaları temizler.
--
-- request_revision() bir sözleşmeyi REVISION_REQUESTED durumuna alır ancak
-- freelancer resubmit_contract() ile değişiklikleri onaylayıp geri gönderdiğinde
-- daha önce atılmış olan (ör. sadece bir tarafın attığı) imzalar kalıyordu.
-- Belge değiştiği için bu imzalar geçersiz olmalıdır.
--
-- Bu migration, resubmit_contract fonksiyonunu güncelleyerek yeniden gönderim
-- sırasında mevcut tüm imzaların silinmesini sağlar.

create or replace function public.resubmit_contract(p_contract_id uuid)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract public.contracts;
  v_uid uuid := auth.uid();
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'contract % not found', p_contract_id using errcode = 'no_data_found';
  end if;

  if v_contract.freelancer_id <> v_uid then
    raise exception 'only the freelancer may resubmit a contract'
      using errcode = 'insufficient_privilege';
  end if;

  if v_contract.status <> 'REVISION_REQUESTED' then
    raise exception 'contract % is not awaiting resubmission (status %)', p_contract_id, v_contract.status
      using errcode = 'check_violation';
  end if;

  -- Sözleşme değiştiği için eski imzaların bir geçerliliği kalmaz.
  delete from public.contract_signatures where contract_id = p_contract_id;

  update public.contracts
  set status = 'PENDING_REVIEW',
      -- Yeni bir belge oluşacağı için eski hash geçersiz
      document_sha256 = null
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;
