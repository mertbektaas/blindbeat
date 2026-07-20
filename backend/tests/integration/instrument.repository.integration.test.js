const {
    prisma,
    disconnectDatabase
} = require("../../src/database");

const {
    createInstrumentRepository
} = require("../../src/repositories/instrument.repository");

describe("InstrumentRepository integration", () => {
    afterAll(async () => {
        await disconnectDatabase();
    });

    test("seed edilen bass instrumentini getirir", async () => {
        const repository = createInstrumentRepository(prisma);

        const result = await repository.findByCode("bass");

        expect(result).not.toBeNull();
        expect(result.code).toBe("bass");
        expect(result.enabled).toBe(true);
    });

    test("seed edilen aktif instrumentleri getirir", async () => {
        const repository = createInstrumentRepository(prisma);

        const result = await repository.findAllEnabled();

        expect(result.length).toBeGreaterThan(0);
        expect(result.some(instrument => instrument.code === "bass")).toBe(true);
        expect(result.every(instrument => instrument.enabled)).toBe(true);
    })
});