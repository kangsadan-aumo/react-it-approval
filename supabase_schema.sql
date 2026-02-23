-- Create custom users table linking to auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'approver', 'admin'
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own record" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger to sync auth.users with public.users on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, department)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'displayName', 
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'department'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create requests table
CREATE TABLE public.requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL,
  quotation_url TEXT,
  quotation_name TEXT,
  signed_quotation_url TEXT,
  signed_quotation_name TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Policies for requests (Simplified for this app: authenticated users can do everything. In production, restrict based on role)
CREATE POLICY "Authenticated users full access to requests" ON public.requests 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Insert Storage Bucket (it-approval)
INSERT INTO storage.buckets (id, name, public) VALUES ('it-approval', 'it-approval', true);

-- Storage Policies
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'it-approval');
CREATE POLICY "Authenticated Users Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'it-approval');
CREATE POLICY "Authenticated Users Update Access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'it-approval');
CREATE POLICY "Authenticated Users Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'it-approval');
