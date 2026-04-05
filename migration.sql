-- ============================================================
-- CRAZY SKULL CARD — Migration SQL
-- Exécutez dans Supabase > SQL Editor > New Query
-- ============================================================

-- Ajouter les colonnes manquantes
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS facebook text;

-- Si la colonne github existe, la renommer en facebook
-- (ignorez l'erreur si github n'existe pas)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='github') THEN
    ALTER TABLE public.cards RENAME COLUMN github TO facebook;
  END IF;
END $$;
