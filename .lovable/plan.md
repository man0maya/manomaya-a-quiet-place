## Fix open DELETE policy on `quote_likes` and `story_likes`

### Problem
Both tables currently allow `DELETE` with `USING (true)` for the public role, meaning anyone can delete anyone else's like record (vote manipulation). Likes are anonymous and identified by a client-generated `session_id` stored in `localStorage` — there is no `auth.uid()` to scope by.

### Approach
Replace the public `DELETE` policy with `SECURITY DEFINER` RPC functions that perform the delete server-side, scoped to a session id passed as a parameter. Then revoke public DELETE entirely. This way the database rule is "no one can delete via the table API" and only the controlled function path can remove a like (and only the row matching the provided session id + content id).

This is more reliable than the suggested header-based check because Supabase JS doesn't send a custom `x-session-id` header by default and adding one through `global.headers` would apply globally. RPCs give us a clean, scoped contract.

### Migration
1. Create `public.unlike_quote(_quote_id uuid, _session_id text)` — `SECURITY DEFINER`, `SET search_path = public`. Deletes only the row where both `quote_id` and `session_id` match. Returns void.
2. Create `public.unlike_story(_story_id uuid, _session_id text)` — same pattern.
3. `GRANT EXECUTE` on both functions to `anon, authenticated`.
4. `DROP POLICY "Anyone can unlike quotes" ON public.quote_likes;`
5. `DROP POLICY "Anyone can unlike stories" ON public.story_likes;`
6. Leave existing SELECT and INSERT policies intact (insert still uses `WITH CHECK true` since likes are anonymous; that's acceptable — at worst a session can spam its own likes, which the unique constraint / app logic prevents).

### Frontend change — `src/components/LikeButton.tsx`
Replace the two `.from('quote_likes').delete()...` and `.from('story_likes').delete()...` calls with:
- `supabase.rpc('unlike_quote', { _quote_id: itemId, _session_id: sessionId })`
- `supabase.rpc('unlike_story', { _story_id: itemId, _session_id: sessionId })`

No other UI/logic changes — optimistic update stays the same.

### Security finding follow-up
After applying the migration and code change, mark `quote_story_likes_open_delete` (scanner `supabase_lov`) as fixed via `security--manage_security_finding` with an explanation describing the new RPC-based scoped deletion.

### Files touched
- New migration under `supabase/migrations/` (functions + drop policies + grants)
- `src/components/LikeButton.tsx` (swap delete calls for RPCs)
