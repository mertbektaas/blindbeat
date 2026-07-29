const {
    createEmptyPattern
} = require("../src/game/empty-pattern.factory");

describe("EmptyPatternFactory", () => {
    test("davul icin false steplerden bos pattern uretir", () => {
        const pattern = createEmptyPattern({
            instrumentCode: "kick",
            instrumentCategory: "drums",
            stepCount: 2
        });

        expect(pattern).toEqual({
            version: 1,
            instrumentType: "drums",
            stepCount: 2,
            data: {
                steps: [
                    { kick: false, snare: false, hiHat: false },
                    { kick: false, snare: false, hiHat: false }
                ]
            }
        });
    });

    test("melodik enstruman icin null steplerden bos pattern uretir", () => {
        const pattern = createEmptyPattern({
            instrumentCode: "bass",
            instrumentCategory: "melodic",
            stepCount: 3
        });

        expect(pattern).toEqual({
            version: 1,
            instrumentType: "bass",
            stepCount: 3,
            data: {
                steps: [null, null, null]
            }
        });
    });
});
