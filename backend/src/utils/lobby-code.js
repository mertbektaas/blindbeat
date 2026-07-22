const { randomInt } = require("node:crypto");

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateLobbyCode(length = 4) {
    let code = "";

    // length kadar döngü kur
    // randomInt ile alphabet içinden karakter seç
    // seçilen karakteri code'a ekle
    for(let i = 0; i < length; i++){
        let char = alphabet[randomInt(alphabet.length)];
        code += char;
    }

    return code;
}

module.exports = {
    generateLobbyCode
};