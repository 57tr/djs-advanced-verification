const { Client, Interaction } = require("discord.js");

module.exports = {
    name: "interactionCreate",

    /**
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @returns 
     */
    async execute(client, interaction) {

        if (!interaction.guild || !interaction.channel || !interaction.user || interaction.user.bot) return;

        if (!interaction.isChatInputCommand()) return;

        const COMANDO = client.slashCommands.get(interaction?.commandName);

        if (COMANDO) {
            try {
                return COMANDO.execute(client, interaction)
            } catch (error) {
                console.error(error);
            }
        }
    }
}