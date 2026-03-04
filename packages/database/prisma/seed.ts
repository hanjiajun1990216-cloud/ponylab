import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create users
  const adminHash = await bcrypt.hash("admin123!", 12);
  const piHash = await bcrypt.hash("pi123456!", 12);
  const researcherHash = await bcrypt.hash("research!", 12);
  const techHash = await bcrypt.hash("tech1234!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ponylab.io" },
    update: {},
    create: {
      email: "admin@ponylab.io",
      passwordHash: adminHash,
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  const pi = await prisma.user.upsert({
    where: { email: "pi@lab.edu" },
    update: {},
    create: {
      email: "pi@lab.edu",
      passwordHash: piHash,
      firstName: "Sarah",
      lastName: "Chen",
      role: "PI",
    },
  });

  const researcher = await prisma.user.upsert({
    where: { email: "researcher@lab.edu" },
    update: {},
    create: {
      email: "researcher@lab.edu",
      passwordHash: researcherHash,
      firstName: "Alex",
      lastName: "Kim",
      role: "RESEARCHER",
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: "tech@lab.edu" },
    update: {},
    create: {
      email: "tech@lab.edu",
      passwordHash: techHash,
      firstName: "Mike",
      lastName: "Johnson",
      role: "TECHNICIAN",
    },
  });

  // Create team
  const team = await prisma.team.create({
    data: {
      name: "Biochemistry Lab",
      description: "Research team for protein analysis and drug discovery",
      members: {
        create: [
          { userId: pi.id, role: "OWNER" },
          { userId: researcher.id, role: "MEMBER" },
          { userId: tech.id, role: "MEMBER" },
          { userId: admin.id, role: "ADMIN" },
        ],
      },
    },
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      name: "Protein Expression Optimization",
      description: "Optimizing expression conditions for recombinant proteins",
      teamId: team.id,
    },
  });

  // Create experiments
  const exp1 = await prisma.experiment.create({
    data: {
      title: "GFP Expression in E. coli BL21",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Objective" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Optimize GFP expression conditions using IPTG induction in E. coli BL21(DE3).",
              },
            ],
          },
        ],
      },
      status: "IN_PROGRESS",
      projectId: project.id,
      authorId: researcher.id,
    },
  });

  const exp2 = await prisma.experiment.create({
    data: {
      title: "Western Blot - Anti-GFP",
      status: "DRAFT",
      projectId: project.id,
      authorId: researcher.id,
    },
  });

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Prepare LB media",
        status: "DONE",
        priority: 1,
        experimentId: exp1.id,
        assigneeId: tech.id,
      },
      {
        title: "Transform BL21 with pET-GFP",
        status: "DONE",
        priority: 2,
        experimentId: exp1.id,
        assigneeId: researcher.id,
      },
      {
        title: "IPTG induction (0.1-1.0 mM range)",
        status: "IN_PROGRESS",
        priority: 3,
        experimentId: exp1.id,
        assigneeId: researcher.id,
      },
      {
        title: "Harvest and lyse cells",
        status: "TODO",
        priority: 4,
        experimentId: exp1.id,
        assigneeId: tech.id,
      },
      {
        title: "SDS-PAGE analysis",
        status: "TODO",
        priority: 5,
        experimentId: exp1.id,
        assigneeId: researcher.id,
      },
    ],
  });

  // Create samples
  const freezer = await prisma.storageLocation.create({
    data: {
      name: "Freezer -80°C #1",
      type: "FREEZER",
      temperature: -80,
    },
  });

  const box = await prisma.storageLocation.create({
    data: {
      name: "Box A1",
      type: "BOX",
      parentId: freezer.id,
      gridRows: 9,
      gridCols: 9,
      capacity: 81,
    },
  });

  await prisma.sample.createMany({
    data: [
      {
        name: "pET-28a-GFP plasmid",
        sampleType: "Plasmid",
        barcode: "PL-2026-0001",
        status: "AVAILABLE",
        storageId: box.id,
        storagePosition: "A1",
        createdById: researcher.id,
      },
      {
        name: "BL21(DE3) glycerol stock",
        sampleType: "Bacterial Stock",
        barcode: "BS-2026-0001",
        status: "AVAILABLE",
        storageId: box.id,
        storagePosition: "A2",
        createdById: tech.id,
      },
      {
        name: "GFP lysate - 0.5mM IPTG",
        sampleType: "Cell Lysate",
        barcode: "LY-2026-0001",
        status: "IN_USE",
        experimentId: exp1.id,
        createdById: researcher.id,
      },
    ],
  });

  // Create inventory
  await prisma.inventoryItem.createMany({
    data: [
      {
        name: "IPTG (1M stock)",
        category: "Reagent",
        sku: "SIGMA-I6758",
        quantity: 5,
        unit: "mL",
        minQuantity: 2,
        supplier: "Sigma-Aldrich",
        catalogNumber: "I6758",
      },
      {
        name: "LB Broth (Miller)",
        category: "Media",
        sku: "BD-244620",
        quantity: 2500,
        unit: "g",
        minQuantity: 500,
        supplier: "BD Difco",
        catalogNumber: "244620",
      },
      {
        name: "Ampicillin (100mg/mL)",
        category: "Antibiotic",
        quantity: 10,
        unit: "mL",
        minQuantity: 5,
        supplier: "Thermo Fisher",
      },
      {
        name: "SDS-PAGE gel (4-20%)",
        category: "Consumable",
        sku: "BIO-4561094",
        quantity: 3,
        unit: "pack",
        minQuantity: 2,
        supplier: "Bio-Rad",
        catalogNumber: "4561094",
      },
      {
        name: "Anti-GFP antibody",
        category: "Antibody",
        quantity: 50,
        unit: "µL",
        minQuantity: 20,
        supplier: "Abcam",
        catalogNumber: "ab290",
      },
    ],
  });

  // Create protocols
  const protocol = await prisma.protocol.create({
    data: {
      name: "Bacterial Transformation (Heat Shock)",
      description: "Standard heat shock transformation protocol for E. coli",
      category: "Molecular Biology",
      authorId: pi.id,
      isPublished: true,
      versions: {
        create: {
          version: 1,
          content: {
            steps: [
              { order: 1, title: "Thaw competent cells", duration: "10 min", description: "Thaw on ice for 10 minutes" },
              { order: 2, title: "Add DNA", duration: "1 min", description: "Add 1-5 µL of plasmid DNA, mix gently" },
              { order: 3, title: "Incubate on ice", duration: "30 min", description: "Incubate on ice for 30 minutes" },
              { order: 4, title: "Heat shock", duration: "45 sec", description: "42°C water bath for exactly 45 seconds" },
              { order: 5, title: "Ice recovery", duration: "2 min", description: "Return to ice for 2 minutes" },
              { order: 6, title: "Add SOC media", duration: "1 min", description: "Add 250 µL pre-warmed SOC media" },
              { order: 7, title: "Recovery incubation", duration: "1 hr", description: "37°C shaker at 250 rpm for 1 hour" },
              { order: 8, title: "Plate", duration: "5 min", description: "Plate 50-200 µL on selective agar plates" },
            ],
          },
        },
      },
    },
  });

  // Create instruments
  const spectro = await prisma.instrument.create({
    data: {
      name: "UV-Vis Spectrophotometer",
      manufacturer: "Agilent",
      model: "Cary 60",
      serialNumber: "MY2024A001",
      location: "Room 301",
      status: "AVAILABLE",
    },
  });

  await prisma.instrument.create({
    data: {
      name: "Incubator Shaker",
      manufacturer: "New Brunswick",
      model: "Innova 44",
      serialNumber: "NB2024S002",
      location: "Room 305",
      status: "IN_USE",
    },
  });

  await prisma.instrument.create({
    data: {
      name: "FPLC System",
      manufacturer: "Cytiva",
      model: "ÄKTA pure 25",
      serialNumber: "CY2023F001",
      location: "Room 302",
      status: "AVAILABLE",
    },
  });

  // Create a booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(12, 0, 0, 0);

  await prisma.booking.create({
    data: {
      instrumentId: spectro.id,
      userId: researcher.id,
      title: "OD600 measurements for IPTG induction",
      startTime: tomorrow,
      endTime: tomorrowEnd,
    },
  });

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "REGISTER",
        entityType: "User",
        entityId: admin.id,
        newValue: { email: "admin@ponylab.io" },
      },
      {
        userId: researcher.id,
        action: "CREATE",
        entityType: "Experiment",
        entityId: exp1.id,
        newValue: { title: exp1.title },
      },
      {
        userId: researcher.id,
        action: "UPDATE",
        entityType: "Experiment",
        entityId: exp1.id,
        oldValue: { status: "DRAFT" },
        newValue: { status: "IN_PROGRESS" },
      },
    ],
  });

  console.log("Seed completed!");
  console.log("  Users: admin@ponylab.io / admin123!");
  console.log("  PI: pi@lab.edu / pi123456!");
  console.log("  Researcher: researcher@lab.edu / research!");
  console.log("  Technician: tech@lab.edu / tech1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
