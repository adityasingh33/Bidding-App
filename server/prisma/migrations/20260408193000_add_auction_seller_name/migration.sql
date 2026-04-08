ALTER TABLE "Auction"
ADD COLUMN "sellerName" TEXT;

UPDATE "Auction" AS a
SET "sellerName" = COALESCE(
  NULLIF(
    BTRIM(
      INITCAP(
        REGEXP_REPLACE(SPLIT_PART(u."email", '@', 1), '[._-]+', ' ', 'g')
      )
    ),
    ''
  ),
  u."email"
)
FROM "User" AS u
WHERE a."sellerId" = u."id";

UPDATE "Auction"
SET "sellerName" = 'Unknown Seller'
WHERE "sellerName" IS NULL OR BTRIM("sellerName") = '';

ALTER TABLE "Auction"
ALTER COLUMN "sellerName" SET NOT NULL;
