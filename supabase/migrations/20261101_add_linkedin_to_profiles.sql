-- Migration: Add linkedin_url to profiles table
-- Allows authors to link their LinkedIn profile for Proof-of-Work portfolio

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
