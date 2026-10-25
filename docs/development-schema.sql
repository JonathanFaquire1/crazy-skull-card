-- Development-only schema; no production rows, accounts, tokens or files.
SET search_path = public;
CREATE TABLE public."card_views" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"slug" text NOT NULL,
"viewed_at" timestamptz DEFAULT now(),
"user_agent" text,
"referrer" text
);
CREATE TABLE public."cards" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid NOT NULL,
"slug" text NOT NULL,
"firstname" text NOT NULL,
"lastname" text NOT NULL,
"title" text,
"company" text,
"bio" text,
"email" text,
"phone" text,
"website" text,
"address" text,
"linkedin" text,
"github" text,
"twitter" text,
"instagram" text,
"color_accent" text DEFAULT '#00d4ff'::text,
"is_active" bool DEFAULT true,
"scan_count" int4 DEFAULT 0,
"save_count" int4 DEFAULT 0,
"created_at" timestamptz DEFAULT now(),
"updated_at" timestamptz DEFAULT now(),
"facebook" text,
"avatar_url" text,
"last_scan" timestamptz
);
CREATE TABLE public."nfc_tokens" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"code" text NOT NULL,
"card_id" uuid,
"activated_at" timestamp,
"created_at" timestamp DEFAULT now(),
"user_id" uuid,
"status" text DEFAULT 'unclaimed'::text NOT NULL
);
CREATE TABLE public."profiles" (
"id" uuid NOT NULL,
"role" text DEFAULT 'client'::text NOT NULL,
"created_at" timestamptz DEFAULT now()
);
CREATE TABLE public."scan_logs" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"card_id" uuid NOT NULL,
"scanned_at" timestamptz DEFAULT now(),
"user_agent" text,
"country" text
);
ALTER TABLE public."card_views" ADD CONSTRAINT "card_views_pkey" PRIMARY KEY (id);
ALTER TABLE public."cards" ADD CONSTRAINT "cards_pkey" PRIMARY KEY (id);
ALTER TABLE public."cards" ADD CONSTRAINT "cards_slug_key" UNIQUE (slug);
ALTER TABLE public."nfc_tokens" ADD CONSTRAINT "nfc_tokens_code_check" CHECK ((code ~ '^SKU[0-9]{5}$'::text));
ALTER TABLE public."nfc_tokens" ADD CONSTRAINT "nfc_tokens_code_key" UNIQUE (code);
ALTER TABLE public."nfc_tokens" ADD CONSTRAINT "nfc_tokens_pkey" PRIMARY KEY (id);
ALTER TABLE public."nfc_tokens" ADD CONSTRAINT "nfc_tokens_status_check" CHECK ((status = ANY (ARRAY['unclaimed'::text, 'claimed'::text, 'active'::text])));
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'client'::text])));
ALTER TABLE public."scan_logs" ADD CONSTRAINT "scan_logs_pkey" PRIMARY KEY (id);
ALTER TABLE public."cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."nfc_tokens" ADD CONSTRAINT "nfc_tokens_card_id_fkey" FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL;
ALTER TABLE public."nfc_tokens" ADD CONSTRAINT "nfc_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."scan_logs" ADD CONSTRAINT "scan_logs_card_id_fkey" FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;
ALTER TABLE public."card_views" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."card_views" FROM anon, authenticated;
GRANT ALL ON public."card_views" TO service_role;
ALTER TABLE public."cards" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."cards" FROM anon, authenticated;
GRANT ALL ON public."cards" TO service_role;
ALTER TABLE public."nfc_tokens" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."nfc_tokens" FROM anon, authenticated;
GRANT ALL ON public."nfc_tokens" TO service_role;
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."profiles" FROM anon, authenticated;
GRANT ALL ON public."profiles" TO service_role;
ALTER TABLE public."scan_logs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."scan_logs" FROM anon, authenticated;
GRANT ALL ON public."scan_logs" TO service_role;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.cards,public.nfc_tokens TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.cards TO authenticated;
GRANT UPDATE ON public.nfc_tokens TO authenticated;
GRANT SELECT,INSERT ON public.card_views,public.scan_logs TO anon,authenticated;
CREATE POLICY "Users can upload avatar" ON "storage"."objects" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Public can view avatars" ON "storage"."objects" AS PERMISSIVE FOR SELECT TO "public" USING ((bucket_id = 'avatars'::text));
CREATE POLICY "Allow public insert" ON "public"."card_views" AS PERMISSIVE FOR INSERT TO "anon","authenticated" WITH CHECK ((slug IS NOT NULL));
CREATE POLICY "scanlogs_insert" ON "public"."scan_logs" AS PERMISSIVE FOR INSERT TO "anon","authenticated" WITH CHECK ((card_id IS NOT NULL));
CREATE POLICY profiles_own ON public.profiles FOR SELECT TO authenticated USING ((select auth.uid())=id);
CREATE POLICY "nfc_tokens_public_read" ON "public"."nfc_tokens" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (true);
CREATE POLICY "nfc_tokens_owner_update" ON "public"."nfc_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "card_views_auth_read" ON "public"."card_views" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (SELECT 1 FROM public.cards c WHERE c.slug=card_views.slug AND c.user_id=(SELECT auth.uid())));
CREATE POLICY "scanlogs_owner" ON "public"."scan_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((card_id IN ( SELECT cards.id
   FROM cards
  WHERE (cards.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "cards_public_read" ON "public"."cards" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (is_active OR user_id=(SELECT auth.uid()));
CREATE POLICY "cards_owner_write" ON "public"."cards" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "cards_owner_update" ON "public"."cards" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "cards_owner_delete" ON "public"."cards" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE OR REPLACE FUNCTION public.claim_nfc_token(p_code text, p_profile_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_token public.nfc_tokens%rowtype;
BEGIN
  SELECT *
  INTO v_token
  FROM public.nfc_tokens
  WHERE code = p_code
  LIMIT 1;

  IF v_token.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'SKU introuvable'
    );
  END IF;

  IF v_token.card_id IS NOT NULL OR v_token.user_id IS NOT NULL OR v_token.status <> 'unclaimed' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ce SKU est déjà utilisé'
    );
  END IF;

  UPDATE public.nfc_tokens
  SET
    user_id = p_profile_id,
    status = 'claimed'
  WHERE id = v_token.id;

  RETURN json_build_object(
    'success', true,
    'message', 'SKU réservé avec succès'
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.increment_save(card_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.cards SET save_count = save_count + 1 WHERE slug = card_slug;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.increment_scan(card_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.cards
  SET
    scan_count = COALESCE(scan_count, 0) + 1,
    last_scan = now()
  WHERE slug = card_slug;
END;
$function$
;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM public,anon,authenticated;
CREATE FUNCTION private.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
INSERT INTO public.profiles(id,role) VALUES(new.id,'client');
RETURN new;
END;$$;
REVOKE ALL ON FUNCTION private.handle_new_user() FROM public,anon,authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('avatars','avatars',true,5242880,ARRAY['image/jpeg','image/png','image/webp']);
CREATE POLICY avatar_owner_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='avatars' AND (select auth.uid())::text=(storage.foldername(name))[1]) WITH CHECK(bucket_id='avatars' AND (select auth.uid())::text=(storage.foldername(name))[1]);
CREATE INDEX idx_scan_logs_card_id ON public.scan_logs USING btree (card_id);
CREATE INDEX idx_cards_user_id ON public.cards USING btree (user_id);
CREATE INDEX idx_nfc_tokens_card_id ON public.nfc_tokens USING btree (card_id);
CREATE INDEX idx_nfc_tokens_user_id ON public.nfc_tokens USING btree (user_id);
CREATE INDEX idx_card_views_slug ON public.card_views USING btree (slug);
CREATE INDEX idx_card_views_date ON public.card_views USING btree (viewed_at);

