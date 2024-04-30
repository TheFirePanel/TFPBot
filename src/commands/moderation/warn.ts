import {
    //codeBlock,
    //EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type Guild,
} from 'discord.js';
import { Command } from '../../typings/index.js';
//import { sendBotLog } from '../../helpers.js';
//import { randomUUID } from 'node:crypto';


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

        await interaction.deferReply()
            .catch(console.error);

        switch(subCommand) {
            case 'add':
                await addWarning(interaction.guild, interaction);
                break;
            case 'list':
                await listWarnings(interaction.guild, interaction);
                break;
            case 'remove':
                await removeWarning(interaction.guild, interaction);
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
    const warnReason = interaction.options.get('reason', true).value;
    if (!warnUser || !warnReason) return interaction.editReply(`Required values have not been supplied`);

    console.log(guild, warnUser, warnReason);
}

/*async function listWarnings(guild: Guild, interaction: ChatInputCommandInteraction) {

}

async function removeWarning(guild: Guild, interaction: ChatInputCommandInteraction) {

}*/

export default warnCommand;