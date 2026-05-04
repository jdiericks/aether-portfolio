ALTER TABLE "Testimonial"
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Testimonial'
      AND column_name = 'photoUrl'
  ) THEN
    EXECUTE 'UPDATE "Testimonial" SET "imageUrl" = "photoUrl" WHERE "imageUrl" IS NULL';
  END IF;
END $$;
