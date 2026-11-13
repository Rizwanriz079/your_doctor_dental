#!/usr/bin/env bash
# Booking-integrity tests against the LOCAL Supabase database.
# Creates a throwaway test doctor, runs the scenarios from spec §21.2–21.4, then cleans up.
set -uo pipefail
cd "$(dirname "$0")/../.."
PSQL="scripts/psql.sh"
PASS=0; FAIL=0
ADMIN='aaaaaaaa-0000-0000-0000-000000000001'
DOC='99999999-0000-0000-0000-000000000001'
SVC='11111111-0000-0000-0000-000000000001'

q() { $PSQL -c "$1" 2>&1 | tail -n 1; }
as_admin() { $PSQL -c "begin; set local role authenticated; set local request.jwt.claims = '{\"sub\":\"$ADMIN\",\"role\":\"authenticated\"}'; $1; commit;" 2>&1 | grep -v -E '^(BEGIN|SET|COMMIT)$' | tail -n 1; }
as_anon() { $PSQL -c "begin; set local role anon; $1; commit;" 2>&1 | grep -v -E '^(BEGIN|SET|COMMIT|HINT:.*)$' | tail -n 1; }
check() { # name, actual, expected-substring
  if [[ "$2" == *"$3"* ]]; then PASS=$((PASS+1)); echo "  ✓ $1";
  else FAIL=$((FAIL+1)); echo "  ✗ $1"; echo "      expected to contain: $3"; echo "      got: $2"; fi
}

# Next date (>= 2 days ahead) that falls on a Monday, so it is a working day.
DATE=$(q "select d::date from generate_series(current_date + 2, current_date + 9, '1 day') d where extract(dow from d) = 1 limit 1")
echo "Test date: $DATE"

cleanup() {
  $PSQL >/dev/null 2>&1 <<SQL
delete from notifications where doctor_id = '$DOC';
delete from appointments where doctor_id = '$DOC';
delete from patients where phone like '+97150000%';
delete from doctors where id = '$DOC';
SQL
}
cleanup
$PSQL >/dev/null <<SQL
insert into doctors (id, full_name, slug, specialization, default_daily_capacity, default_appointment_duration_minutes)
values ('$DOC', 'Dr. Test Capacity', 'dr-test-capacity', 'Testing', 3, 30);
insert into doctor_services values ('$DOC', '$SVC');
insert into doctor_schedules (doctor_id, weekday, start_time, end_time) values ('$DOC', 1, '09:00', '12:00');
SQL

book() { # time phone [doctor] [date]
  as_anon "select book_appointment('$SVC', '${3:-$DOC}', '${4:-$DATE}', '$1', 'Test Patient', '$2', null, null, true)::text"
}

echo "Capacity (default 3/day)"
check "availability shows capacity 3" "$(as_anon "select get_available_slots('$DOC','$SVC','$DATE')->>'remaining'")" "3"
check "booking 1 succeeds" "$(book 09:00 +971500001)" '"ok": true'
check "duplicate slot rejected" "$(book 09:00 +971500002)" 'slot_taken'
check "booking 2 succeeds" "$(book 09:30 +971500003)" '"ok": true'
check "booking 3 succeeds" "$(book 10:00 +971500004)" '"ok": true'
check "4th booking rejected when full" "$(book 10:30 +971500005)" 'fully_booked'
check "availability reports fully booked" "$(as_anon "select get_available_slots('$DOC','$SVC','$DATE')->>'reason'")" "fully_booked"

echo "Release on cancel/reject"
A1=$(q "select id from appointments where doctor_id='$DOC' and start_time='09:00'")
A2=$(q "select id from appointments where doctor_id='$DOC' and start_time='09:30'")
A3=$(q "select id from appointments where doctor_id='$DOC' and start_time='10:00'")
check "cancel requires reason" "$(as_admin "select admin_set_appointment_status('$A1','cancelled',null)::text")" 'reason_required'
check "cancel succeeds" "$(as_admin "select admin_set_appointment_status('$A1','cancelled','Patient request')::text")" '"ok": true'
check "capacity released after cancel" "$(as_anon "select get_available_slots('$DOC','$SVC','$DATE')->>'remaining'")" "1"
check "cancelled slot can be rebooked" "$(book 09:00 +971500006)" '"ok": true'
check "reject succeeds" "$(as_admin "select admin_set_appointment_status('$A2','rejected','Doctor unavailable')::text")" '"ok": true'
check "capacity released after reject" "$(as_anon "select get_available_slots('$DOC','$SVC','$DATE')->>'remaining'")" "1"

echo "Status workflow"
check "invalid transition blocked (rejected->confirmed)" "$(as_admin "select admin_set_appointment_status('$A2','confirmed',null)::text")" 'invalid_transition'
check "confirm pending" "$(as_admin "select admin_set_appointment_status('$A3','confirmed',null)::text")" '"ok": true'
check "complete confirmed" "$(as_admin "select admin_set_appointment_status('$A3','completed',null)::text")" '"ok": true'
check "completed still counts toward daily usage" "$(as_anon "select get_available_slots('$DOC','$SVC','$DATE')->>'booked'")" "2"
check "anon cannot change status" "$(as_anon "select admin_set_appointment_status('$A3','cancelled','x')::text")" 'permission denied'

