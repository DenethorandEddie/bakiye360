-- Önce categories tablosunu boşaltalım (ihtiyatlı)
TRUNCATE categories CASCADE;

-- Genel kategorileri ekleyelim (user_id NULL olarak)
INSERT INTO categories (name, type, user_id) VALUES
  ('Maaş', 'income', NULL),
  ('Freelance', 'income', NULL),
  ('Yatırım', 'income', NULL),
  ('Hediye', 'income', NULL),
  ('Diğer Gelir', 'income', NULL),
  ('Yiyecek', 'expense', NULL),
  ('Ulaşım', 'expense', NULL),
  ('Konut', 'expense', NULL),
  ('Faturalar', 'expense', NULL),
  ('Eğlence', 'expense', NULL),
  ('Sağlık', 'expense', NULL),
  ('Giyim', 'expense', NULL),
  ('Eğitim', 'expense', NULL),
  ('Diğer Gider', 'expense', NULL);

-- RLS politikalarının çalıştığından emin olalım
SELECT * FROM pg_policies WHERE tablename = 'categories'; 