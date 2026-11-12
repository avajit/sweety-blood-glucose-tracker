-- AlterTable: Add CHECK constraint for physiologically plausible blood glucose values (40 to 600 mg/dl)
ALTER TABLE "Reading"
  ADD CONSTRAINT "reading_value_range"
  CHECK (value >= 40 AND value <= 600);

