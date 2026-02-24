-- =============================================================
-- BudgetMaster - Household RPC Functions
-- Run this ONCE in Supabase SQL Editor:
-- https://supabase.com/project/xzsbrmxwvqnrxtqizfsw/editor
-- =============================================================

-- 1. Helper: get caller's household_id without RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_household_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Allow users to see profiles in their household (no recursion)
DROP POLICY IF EXISTS "Users can view profiles in same household" ON public.profiles;
CREATE POLICY "Users can view profiles in same household"
  ON public.profiles FOR SELECT
  USING (household_id = public.get_my_household_id());

-- 3. Find user by email (for admin add-member feature)
CREATE OR REPLACE FUNCTION public.find_user_by_email(p_email text)
RETURNS TABLE (id uuid, email text, full_name text, household_id uuid, role text)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id, email, full_name, household_id, role
  FROM public.profiles WHERE email = p_email;
$$;

-- 4. Admin update: allows admin to update members in their household
CREATE OR REPLACE FUNCTION public.update_member_profile(
  p_member_id uuid,
  p_household_id uuid DEFAULT NULL,
  p_role text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  caller_role text;
  caller_household_id uuid;
  target_household_id uuid;
BEGIN
  SELECT role, household_id INTO caller_role, caller_household_id
  FROM public.profiles WHERE id = auth.uid();

  SELECT household_id INTO target_household_id
  FROM public.profiles WHERE id = p_member_id;

  -- Allow self-update OR admin updating member of same household
  IF auth.uid() != p_member_id
    AND (caller_role != 'admin' OR caller_household_id != target_household_id) THEN
    RAISE EXCEPTION 'Not authorized to update this profile';
  END IF;

  UPDATE public.profiles
  SET
    household_id = COALESCE(p_household_id, household_id),
    role = COALESCE(p_role, role)
  WHERE id = p_member_id;
END;
$$;
