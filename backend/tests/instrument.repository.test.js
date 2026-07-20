const {
    createInstrumentRepository
} = require("../src/repositories/instrument.repository");

describe("InstrumentRepository", () => {
    test("aktif enstrümanları getirir", async () => {
        const fakeInstruments = [
            {
                code: "bass",
                name: "Bass",
                category: "melodic",
                enabled: true
            }
        ];

        const prisma = {
            instrument: {
                findMany: jest.fn().mockResolvedValue(fakeInstruments)
            }
        };

        const repository = createInstrumentRepository(prisma);

        const result = await repository.findAllEnabled();

        expect(prisma.instrument.findMany).toHaveBeenCalledWith({
            where: {
                enabled: true
            },
            orderBy: {
                name: "asc"
            }
        });

        expect(result).toEqual(fakeInstruments);
    });

    test("koda göre enstrüman getirir", async () => {
        const fakeInstrument = {
            code: "guitar",
            name: "Elektro Gitar",
            category: "melodic",
            enabled: true
        };

        const prisma = {
            instrument: {
                findUnique: jest.fn().mockResolvedValue(fakeInstrument)
            }
        };

        const repository = createInstrumentRepository(prisma);

        const result = await repository.findByCode("guitar");

        expect(prisma.instrument.findUnique).toHaveBeenCalledWith({
            where: {
                code: "guitar"
            }
        });

        expect(result).toEqual(fakeInstrument);
    });

    test("id'e gore instrument getirir", async () => {
        const fakeInstrument = {
            id: 3,
            code : "bass",
            name : "Bass",
            category : "melodic",
            enabled : true
        };

        const prisma = {
            instrument : {
                findUnique : jest.fn().mockResolvedValue(fakeInstrument)
            }
        };

        const repository = createInstrumentRepository(prisma);

        const result = await repository.findById(3);

        expect(prisma.instrument.findUnique).toHaveBeenCalledWith({
            where:{
                id: 3
            }
        });

        expect(result).toEqual(fakeInstrument);
    });
});
