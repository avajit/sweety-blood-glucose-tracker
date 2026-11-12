-- AlterTable: Add optional carbs_grams and insulin_units to Reading
ALTER TABLE "Reading" ADD COLUMN "carbs_grams" INTEGER;
ALTER TABLE "Reading" ADD COLUMN "insulin_units" DOUBLE PRECISION;

