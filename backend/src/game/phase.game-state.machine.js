
const GAME_PHASES = Object.freeze({
    LOBBY: "LOBBY",
    MATCH_STARTING: "MATCH_STARTING",
    INSTRUMENT_ROUND: "INSTRUMENT_ROUND",
    NEXT_INSTRUMENT: "NEXT_INSTRUMENT",
    MATCH_BUILDING: "MATCH_BUILDING",
    OG_ROUND: "OG_ROUND",
    PLAYBACK: "PLAYBACK",
    VOTING: "VOTING",
    MATCH_RESULT: "MATCH_RESULT",
    SESSION_RESULT: "SESSION_RESULT",
    SESSION_COMPLETED: "SESSION_COMPLETED"
});


const ALLOWED_TRANSITIONS = {
    LOBBY: [
        GAME_PHASES.MATCH_STARTING
    ],

    MATCH_STARTING: [
        GAME_PHASES.INSTRUMENT_ROUND
    ],

    INSTRUMENT_ROUND: [
        GAME_PHASES.NEXT_INSTRUMENT,
        GAME_PHASES.MATCH_BUILDING
    ],

    NEXT_INSTRUMENT: [
        GAME_PHASES.INSTRUMENT_ROUND
    ],

    MATCH_BUILDING: [
        GAME_PHASES.PLAYBACK
    ],

    PLAYBACK: [
        GAME_PHASES.VOTING
    ],

    VOTING: [
        GAME_PHASES.MATCH_RESULT,
        GAME_PHASES.SESSION_RESULT,
        GAME_PHASES.OG_ROUND
    ],

    MATCH_RESULT: [
        GAME_PHASES.MATCH_STARTING,
        GAME_PHASES.OG_ROUND,
        GAME_PHASES.SESSION_RESULT,
        GAME_PHASES.SESSION_COMPLETED
    ],

    OG_ROUND: [
        GAME_PHASES.PLAYBACK
    ],

    SESSION_RESULT: [],

    SESSION_COMPLETED: []
};

function createPhaseStateMachine() {


    function canTransition(currentPhase, nextPhase) {

        const allowedTransitionsList = ALLOWED_TRANSITIONS;

        if(!allowedTransitionsList){
            return false;
        }

        if(!GAME_PHASES[currentPhase]){
            return false;
        }

        if(!GAME_PHASES[nextPhase]){
            return false;
        }

        if(allowedTransitionsList[currentPhase].includes(nextPhase)){
            return true;
        }
        else {
            return false;
        }
    }

    function transition(runtime, nextPhase) {

        if(!nextPhase){
            const error = new Error("gecilmek istenilen durum belirtilmedi.");
            throw error;
        }

        if(!canTransition(runtime.phase, nextPhase)){
            const error = new Error(`geçerli geçiş değil: ${runtime.phase} -> ${nextPhase}`);
            throw error;
        }

        runtime.phase = nextPhase;
        runtime.stateVersion++;
        return runtime;
    }

    return {
        canTransition,
        transition
    };
}

module.exports = {
    createPhaseStateMachine,
    GAME_PHASES
}
