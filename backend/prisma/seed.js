require('dotenv').config({ path: "../.env" });
const { prisma, disconnectDatabase } = require('../src/database');



async function main(){
    const instruments = [
    
    {
        code: "kick",
        name: "Kick",
        category: "drums",
        enabled: true
    },
    {
        code: "snare",
        name: "Snare",
        category: "drums",
        enabled: true
    },
    {
        code: "hi-hat",
        name: "Hi-Hat",
        category: "drums",
        enabled: true
    },
    {
        code: "bass",
        name: "Bass",
        category: "melodic",
        enabled: true
    },
    {
        code: "chord-synth",
        name: "Chord-Synth",
        category: "melodic",
        enabled: true
    },
    {
        code: "lead-synth",
        name: "Lead-Synth",
        category: "melodic",
        enabled: true
    },
    {
        code: "guitar",
        name: "Elektro Gitar",
        category: "melodic",
        enabled: true
    }];


    for(const instrument of instruments){   
        await prisma.instrument.upsert({
            where: {
                code: instrument.code
            },
            update: instrument,
            create: instrument
        });
    }

    console.log("Seeded instruments successfully.");

}

main()
    .catch((e) => {
        console.error("Error seeding instruments:", e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await disconnectDatabase();
    });