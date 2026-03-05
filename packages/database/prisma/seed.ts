import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── 0. Clean up existing data (reverse FK order) ───
  console.log("  Cleaning existing data...");
  await prisma.comment.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.taskStep.deleteMany();
  await prisma.taskParticipant.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskInventoryUsage.deleteMany();
  await prisma.protocolExecutionStep.deleteMany();
  await prisma.protocolExecution.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.experimentTag.deleteMany();
  await prisma.result.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.inventoryColumn.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.sampleEvent.deleteMany();
  await prisma.sample.deleteMany();
  await prisma.storageLocation.deleteMany();
  await prisma.task.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.protocolVersion.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.project.deleteMany();
  await prisma.direction.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.teamApplication.deleteMany();
  await prisma.functionalRole.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.experimentTemplate.deleteMany();
  await prisma.fileAttachment.deleteMany();
  await prisma.user.deleteMany();
  console.log("  Existing data cleaned.");

  // ─── 1. Users ───
  const adminHash = await bcrypt.hash("admin123!", 12);
  const piHash = await bcrypt.hash("pi123456!", 12);
  const researcherHash = await bcrypt.hash("research!", 12);
  const techHash = await bcrypt.hash("tech1234!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ponylab.io" },
    update: {
      role: "SUPER_ADMIN",
      userColor: "#6366f1",
    },
    create: {
      email: "admin@ponylab.io",
      passwordHash: adminHash,
      firstName: "System",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      userColor: "#6366f1",
    },
  });

  const pi = await prisma.user.upsert({
    where: { email: "pi@lab.edu" },
    update: { userColor: "#0ea5e9" },
    create: {
      email: "pi@lab.edu",
      passwordHash: piHash,
      firstName: "Sarah",
      lastName: "Chen",
      role: "PI",
      userColor: "#0ea5e9",
    },
  });

  const researcher = await prisma.user.upsert({
    where: { email: "researcher@lab.edu" },
    update: { userColor: "#22c55e" },
    create: {
      email: "researcher@lab.edu",
      passwordHash: researcherHash,
      firstName: "Alex",
      lastName: "Kim",
      role: "RESEARCHER",
      userColor: "#22c55e",
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: "tech@lab.edu" },
    update: { userColor: "#f59e0b" },
    create: {
      email: "tech@lab.edu",
      passwordHash: techHash,
      firstName: "Mike",
      lastName: "Johnson",
      role: "TECHNICIAN",
      userColor: "#f59e0b",
    },
  });

  console.log("  Users created.");

  // ─── 2. Team (visibility: CLOSED) ───
  const team = await prisma.team.create({
    data: {
      name: "Biochemistry Lab",
      description: "Research team for protein analysis and drug discovery",
      visibility: "CLOSED",
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

  console.log("  Team created.");

  // ─── 3. Functional Roles (tech 用户: INSTRUMENT_ADMIN + INVENTORY_ADMIN) ───
  await prisma.functionalRole.createMany({
    data: [
      {
        userId: tech.id,
        teamId: team.id,
        role: "INSTRUMENT_ADMIN",
        assignedBy: admin.id,
      },
      {
        userId: tech.id,
        teamId: team.id,
        role: "INVENTORY_ADMIN",
        assignedBy: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("  Functional roles assigned.");

  // ─── 4. Direction (研究方向) ───
  const direction = await prisma.direction.create({
    data: {
      name: "Recombinant Protein Production",
      description: "Research focus on optimizing expression and purification of recombinant proteins",
      leadId: pi.id,
      teamId: team.id,
      color: "#0ea5e9",
      status: "ACTIVE",
    },
  });

  console.log("  Direction created.");

  // ─── 5. Project (含 directionId + leadId) ───
  const project = await prisma.project.create({
    data: {
      name: "Protein Expression Optimization",
      description: "Optimizing expression conditions for recombinant proteins",
      teamId: team.id,
      directionId: direction.id,
      leadId: pi.id,
    },
  });

  console.log("  Project created.");

  // ─── 6. Experiments ───
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

  console.log("  Experiments created.");

  // ─── 7. Tasks (含 projectId，不再只依赖 experimentId) ───
  const task1 = await prisma.task.create({
    data: {
      title: "Prepare LB media",
      status: "DONE",
      priority: 1,
      projectId: project.id,
      experimentId: exp1.id,
      assigneeId: tech.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Transform BL21 with pET-GFP",
      status: "DONE",
      priority: 2,
      projectId: project.id,
      experimentId: exp1.id,
      assigneeId: researcher.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "IPTG induction (0.1-1.0 mM range)",
      status: "IN_PROGRESS",
      priority: 3,
      projectId: project.id,
      experimentId: exp1.id,
      assigneeId: researcher.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Harvest and lyse cells",
      status: "TODO",
      priority: 4,
      projectId: project.id,
      experimentId: exp1.id,
      assigneeId: tech.id,
    },
  });

  // Project-level task (no experimentId)
  const task5 = await prisma.task.create({
    data: {
      title: "Submit monthly progress report",
      description: "Compile results from all ongoing experiments and submit to PI",
      status: "TODO",
      priority: 1,
      projectId: project.id,
      assigneeId: researcher.id,
      leadId: pi.id,
      isMilestone: true,
    },
  });

  console.log("  Tasks created.");

  // ─── 8. TaskSteps ───
  await prisma.taskStep.createMany({
    data: [
      {
        taskId: task3.id,
        title: "Prepare IPTG dilutions (0.1, 0.5, 1.0 mM)",
        sortOrder: 1,
        status: "COMPLETED",
        assigneeId: tech.id,
      },
      {
        taskId: task3.id,
        title: "Induce cultures at OD600 = 0.6",
        sortOrder: 2,
        status: "IN_PROGRESS",
        assigneeId: researcher.id,
      },
      {
        taskId: task3.id,
        title: "Incubate 4h at 37°C, 250 rpm",
        sortOrder: 3,
        status: "PENDING",
        assigneeId: researcher.id,
      },
      {
        taskId: task3.id,
        title: "Measure fluorescence via plate reader",
        sortOrder: 4,
        status: "PENDING",
        assigneeId: researcher.id,
      },
    ],
  });

  await prisma.taskStep.createMany({
    data: [
      {
        taskId: task5.id,
        title: "Collect raw data from all experiments",
        sortOrder: 1,
        status: "PENDING",
        assigneeId: researcher.id,
      },
      {
        taskId: task5.id,
        title: "Draft report outline",
        sortOrder: 2,
        status: "PENDING",
        assigneeId: researcher.id,
      },
      {
        taskId: task5.id,
        title: "PI review and approval",
        sortOrder: 3,
        status: "PENDING",
        assigneeId: pi.id,
      },
    ],
  });

  console.log("  TaskSteps created.");

  // ─── 9. Samples ───
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

  console.log("  Samples created.");

  // ─── 10. Inventory ───
  const iptgItem = await prisma.inventoryItem.create({
    data: {
      name: "IPTG (1M stock)",
      category: "Reagent",
      sku: "SIGMA-I6758",
      quantity: 5,
      unit: "mL",
      minQuantity: 2,
      supplier: "Sigma-Aldrich",
      catalogNumber: "I6758",
      teamId: team.id,
    },
  });

  await prisma.inventoryItem.createMany({
    data: [
      {
        name: "LB Broth (Miller)",
        category: "Media",
        sku: "BD-244620",
        quantity: 2500,
        unit: "g",
        minQuantity: 500,
        supplier: "BD Difco",
        catalogNumber: "244620",
        teamId: team.id,
      },
      {
        name: "Ampicillin (100mg/mL)",
        category: "Antibiotic",
        quantity: 10,
        unit: "mL",
        minQuantity: 5,
        supplier: "Thermo Fisher",
        teamId: team.id,
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
        teamId: team.id,
      },
      {
        name: "Anti-GFP antibody",
        category: "Antibody",
        quantity: 50,
        unit: "µL",
        minQuantity: 20,
        supplier: "Abcam",
        catalogNumber: "ab290",
        teamId: team.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("  Inventory created.");

  // ─── 11. Protocols ───
  await prisma.protocol.create({
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

  console.log("  Protocol created.");

  // ─── 12. Instruments ───
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

  const shaker = await prisma.instrument.create({
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

  console.log("  Instruments created.");

  // ─── 13. Bookings (多人多时段) ───
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(12, 0, 0, 0);

  const tomorrow2Start = new Date(tomorrow);
  tomorrow2Start.setHours(13, 0, 0, 0);
  const tomorrow2End = new Date(tomorrow);
  tomorrow2End.setHours(15, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(10, 0, 0, 0);
  const dayAfterEnd = new Date(dayAfter);
  dayAfterEnd.setHours(16, 0, 0, 0);

  const dayAfter2 = new Date();
  dayAfter2.setDate(dayAfter2.getDate() + 3);
  dayAfter2.setHours(9, 0, 0, 0);
  const dayAfter2End = new Date(dayAfter2);
  dayAfter2End.setHours(11, 0, 0, 0);

  await prisma.booking.createMany({
    data: [
      {
        instrumentId: spectro.id,
        userId: researcher.id,
        title: "OD600 measurements for IPTG induction",
        startTime: tomorrow,
        endTime: tomorrowEnd,
        notes: "Measure 3 culture conditions in triplicate",
      },
      {
        instrumentId: spectro.id,
        userId: tech.id,
        title: "Protein concentration assay (BCA)",
        startTime: tomorrow2Start,
        endTime: tomorrow2End,
      },
      {
        instrumentId: shaker.id,
        userId: researcher.id,
        title: "IPTG induction cultures - overnight",
        startTime: dayAfter,
        endTime: dayAfterEnd,
        notes: "37°C, 250 rpm",
      },
      {
        instrumentId: spectro.id,
        userId: pi.id,
        title: "Final protein purity check",
        startTime: dayAfter2,
        endTime: dayAfter2End,
      },
    ],
  });

  console.log("  Bookings created.");

  // ─── 14. Comments (项目级 + 仪器级) ───
  const projectComment1 = await prisma.comment.create({
    data: {
      content: "Great progress on the IPTG optimization! Please make sure to document all conditions carefully.",
      authorId: pi.id,
      projectId: project.id,
      isPinned: true,
      label: "suggestion",
    },
  });

  // Reply to project comment
  await prisma.comment.create({
    data: {
      content: "Understood! I will update the ELN entry with all concentration details.",
      authorId: researcher.id,
      projectId: project.id,
      parentId: projectComment1.id,
    },
  });

  // Task-level comment
  await prisma.comment.create({
    data: {
      content: "I have set up the 3 dilutions. They are in the 4°C fridge, labeled.",
      authorId: tech.id,
      taskId: task3.id,
      label: "share",
    },
  });

  // Instrument-level comment (maintenance note)
  await prisma.comment.create({
    data: {
      content: "Calibrated UV lamp last week. Performance is optimal. Next calibration due in 3 months.",
      authorId: tech.id,
      instrumentId: spectro.id,
      label: "maintenance",
      isPinned: true,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Please ensure the cuvette holder is clean before each use — residues can affect readings.",
      authorId: pi.id,
      instrumentId: spectro.id,
      label: "suggestion",
    },
  });

  console.log("  Comments created.");

  // ─── 15. Announcements ───
  const expiresNextMonth = new Date();
  expiresNextMonth.setMonth(expiresNextMonth.getMonth() + 1);

  await prisma.announcement.createMany({
    data: [
      {
        scope: "TEAM",
        authorId: pi.id,
        title: "Lab Safety Reminder",
        content: "Please review the updated SDS sheets for IPTG and Ampicillin. Training session on Friday at 10am.",
        isPinned: true,
        teamId: team.id,
        expiresAt: expiresNextMonth,
      },
      {
        scope: "TEAM",
        authorId: admin.id,
        title: "System Maintenance Window",
        content: "PonyLab system will undergo maintenance on Saturday 2am-4am. Please save all work before then.",
        teamId: team.id,
      },
      {
        scope: "INSTRUMENT",
        authorId: tech.id,
        title: "Spectrophotometer: New SOP",
        content: "A new SOP for the Cary 60 spectrophotometer has been uploaded to the shared drive. Please read before next use.",
        instrumentId: spectro.id,
        isPinned: true,
      },
    ],
  });

  console.log("  Announcements created.");

  // ─── 16. Audit logs ───
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
      {
        userId: tech.id,
        action: "INVENTORY_ADJUST",
        entityType: "InventoryItem",
        entityId: iptgItem.id,
        oldValue: { quantity: 10 },
        newValue: { quantity: 5, action: "OUT", reason: "Used for IPTG induction experiment" },
      },
    ],
  });

  console.log("  Audit logs created.");

  console.log("\nSeed completed successfully!");
  console.log("─────────────────────────────────────────");
  console.log("  SUPER_ADMIN : admin@ponylab.io / admin123!");
  console.log("  PI          : pi@lab.edu / pi123456!");
  console.log("  Researcher  : researcher@lab.edu / research!");
  console.log("  Technician  : tech@lab.edu / tech1234!");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
