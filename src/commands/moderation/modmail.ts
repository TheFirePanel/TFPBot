import {
    codeBlock,
    EmbedBuilder,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type Embed,
} from 'discord.js';
import { Command } from '../../typings/index.js';
import { randomUUID } from 'node:crypto';

const modmailCommand: Command = {
    data: new SlashCommandBuilder()
        .addStringOption(option => 
            option
                .setName('message')
                .setDescription('The message for the mod team.')
                .setRequired(true)
        )
        .setDMPermission(false)
        .setName('modmail')
        .setDescription('Sends a message to the mod team.'),
    async execute(interaction) {
        if (!interaction.guild) return;
        interaction.deferReply({ ephemeral: true });

        const message = interaction.options.get('message', true).value as string;
        return createModMail(message, interaction);
    }
};

async function createModMail(message: string, interaction: ChatInputCommandInteraction) {
    const { client, guild, user } = interaction;
    if (!guild || !user) return;

    // Get configured mod channel
    const channelName = guild.client.getConfig('modChatChannel', guild.id);
    const modChannel = guild.channels.cache.find((channel) => {
        return (channel.name === channelName);
    });
    if (!modChannel || !modChannel.isTextBased()) return;

    // Create the mail id before we send it to the moderators
    const mailId = randomUUID();
    const embed = new EmbedBuilder()
        .setColor('Red')
        .setTimestamp()
        .setFooter({
            text: `Mail ID ${mailId} • Version ${process.env.version}`
        })
        .setTitle(`📫 ${guild.name} Modmail`)
        .toJSON();

    const userMessage = await user.send({
        embeds: [
            new EmbedBuilder(embed)
                .setDescription(`
                Reply to this embed to send any additional respones, any message sent without using reply will be ignored.

                **Please refrain from spamming, failure to do so will result in disciplinary action.**
                `)
                .addFields(
                    {
                        name: '🗒️ Message',
                        value: codeBlock(((message as string) || 'No message provided???'))
                    }
                )
        ]
    }).catch(() => {});
    if (!userMessage) return interaction.editReply({
        embeds: [
            new EmbedBuilder(embed)
                .setTitle(`😔 Unable to send message`)
                .setDescription(`Direct messages must be open to send modmail, please allow the bot to message you and try again.`)
        ]
    });

    await modChannel.send({
        embeds: [
            new EmbedBuilder(embed)
                .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
                .setTitle(`📬 Modmail from ${user.displayName}`)
                .addFields(
                    {
                        name: '🙍 User',
                        value: `<@${user.id}>`,
                        inline: true
                    },
                    {
                        name: '🗒️ Message',
                        value: codeBlock(((message as string) || 'No message provided???'))
                    }
                )
        ]
    });

    // Attempt to add to database
    await client.db
        .insertInto('modmail')
        .values({
            id: mailId,
            user_id: user.id,
            guild_id: guild.id,
            dm_channel_id: userMessage.channel.id,
            message: message,
        })
        .execute()
        .catch((err) => {
            interaction.editReply({
                content: `A database error has occured, please contact a bot administrator for help. \n **${err}**`,
            });
            return console.error(err);
        });

    return interaction.editReply({
        embeds: [
            new EmbedBuilder(embed)
                .setDescription(`Modmail sent, please check your direct messages for more information.`)
        ]
    });
}

/**
 * To limit having to rely on database message ids we can extract the mailId in the footer of our embeds.
 * It is recommeded to make sure this embed is coming from the client user account.
 * 
 * Grabbing the ID from the embed allows all previous embeds to be used for the conversation,
 * storing multiple ids or just changing one can cause multiple edge cases.
 * @param embed The embeded object to extract the mailId from
 * @returns string
 */
export function extractMailId(embed: Embed): string | null | undefined {
    if (!embed.footer || !embed.footer.text) return null;

    // UUID Regex
    const uuidPattern: RegExp = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/;
    const extractedId: string | undefined = embed.footer?.text.match(uuidPattern)?.[0];

    return extractedId;
}

export default modmailCommand;