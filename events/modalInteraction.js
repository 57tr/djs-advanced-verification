const {
    Client,
    Interaction,
    WebhookClient,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction,
    EmbedBuilder,
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

        if (!interaction.guild || !interaction.channel || !interaction.user || interaction.user.bot) return;

        if (!interaction.isModalSubmit()) return;

        const { fields, guild, member, customId } = interaction;

        const valid = fields.getTextInputValue("captcha-code");

        const dataVerify = await verifySchema.findOne({ guildId: guild.id });
        const dataCode = await codesSchema.findOne({ userId: member.id });

        if (customId === "captcha-modal") {
            if (!dataCode && dataCode.userId !== interaction.member.id) return interaction.reply({
                content: "We are having trouble verifying you, please try again.",
            });

            if (dataCode.captchaCode !== valid) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`Invalid captcha code: ${valid}`)
                            .setColor("Red")
                    ],
                    ephemeral: true,
                });
            } else {
                await codesSchema.findOneAndUpdate({ userId: member.id },
                    { captchaCode: `verified` },
                    { new: true, upsert: true }
                );

                interaction.member.roles.add(dataVerify.roleId);

                return await interaction.reply({
                    content: `<a:checkmark:1081679442595823686> We have verified that you are not a robot. Welcome to our server have a good time.`,
                    ephemeral: true,
                });
            }
        }
    }
}