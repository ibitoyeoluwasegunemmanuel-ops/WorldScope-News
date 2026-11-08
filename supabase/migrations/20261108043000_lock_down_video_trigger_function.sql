-- The video workflow function is invoked by the table trigger, not directly by API clients.
revoke all on function public.enforce_video_workflow() from public, anon, authenticated;
grant execute on function public.enforce_video_workflow() to service_role;
