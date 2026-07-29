function createEmptyPattern({
    instrumentCode,
    instrumentCategory,
    stepCount
}){
    const drumCodes = ["kick", "snare", "hi-hat"];
    const isDrum = instrumentCategory === "drums"
        || instrumentCode === "drums"
        || drumCodes.includes(instrumentCode);

    const steps = isDrum
        ? Array.from({ length: stepCount }, () => ({
            kick: false,
            snare: false,
            hiHat: false
        }))
        : Array.from({ length: stepCount }, () => null);

    return {
        version: 1,
        instrumentType: isDrum ? "drums" : instrumentCode,
        stepCount: stepCount,
        data: { steps }
    };
}

module.exports = {
    createEmptyPattern
};
