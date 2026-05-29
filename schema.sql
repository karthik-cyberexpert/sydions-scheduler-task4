-- Create a table for public profiles (mapping user auth to custom details)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles (to view contacts)
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to insert their own profile during signup
CREATE POLICY "Allow insert for own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile details
CREATE POLICY "Allow update for own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile row when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    new.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger function to the auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable helper function or indexes for username queries
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- Create chats table
CREATE TABLE public.chats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_color TEXT,
  type TEXT DEFAULT 'single',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create messages table
CREATE TABLE public.messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES public.chats(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  media_type TEXT,
  status TEXT DEFAULT 'sent',
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS policies
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to chats" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Allow public insert to chats" ON public.chats FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert to messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Enable Supabase Realtime for database changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