echo "Date override precedence & blocked dates"
check "override capacity to 5" "$(as_admin "select admin_set_capacity_override('$DOC','$DATE',5,'Extra session',false)::text")" '"ok": true'
check "override takes precedence" "$(as_anon "select get_available_slots('$DOC','$SVC','$DATE')->>'capacity'")" "5"
check "override below booked needs confirmation" "$(as_admin "select admin_set_capacity_override('$DOC','$DATE',1,'',false)::text")" 'below_booked'
check "close date with bookings needs confirmation" "$(as_admin "select admin_set_schedule_override('$DOC','$DATE',true,null,null,'Leave',false)::text")" '"code": "impact"'
NEXT=$(q "select ('$DATE'::date + 7)::text")
as_admin "select admin_set_schedule_override('$DOC','$NEXT',true,null,null,'Leave',false)::text" >/dev/null
check "blocked date shows no availability" "$(as_anon "select get_available_slots('$DOC','$SVC','$NEXT')->>'reason'")" "date_blocked"
check "booking on blocked date rejected" "$(book 09:00 +971500007 $DOC $NEXT)" 'date_blocked'

echo "Validation"
check "outside working hours rejected" "$(book 15:00 +971500008)" 'invalid_slot'
check "invalid phone rejected" "$(book 11:00 abc)" 'invalid_phone'
check "missing consent rejected" "$(as_anon "select book_appointment('$SVC','$DOC','$DATE','11:00','Test Patient','+971500009',null,null,false)::text")" 'consent_required'
check "service not offered rejected" "$(as_anon "select book_appointment('11111111-0000-0000-0000-000000000002','$DOC','$DATE','11:00','Test Patient','+971500010',null,null,true)::text")" 'service_not_offered'

echo "Reschedule"
A4=$(q "select id from appointments where doctor_id='$DOC' and start_time='09:00' and status='pending'")
check "reschedule into taken slot fails" "$(as_admin "select admin_reschedule_appointment('$A4','$DATE','10:00','x')::text")" 'slot_taken'
check "original booking unchanged after failed reschedule" "$(q "select start_time from appointments where id='$A4'")" "09:00"
check "reschedule to free slot succeeds" "$(as_admin "select admin_reschedule_appointment('$A4','$DATE','11:30','Patient asked')::text")" '"ok": true'
check "old slot released after reschedule" "$(as_anon "select (select x->>'available' from jsonb_array_elements(get_available_slots('$DOC','$SVC','$DATE')->'slots') x where x->>'start'='09:00')")" "true"

echo "Inactive doctor"
as_admin "select admin_set_doctor_status('$DOC','inactive',true)::text" >/dev/null
check "inactive doctor cannot be booked" "$(book 09:00 +971500011)" 'doctor_unavailable'
check "inactive doctor hidden from public" "$(as_anon "select count(*) from doctors where id='$DOC'")" "0"
check "admin notified about upcoming bookings" "$(q "select count(*) from notifications where doctor_id='$DOC' and event_type='doctor_attention'")" "1"
as_admin "select admin_set_doctor_status('$DOC','active',true)::text" >/dev/null
check "delete blocked when history exists" "$(as_admin "select admin_delete_doctor('$DOC')::text")" 'has_history'

echo "Concurrency: 12 simultaneous requests for the last 2 capacity units"
as_admin "select admin_set_capacity_override('$DOC','$DATE',4,'',true)::text" >/dev/null
check "remaining is 2 before race" "$(as_anon "select get_available_slots('$DOC','$SVC','$DATE')->>'remaining'")" "2"
TMP=$(mktemp -d)
SLOTS=(09:30 10:00 10:30 11:00 09:30 10:00 10:30 11:00 09:30 10:30 11:00 10:00)
for i in $(seq 0 11); do
  ( book "${SLOTS[$i]}" "+9715000$((20+i))" > "$TMP/$i" ) &
done
wait
OKS=$(grep -l '"ok": true' "$TMP"/* | wc -l | tr -d ' ')
check "exactly 2 of 12 succeeded" "$OKS" "2"
check "active bookings never exceed capacity" "$(q "select count(*) from appointments where doctor_id='$DOC' and appointment_date='$DATE' and status in ('pending','confirmed','completed')")" "4"
check "no overlapping active bookings" "$(q "select count(*) from appointments a join appointments b on a.doctor_id=b.doctor_id and a.id<b.id and a.time_range && b.time_range where a.doctor_id='$DOC' and a.status in ('pending','confirmed','completed') and b.status in ('pending','confirmed','completed')")" "0"
rm -rf "$TMP"

echo "Notifications"
BOOKED=$(q "select count(*) from appointments where doctor_id='$DOC'")
check "one notification per successful booking" "$(q "select count(*) from notifications where doctor_id='$DOC' and event_type='appointment_created'")" "$BOOKED"
check "anon cannot read notifications" "$(as_anon "select count(*) from notifications")" "permission denied"
check "anon cannot read appointments" "$(as_anon "select count(*) from appointments")" "permission denied"
check "anon cannot read patients" "$(as_anon "select count(*) from patients")" "permission denied"
check "mark all read" "$(as_admin "select admin_mark_notifications_read(null)")" ""
check "unread count zero after mark-all" "$(q "select count(*) from notifications where recipient_user_id='$ADMIN' and not is_read")" "0"

echo "Pending hold expiry"
$PSQL >/dev/null -c "update clinic_settings set pending_expiry_hours = 1"
check "booking with expiry succeeds" "$(book 11:00 +971500050 $DOC $(q "select ('$DATE'::date + 14)::text"))" '"ok": true'
$PSQL >/dev/null -c "update appointments set hold_expires_at = now() - interval '1 minute' where patient_phone = '+971500050'"
check "expired hold no longer counted" "$(as_anon "select get_available_slots('$DOC','$SVC',('$DATE'::date + 14))->>'booked'")" "0"
check "expiry job marks hold expired" "$(q "select expire_stale_holds()")" "1"
$PSQL >/dev/null -c "update clinic_settings set pending_expiry_hours = null"

cleanup
echo
echo "Passed: $PASS  Failed: $FAIL"
[[ $FAIL -eq 0 ]]
