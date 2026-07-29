const {
    createDraftPatternManager
} = require("../src/game/draft-pattern");

describe("DraftPatternManager", () => {
    function createRuntime() {
        return {
            phase: "INSTRUMENT_ROUND",
            stateVersion: 0,
            players: new Map([
                [10, {
                    playerId: 10,
                    draftPattern: null,
                    locked: false,
                    connected: true
                }],
                [11, {
                    playerId: 11,
                    draftPattern: null,
                    locked: true,
                    connected: true
                }]
            ])
        };
    }

    test("gecerli drafti oyuncunun runtime stateine kaydeder", () => {
        const manager = createDraftPatternManager();
        const runtime = createRuntime();
        const patternData = {
            version: 1,
            instrumentType: "bass",
            stepCount: 1,
            data: {
                steps: [null]
            }
        };

        const updatedRuntime = manager.updateDraft({
            runtime,
            playerId: 10,
            patternData
        });

        expect(updatedRuntime).toBe(runtime);
        expect(runtime.players.get(10).draftPattern).toBe(patternData);
        expect(runtime.stateVersion).toBe(1);
    });

    test("INSTRUMENT_ROUND disinda draft guncellenemez", () => {
        const manager = createDraftPatternManager();
        const runtime = createRuntime();
        runtime.phase = "MATCH_STARTING";

        expect(() => {
            manager.updateDraft({
                runtime,
                playerId: 10,
                patternData: { steps: [] }
            });
        }).toThrow("draft yapilamaz");
    });

    test("runtime disindaki oyuncu draft guncelleyemez", () => {
        const manager = createDraftPatternManager();
        const runtime = createRuntime();

        expect(() => {
            manager.updateDraft({
                runtime,
                playerId: 99,
                patternData: { steps: [] }
            });
        }).toThrow("oyuncu bulunamadi");
    });

    test("locklanmis oyuncu draft guncelleyemez", () => {
        const manager = createDraftPatternManager();
        const runtime = createRuntime();

        expect(() => {
            manager.updateDraft({
                runtime,
                playerId: 11,
                patternData: { steps: [] }
            });
        }).toThrow("locklamis");
    });

    test.each([null, undefined, "pattern", [], {}])(
        "gecersiz patternData reddedilir: %p",
        (patternData) => {
            const manager = createDraftPatternManager();
            const runtime = createRuntime();

            expect(() => {
                manager.updateDraft({
                    runtime,
                    playerId: 10,
                    patternData
                });
            }).toThrow("gecersiz patternData");
        }
    );
});
