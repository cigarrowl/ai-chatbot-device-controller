CREATE TABLE public.profiles (id UUID PRIMARY KEY REFERENCES 
auth.users(id) ON DELETE CASCADE, email TEXT, created_at TIMESTAMPTZ 
DEFAULT NOW());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT USING 
(auth.uid() = id);

CREATE TABLE public.audit_logs (id UUID PRIMARY KEY DEFAULT 
gen_random_uuid(), user_id UUID REFERENCES public.profiles(id), tool_name 
TEXT NOT NULL, arguments JSONB, decision TEXT CHECK (decision IN 
('approved','rejected','dry_run')), created_at TIMESTAMPTZ DEFAULT NOW());
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own audit" ON public.audit_logs FOR SELECT USING 
(auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ 
BEGIN INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email); 
RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH 
ROW EXECUTE FUNCTION public.handle_new_user();
