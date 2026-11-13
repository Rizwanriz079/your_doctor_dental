#!/usr/bin/env bash
# Run SQL against the local Supabase database container.
exec docker exec -i supabase_db_dental-clinic psql -U postgres -d postgres -tA -v ON_ERROR_STOP=1 "$@"
