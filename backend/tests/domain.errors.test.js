const {
    DomainError,
    originNotAllowed,
    mapPrismaError
} = require("../src/errors/domain.errors");

describe("Domain errors", () => {
    test("origin hatasini 403 olarak olusturur", () => {
        const error = originNotAllowed();

        expect(error).toBeInstanceOf(DomainError);
        expect(error.code).toBe("ORIGIN_NOT_ALLOWED");
        expect(error.statusCode).toBe(403);
    });

    test("nickname unique hatasini domain hatasina cevirir", () => {
        const prismaError = {
            code: "P2002",
            meta: {
                target: ["lobbyId", "nickname"]
            }
        };

        const error = mapPrismaError(prismaError);

        expect(error).toBeInstanceOf(DomainError);
        expect(error.code).toBe("NICKNAME_TAKEN");
        expect(error.statusCode).toBe(409);
    });

    test("baska unique hatasini nickname hatasi yapmaz", () => {
        const prismaError = {
            code: "P2002",
            meta: {
                target: ["code"]
            }
        };

        const error = mapPrismaError(prismaError);

        expect(error).toBe(prismaError);
    });

    test("P2002 olmayan hatayi degistirmeden dondurur", () => {
        const prismaError = {
            code: "P2025",
            message: "Record not found"
        };

        expect(mapPrismaError(prismaError)).toBe(prismaError);
    });
});
