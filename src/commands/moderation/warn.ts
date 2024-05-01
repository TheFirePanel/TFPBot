import {
    codeBlock,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type Guild,
} from 'discord.js';
import { Command } from '../../typings/index.js';
import { randomUUID } from 'node:crypto';
import { embedEntries, sendBotLog } from '../../helpers.js';


const warnCommand: Command = {
    data: new SlashCommandBuilder()
        .addSubcommand(option => 
            option
                .setName('add')
                .setDescription('Add a warning to a user.')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('The user to warn.')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('reason')
                    .setDescription('Reason for warning the user.')
                    .setRequired(true)
                )
                .addBooleanOption(option => option
                    .setName('public')
                    .setDescription('Whether to publicly display warning message to user.')
                )
        )
        .addSubcommand(option => 
            option
                .setName('list')
                .setDescription('List warnings that a user has.')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('The user to get warnings of.')
                    .setRequired(true)
                )
        )
        .addSubcommand(option => 
            option
                .setName('remove')
                .setDescription('Removes a warn by ID.')
                .addStringOption(option => option
                    .setName('id')
                    .setDescription("The ID of the warn to remove.")
                    .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .setName('warn')
        .setDescription('Warns mentioned user for specified reason.'),
    async execute(interaction) {
        if (!interaction.channel || !interaction.channel.isTextBased() || !interaction.inCachedGuild()) return;

        const subCommand = interaction.options.getSubcommand();

        // This should never run but we will do this anyway, command is blocked from dms
        if (!interaction.guild) return interaction.reply({ content: `This command must be ran in a guild!`, ephemeral: true })
            .catch(console.error);

        await interaction.deferReply({ ephemeral: true })
            .catch(console.error);

        switch(subCommand) {
            case 'add':
                await addWarning(interaction.guild, interaction);
                break;
            case 'list':
                await listWarnings(interaction.guild, interaction);
                break;
            case 'remove':
                //await removeWarning(interaction.guild, interaction);
                break;
        }

        if (!interaction.replied) {
            interaction.editReply(`Function has completed but no reply was given, please contact a bot administrator.`)
                .catch(console.error);
        }
        
        return;
    }
};

async function addWarning(guild: Guild, interaction: ChatInputCommandInteraction) {
    const warnUser = interaction.options.get('user', true).user;
    const warnReason = interaction.options.get('reason', true).value as string;
    if (!warnUser || !warnReason) return interaction.editReply(`Required values have not been supplied`);

    const moderator = interaction.user;

    const warnId = randomUUID();
    await interaction.client.db
        .insertInto('warnings')
        .values({
            id: warnId,
            user_id: warnUser.id,
            guild_id: guild.id,
            mod_id: moderator.id,
            reason: warnReason
        })
        .execute()
        .catch((err) => {
            interaction.editReply(err);
        });

    const displayWarning = interaction.options.get('public')?.value;
    if (displayWarning) {
        interaction.channel?.send({
            content: `<@${warnUser.id}>`,
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`
                        You've recieved an official warning from **${guild.name}** moderation team.
                        The reason supplied with the warn will be shown below.
                        
                        *If you believe this has been done in error please contact the moderation staff using **/modmail***
                    `)
                    .addFields(
                        {
                            name: '🗒️ Reason',
                            value: codeBlock(warnReason),
                            inline: true
                        }
                    )
                    .setTimestamp()
                    .setFooter({
                        text: `Warn ID ${warnId} • Version ${process.env.version}`
                    })
                    .setTitle(`👮 ${guild.name} Official Warning`)
            ]
        });
    }

    sendBotLog(guild, {
        title: 'Warning Given',
        embed: new EmbedBuilder()
            .setAuthor({ name: warnUser.displayName, iconURL: warnUser.displayAvatarURL() })
            .addFields(
                {
                    name: '🙍 User',
                    value: `<@${warnUser.id}>`,
                    inline: true
                },
                {
                    name: '🛡️ Staff Member',
                    value: `<@${moderator.id}>`,
                    inline: true
                },
                {
                    name: '🗒️ Reason',
                    value: codeBlock((warnReason || 'No reason provided'))
                },
                {
                    name: '🪪 ID',
                    value: codeBlock(warnId)
                }
            )
    });

    return interaction.editReply(`Warning successfully given!`);
}

async function listWarnings(guild: Guild, interaction: ChatInputCommandInteraction) {
    const warnUser = interaction.options.get('user', true).user;
    if (!warnUser) return interaction.editReply(`Required values have not been supplied`);

    const warnings = await interaction.client.db
        .selectFrom('warnings')
        .selectAll()
        .where('user_id', '=', warnUser.id)
        .where('guild_id', '=', guild.id)
        .execute()
        .then((warnings) => {
            return warnings;
        })
        .catch(() => {});
    if (!warnings || warnings.length <= 0) return interaction.editReply(`User has no warnings on record.`);

    const embeds = embedEntries(warnings, {
        title: `Warnings for ${warnUser.displayName}`
    }, (embed, warning) => {
        embed.addFields({
            name: warning.created_at.toLocaleString(),
            value: `
                🛡️ **Moderator**: <@${warning.mod_id}>
                🗒️ **Reason**: ${codeBlock(warning.reason ? warning.reason : 'None provided.')}
            `,
            inline: true
        });
    });
    if (!embeds) return interaction.editReply(`There are no embeds in response, unable to send data.`);

    return interaction.editReply({
        embeds: embeds
    });
}

/*async function removeWarning(guild: Guild, interaction: ChatInputCommandInteraction) {

}*/

export default warnCommand;