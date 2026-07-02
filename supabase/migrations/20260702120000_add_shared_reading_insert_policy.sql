create policy "Users can create reading rooms"
on public.shared_reading_rooms for insert
to authenticated
with check (auth.uid() = host_id);
