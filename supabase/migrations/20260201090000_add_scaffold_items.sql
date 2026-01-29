-- Create scaffold items table
CREATE TABLE public.scaffold_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  mass_tonne_per_item NUMERIC,
  weekly_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scaffold_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view scaffold items"
  ON public.scaffold_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Elevated users can manage scaffold items"
  ON public.scaffold_items FOR ALL
  TO authenticated
  USING (public.has_elevated_role(auth.uid()));

CREATE TRIGGER update_scaffold_items_updated_at
  BEFORE UPDATE ON public.scaffold_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.scaffold_items (
  part_number,
  description,
  quantity,
  mass_tonne_per_item,
  weekly_rate
) VALUES
  ('140335', 'Bt Base Jack 610 R/o (38 Dia Tube)', 0, NULL, 174.21),
  ('1105005', 'Kwik-stage Standard 3000', 320, 15.5, 408.7),
  ('1105004', 'Kwik-stage Standard 2500', 0, 12.9, 351.52),
  ('1105003', 'Kwik- stage Standard 2000', 203, 10.3, 290.25),
  ('1105002', 'Kwik-stage Standard 1500', 0, 7.7, 230),
  ('1105002', 'Kwik -stage Standard 1000', 0, 5.2, 166.37),
  ('1105021', 'Kwik-stage Ledger 2500 (2452- green)', 850, 9, 212.81),
  ('1105022', 'Kwik-stage Ledger 2000 (1952- black)', 161, 7.3, 184.3),
  ('1105023', 'Kwik-stage Ledger 1500 (1452-white)', 509, 5, 138.7),
  ('1105024', 'Kwik-stage Ledger 1294 (1246-orange)', 99, 4.4, 129.56),
  ('1105027', 'Kwik-stage Ledger 1000 (952- grey)', 33, 3.5, 113.26),
  ('1105029', 'Kwik-stage Ledger 900 (852-pink)', 604, 3.2, 105.23),
  ('1105032', 'Kwik-stage Ledger 600(552-yellow)', 0, 2.4, 88.68),
  ('1105018', 'Kwik-stage Ledger 1800 (1752-red)', 14, 5.9, 179.59),
  ('1105040', 'Kwik-stage Reinf Ledger 2500(2452 0/1)', 0, NULL, 376.47),
  ('1105076', 'Hook-on Board 2500 Non Tilt', 505, 17.8, 672.65),
  ('1105077', 'Hook-on Board 2000 Non Tilt', 16, 15.4, 654),
  ('1105085', 'Hook-on Board 1500 (two hooks)', 174, NULL, 654),
  ('1105085', 'Hook-on Board 1500 Non Tilt', 41, 11.2, 597.92),
  ('1105070', 'Hook-on Board 1294', 0, 9.1, 579.52),
  ('1105085', 'Hook-on Board 900 Non Tilt ( steel)', 0, NULL, 523.07),
  ('1105120', 'Toe Board 2500', 0, 14.3, 652.14),
  ('1105119', 'Toe Board 2000', 0, 11.6, 420.56),
  ('1105118', 'Toe Board 1500', 0, 8.7, 316.93),
  ('1105151', 'Toe Board 900', 0, 0.01, 169.83),
  ('1105121', 'Toe Board Clip', 0, 0.1, 130.18),
  ('1105500', 'Staircase 2500x2000x500', 0, 53, 5037.82),
  ('1005511', 'Staircase Centre Handrail', 0, 10.8, 1282.92),
  ('1105504', 'Ladder Hook-on Type 2000', 16, 0.02, 749.1),
  ('1105512', 'Ladder Hook-on Type 1000', 0, 0.01, 321.63),
  ('1105111', '3 Board Trapdoor', 0, 0.02, 1249.33),
  ('1105112', '2 Board Trapdoor', 0, 0.01, 1249.33),
  ('1905016', 'Coupler 90 Deg 50x50( galvanised)', 0, 0.1, 81.52),
  ('1905059', 'Coupler Swivel 50x50( galvanised)', 0, 0.1, 81.56),
  ('145341', 'Connector Kwikstage (galv)', 63, 0.4, 37.19),
  ('2710604', 'Sleeve Coupler', 0, 0.1, 121.27),
  ('1905151', 'Scaffold Tube 6000 (Orange)', 0, 0.02, 373.5),
  ('1905097', 'Scaffold Tube 5000 (brown)', 0, 0.02, 309),
  ('1905096', 'Scaffold Tube 4500 (pink)', 0, 0.02, 278.72),
  ('1905095', 'Scaffold Tube 4000(red oxide)', 0, 0.01, 248.25),
  ('1905094', 'Scaffold Tube 3500 (purple)', 0, 0.01, 216.05),
  ('1905093', 'Scaffold Tube 3000 (blue)', 0, 0.01, 183.43),
  ('1905092', 'Scaffold Tube 2500(green)', 0, 0.01, 155.21),
  ('1905091', 'Scaffold Tube 2000(black)', 0, 0.01, 122.49),
  ('1905089', 'Scaffold Tube 1500 (white)', 0, NULL, 94.07),
  ('1905087', 'Scaffold Tube 1000 (grey)', 0, NULL, 61.86),
  ('425112', 'H D Jacking Castor (complete)', 0, NULL, 999.83),
  ('425113', 'H D Castor C/w  Base (28kn)', 0, NULL, 783.56);
