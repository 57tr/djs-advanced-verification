const {
    Client,
    ChatInputCommandInteraction,
    EmbedBuilder,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const verifySchema = require('../../schemas/verifySchema');
const codesSchema = require('../../schemas/codesSchema');

const { Captcha } = require('captcha-canvas');

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
        if (!interaction.isButton()) return;

        if (!interaction.guild || !interaction.channel || !interaction.user || interaction.user.bot) return;

        const { guild, member, customId } = interaction;

        switch (customId) {
            case 'verify-button': {
                const dataVerify = await verifySchema.findOne({ guildId: guild.id });
                const dataCode = await codesSchema.findOne({ userId: member.id });

                const captcha = new Captcha();

                /**
                 * ! Captcha options
                 */
                captcha.async = false;
                captcha.addDecoy();
                captcha.drawTrace();
                captcha.drawCaptcha();

                const attachment = new AttachmentBuilder()
                    .setFile(await captcha.png)
                    .setName('captcha-image.png')
                    .setDescription('Captcha image');

                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Captcha System', iconURL: 'https://i.imgur.com/6gvcooF.gif' })
                    .setDescription('This is your captcha code.')
                    .setColor('Green')
                    .setImage(`attachment://${attachment.name}`);

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('captcha-button')
                            .setEmoji('🤖')
                            .setLabel('Send captcha')
                            .setStyle(ButtonStyle.Success)
                    );

                if (member.id === interaction.guild.ownerId) {
                    return interaction.reply({
                        content: "✅ You don't need to verify yourself because you are the owner of the server.",
                        ephemeral: true,
                    });
                } else if (dataCode && dataCode.captchaCode === 'verified') {
                    member.roles.add(dataVerify.roleId);

                    return interaction.reply({
                        content: '✅ You are already verified.',
                        ephemeral: true,
                    });
                } else if (!dataCode) {
                    await codesSchema.create({
                        userId: member.id,
                        captchaCode: `${captcha.text}`,
                    });

                    return await interaction.reply({
                        embeds: [embed],
                        components: [row],
                        files: [attachment],
                        ephemeral: true,
                    });
                } else if (dataCode.captchaCode !== 'verified') {
                    await codesSchema.findOneAndUpdate({ userId: member.id },
                        { captchaCode: `${captcha.text}` },
                        { new: true, upsert: true }
                    );

                    return await interaction.reply({
                        embeds: [embed],
                        components: [row],
                        files: [attachment],
                        ephemeral: true,
                    });
                }

                break;
            }

            case 'captcha-button': {
                const modal = new ModalBuilder()
                    .setCustomId('captcha-modal')
                    .setTitle(`${guild.name}'s - Verification`);

                const captchaText = new TextInputBuilder()
                    .setCustomId('captcha-code')
                    .setLabel('Send the captcha')
                    .setPlaceholder('Write the captcha code...')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(6)
                    .setMaxLength(6)
                    .setRequired(true);

                const textModal = new ActionRowBuilder().addComponents(captchaText);

                modal.addComponents(textModal);

                await interaction.showModal(modal);

                break;
            }

            default:
                break;
        }
    }
}