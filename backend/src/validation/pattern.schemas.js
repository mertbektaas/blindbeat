const { z } = require("zod");

const basePatternSchema = z.object({
    version: z.number().int().positive(),
    instrumentType: z.string().min(1),
    stepCount: z.number().int().min(1).max(64),
    data: z.any()
});

const drumStepSchema = z.object({
    kick : z.boolean(),
    snare : z.boolean(),
    hiHat : z.boolean()
});

const drumDataSchema = z.object({
    steps: z.array(drumStepSchema).min(1).max(64)
});

const drumPatternSchema = basePatternSchema
    .extend({
    instrumentType: z.literal("drums"),
    data: drumDataSchema
    })
    .superRefine((pattern,context) => {
        if( pattern.stepCount !== pattern.data.steps.length){
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["data", "steps"],
            })
        }
    });



function validateBasePattern(pattern) {
    const result = basePatternSchema.safeParse(pattern);
    return result.success ? { valid: true, data: result.data } : { valid: false, error: result.error };
}

function validateDrumPattern(pattern) {
    const result = drumPatternSchema.safeParse(pattern);
    return result.success ? { valid: true, data: result.data } : { valid: false, error: result.error };
}

module.exports = {
    basePatternSchema,
    validateBasePattern,
    validateDrumPattern,
    drumPatternSchema,
    drumDataSchema,
    drumStepSchema
}