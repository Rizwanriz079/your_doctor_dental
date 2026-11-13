-- Per-date availability summary for one doctor across a date range (admin availability grid).
create or replace function public.admin_doctor_range(p_doctor uuid, p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_day date;
  v_out jsonb := '[]'::jsonb;
  v_cap public.doctor_capacity;
  v_ovr public.doctor_schedule_overrides;
  v_hol public.clinic_holidays;
  v_intervals jsonb;
  v_capacity int;
  v_booked int;
begin
  perform public._require_admin();
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 92 then
    raise exception 'Invalid date range (max 93 days)';
  end if;
  v_day := p_from;
  while v_day <= p_to loop
    select * into v_cap from public.doctor_capacity where doctor_id = p_doctor and capacity_date = v_day;
    select * into v_ovr from public.doctor_schedule_overrides where doctor_id = p_doctor and schedule_date = v_day;
    select * into v_hol from public.clinic_holidays where holiday_date = v_day;
    select coalesce(jsonb_agg(jsonb_build_object('start', to_char(i.start_time, 'HH24:MI'), 'end', to_char(i.end_time, 'HH24:MI'))), '[]'::jsonb)
      into v_intervals from public._doctor_intervals(p_doctor, v_day) i;
    v_capacity := public._effective_capacity(p_doctor, v_day);
    v_booked := public._booked_count(p_doctor, v_day);
    v_out := v_out || jsonb_build_object(
      'date', v_day,
      'weekday', extract(dow from v_day)::int,
      'scheduled', jsonb_array_length(v_intervals) > 0,
      'intervals', v_intervals,
      'capacity', v_capacity,
      'booked', v_booked,
      'remaining', greatest(v_capacity - v_booked, 0),
      'over_capacity', v_booked > v_capacity,
      'capacity_override', case when v_cap.id is null then null else jsonb_build_object(
          'max_bookings', v_cap.max_bookings, 'reason', v_cap.reason) end,
      'schedule_override', case when v_ovr.id is null then null else jsonb_build_object(
          'is_closed', v_ovr.is_closed, 'start_time', to_char(v_ovr.start_time, 'HH24:MI'),
          'end_time', to_char(v_ovr.end_time, 'HH24:MI'), 'reason', v_ovr.reason) end,
      'holiday', case when v_hol.id is null then null else v_hol.name end);
    v_day := v_day + 1;
  end loop;
  return v_out;
end $$;

revoke execute on function public.admin_doctor_range(uuid, date, date) from public, anon;
grant execute on function public.admin_doctor_range(uuid, date, date) to authenticated;
