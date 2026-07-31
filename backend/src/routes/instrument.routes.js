const express = require("express");

function createInstrumentRoutes({
    instrumentController
}) {
    const router = express.Router();

    router.get("/", instrumentController.listInstruments);

    return router;
}

module.exports = {
    createInstrumentRoutes
};
