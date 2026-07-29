const {
    validateStartSession
} = require("../src/validation/session.schemas");
const gameConfig = require("../src/config/game.config");

describe("Session schemas", () => {
    test("gecerli session ayarlarini kabul eder", () => {
        const result = validateStartSession({
            maxMatchCount: 3,
            bpm: 140,
            stepCount: 16,
            instrumentRoundSeconds: 20,
            playbackLoops: 4,
            songVariantCount: 3,
            instrumentCodes: ["kick", "bass", "guitar"]
        });

        expect(result.valid).toBe(true);
        expect(result.data.bpm).toBe(140);
        expect(result.data.stepCount).toBe(16);
        expect(result.data.instrumentCodes).toEqual([
            "kick",
            "bass",
            "guitar"
        ]);
    });

    test("eksik ayarlara config varsayilanlarini ekler", () => {
        const result = validateStartSession({
            instrumentCodes: ["kick"]
        });

        expect(result.valid).toBe(true);
        expect(result.data.maxMatchCount).toBe(5);
        expect(result.data.bpm).toBe(120);
        expect(result.data.stepCount).toBe(8);
        expect(result.data.instrumentRoundSeconds).toBe(
            gameConfig.instrumentRoundSeconds
        );
        expect(result.data.playbackLoops).toBe(5);
        expect(result.data.songVariantCount).toBe(3);
    });

    test("instrument listesi bos birakilamaz", () => {
        const result = validateStartSession({
            instrumentCodes: []
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    test("ayni instrumentin birden fazla secilmesini reddeder", () => {
        const result = validateStartSession({
            instrumentCodes: ["kick", "bass", "kick"]
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    test("bpm sinirlarinin disindaki degeri reddeder", () => {
        const result = validateStartSession({
            bpm: 300,
            instrumentCodes: ["kick"]
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    test("instrument sayisi ust limiti asamaz", () => {
        const result = validateStartSession({
            instrumentCodes: [
                "kick",
                "snare",
                "hi-hat",
                "bass",
                "chord-synth",
                "lead-synth",
                "guitar"
            ]
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });
});
