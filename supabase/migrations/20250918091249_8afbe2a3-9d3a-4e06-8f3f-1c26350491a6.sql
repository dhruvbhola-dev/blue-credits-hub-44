-- Add wallet_address column to profiles table for blockchain integration
ALTER TABLE profiles 
ADD COLUMN wallet_address TEXT;