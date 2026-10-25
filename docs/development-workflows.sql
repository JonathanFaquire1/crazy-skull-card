-- Apply only to Crazy Skull Card Dev (epoffgdhajtdvkvlreae), after development-schema.sql.
ALTER TABLE public.cards ADD CONSTRAINT cards_one_per_user UNIQUE(user_id);

CREATE FUNCTION private.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin');
$$;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
CREATE POLICY cards_admin ON public.cards FOR ALL TO authenticated USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));

DROP FUNCTION public.claim_nfc_token(text,uuid);
REVOKE ALL ON public.nfc_tokens FROM anon,authenticated;
GRANT SELECT(id,code,card_id,status,activated_at,created_at) ON public.nfc_tokens TO anon,authenticated;
DROP POLICY nfc_tokens_owner_update ON public.nfc_tokens;

CREATE FUNCTION private.claim_nfc_token(p_code text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 caller uuid:=auth.uid(); token public.nfc_tokens%rowtype; card public.cards%rowtype;
BEGIN
 IF caller IS NULL THEN RAISE EXCEPTION 'Connexion requise' USING ERRCODE='42501'; END IF;
 IF p_code IS NULL OR p_code !~ '^SKU[0-9]{5}$' THEN RETURN jsonb_build_object('success',false,'message','Code invalide.'); END IF;
 SELECT * INTO token FROM public.nfc_tokens WHERE code=p_code FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('success',false,'message','Code introuvable.'); END IF;
 IF token.user_id IS NOT NULL AND token.user_id<>caller THEN
  RETURN jsonb_build_object('success',false,'message','Ce code est déjà réservé.');
 END IF;
 IF token.card_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.cards WHERE id=token.card_id AND user_id=caller) THEN
  RETURN jsonb_build_object('success',false,'message','Ce code est déjà lié.');
 END IF;
 SELECT * INTO card FROM public.cards WHERE user_id=caller;
 UPDATE public.nfc_tokens SET user_id=caller,card_id=card.id,
  status=CASE WHEN card.id IS NULL THEN 'claimed' ELSE 'active' END,
  activated_at=CASE WHEN card.id IS NULL THEN NULL ELSE coalesce(token.activated_at,now()) END
 WHERE id=token.id;
 RETURN jsonb_build_object('success',true,'needs_card',card.id IS NULL,'card_id',card.id,'slug',card.slug);
END;$$;
REVOKE ALL ON FUNCTION private.claim_nfc_token(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.claim_nfc_token(text) TO authenticated;
CREATE FUNCTION public.claim_nfc_token(p_code text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.claim_nfc_token(p_code); $$;
REVOKE ALL ON FUNCTION public.claim_nfc_token(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_nfc_token(text) TO authenticated;

CREATE FUNCTION private.reset_nfc_token(p_code text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'Accès refusé' USING ERRCODE='42501'; END IF;
 UPDATE public.nfc_tokens SET user_id=NULL,card_id=NULL,status='unclaimed',activated_at=NULL WHERE code=p_code;
 IF NOT FOUND THEN RAISE EXCEPTION 'Code introuvable'; END IF;
END;$$;
REVOKE ALL ON FUNCTION private.reset_nfc_token(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.reset_nfc_token(text) TO authenticated;
CREATE FUNCTION public.reset_nfc_token(p_code text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.reset_nfc_token(p_code); $$;
REVOKE ALL ON FUNCTION public.reset_nfc_token(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reset_nfc_token(text) TO authenticated;

-- Anonymous visitors can record bounded events, never update card records.
CREATE TABLE public.card_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,kind text NOT NULL CHECK(kind IN ('scan','save')),created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.card_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.card_events FROM anon,authenticated;
GRANT INSERT(card_id,kind) ON public.card_events TO anon,authenticated;
GRANT SELECT ON public.card_events TO authenticated;
GRANT ALL ON public.card_events TO service_role;
CREATE POLICY event_insert ON public.card_events FOR INSERT TO anon,authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.cards c WHERE c.id=card_id AND c.is_active));
CREATE POLICY event_owner_read ON public.card_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.cards c WHERE c.id=card_id AND c.user_id=(SELECT auth.uid())));
CREATE INDEX card_events_card_id_idx ON public.card_events(card_id);
-- Trigger-only privilege boundary: a visitor can change only a counter by inserting an allowed event.
CREATE FUNCTION private.apply_card_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.kind='scan' THEN
  UPDATE public.cards SET scan_count=coalesce(scan_count,0)+1,last_scan=NEW.created_at WHERE id=NEW.card_id AND is_active;
 ELSIF NEW.kind='save' THEN
  UPDATE public.cards SET save_count=coalesce(save_count,0)+1 WHERE id=NEW.card_id AND is_active;
 END IF;
 RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION private.apply_card_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER apply_card_event AFTER INSERT ON public.card_events FOR EACH ROW EXECUTE FUNCTION private.apply_card_event();
CREATE OR REPLACE FUNCTION public.increment_scan(card_slug text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 INSERT INTO public.card_events(card_id,kind) SELECT id,'scan' FROM public.cards WHERE slug=card_slug AND is_active;
$$;
CREATE OR REPLACE FUNCTION public.increment_save(card_slug text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 INSERT INTO public.card_events(card_id,kind) SELECT id,'save' FROM public.cards WHERE slug=card_slug AND is_active;
$$;
REVOKE ALL ON FUNCTION public.increment_scan(text),public.increment_save(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_scan(text),public.increment_save(text) TO anon,authenticated;
DROP POLICY "Allow public insert" ON public.card_views;
CREATE POLICY active_card_view_insert ON public.card_views FOR INSERT TO anon,authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.cards c WHERE c.slug=card_views.slug AND c.is_active) AND length(coalesce(user_agent,''))<=1024 AND length(coalesce(referrer,''))<=2048);
CREATE POLICY avatar_owner_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='avatars' AND (SELECT auth.uid())::text=(storage.foldername(name))[1]);
