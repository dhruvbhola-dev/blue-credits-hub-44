-- Add wallet_address column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN wallet_address TEXT;

-- Add index for wallet_address for better query performance
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);