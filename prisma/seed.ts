import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminHash = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@urbench.com" },
    update: {},
    create: {
      name: "Uvesh Samol",
      email: "admin@urbench.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const recruiterHash = await bcrypt.hash("Recruiter1234!", 12);
  await prisma.user.upsert({
    where: { email: "recruiter@urbench.com" },
    update: {},
    create: {
      name: "Recruiter One",
      email: "recruiter@urbench.com",
      passwordHash: recruiterHash,
      role: "RECRUITER",
    },
  });

  const salesHash = await bcrypt.hash("Sales1234!", 12);
  await prisma.user.upsert({
    where: { email: "sales@urbench.com" },
    update: {},
    create: {
      name: "Sales One",
      email: "sales@urbench.com",
      passwordHash: salesHash,
      role: "SALES",
    },
  });

  await prisma.client.upsert({
    where: { id: "sample-client-001" },
    update: {},
    create: {
      id: "sample-client-001",
      name: "Acme Corporation",
      industry: "Manufacturing",
      rateAgreement: "markup_18_percent",
      notes: "Key client",
    },
  });

  console.log("\n✅ Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👤 Admin:     admin@urbench.com     / Admin1234!");
  console.log("👤 Recruiter: recruiter@urbench.com / Recruiter1234!");
  console.log("👤 Sales:     sales@urbench.com     / Sales1234!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚠️  CHANGE ALL PASSWORDS AFTER FIRST LOGIN!\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());