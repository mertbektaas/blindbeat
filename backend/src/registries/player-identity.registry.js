const { randomBytes } = require("node:crypto");

function createPlayerIdentityRegistry() {
    const identities = new Map();
    
    return {
        create(identity){
            const token = randomBytes(32).toString("hex");

            const storedIdentity = {
                ...identity,
                createdAt: new Date(),
                lastSeenAt: new Date()
            }

            identities.set(token, storedIdentity);

            return{
                token,
                identity: storedIdentity
            }
        },

        get(token) {
            const identity = identities.get(token);

            if(!identity){
                return null;
            }

            identity.lastSeenAt = new Date();

            return identity;
        },

        delete(token){
            return identities.delete(token);
        },

        clear(){
            identities.clear();
        }
    };
}




module.exports = {
    createPlayerIdentityRegistry
};