const { success } = require("../response");

function createInstrumentController({
    instrumentRepository
}) {
    return {
        async listInstruments(req, res, next) {
            try {
                const instruments = await instrumentRepository.findAllEnabled();

                res.status(200).json(success({
                    instruments: instruments.map(instrument => ({
                        id: instrument.id,
                        code: instrument.code,
                        name: instrument.name,
                        category: instrument.category
                    }))
                }, req.requestId));
            } catch (error) {
                next(error);
            }
        }
    };
}

module.exports = {
    createInstrumentController
};
