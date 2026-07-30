function isValidMelodicNote(note) {
    return /^[A-Ga-g](?:#|b)?[0-8]$/.test(note);
}

export {
    isValidMelodicNote
};
