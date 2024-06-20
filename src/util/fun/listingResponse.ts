import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, Events, codeBlock, type Message } from 'discord.js';
import { type Utility } from '../../typings/index.js';
import { checkUrl } from '../../helpers.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

type ParsedData = { 
    [key: string]: {
        title: string,
        value: string | null | undefined
    }
}

type AllowedSites = { 
    [key: string]: {
        meta: {
            title: string,
            color: ColorResolvable,
            domainName: string,
            description?: string,
            logoUrl?: string
        },
        url?: { 
            [key: string]: {
                title: string
                value: (url: string) => string | null | undefined
            }
        },
        html?: {
            [key: string]: {
                prop?: string,
                title: string,
                selector: string,
                embed?: boolean,
                func?: (text: string) => string | null | undefined
            }
        },
        text?: {
            [key: string]: {
                title: string,
                value: string
            }
        }
    }
}

/**
 * url: Function code to grab any elements from the url
 * html: Provide any selectors for grabbing content from html
 * 
 * 'image' key will always be set as image
 */
export const allowedSites: AllowedSites = {
    'ebay.com/itm': {
        meta: {
            title: 'eBay Listing',
            color: 'Yellow',
            domainName: 'ebay.com',
            logoUrl: 'https://ir.ebaystatic.com/cr/v/c1/ebay-logo-1-1200x630-margin.png'
        },
        url: {
            'id': {
                title: '🏷️ ID',
                value: (url: string) => {
                    const id = url.match(/\/(\d+)/);
                    return id ? id[1] : null; 
                }
            }
        },
        html: {
            'item_name': {
                title: '📦 Item Name',
                selector: '.x-item-title__mainTitle > span'
            },
            'seller_name': {
                title: '🧍 Seller Name',
                selector: '.x-sellercard-atf__info__about-seller > a > span'
            },
            'condition': {
                title: '⛓️‍💥 Condition',
                selector: '.x-item-condition-text .ux-textspans'
            },
            'price': {
                title: '💰 Price',
                selector: '.x-price-primary'
            },
            'shipping': {
                title: '🚚 Shipping',
                selector: '.ux-labels-values--shipping .ux-textspans--BOLD',
                func: (text) => {
                    return (text.toLocaleLowerCase() === 'free') 
                        ? text
                        : 'See listing';
                }
            },
            'image': {
                title: 'image',
                prop: 'content',
                selector: 'meta[name="twitter:image"]'
            }
        }
    },
};

/**
 * @name listingResponse
 * @event MessageCreate
 * @author DrPepperG
 * @desc This utility
 */
const listingResponse: Utility = {
    name: 'listingResponse',
    events: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;

        const splitContent = message.content.split(' ');
        if (!splitContent) return;

        splitContent.forEach((word) => {
            if (!checkUrl(word)) return;

            // Remove the query parameters
            const cleanedUrl = word.split("?")[0];
            if (!cleanedUrl) return;

            const domainPage = cleanedUrl.match(/^https?:\/\/(?:www\.)?([^/]+(?:\/[^/]+)*?)\/?(?:\/[^/]+)?$/)?.[1];
            if (!domainPage) return;

            const allowedSite = allowedSites[domainPage];
            if (!allowedSite) return;

            // Parse the site
            parseSite(allowedSite, cleanedUrl)
                .then((parsedData) => {
                    if (!parsedData) return;
                    generateEmbed(message, cleanedUrl, allowedSite, parsedData);
                })
                .catch(() => {});
        });
    },
};

async function parseSite(allowedSite: AllowedSites[string], url: string): Promise<ParsedData | null> {
    if (!allowedSite) return null;
    
    const response = await axios.get(url).catch(() => {});
    if (!response) return null;

    const parsedData: ParsedData = {};

    // Search through the site's html
    if (allowedSite.html) {
        const $ = cheerio.load(response.data);
        
        for (const [key, el] of Object.entries(allowedSite.html)) {
            const selected = $(el?.selector);

            let value = null;
            if (el.prop) {
                value = selected.prop(el.prop);
            } else {
                value = selected.text();
            }

            // If we have a function, run the function and override the value
            if (el.func) {
                value = el.func(value);
            }

            parsedData[key] = {
                title: el.title,
                value: value
            };
        }
    }

    // Search through the site's url
    if (allowedSite.url) {
        for (const [key, el] of Object.entries(allowedSite.url)) {
            parsedData[key] = {
                title: el.title,
                value: el.value(url)
            };
        }
    }

    // Add any text if it exists
    if (allowedSite.text) {
        for (const [key, el] of Object.entries(allowedSite.text)) {
            parsedData[key] = {
                title: el.title,
                value: el.value
            };
        }
    }

    return parsedData;
}

async function generateEmbed(message: Message, url: string, allowedSite: AllowedSites[string], parsedData: ParsedData) {
    if (!parsedData || !allowedSite) return;

    const embed = new EmbedBuilder()
        .setTitle(allowedSite.meta.title)
        .setColor(allowedSite.meta.color)
        .setDescription(allowedSite.meta.description ? `${allowedSite.meta.description}\n${url}` : url)
        .setThumbnail(allowedSite.meta.logoUrl ? allowedSite.meta.logoUrl : null)
        .setURL(url)
        .setTimestamp()
        .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
        .setFooter({ text: `Version ${process.env.version}`});

    let displayImage = null;
    for (const [key, field] of Object.entries(parsedData)) {
        if (!field.value) continue;

        switch (key) {
            case 'image':
                displayImage = field.value;
                break;
            default:
                embed.addFields({
                    name: field.title,
                    value: codeBlock(field.value),
                    inline: (field.value.length <= 20)
                });
                break;
        }
    }

    // Create button link
    const button = new ButtonBuilder()
        .setLabel(allowedSite.meta.domainName)
        .setURL(url)
        .setStyle(ButtonStyle.Link);
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(button);

    message.channel.send({
        components: [row],
        embeds: [embed],
        files: displayImage ? [{ attachment: displayImage }] : []
    }).catch(console.log);

    message.delete().catch(() => {});
}

export default listingResponse;
