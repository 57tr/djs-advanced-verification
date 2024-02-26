const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const BotUtils = require("./utils");

const fs = require("fs");
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://ign57tr:BHpPAP3GKOkXtS1E@dbt.kriulfy.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("DB connected");
}).catch(() => {
    console.log("DB disconnected");
})

const client = new Client({
    intents: [
        Object.keys(GatewayIntentBits)
    ],
    partials: [
        Object.keys(Partials)
    ]
});

client.utils = new BotUtils(client);
client.slashCommands = new Collection();
client.slashArray = [];

loadEvents();
loadSlashCommands();

async function loadEvents() {
    client.removeAllListeners();
    fs.readdirSync('./Events').forEach(dirs => {
        try {
            const events = fs.readdirSync(`./events/${dirs}`).filter(files => files.endsWith('.js'));

            for (const file of events) {
                const event = require(`./events/${dirs}/${file}`);
                client.on(event.name, (...args) => event.execute(client, ...args));
            };
        } catch (error) {
            console.log(error);
        }
    });
}

async function loadSlashCommands() {

    const RUTA_ARCHIVOS = await client.utils.loadFiles("/commands");

    if (RUTA_ARCHIVOS.length) {
        RUTA_ARCHIVOS.forEach((rutaArchivo) => {
            try {
                const COMANDO = require(rutaArchivo);

                if (COMANDO) client.slashCommands.set(COMANDO.data.name, COMANDO);

                client.slashArray.push(COMANDO.data.toJSON())
            } catch (error) {
                console.log(error);
            }
        })
    }

    if (client?.application?.commands) {
        client.application.commands.set(client.slashArray);
    }
}

client.login("MTA3ODMwMjUwMzc2Mzk2ODA2MA.GAV3VB.hrWwS31fxCBFWF5NIR_DJIOg8NrkM2EHzST-Ds")