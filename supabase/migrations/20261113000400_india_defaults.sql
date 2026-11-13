-- Clinic is based in Calicut (Kozhikode), Kerala: default to Indian time zone and currency.
alter table public.clinic_settings alter column timezone set default 'Asia/Kolkata';
alter table public.clinic_settings alter column currency set default 'INR';
