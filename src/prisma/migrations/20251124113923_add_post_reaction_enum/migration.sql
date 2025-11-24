-- CreateEnum
CREATE TYPE "PostReaction" AS ENUM ('like', 'love', 'haha', 'wow', 'sad', 'angry');

-- AlterTable: Convert TEXT column to enum type
-- Step 1: Add new column with enum type
ALTER TABLE "res_post_like" ADD COLUMN "reaction_new" "PostReaction" NOT NULL DEFAULT 'like';

-- Step 2: Migrate existing data (convert string to enum)
UPDATE "res_post_like" 
SET "reaction_new" = CASE 
  WHEN "reaction" IN ('like', 'love', 'haha', 'wow', 'sad', 'angry') 
  THEN "reaction"::"PostReaction"
  ELSE 'like'::"PostReaction"
END;

-- Step 3: Drop old column
ALTER TABLE "res_post_like" DROP COLUMN "reaction";

-- Step 4: Rename new column to original name
ALTER TABLE "res_post_like" RENAME COLUMN "reaction_new" TO "reaction";

