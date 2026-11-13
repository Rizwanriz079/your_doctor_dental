-- =====================================================================
-- LOCAL DEVELOPMENT SEED ONLY.
-- Demo doctors/services so the UI can be exercised. Replace with the
-- clinic's real data through the admin dashboard before going live.
-- No testimonials or statistics are seeded: only publish verified ones.
-- =====================================================================

insert into public.clinic_settings (id, clinic_name, tagline, phone, email, address, map_url, map_embed_url,
  timezone, currency, opening_hours,
  social_links, footer_text, about_overview, mission, facilities, technology, clinic_values, benefits, hero_highlights)
values (1, 'Your Dentist', 'Gentle, modern dentistry in Calicut',
  '+91 495 000 0000', 'hello@yourdentist.example', 'Mavoor Road, Kozhikode (Calicut), Kerala 673004, India',
  'https://www.google.com/maps/search/?api=1&query=Mavoor+Road%2C+Kozhikode%2C+Kerala',
  'https://maps.google.com/maps?q=Mavoor%20Road%2C%20Kozhikode%2C%20Kerala&z=14&output=embed',
  'Asia/Kolkata', 'INR',
  '[{"label":"Monday – Saturday","hours":"9:00 AM – 7:00 PM"},{"label":"Sunday","hours":"Closed"}]',
  '{"instagram":"https://instagram.com","facebook":"https://facebook.com"}',
  'Calm, precise dental care for the whole family.',
  'Your Dentist is a modern dental clinic in Calicut focused on preventive, restorative and cosmetic dentistry. We take time to explain every option so you can make confident decisions about your care.',
  'To deliver careful, honest dentistry in a calm environment, and to help every patient feel comfortable from the moment they arrive.',
  'Private treatment rooms, a dedicated sterilisation area, and a quiet waiting lounge.',
  'Digital imaging and intraoral scanning help us plan treatment precisely and show you exactly what we see.',
  '[{"title":"Clarity","text":"Clear explanations and transparent treatment plans."},{"title":"Comfort","text":"Unhurried appointments and gentle techniques."},{"title":"Care","text":"Strict hygiene and sterilisation standards."}]',
  '[{"title":"Experienced team","text":"Dentists across general, cosmetic and specialist care.","icon":"stethoscope"},{"title":"Modern equipment","text":"Digital imaging and precise treatment planning.","icon":"scan"},{"title":"Convenient booking","text":"Choose a doctor and time that suits you online.","icon":"calendar"},{"title":"Patient-focused","text":"Time to talk through every option with you.","icon":"heart"}]',
  '[{"title":"Precision","text":"Digital smile planning"},{"title":"Comfort","text":"Gentle, patient-first care"}]')
on conflict (id) do update set clinic_name = excluded.clinic_name;

insert into public.services (id, name, slug, category, short_description, description, procedure_details, duration_minutes, price, show_price, is_featured, sort_order) values
 ('11111111-0000-0000-0000-000000000001', 'Check-up & Cleaning', 'check-up-cleaning', 'Preventive',
  'A thorough examination and professional cleaning to keep teeth and gums healthy.',
  'Regular check-ups help catch problems early. Your dentist examines your teeth, gums and bite, and a professional clean removes plaque and tartar that brushing can miss.',
  'Examination, scaling and polishing, and personalised home-care advice. X-rays are taken only when clinically needed.', 30, null, false, true, 1),
 ('11111111-0000-0000-0000-000000000002', 'Teeth Whitening', 'teeth-whitening', 'Cosmetic',
  'Professional whitening tailored to your smile, after a suitability assessment.',
  'Whitening can lighten natural tooth colour. We first check that whitening is suitable for you and talk through realistic expectations.',
  'Shade assessment, protection of gums, and application of a professional whitening gel.', 60, null, false, true, 2),
 ('11111111-0000-0000-0000-000000000003', 'Dental Implants', 'dental-implants', 'Restorative',
  'A consultation to discuss replacing missing teeth with implants.',
  'Implants are one option for replacing missing teeth. A consultation assesses your bone, gums and general health to find out whether implants suit you.',
  'Consultation, imaging where needed, and a written treatment plan with alternatives.', 45, null, false, true, 3),
 ('11111111-0000-0000-0000-000000000004', 'Orthodontics & Aligners', 'orthodontics-aligners', 'Orthodontic',
  'Assessment for braces or clear aligners to straighten teeth.',
  'Orthodontic treatment can improve the alignment of teeth and bite. We assess your teeth and explain the options available.',
  'Orthodontic assessment, photographs and digital scan where appropriate.', 45, null, false, true, 4),
 ('11111111-0000-0000-0000-000000000005', 'Root Canal Treatment', 'root-canal-treatment', 'Restorative',
  'Treatment to save a tooth with an infected or inflamed nerve.',
  'Root canal treatment removes infected or inflamed tissue from inside a tooth, cleans the canals and seals them.',
  'Local anaesthetic, cleaning and shaping of the canals, and a temporary or permanent seal.', 60, null, false, false, 5),
 ('11111111-0000-0000-0000-000000000006', 'Children''s Dentistry', 'childrens-dentistry', 'Preventive',
  'Gentle, friendly check-ups designed for children.',
  'We help children feel at ease with the dentist, with check-ups and preventive care suited to their age.',
  'Gentle examination, cleaning and preventive advice for parents.', 30, null, false, false, 6)
