const express = require("express");

function createLobbyRoutes({
    lobbyController
}) {
    const router = express.Router();

    router.post(
        "/",
        lobbyController.createLobby
    );

    router.post(
    "/:lobbyCode/join",
    lobbyController.joinLobby
    );

    router.delete(
    "/:lobbyCode/players/me",
    lobbyController.leaveLobby
    );

    router.post(
        "/:lobbyCode/sessions",
        lobbyController.startSession
    );

    router.post(
        "/rotate",
        lobbyController.rotateLobby
    );

    return router;
}

module.exports = {
    createLobbyRoutes
};