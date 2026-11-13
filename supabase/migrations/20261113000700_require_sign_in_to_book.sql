-- Booking requires a signed-in Supabase Auth account, so every appointment is
-- linked to a patient (appointments.user_id) and shows in their history.
-- Anonymous visitors can still browse doctors and see availability.
revoke execute on function public.book_appointment(uuid, uuid, date, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.book_appointment(uuid, uuid, date, text, text, text, text, text, boolean) to authenticated;
