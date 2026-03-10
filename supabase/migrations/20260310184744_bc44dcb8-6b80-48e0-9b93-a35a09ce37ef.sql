CREATE TABLE public.visitor_counter (
  id integer PRIMARY KEY DEFAULT 1,
  count bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO public.visitor_counter (id, count) VALUES (1, 0);

ALTER TABLE public.visitor_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view counter" ON public.visitor_counter FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update counter" ON public.visitor_counter FOR UPDATE TO public USING (true);
