const { Client } = require("discord.js");

module.exports = {
    name: "ready",

    /**
     * @param {Client} client 
     */
    async execute(client) {
        if (client?.application?.commands) {
            client.application.commands.set(client.slashArray);
        }

        console.log("Sesion iniciada como " + client.user.username);
    }
}