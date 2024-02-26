const {
    Client,
    Interaction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const setupSchema = require("../../schemas/setupSchema");
const configSchema = require("../../schemas/configSchema");
const ticketSchema = require("../../schemas/ticketSchema");

module.exports = {
    name: "interactionCreate",

    /**
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @returns 
     */
    async execute(client, interaction) {
        if (!interaction.isButton()) return;

        if (!interaction.guild || !interaction.channel || !interaction.user || interaction.user.bot) return;

        const { guild, channel, message, user, member, customId } = interaction;

        if (customId === "ticket-button") {
            const dataSetup = await setupSchema.findOne({ guildId: guild.id });
            const dataConfig = await configSchema.findOne({ guildId: guild.id });
            const dataTicket = await ticketSchema.find({ guildId: guild.id, userId: user.id, isClose: false });

            if (!dataSetup || !dataSetup.channelId ||
                dataSetup.channelId !== channel.id ||
                dataSetup.messageId !== message.id) return;

            for (const ticket of dataTicket) {
                if (guild.channels.cache.get(ticket.channelId)) return interaction.reply({
                    embeds: [returnErrorEmbed(`You already have a ticket created in <#${ticket.channelId}>`)],
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: "⌛ Creating your ticket... **Please wait**.",
                ephemeral: true
            });

            const row = new ActionRowBuilder().addComponents(
                [
                    new ButtonBuilder()
                        .setCustomId("ticket-close-button")
                        .setEmoji("🔒")
                        .setStyle(ButtonStyle.Danger),

                    new ButtonBuilder()
                        .setCustomId("ticket-delete-button")
                        .setEmoji("🗑")
                        .setStyle(ButtonStyle.Secondary),
                ]
            );

            const rowConfig = new ActionRowBuilder().addComponents(
                [
                    new ButtonBuilder()
                        .setCustomId("ticket-close-button")
                        .setEmoji("🔒")
                        .setStyle(ButtonStyle.Danger),

                    new ButtonBuilder()
                        .setCustomId("ticket-delete-button")
                        .setEmoji("🗑")
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId("ticket-transcript-button")
                        .setEmoji("📝")
                        .setStyle(ButtonStyle.Primary)
                ]
            );

            if (dataConfig) {
                const ch = await guild.channels.create({
                    name: formatString(`ticket-${member.user.username}`),
                    type: 0,
                    parent: dataSetup.categoryId ?? null,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ["ViewChannel"]
                        },
                        {
                            id: interaction.user.id,
                            allow: ["ViewChannel"]
                        },
                        {
                            id: dataConfig.supportRoleId,
                            allow: ["ViewChannel"]
                        }
                    ]
                });

                ch.send({
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: `${member.user.tag}'s ticket`, iconURL: member.displayAvatarURL() })
                            .setDescription(`Thanks for creating a ticket!\nSupport will be with you shortly\n\n🔒 - Close ticket\n🗑 - Delete ticket\n📝 - Transcript ticket`)
                            .addFields(
                                { name: "Created at:", value: `<t:${parseInt(ch.createdTimestamp / 1000)}:R>` }
                            )
                            .setColor("Green")
                    ],
                    components: [rowConfig]
                });

                let dataUpdate = new ticketSchema({
                    guildId: guild.id,
                    userId: user.id,
                    channelId: ch.id,
                    isClose: false
                });

                await dataUpdate.save();

                return await interaction.editReply({
                    content: `<a:checkmark:1081679442595823686> Ticket created on **${ch}**.`,
                    ephemeral: true
                });
            } else {
                const ch = await guild.channels.create({
                    name: formatString(`ticket-${member.user.username}`),
                    type: 0,
                    parent: dataSetup.categoryId ?? null,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ["ViewChannel"]
                        },
                        {
                            id: interaction.user.id,
                            allow: ["ViewChannel"]
                        },
                    ]
                });

                ch.send({
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: `${member.user.tag}'s ticket`, iconURL: member.displayAvatarURL() })
                            .setDescription(`Thanks for creating a ticket!\nSupport will be with you shortly\n\n🔒 - Close ticket\n🗑 - Delete ticket\n📝 - Transcript ticket`)
                            .addFields(
                                { name: "Created at:", value: `<t:${parseInt(ch.createdTimestamp / 1000)}:R>` }
                            )
                            .setColor("Green")
                    ],
                    components: [row]
                });

                let dataUpdate = new ticketSchema({
                    guildId: guild.id,
                    userId: user.id,
                    channelId: ch.id,
                    isClose: false
                });

                await dataUpdate.save();

                return await interaction.editReply({
                    content: `<a:checkmark:1081679442595823686> Ticket created on **${ch}**.`,
                    ephemeral: true
                });
            }
        }

        if (customId === "ticket-close-button") {
            const dataConfig = await configSchema.findOne({ guildId: guild.id });
            const dataSetup = await setupSchema.findOne({ guildId: guild.id });
            const dataTicket = await ticketSchema.findOne({ guildId: guild.id, channelId: channel.id });

            if (dataTicket && dataTicket.isClose) return interaction.reply({
                embeds: [returnErrorEmbed("This ticket is already **closed**!")],
                ephemeral: true
            });

            await interaction.deferUpdate();

            const row = new ActionRowBuilder().addComponents(
                [
                    new ButtonBuilder()
                        .setCustomId("get-verified-button")
                        .setEmoji("<a:checkmark:1081679442595823686>")
                        .setLabel("Get verified")
                        .setStyle(ButtonStyle.Success)
                ]
            );

            const noVerified = new ActionRowBuilder().addComponents(
                [
                    new ButtonBuilder()
                        .setCustomId("get-verified-button")
                        .setEmoji("❌")
                        .setLabel("NOT VERIFIED")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                ]
            );

            const verify = await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Verify yourself first!`)
                        .setColor('Green')
                ],
                components: [row]
            });

            const collector = verify.createMessageComponentCollector({
                filter: i => i.isButton(),
                time: 180e3
            });

            collector.on("collect", async (b) => {
                if (b.user.id !== user.id) return b.reply({
                    enbeds: [returnErrorEmbed(`Only ${interaction.user} can interact with the button!`)],
                    ephemeral: true
                });

                collector.stop("Verified");

                await b.deferUpdate();

                dataTicket.isClose = true;
                await dataTicket.save();

                channel.permissionOverwrites.edit(dataTicket.userId,
                    { ViewChannel: false }
                );

                const chDeleted = guild.channels.cache.get(dataTicket.channelId);
                const chPanel = guild.channels.cache.get(dataSetup.channelId);

                if (dataConfig) {
                    return channel.send({
                        content: `<a:checkmark:1081679442595823686> Ticket **closed** by ${user} <t:${parseInt(Date.now() / 1000)}:R>.`
                    }).then(() => {
                        const ch = guild.channels.cache.get(dataConfig.channelLog);
                        return ch.send({
                            embeds: [returnEmbedLog(b, "Closed", chPanel, chDeleted)]
                        });
                    })
                } else {
                    return channel.send({
                        content: `<a:checkmark:1081679442595823686> Ticket **closed** by ${user} <t:${parseInt(Date.now() / 1000)}:R>.`
                    });
                }
            });

            collector.on("end", async (collect, reason) => {
                if (reason && reason === "Verified") {
                    await verify.delete().catch(() => { });
                } else {
                    verify.edit({
                        embeds: [verify.embeds[0].setColor("Red")],
                        components: [noVerified]
                    });
                }
            });
        }

        if (customId === "ticket-delete-button") {
            const dataConfig = await configSchema.findOne({ guildId: guild.id });
            const dataSetup = await setupSchema.findOne({ guildId: guild.id });
            const dataTicket = await ticketSchema.findOne({ guildId: guild.id, channelId: channel.id });

            if (dataConfig) {
                if (!member.roles.cache.has(dataConfig.supportRoleId) && !member.permissions.has("Administrator")) return interaction.reply({
                    embeds: [returnErrorEmbed(`${user} You require the **support** role to close a ticket.`)],
                    ephemeral: true,
                });
            } else {
                if (!member.permissions.has("Administrator")) return interaction.reply({
                    embeds: [returnErrorEmbed(`${user} You require the **administration** permission to close a ticket.`)],
                    ephemeral: true,
                });
            }

            await interaction.deferUpdate();

            const row = new ActionRowBuilder().addComponents(
                [
                    new ButtonBuilder()
                        .setCustomId("get-verified-button")
                        .setEmoji("<a:checkmark:1081679442595823686>")
                        .setLabel("Get verified")
                        .setStyle(ButtonStyle.Success)
                ]
            );

            const noVerified = new ActionRowBuilder().addComponents(
                [
                    new ButtonBuilder()
                        .setCustomId("get-verified-button")
                        .setEmoji("❌")
                        .setLabel("NOT VERIFIED")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                ]
            );

            const verify = await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Verify yourself first!`)
                        .setColor('Green')
                ],
                components: [row]
            });

            const collector = verify.createMessageComponentCollector({
                filter: i => i.isButton(),
                time: 180e3
            });

            collector.on("collect", async (b) => {
                if (b.user.id !== user.id) return b.reply({
                    enbeds: [returnErrorEmbed(`Only ${interaction.user} can interact with the button!`)],
                    ephemeral: true
                });

                collector.stop("Verified");

                await b.deferUpdate();

                dataTicket.deleteOne();

                const chDeleted = guild.channels.cache.get(dataTicket.channelId);
                const chPanel = guild.channels.cache.get(dataSetup.channelId);

                if (dataConfig) {
                    channel.send({
                        content: `<a:checkmark:1081679442595823686> The ticket will be **deleted** in less than 3 seconds.\nAction carried out by ${user} <t:${parseInt(Date.now() / 1000)}:R>.`
                    }).then(() => {
                        const ch = guild.channels.cache.get(dataConfig.channelLog);
                        return ch.send({
                            embeds: [returnEmbedLog(b, "Deleted", chPanel, chDeleted)]
                        });
                    });

                    return setTimeout(() => {
                        channel.delete();
                    }, 3000);
                } else {
                    channel.send({
                        content: `<a:checkmark:1081679442595823686> The ticket will be **deleted** in less than 3 seconds.\nAction carried out by ${user} <t:${parseInt(Date.now() / 1000)}:R>.`
                    });

                    return setTimeout(() => {
                        channel.delete();
                    }, 3000);
                }
            });

            collector.on("end", async (collect, reason) => {
                if (reason && reason === "Verified") {
                    await verify.delete().catch(() => { });
                } else {
                    verify.edit({
                        embeds: [verify.embeds[0].setColor("Red")],
                        components: [noVerified]
                    });
                }
            });
        }
    }
}

function returnErrorEmbed(text) {
    return new EmbedBuilder()
        .setAuthor({ name: "Error", iconURL: "https://i.imgur.com/UhD2EUb.png" })
        .setDescription(text)
        .setColor("Red")
}

function returnEmbedLog(interaction, action, panel, ticket) {
    return new EmbedBuilder()
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .addFields(
            { name: "Logged Info", value: `Ticket: ${ticket.name}\nAction: ${action}`, inline: true },
            { name: "Panel", value: `${panel}`, inline: true },
        )
        .setColor("Red")
        .setTimestamp()
}

function formatString(string) {
    return string.substring(0, 50);
}
