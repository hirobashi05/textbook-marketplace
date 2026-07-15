INSERT OR IGNORE INTO "point_transactions" (
  "id",
  "userId",
  "type",
  "amount",
  "balanceAfter",
  "pointPurchaseId",
  "description",
  "createdAt"
)
SELECT
  'legacy-point-purchase-' || purchase."id",
  purchase."userId",
  'point_purchase',
  purchase."amount",
  user."points",
  purchase."id",
  '既存のポイント購入履歴から移行',
  purchase."createdAt"
FROM "point_purchases" AS purchase
JOIN "users" AS user ON user."uid" = purchase."userId"
WHERE purchase."status" = 'paid';
