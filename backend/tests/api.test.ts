import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ListingCondition, ListingStatus, PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.join(os.tmpdir(), `textbook-marketplace-${Date.now()}.db`);

process.env.DATABASE_URL = `file:${testDbPath.replace(/\\/g, "/")}`;
process.env.JWT_SECRET = "test-secret-at-least-32-characters";
process.env.UNIVERSITY_EMAIL_DOMAINS = "keio.jp,keio.ac.jp,*.keio.ac.jp";
process.env.CORS_ORIGIN = "http://localhost:5173";

const { app } = await import("../src/app.js");
const { prisma: appPrisma } = await import("../src/utils/prisma.js");
const prisma = new PrismaClient();

async function applyMigration() {
  const migrationsPath = path.resolve(__dirname, "../prisma/migrations");
  const migrationDirs = fs
    .readdirSync(migrationsPath)
    .filter((entry) => fs.statSync(path.join(migrationsPath, entry)).isDirectory())
    .sort();

  for (const dir of migrationDirs) {
    const migrationPath = path.join(migrationsPath, dir, "migration.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");
    const statements = sql
      .split(";\n")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  }
}

async function resetData() {
  await prisma.pointTransaction.deleteMany();
  await prisma.pointPurchase.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.textbookMaster.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(email: string, password = "password123", points = 0) {
  const response = await request(app).post("/users").send({
    email,
    name: email.split("@")[0],
    password
  });

  if (response.status === 201 && points > 0) {
    await prisma.user.update({
      where: { email },
      data: { points }
    });
  }

  return response;
}

async function login(email: string, password = "password123") {
  const response = await request(app).post("/auth/login").send({ email, password });
  return response.body.token as string;
}

async function createTextbook() {
  return prisma.textbookMaster.create({
    data: {
      isbn: `978${Math.floor(Math.random() * 10000000000).toString().padStart(10, "0")}`,
      title: "ミクロ経済学入門",
      publisher: "サンプル出版",
      listPrice: 3200,
      courseName: "ミクロ経済学",
      faculty: "経済学部",
      department: "経済学科",
      academicYear: 1,
      imageUrl: "/images/textbooks/microeconomics.jpg"
    }
  });
}

async function createListingForSeller(sellerId: string, status: ListingStatus = ListingStatus.AVAILABLE) {
  const textbook = await createTextbook();

  return prisma.listing.create({
    data: {
      sellerId,
      masterId: textbook.id,
      sellingPrice: 1200,
      condition: ListingCondition.GOOD,
      description: "テスト出品",
      imageUrl: "/images/textbooks/microeconomics.jpg",
      status
    }
  });
}

beforeAll(async () => {
  await applyMigration();
});

beforeEach(async () => {
  await resetData();
});

afterAll(async () => {
  await Promise.all([prisma.$disconnect(), appPrisma.$disconnect()]);

  for (let attempt = 0; attempt < 10 && fs.existsSync(testDbPath); attempt += 1) {
    try {
      await fs.promises.unlink(testDbPath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if ((code !== "EBUSY" && code !== "EPERM") || attempt === 9) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
});

describe("ユーザー登録", () => {
  it("大学メールなら登録成功", async () => {
    const response = await createUser("student@keio.jp");

    expect(response.status).toBe(201);
    expect(response.body.email).toBe("student@keio.jp");
    expect(response.body.passwordHash).toBeUndefined();
  });

  it("@keio.ac.jp なら登録成功", async () => {
    const response = await createUser("student@keio.ac.jp");

    expect(response.status).toBe(201);
    expect(response.body.email).toBe("student@keio.ac.jp");
  });

  it("@appi.keio.ac.jp のような keio.ac.jp サブドメインなら登録成功", async () => {
    const response = await createUser("student@appi.keio.ac.jp");

    expect(response.status).toBe(201);
    expect(response.body.email).toBe("student@appi.keio.ac.jp");
  });

  it("大学メール以外なら登録失敗", async () => {
    const response = await createUser("student@example.ac.jp");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("EMAIL_DOMAIN_NOT_ALLOWED");
  });

  it("同一 email は登録失敗", async () => {
    await createUser("student@keio.jp");
    const response = await createUser("student@keio.jp");

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("短すぎる password は登録失敗", async () => {
    const response = await createUser("short@keio.jp", "short");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("ポイントを購入できる", async () => {
    await createUser("wallet@keio.jp");
    const token = await login("wallet@keio.jp");

    const response = await request(app)
      .post("/users/me/points/purchase")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 5000,
        paymentMethod: "credit_card"
      });

    expect(response.status).toBe(201);
    expect(response.body.user.points).toBe(5000);
    expect(response.body.pointPurchase.status).toBe("paid");

    const history = await request(app)
      .get("/users/me/point-history")
      .set("Authorization", `Bearer ${token}`);
    expect(history.status).toBe(200);
    expect(history.body[0].type).toBe("point_purchase");
    expect(history.body[0].amount).toBe(5000);
  });

  it("支払い設定を保存して取得できる", async () => {
    await createUser("payments@keio.jp");
    const token = await login("payments@keio.jp");

    const saveResponse = await request(app)
      .patch("/users/me/payment-settings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        preferredMethod: "credit_card",
        creditCard: {
          holderName: "Keio Student",
          brand: "visa",
          last4: "4242",
          expiryMonth: 12,
          expiryYear: 2030
        },
        convenienceStore: {
          chain: "familymart",
          payerName: "Keio Student",
          payerPhone: "09012345678"
        }
      });

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.paymentSettings.preferredMethod).toBe("credit_card");

    const getResponse = await request(app)
      .get("/users/me/payment-settings")
      .set("Authorization", `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.creditCard.last4).toBe("4242");
    expect(getResponse.body.convenienceStore.chain).toBe("familymart");
  });
});

describe("出品", () => {
  it("ログイン済みユーザーは出品できる", async () => {
    await createUser("seller@keio.jp");
    const token = await login("seller@keio.jp");
    const textbook = await createTextbook();

    const response = await request(app)
      .post("/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        masterId: textbook.id,
        sellingPrice: 1200,
        condition: "good",
        imageUrl: "/images/textbooks/microeconomics.jpg",
        description: "少し書き込みがあります"
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("available");
  });

  it("未ログインユーザーは出品できない", async () => {
    const textbook = await createTextbook();

    const response = await request(app).post("/listings").send({
      masterId: textbook.id,
      sellingPrice: 1200,
      condition: "good",
      imageUrl: "/images/textbooks/microeconomics.jpg"
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("価格が負数の場合は失敗", async () => {
    await createUser("seller@keio.jp");
    const token = await login("seller@keio.jp");
    const textbook = await createTextbook();

    const response = await request(app)
      .post("/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        masterId: textbook.id,
        sellingPrice: -1,
        condition: "good",
        imageUrl: "/images/textbooks/microeconomics.jpg"
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("商品画像がない場合は失敗", async () => {
    await createUser("seller@keio.jp");
    const token = await login("seller@keio.jp");
    const textbook = await createTextbook();

    const response = await request(app)
      .post("/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        masterId: textbook.id,
        sellingPrice: 1200,
        condition: "good"
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("教科書マスタ", () => {
  it("許可された学部学科で登録できる", async () => {
    await createUser("master-owner@keio.jp");
    const token = await login("master-owner@keio.jp");

    const response = await request(app)
      .post("/textbooks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        isbn: "9781234567890",
        title: "経済史入門",
        publisher: "テスト出版",
        listPrice: 2800,
        courseName: "経済史",
        faculty: "経済学部",
        department: "経済学科",
        academicYear: 2,
        imageUrl: "/images/textbooks/microeconomics.jpg"
      });

    expect(response.status).toBe(201);
    expect(response.body.faculty).toBe("経済学部");
    expect(response.body.department).toBe("経済学科");
  });

  it("許可されていない学部は登録できない", async () => {
    await createUser("master-owner@keio.jp");
    const token = await login("master-owner@keio.jp");

    const response = await request(app)
      .post("/textbooks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        isbn: "9781234567891",
        title: "工学概論",
        publisher: "テスト出版",
        listPrice: 2800,
        courseName: "工学概論",
        faculty: "工学部",
        department: "情報工学科",
        academicYear: 2,
        imageUrl: "/images/textbooks/microeconomics.jpg"
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("学部と学科の組み合わせが不正なら登録できない", async () => {
    await createUser("master-owner@keio.jp");
    const token = await login("master-owner@keio.jp");

    const response = await request(app)
      .post("/textbooks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        isbn: "9781234567892",
        title: "理論会計",
        publisher: "テスト出版",
        listPrice: 2800,
        courseName: "理論会計",
        faculty: "商学部",
        department: "情報工学科",
        academicYear: 2,
        imageUrl: "/images/textbooks/microeconomics.jpg"
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("購入", () => {
  it("available の出品を購入でき、listing.status が sold になる", async () => {
    await createUser("seller@keio.jp");
    await createUser("buyer@keio.jp", "password123", 5000);
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "seller@keio.jp" } });
    const listing = await createListingForSeller(seller.uid);
    const buyerToken = await login("buyer@keio.jp");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        listingId: listing.id,
        shippingAddress: "東京都千代田区1-1-1",
        shippingFee: 300
      });

    expect(response.status).toBe(201);
    expect(response.body.totalAmount).toBe(1500);
    expect(response.body.listingStatus).toBe("sold");
    expect(response.body.buyerPointsBalance).toBe(3500);
    expect(response.body.sellerPointsBalance).toBe(1500);
    expect(response.body.transactionStatus).toBe("awaiting_seller_confirmation");

    const updated = await prisma.listing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(updated.status).toBe(ListingStatus.SOLD);

    const pointTransactions = await prisma.pointTransaction.findMany({
      where: { orderId: response.body.orderId },
      orderBy: { amount: "asc" }
    });
    expect(pointTransactions).toHaveLength(2);
    expect(pointTransactions[0].amount).toBe(-1500);
    expect(pointTransactions[1].amount).toBe(1500);
  });

  it("ポイント不足なら購入できない", async () => {
    await createUser("seller@keio.jp");
    await createUser("buyer@keio.jp", "password123", 100);
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "seller@keio.jp" } });
    const listing = await createListingForSeller(seller.uid);
    const buyerToken = await login("buyer@keio.jp");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        listingId: listing.id,
        shippingAddress: "東京都千代田区1-1-1",
        shippingFee: 300
      });

    expect(response.status).toBe(402);
    expect(response.body.error.code).toBe("INSUFFICIENT_POINTS");
  });

  it("sold の出品は購入できない", async () => {
    await createUser("seller@keio.jp");
    await createUser("buyer@keio.jp", "password123", 5000);
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "seller@keio.jp" } });
    const listing = await createListingForSeller(seller.uid, ListingStatus.SOLD);
    const buyerToken = await login("buyer@keio.jp");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        listingId: listing.id,
        shippingAddress: "東京都千代田区1-1-1",
        shippingFee: 300
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("LISTING_NOT_AVAILABLE");
  });

  it("cancelled の出品は購入できない", async () => {
    await createUser("seller@keio.jp");
    await createUser("buyer@keio.jp", "password123", 5000);
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "seller@keio.jp" } });
    const listing = await createListingForSeller(seller.uid, ListingStatus.CANCELLED);
    const buyerToken = await login("buyer@keio.jp");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        listingId: listing.id,
        shippingAddress: "東京都千代田区1-1-1",
        shippingFee: 300
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("LISTING_NOT_AVAILABLE");
  });

  it("自分の出品は購入できない", async () => {
    await createUser("seller@keio.jp");
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "seller@keio.jp" } });
    const listing = await createListingForSeller(seller.uid);
    const sellerToken = await login("seller@keio.jp");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        listingId: listing.id,
        shippingAddress: "東京都千代田区1-1-1",
        shippingFee: 300
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CANNOT_BUY_OWN_LISTING");
  });

  it("同じ listing に対して二重購入できない", async () => {
    await createUser("seller@keio.jp");
    await createUser("buyer1@keio.jp", "password123", 5000);
    await createUser("buyer2@keio.jp", "password123", 5000);
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "seller@keio.jp" } });
    const listing = await createListingForSeller(seller.uid);
    const buyer1Token = await login("buyer1@keio.jp");
    const buyer2Token = await login("buyer2@keio.jp");

    const first = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${buyer1Token}`)
      .send({
        listingId: listing.id,
        shippingAddress: "東京都千代田区1-1-1",
        shippingFee: 300
      });

    const second = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${buyer2Token}`)
      .send({
        listingId: listing.id,
        shippingAddress: "東京都千代田区1-1-1",
        shippingFee: 300
      });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("LISTING_NOT_AVAILABLE");

    const count = await prisma.order.count({ where: { listingId: listing.id } });
    expect(count).toBe(1);
  });
});

describe("取引ステータス", () => {
  it("出品者確認から発送、購入者の受け取り完了まで遷移できる", async () => {
    await createUser("status-seller@keio.jp");
    await createUser("status-buyer@keio.jp", "password123", 5000);
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "status-seller@keio.jp" } });
    const listing = await createListingForSeller(seller.uid);
    const sellerToken = await login("status-seller@keio.jp");
    const buyerToken = await login("status-buyer@keio.jp");

    const purchase = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ listingId: listing.id, shippingAddress: "東京都港区1-1-1", shippingFee: 300 });

    const preparing = await request(app)
      .patch(`/orders/${purchase.body.orderId}/transaction-status`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ transactionStatus: "preparing_shipment" });
    expect(preparing.status).toBe(200);
    expect(preparing.body.transactionStatus).toBe("preparing_shipment");

    const shipped = await request(app)
      .patch(`/orders/${purchase.body.orderId}/transaction-status`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ transactionStatus: "shipped" });
    expect(shipped.status).toBe(200);

    const completed = await request(app)
      .patch(`/orders/${purchase.body.orderId}/transaction-status`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ transactionStatus: "completed" });
    expect(completed.status).toBe(200);
    expect(completed.body.transactionStatus).toBe("completed");
  });

  it("発送前の取引はキャンセル申請中へ遷移できる", async () => {
    await createUser("cancel-seller@keio.jp");
    await createUser("cancel-buyer@keio.jp", "password123", 5000);
    const seller = await prisma.user.findUniqueOrThrow({ where: { email: "cancel-seller@keio.jp" } });
    const listing = await createListingForSeller(seller.uid);
    const buyerToken = await login("cancel-buyer@keio.jp");

    const purchase = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ listingId: listing.id, shippingAddress: "東京都港区1-1-1", shippingFee: 300 });
    const cancelled = await request(app)
      .patch(`/orders/${purchase.body.orderId}/transaction-status`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ transactionStatus: "cancellation_requested" });

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.transactionStatus).toBe("cancellation_requested");
  });
});
