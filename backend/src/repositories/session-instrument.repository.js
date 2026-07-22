function createSessionInstrumentRepository(prisma) {
    return {
        createMany({
            sessionId,
            instruments
        }) {
            const data = instruments.map(({instrumentId, orderNo}) => ({
                sessionId,
                instrumentId,
                orderNo
            }))
            return prisma.sessionInstrument.createMany({data})
        },

        findBySessionId(sessionId) {
            // session instrumentlerini instrument ilişkisiyle getir
            // orderNo asc
            return prisma.sessionInstrument.findMany({
                where:{
                    sessionId:sessionId
                },
                include:{
                    instrument: true
                },
                orderBy:{
                    orderNo: "asc"
                }
            })
        },

        findBySessionAndInstrument({
            sessionId,
            instrumentId
        }) {
            // composite primary key ile tek eşleşmeyi getir
            return prisma.sessionInstrument.findUnique({
                where:{
                    sessionId_instrumentId:{
                        sessionId,
                        instrumentId
                    }
                }
            })
        },

        countBySessionId(sessionId) {
            // sessiondaki instrument sayısını getir
            return prisma.sessionInstrument.count({
                where:{
                    sessionId: sessionId
                }
            })
        }
    };
}

module.exports = {
    createSessionInstrumentRepository
};