on conflict (id) do nothing;

-- Photos: free Unsplash stock placeholders in public/images/doctors (see CREDITS.md).
insert into public.doctors (id, full_name, slug, profile_image_path, qualification, specialization, experience_years, biography,
  default_appointment_duration_minutes, buffer_minutes, default_daily_capacity, status, accepting_bookings, sort_order) values
 ('22222222-0000-0000-0000-000000000001', 'Dr. Anjali Menon', 'dr-anjali-menon', '/images/doctors/dr-anjali-menon.jpg',
  'BDS, MDS Conservative Dentistry', 'Restorative Dentistry', 12,
  'Demo profile. Dr. Menon focuses on restorative and implant dentistry and enjoys helping patients rebuild confidence in their smile.',
  30, 0, 25, 'active', true, 1),
 ('22222222-0000-0000-0000-000000000002', 'Dr. Arjun Nair', 'dr-arjun-nair', '/images/doctors/dr-arjun-nair.jpg',
  'BDS, MDS Prosthodontics', 'Cosmetic Dentistry', 8,
  'Demo profile. Dr. Nair practises cosmetic and general dentistry with a calm, detail-focused approach.',
  30, 0, 10, 'active', true, 2),
 ('22222222-0000-0000-0000-000000000003', 'Dr. Rahul Krishnan', 'dr-rahul-krishnan', '/images/doctors/dr-rahul-krishnan.jpg',
  'BDS, MDS Orthodontics', 'Orthodontics', 10,
  'Demo profile. Dr. Krishnan provides orthodontic assessments and treatment with braces and clear aligners.',
  45, 0, 15, 'active', true, 3),
 ('22222222-0000-0000-0000-000000000004', 'Dr. Fathima Rahman', 'dr-fathima-rahman', '/images/doctors/dr-fathima-rahman.jpg',
  'BDS, MDS Paediatric Dentistry', 'Paediatric Dentistry', 6,
  'Demo profile. Dr. Rahman looks after younger patients and focuses on prevention and positive first visits.',
  30, 0, 12, 'active', true, 4)
on conflict (id) do nothing;

insert into public.doctor_private (doctor_id) select id from public.doctors on conflict do nothing;

insert into public.doctor_services (doctor_id, service_id) values
 ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005'),
 ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002'),
 ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004'),
 ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000006'),
 ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001')
on conflict do nothing;

-- Weekly sessions (0 = Sunday; clinic closed Sundays). Morning + afternoon with a lunch break.
insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
select d.id, w.wd, s.st, s.et
from public.doctors d
cross join (values (1), (2), (3), (4), (5), (6)) w(wd)
cross join (values ('09:00'::time, '13:00'::time), ('14:00'::time, '18:00'::time)) s(st, et)
where d.id in ('22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003');

insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
select d.id, w.wd, '10:00', '16:00'
from public.doctors d
cross join (values (1), (2), (4), (6)) w(wd)
where d.id in ('22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000004');

-- ---------------------------------------------------------------------
-- Service photos and additional demo doctors (images in public/images, see CREDITS.md)
-- ---------------------------------------------------------------------
update public.services set image_path = '/images/services/' || slug || '.jpg'
 where slug in ('check-up-cleaning', 'teeth-whitening', 'dental-implants', 'orthodontics-aligners',
                'root-canal-treatment', 'childrens-dentistry')
   and image_path is null;

