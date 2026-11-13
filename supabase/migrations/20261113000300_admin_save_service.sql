-- Create/update a service and replace its doctor assignments in one transaction.
create or replace function public.admin_save_service(p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
begin
  perform public._require_admin();
  if v_id is not null then
    update public.services set
      name = p ->> 'name', slug = p ->> 'slug', category = p ->> 'category',
      short_description = coalesce(p ->> 'short_description', ''),
      description = coalesce(p ->> 'description', ''),
      procedure_details = coalesce(p ->> 'procedure_details', ''),
      image_path = nullif(p ->> 'image_path', ''),
      duration_minutes = nullif(p ->> 'duration_minutes', '')::int,
      price = nullif(p ->> 'price', '')::numeric,
      show_price = coalesce((p ->> 'show_price')::boolean, false),
      is_active = coalesce((p ->> 'is_active')::boolean, true),
      is_featured = coalesce((p ->> 'is_featured')::boolean, false),
      sort_order = coalesce((p ->> 'sort_order')::int, 0)
    where id = v_id;
    if not found then
      return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Service not found.');
    end if;
  else
    insert into public.services (name, slug, category, short_description, description, procedure_details,
      image_path, duration_minutes, price, show_price, is_active, is_featured, sort_order)
    values (p ->> 'name', p ->> 'slug', p ->> 'category', coalesce(p ->> 'short_description', ''),
      coalesce(p ->> 'description', ''), coalesce(p ->> 'procedure_details', ''), nullif(p ->> 'image_path', ''),
      nullif(p ->> 'duration_minutes', '')::int, nullif(p ->> 'price', '')::numeric,
      coalesce((p ->> 'show_price')::boolean, false), coalesce((p ->> 'is_active')::boolean, true),
      coalesce((p ->> 'is_featured')::boolean, false), coalesce((p ->> 'sort_order')::int, 0))
    returning id into v_id;
  end if;

  delete from public.doctor_services where service_id = v_id;
  insert into public.doctor_services (doctor_id, service_id)
  select d.id, v_id from public.doctors d
   where d.id in (select (jsonb_array_elements_text(coalesce(p -> 'doctor_ids', '[]'::jsonb)))::uuid);

  return jsonb_build_object('ok', true, 'id', v_id);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'slug_taken', 'message', 'That URL slug is already used by another service.');
  when check_violation then
    return jsonb_build_object('ok', false, 'code', 'validation', 'message', 'Some values are out of range.');
end $$;

revoke execute on function public.admin_save_service(jsonb) from public, anon;
grant execute on function public.admin_save_service(jsonb) to authenticated;
