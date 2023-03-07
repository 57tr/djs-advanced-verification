const {
    SlashCommandBuilder,
    EmbedBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const verifySchema = require("../../schemas/verifySchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Set up verification system.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(channel =>
            channel
                .setName("channel")
                .setDescription("Channel where the bot will send the verification message.")
                .addChannelTypes(0)
                .setRequired(true)
        )
        .addRoleOption(role =>
            role
                .setName("role")
                .setDescription("Role to be granted to verified users.")
                .setRequired(true)
        ),

    /**
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    
    /**
     * ! Check the order of how you pass parameters in your slashcommand handler
     */
    async execute(client, interaction) {

        const { options, guild } = interaction;

        const channel = options.getChannel("channel");
        const role = options.getRole("role");

        const data = await verifySchema.findOne({ guildId: guild.id });
        if (!data) {
            await verifySchema.create({
                guildId: guild.id,
                roleId: role.id
            });
        } else {
            await verifySchema.findOneAndUpdate({ guildId: guild.id },
                { roleId: role.id },
                { new: true, upsert: true }
            );
        }

        const dataSaved = await verifySchema.findOne({ guildId: guild.id });

        const row = new ActionRowBuilder().addComponents([
            new ButtonBuilder()
                .setCustomId("verify-button")
                .setEmoji("<a:checkmark:1081679442595823686>")
                .setLabel("Verify")
                .setStyle(ButtonStyle.Success)
        ]);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${guild.name}'s - Verification`, iconURL: "https://i.imgur.com/6gvcooF.gif" })
            .setDescription("This server requires verification in order to access other channels, it can be verified by completing a captcha, click the button to start verification.")
            .setColor("Green")
            .setFooter({ text: "Coded by 57tr#0001" });

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: `Verification setup completed successfully`, iconURL: "https://i.imgur.com/6gvcooF.gif" })
                    .setDescription(`> Correctly configured the verification system.`)
                    .addFields(
                        { name: "Channel:", value: `${channel}` },
                        { name: "Verified role:", value: `<@&${dataSaved.roleId}>` }
                    )
                    .setColor("Green")
            ],
            ephemeral: true,
        });

        return await channel.send({
            embeds: [embed],
            components: [row]
        });
    },
};
