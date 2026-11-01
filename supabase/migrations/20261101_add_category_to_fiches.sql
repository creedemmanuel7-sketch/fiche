-- Migration: Add category column to fiches table
-- Category supports: 'Code', 'Carrière', 'Méthodo', 'Contexte Local', 'Soft Skills'

ALTER TABLE public.fiches ADD COLUMN IF NOT EXISTS category text DEFAULT 'Code';

-- Index to optimize filtering by category
CREATE INDEX IF NOT EXISTS idx_fiches_category ON public.fiches(category);
