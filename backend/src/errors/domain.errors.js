class DomainError extends Error {
    constructor(code, message, statusCode) {
        super(message);

        this.name = "DomainError";
        this.code = code;
        this.statusCode = statusCode;
    }
}

function lobbyNotFound() {
    return new DomainError(
        "LOBBY_NOT_FOUND",
        "Lobi bulunamadi",
        404
    )
}

function lobbyLocked() {
    // 409
    return new DomainError(
        "LOBBY_LOCKED",
        "Lobi kilitlendi.",
        409
    )
}

function lobbyFull() {
    // 409
    return new DomainError(
        "LOBBY_FULL",
        "Lobi dolu.",
        409
    )
}

function nicknameTaken() {
    // 409
    return new DomainError(
        "NICKNAME_TAKEN",
        "Kullanici adi zaten alinmis",
        409
    )
}

function sessionNotFound() {
    // 404
    return new DomainError(
        "SESSION_NOT_FOUND",
        "Seans bulunamadi",
        404
    )
}

function matchNotFound() {
    return new DomainError(
        "MATCH_NOT_FOUND",
        "Match bulunamadi",
        404
    );
}

function identityNotFound() {
    // 401
    return new DomainError(
        "IDENTITY_NOT_FOUND",
        "Identity eslesmesi bulunamadi",
        401
    )
}

function originNotAllowed() {
    return new DomainError(
        "ORIGIN_NOT_ALLOWED",
        "Origin adresine izin verilmiyor.",
        403
    )
}

function minPlayersNotReached(currentPlayerCount, minimumPlayerCount){
    return new DomainError(
        "MIN_PLAYERS_NOT_REACHED",
        "Oyuncu sayisi yeterli degil.",
        409
    );
}

function mapPrismaError(error) {
    if (error?.code !== "P2002") {
        return error;
    }

    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target : [target];

    if (fields.includes("nickname")) {
        return nicknameTaken();
    }

    return error;
}

function invalidSessionConfig() {
    return new DomainError(
        "INVALID_SESSION_CONFIG",
        "Session ayarlari gecersiz.",
        400
    );
}

function instrumentNotAvailable(code) {
    return new DomainError(
        "INSTRUMENT_NOT_AVAILABLE",
        `Instrument kullanilamiyor: ${code}`,
        400
    );
}

function playerNotInSession() {
    return new DomainError(
        "PLAYER_NOT_IN_SESSION",
        "Oyuncu bu sessiona dahil degil.",
        403
    );
}

function votingNotOpen() {
    return new DomainError(
        "VOTING_NOT_OPEN",
        "Oylama henuz acilmadi.",
        409
    );
}

function songVariantNotFound() {
    return new DomainError(
        "SONG_VARIANT_NOT_FOUND",
        "Secilen sarki varyanti bulunamadi.",
        404
    );
}

function voteAlreadySubmitted() {
    return new DomainError(
        "VOTE_ALREADY_SUBMITTED",
        "Bu match icin zaten oy kullandiniz.",
        409
    );
}

function votingNotComplete() {
    return new DomainError(
        "VOTING_NOT_COMPLETE",
        "Tum oyuncular henuz oy kullanmadi.",
        409
    );
}

module.exports = {
    DomainError,
    lobbyNotFound,
    lobbyLocked,
    lobbyFull,
    nicknameTaken,
    sessionNotFound,
    matchNotFound,
    identityNotFound,
    originNotAllowed,
    mapPrismaError,
    minPlayersNotReached,
    invalidSessionConfig,
    instrumentNotAvailable,
    playerNotInSession,
    votingNotOpen,
    songVariantNotFound,
    voteAlreadySubmitted,
    votingNotComplete
};
