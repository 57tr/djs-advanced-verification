const {
    Client,
    Interaction,
    EmbedBuilder
} = require("discord.js");

const verifySchema = require("../../schemas/verifySchema");
const codesSchema = require("../../schemas/codesSchema");

module.exports = {
    name: "interactionCreate",

    /**
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @returns 
     */
    async execute(client, interaction) {

        if (!interaction.isModalSubmit()) return;
        
        if (!interaction.guild || !interaction.channel || !interaction.user || interaction.user.bot) return;

        const { fields, guild, member, customId } = interaction;

        const dataVerify = await verifySchema.findOne({ guildId: guild.id });
        const dataCode = await codesSchema.findOne({ userId: member.id });

        if (customId === "captcha-modal") {
            const code = fields.getTextInputValue("captcha-code");

            if (!dataCode && dataCode.userId !== member.id) return interaction.reply({
                content: "We are having trouble verifying you, please try again.",
            });

            if (dataCode.captchaCode !== code) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`Invalid captcha code: ${code}`)
                            .setColor("Red")
                    ],
                    ephemeral: true,
                });
            } else {
                await codesSchema.findOneAndUpdate({ userId: member.id },
                    { captchaCode: `verified` },
                    { new: true, upsert: true }
                );

                member.roles.add(dataVerify.roleId);

                return await interaction.reply({
                    content: `<a:checkmark:1081679442595823686> We have verified that you are not a robot. Welcome to our server have a good time.`,
                    ephemeral: true,
                });
            }
        }
    }
}
