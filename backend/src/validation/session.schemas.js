const { z } = require("zod");
const gameConfig = require("../config/game.config");

const startSessionSchema = z.object({
    maxMatchCount: z
        .number()
        .int()
        .min(1)
        .max(gameConfig.maxMatchCount)
        .default(gameConfig.maxMatchCount),

    bpm: z
        .number()
        .int()
        .min(40)
        .max(240)
        .default(gameConfig.defaultBpm),

    stepCount: z
        .number()
        .int()
        .min(1)
        .max(64)
        .default(gameConfig.defaultStepCount),

    instrumentRoundSeconds: z
        .number()
        .int()
        .min(5)
        .max(120)
        .default(gameConfig.instrumentRoundSeconds),

    playbackLoops: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(gameConfig.playbackLoops),

    songVariantCount: z
        .number()
        .int()
        .min(1)
        .max(3)
        .default(gameConfig.songVariantCount),

    instrumentCodes: z
        .array(z.string().trim().min(1))
        .min(1)
        .max(6)
        .refine(
            codes => new Set(codes).size === codes.length,
            "Ayni instrument birden fazla secilemez."
        )
});

function validateStartSession(payload) {
    const result = startSessionSchema.safeParse(payload)
    return result.success ? {valid: true, data:result.data} : {valid:false, error: result.error}
}

module.exports = {
    startSessionSchema,
    validateStartSession
};