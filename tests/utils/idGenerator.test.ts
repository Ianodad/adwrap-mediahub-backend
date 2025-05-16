import { PrismaClient } from "@prisma/client";
import { generateWorkspaceScopedId } from "../../src/utils/idGenerator";

const prisma = new PrismaClient();

describe("generateWorkspaceScopedId", () => {
  beforeAll(async () => {
    // Seed test data
    await prisma.workspace.create({ data: { id: 1, name: "Test Workspace" } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should generate BB-1 for the first billboard in a workspace", async () => {
    const id = await generateWorkspaceScopedId(prisma, 1, "BILLBOARD");
    expect(id).toBe("BB-1");
  });

  it("should generate SP-1 for the first street pole in a workspace", async () => {
    const id = await generateWorkspaceScopedId(prisma, 1, "STREET_POLE");
    expect(id).toBe("SP-1");
  });
});

