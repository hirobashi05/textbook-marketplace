import bcrypt from "bcryptjs";
import {
  ListingCondition,
  ListingStatus,
  OrderStatus,
  PointTransactionType,
  TransactionStatus,
  UserStatus
} from "@prisma/client";
import { prisma } from "../src/utils/prisma.js";

function requireSeedImage(textbook: { imageUrl: string | null }) {
  if (!textbook.imageUrl) {
    throw new Error("Seed textbook image is required for a listing");
  }

  return textbook.imageUrl;
}

async function main() {
  await prisma.pointTransaction.deleteMany();
  await prisma.pointPurchase.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "taro@keio.jp" },
      update: {},
      create: {
        email: "taro@keio.jp",
        name: "山田太郎",
        passwordHash,
        paymentMethod: "campus_cash",
        points: 8000,
        userStatus: UserStatus.ACTIVE
      }
    }),
    prisma.user.upsert({
      where: { email: "sato@keio.ac.jp" },
      update: {},
      create: {
        email: "sato@keio.ac.jp",
        name: "佐藤花子",
        passwordHash,
        points: 6000,
        userStatus: UserStatus.ACTIVE
      }
    }),
    prisma.user.upsert({
      where: { email: "suzuki@appi.keio.ac.jp" },
      update: {},
      create: {
        email: "suzuki@appi.keio.ac.jp",
        name: "鈴木一郎",
        passwordHash,
        points: 6000,
        userStatus: UserStatus.ACTIVE
      }
    })
  ]);

  const textbooks = await Promise.all([
    prisma.textbookMaster.upsert({
      where: { isbn: "9780000000001" },
      update: {},
      create: {
        isbn: "9780000000001",
        title: "ミクロ経済学入門",
        publisher: "サンプル出版",
        listPrice: 3200,
        courseName: "ミクロ経済学",
        faculty: "経済学部",
        department: "経済学科",
        academicYear: 1,
        imageUrl: "/images/textbooks/microeconomics.jpg"
      }
    }),
    prisma.textbookMaster.upsert({
      where: { isbn: "9780000000002" },
      update: {},
      create: {
        isbn: "9780000000002",
        title: "現代会計学",
        publisher: "学術書房",
        listPrice: 2800,
        courseName: "財務会計",
        faculty: "商学部",
        department: "商学科",
        academicYear: 2,
        imageUrl: "/images/textbooks/accounting.jpg"
      }
    }),
    prisma.textbookMaster.upsert({
      where: { isbn: "9780000000003" },
      update: {},
      create: {
        isbn: "9780000000003",
        title: "データ構造とアルゴリズム",
        publisher: "情報科学出版",
        listPrice: 3600,
        courseName: "アルゴリズム論",
        faculty: "理工学部",
        department: "情報工学科",
        academicYear: 2,
        imageUrl: "/images/textbooks/algorithms.jpg"
      }
    }),
    prisma.textbookMaster.upsert({
      where: { isbn: "9780000000004" },
      update: {},
      create: {
        isbn: "9780000000004",
        title: "民法総則ベーシック",
        publisher: "法律文化社",
        listPrice: 3000,
        courseName: "民法総則",
        faculty: "法学部",
        department: "法学科",
        academicYear: 1,
        imageUrl: "/images/textbooks/civil-law.jpg"
      }
    }),
    prisma.textbookMaster.upsert({
      where: { isbn: "9780000000005" },
      update: {},
      create: {
        isbn: "9780000000005",
        title: "心理学概論",
        publisher: "人文社",
        listPrice: 2600,
        courseName: "心理学入門",
        faculty: "文学部",
        department: "人文社会学科",
        academicYear: 1,
        imageUrl: "/images/textbooks/psychology.jpg"
      }
    }),
    prisma.textbookMaster.upsert({
      where: { isbn: "9780000000006" },
      update: {},
      create: {
        isbn: "9780000000006",
        title: "統計学基礎",
        publisher: "データ教育出版",
        listPrice: 3400,
        courseName: "統計学",
        faculty: "経済学部",
        department: "経済学科",
        academicYear: 1,
        imageUrl: "/images/textbooks/statistics.jpg"
      }
    })
  ]);

  const listings = await prisma.$transaction([
    prisma.listing.create({
      data: {
        sellerId: users[1].uid,
        masterId: textbooks[0].id,
        sellingPrice: 1200,
        condition: ListingCondition.GOOD,
        description: "表紙に少し擦れがあります。",
        imageUrl: requireSeedImage(textbooks[0]),
        status: ListingStatus.AVAILABLE
      }
    }),
    prisma.listing.create({
      data: {
        sellerId: users[2].uid,
        masterId: textbooks[0].id,
        sellingPrice: 900,
        condition: ListingCondition.HAS_WRITING,
        description: "重要箇所にマーカーがあります。",
        imageUrl: requireSeedImage(textbooks[0]),
        status: ListingStatus.AVAILABLE
      }
    }),
    prisma.listing.create({
      data: {
        sellerId: users[0].uid,
        masterId: textbooks[1].id,
        sellingPrice: 1000,
        condition: ListingCondition.FAIR,
        description: "数ページに折れがあります。",
        imageUrl: requireSeedImage(textbooks[1]),
        status: ListingStatus.AVAILABLE
      }
    }),
    prisma.listing.create({
      data: {
        sellerId: users[1].uid,
        masterId: textbooks[2].id,
        sellingPrice: 1800,
        condition: ListingCondition.GOOD,
        description: "演習問題の書き込みはありません。",
        imageUrl: requireSeedImage(textbooks[2]),
        status: ListingStatus.AVAILABLE
      }
    }),
    prisma.listing.create({
      data: {
        sellerId: users[2].uid,
        masterId: textbooks[3].id,
        sellingPrice: 1500,
        condition: ListingCondition.NEW,
        description: "未使用です。",
        imageUrl: requireSeedImage(textbooks[3]),
        status: ListingStatus.AVAILABLE
      }
    }),
    prisma.listing.create({
      data: {
        sellerId: users[0].uid,
        masterId: textbooks[4].id,
        sellingPrice: 800,
        condition: ListingCondition.POOR,
        description: "カバーに破れがあります。",
        imageUrl: requireSeedImage(textbooks[4]),
        status: ListingStatus.CANCELLED
      }
    }),
    prisma.listing.create({
      data: {
        sellerId: users[1].uid,
        masterId: textbooks[4].id,
        sellingPrice: 1300,
        condition: ListingCondition.GOOD,
        description: "授業で一学期だけ使用しました。",
        imageUrl: requireSeedImage(textbooks[4]),
        status: ListingStatus.SOLD
      }
    }),
    prisma.listing.create({
      data: {
        sellerId: users[2].uid,
        masterId: textbooks[5].id,
        sellingPrice: 1600,
        condition: ListingCondition.FAIR,
        description: "背表紙に使用感があります。",
        imageUrl: requireSeedImage(textbooks[5]),
        status: ListingStatus.SOLD
      }
    })
  ]);

  await prisma.order.createMany({
    data: [
      {
        listingId: listings[6].id,
        buyerId: users[0].uid,
        shippingAddress: "東京都千代田区1-1-1",
        shippingFee: 300,
        totalAmount: listings[6].sellingPrice + 300,
        status: OrderStatus.PAID,
        transactionStatus: TransactionStatus.PREPARING_SHIPMENT
      },
      {
        listingId: listings[7].id,
        buyerId: users[1].uid,
        shippingAddress: "東京都新宿区2-2-2",
        shippingFee: 300,
        totalAmount: listings[7].sellingPrice + 300,
        status: OrderStatus.PAID,
        transactionStatus: TransactionStatus.SHIPPED
      }
    ]
  });

  const seededOrders = await prisma.order.findMany({
    where: { listingId: { in: [listings[6].id, listings[7].id] } }
  });
  const firstOrder = seededOrders.find((order) => order.listingId === listings[6].id)!;
  const secondOrder = seededOrders.find((order) => order.listingId === listings[7].id)!;

  await prisma.pointTransaction.createMany({
    data: [
      {
        userId: users[0].uid,
        type: PointTransactionType.TEXTBOOK_PURCHASE,
        amount: -firstOrder.totalAmount,
        balanceAfter: users[0].points,
        orderId: firstOrder.id,
        description: "教科書購入"
      },
      {
        userId: users[1].uid,
        type: PointTransactionType.TEXTBOOK_SALE,
        amount: firstOrder.totalAmount,
        balanceAfter: users[1].points,
        orderId: firstOrder.id,
        description: "教科書販売による獲得"
      },
      {
        userId: users[1].uid,
        type: PointTransactionType.TEXTBOOK_PURCHASE,
        amount: -secondOrder.totalAmount,
        balanceAfter: users[1].points,
        orderId: secondOrder.id,
        description: "教科書購入"
      },
      {
        userId: users[2].uid,
        type: PointTransactionType.TEXTBOOK_SALE,
        amount: secondOrder.totalAmount,
        balanceAfter: users[2].points,
        orderId: secondOrder.id,
        description: "教科書販売による獲得"
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
