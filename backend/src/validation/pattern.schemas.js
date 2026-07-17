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
                message: "stepCount ve steps uzunlugu birbirine esit olmali."
            })
        }
    });



const melodicStepSchema = z.union([
    z.null(),
    z.object({
        note: z.string().min(1),
        velocity: z.number().min(0).max(1),
    })
])

const melodicDataSchema = z.object({
    steps: z.array(melodicStepSchema).min(1).max(64)
});

const melodicPatternSchema = basePatternSchema
    .extend({
        data: melodicDataSchema
    })
    .superRefine((pattern, context) => {
        if ( pattern.stepCount !== pattern.data.steps.length){
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["data", "steps"],
                message: "stepCount ile steps uzunglugu esit olmalidir."
            });
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

function validateMelodicPattern(pattern){
    const result = melodicPatternSchema.safeParse(pattern);
    return result.success ? { valid: true, data:result.data } : {valid:false, error: result.error};
}

function validatePattern(pattern){
    const validator = patternValidators[pattern.instrumentType];

    if(!validator){
        return {
            valid: false,
            error: {
                code:"UNSUPPORTED_INSTRUMENT_TYPE",
                message: "bu enstruman icin pattern dogrulamasi bulunamadi."
            }
        };
    }

    return validator(pattern);
}

const patternValidators = {
    drums: validateDrumPattern,
    bass: validateMelodicPattern
}

module.exports = {
    validateBasePattern,
    validateDrumPattern,
    validateMelodicPattern,
    validatePattern,
    basePatternSchema,
    drumStepSchema,
    drumDataSchema,
    drumPatternSchema,
    melodicStepSchema,
    melodicDataSchema,
    melodicPatternSchema
}