function createInstrumentRepository(prisma) {
    return {
        findAllEnabled(){
            return prisma.instrument.findMany({
                where: {
                    enabled : true
                },
                orderBy: {
                    name: "asc"
                }
            });
        },

        findByCode(code) {
            return prisma.instrument.findUnique({
                where: {
                    code
                }
            });
        },

        findById(instrumentId){
            return prisma.instrument.findUnique({
                where:{
                    id: instrumentId
                }
            });
        }
    };
}

module.exports = {
    createInstrumentRepository
};