insert into public.doctors (id, full_name, slug, profile_image_path, qualification, specialization, experience_years, biography,
  default_appointment_duration_minutes, buffer_minutes, default_daily_capacity, status, accepting_bookings, sort_order) values
 ('22222222-0000-0000-0000-000000000005', 'Dr. Vivek Pillai', 'dr-vivek-pillai', '/images/doctors/dr-vivek-pillai.jpg',
  'BDS, MDS Conservative Dentistry & Endodontics', 'Endodontics', 14,
  'Demo profile. Dr. Pillai specialises in root canal treatment and saving natural teeth, with a gentle, step-by-step approach.',
  45, 0, 12, 'active', true, 5),
 ('22222222-0000-0000-0000-000000000006', 'Dr. Muhammed Shafeeq', 'dr-muhammed-shafeeq', '/images/doctors/dr-muhammed-shafeeq.jpg',
  'BDS, MDS Oral & Maxillofacial Surgery', 'Oral & Maxillofacial Surgery', 11,
  'Demo profile. Dr. Shafeeq handles extractions, wisdom teeth and implant surgery, and takes time to explain every step.',
  45, 15, 8, 'active', true, 6),
 ('22222222-0000-0000-0000-000000000007', 'Dr. Sneha Thomas', 'dr-sneha-thomas', '/images/doctors/dr-sneha-thomas.jpg',
  'BDS, MDS Periodontology', 'Periodontics', 9,
  'Demo profile. Dr. Thomas focuses on gum health, deep cleaning and long-term prevention.',
  30, 0, 16, 'active', true, 7),
 ('22222222-0000-0000-0000-000000000008', 'Dr. Divya Raj', 'dr-divya-raj', '/images/doctors/dr-divya-raj.jpg',
  'BDS', 'General Dentistry', 5,
  'Demo profile. Dr. Raj provides friendly everyday dental care for the whole family, from check-ups to whitening.',
  30, 0, 20, 'active', true, 8)
on conflict (id) do nothing;

insert into public.doctor_private (doctor_id) select id from public.doctors on conflict do nothing;

insert into public.doctor_services (doctor_id, service_id) values
 ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005'),
 ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000005'),
 ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000002'),
 ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000006')
on conflict do nothing;

-- Schedules only for doctors that have none yet (keeps the seed re-runnable).
insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
select v.d::uuid, v.w, v.st::time, v.et::time
from (values
  -- Dr. Pillai: Mon–Fri, morning + afternoon
  ('22222222-0000-0000-0000-000000000005', 1, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 1, '14:00', '17:00'),
  ('22222222-0000-0000-0000-000000000005', 2, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 2, '14:00', '17:00'),
  ('22222222-0000-0000-0000-000000000005', 3, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 3, '14:00', '17:00'),
  ('22222222-0000-0000-0000-000000000005', 4, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 4, '14:00', '17:00'),
  ('22222222-0000-0000-0000-000000000005', 5, '09:00', '13:00'), ('22222222-0000-0000-0000-000000000005', 5, '14:00', '17:00'),
  -- Dr. Shafeeq: Tue, Thu, Sat surgery days
  ('22222222-0000-0000-0000-000000000006', 2, '10:00', '17:00'),
  ('22222222-0000-0000-0000-000000000006', 4, '10:00', '17:00'),
  ('22222222-0000-0000-0000-000000000006', 6, '10:00', '15:00'),
  -- Dr. Thomas: Mon, Wed, Fri, Sat
  ('22222222-0000-0000-0000-000000000007', 1, '11:00', '19:00'),
  ('22222222-0000-0000-0000-000000000007', 3, '11:00', '19:00'),
  ('22222222-0000-0000-0000-000000000007', 5, '11:00', '19:00'),
  ('22222222-0000-0000-0000-000000000007', 6, '09:00', '14:00'),
  -- Dr. Raj: Mon–Sat evenings
  ('22222222-0000-0000-0000-000000000008', 1, '13:00', '19:00'), ('22222222-0000-0000-0000-000000000008', 2, '13:00', '19:00'),
  ('22222222-0000-0000-0000-000000000008', 3, '13:00', '19:00'), ('22222222-0000-0000-0000-000000000008', 4, '13:00', '19:00'),
  ('22222222-0000-0000-0000-000000000008', 5, '13:00', '19:00'), ('22222222-0000-0000-0000-000000000008', 6, '13:00', '19:00')
) v(d, w, st, et)
where not exists (select 1 from public.doctor_schedules s where s.doctor_id = v.d::uuid);

-- Local admin account: admin@clinic.local / ChangeMe!2026  (local only)
do $$
declare
  v_id uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
begin
  if not exists (select 1 from auth.users where id = v_id) then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      'admin@clinic.local', extensions.crypt('ChangeMe!2026', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Clinic Admin"}', now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', 'admin@clinic.local', 'email_verified', true),
      'email', now(), now(), now());
  end if;
  -- profiles only holds staff/admin roles (patients live in Supabase Auth alone).
  insert into public.profiles (id, email, full_name, role)
  values (v_id, 'admin@clinic.local', 'Clinic Admin', 'super_admin')
  on conflict (id) do update set role = 'super_admin', full_name = excluded.full_name;
end $$;
