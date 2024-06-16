import { Collection, type EmojiIdentifierResolvable, Events, type Message } from 'discord.js';
import { type Utility } from '../../typings/index.js';
import { db } from '../../database/database.js';

export type Response = {
    type: "phrase" | "word";
} & (
    | { response_type: "reaction"; value: EmojiIdentifierResolvable }
    | { response_type: "message"; value: string }
);

/**
 * @name autoResponse
 * @event MessageCreate
 * @author DrPepperG
 * @desc This utility initializes the 
 */
const autoResponse: Utility = {
    name: 'autoResponse',
    events: Events.MessageCreate,
    cache: {
        responses: {}
    },
    async refreshCache() {
        if (!this.cache?.responses) return;

        // Clear cache
        this.cache.responses = {};

        await db.selectFrom('responses')
            .selectAll()
            .execute()
            .then((values) => {
                values.forEach((response) => {
                    if (!response.guild_id) return; // Make sure a guild exists
                    // Create a new collection if it doesn't exist
                    if (!this.cache?.responses[response.guild_id]) this.cache!.responses[response.guild_id] = new Collection();
                    this.cache?.responses[response.guild_id]?.set(response.trigger, response);
                });
            })
            .catch();
    },
    async execute(message: Message) {
        if (!this.refreshCache) {
            console.error('Missing refresh cache method!');
            return;
        }

        if (message.author.bot) return;

        if (!message.guild) return;
        const guildResponses: Collection<string, Response> = this.cache?.responses[message.guild.id];
        if (!guildResponses) return;

        if (!message) return;
        if (!message.content) return;

        const caughtResponses: Response[] = []; // Create a temp array

        // Store our content
        const content = message.content.toLowerCase();

        // Check each response
        guildResponses.each((value, key) => {
            switch(value.type) {
                case 'word':
                    // Check whole words, includes lets something like test return true for "est"
                    if (!new RegExp(`\\b${key}\\b`).test(content)) return;
                    break;
                case 'phrase':
                    if (content !== key) return;
                    break;    
            }

            caughtResponses.push(value);
        });

        // If we don't have a response no need to run any further
        if (!caughtResponses) return;
        caughtResponses.forEach((response) => {
            switch(response.response_type) {
                case 'reaction':
                    message.react(response.value)
                        .catch(() => {});
                    break;
                case 'message':
                    message.reply({
                        content: response.value,
                        allowedMentions: { repliedUser: false }
                    }).catch(() => {});
                    break;    
            }
        });
    },
};

export default autoResponse;
