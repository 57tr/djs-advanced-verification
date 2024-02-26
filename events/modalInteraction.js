const {
    Client,
    ChatInputCommandInteraction,
    EmbedBuilder
} = require('discord.js');

const verifySchema = require('../../schemas/verifySchema');
const codesSchema = require('../../schemas/codesSchema');

module.exports = {
    name: 'interactionCreate',
    /**
     * ! Check the order of how you pass parameters in your slashcommand handler
     */

    /**
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
    async execute(client, interaction) {

        if (!interaction.isModalSubmit()) return;

        if (!interaction.guild || !interaction.channel || !interaction.user || interaction.user.bot) return;

        const { fields, guild, member, customId } = interaction;

        switch (customId) {
            case 'captcha-modal': {
                const valid = fields.getTextInputValue('captcha-code');

                const dataVerify = await verifySchema.findOne({ guildId: guild.id });
                const dataCode = await codesSchema.findOne({ userId: member.id });

                if (!dataCode && dataCode.userId !== interaction.member.id) return interaction.reply({
                    content: 'We are having trouble verifying you, please try again.',
                });

                if (dataCode.captchaCode !== valid) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`Invalid captcha code: ${valid}`)
                                .setColor('Red')
                        ],
                        ephemeral: true,
                    });
                } else {
                    await codesSchema.findOneAndUpdate({ userId: member.id },
                        { captchaCode: 'verified' },
                        { new: true, upsert: true }
                    );

                    interaction.member.roles.add(dataVerify.roleId);

                    await interaction.reply({
                        content: '✅ We have verified that you are not a robot. Welcome to our server have a good time.',
                        ephemeral: true,
                    });
                }

                break;
            }

            default:
                break;
        }
    }
}