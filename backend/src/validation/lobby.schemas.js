const { z } = require('zod');

const createLobbySchema = z.object({
    nickname: z
        .string()
        .trim()
        .min(2)
        .max(20)
});

const joinLobbySchema = z.object({
    nickname: z
        .string()
        .trim()
        .min(2)
        .max(20)
});

function validateCreateLobby(payload) {
    const result = createLobbySchema.safeParse(payload)
    return result.success ? {valid: true, data: result.data} : {valid:false, error: result.error}
}

function validateJoinLobby(payload) {
    const result = joinLobbySchema.safeParse(payload)
    return result.success ? {valid:true, data:result.data} : {valid:false, error: result.error}
}

module.exports = {
    createLobbySchema,
    joinLobbySchema,
    validateCreateLobby,
    validateJoinLobby
};