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
            description?: string,
            page?: string,
            logoUrl?: string
        },
        url: { 
            [key: string]: {
                title: string
                value: (url: string) => string | null | undefined
            }
        },
        html: {
            [key: string]: {
                prop?: string,
                title: string,
                selector: string,
                embed?: boolean
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
    'ebay.com': {
        meta: {
            title: 'eBay Listing',
            color: 'Yellow',
            logoUrl: 'https://ir.ebaystatic.com/cr/v/c1/ebay-logo-1-1200x630-margin.png',
            page: 'itm',
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
                selector: '.ux-labels-values--shipping .ux-textspans--BOLD'
            },
            'image': {
                title: 'image',
                prop: 'content',
                selector: 'meta[name="twitter:image"]'
            }
        }
    }
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
            // Extract domain and tld
            const domain = word.replace(/^(?:https?:\/\/)?(?:[^\/]+\.)?([^.\/]+\.[^.\/]+).*$/, "$1");
            if (!Object.keys(allowedSites).includes(domain)) return;

            // Remove the query parameters
            const cleanedUrl = word.split("?")[0];
            if (!cleanedUrl) return;

            // Parse the site
            parseSite(cleanedUrl, domain)
                .then((parsedData) => {
                    if (!parsedData) return;
                    generateEmbed(message, cleanedUrl, domain, parsedData);
                })
                .catch(() => {});
        });
    },
};

async function parseSite(url: string, domain: string): Promise<ParsedData | null> {
    const allowedSite = allowedSites[domain];
    if (!allowedSite) return null;
    // If we set a page then validate it
    if (allowedSite.meta.page) {
        const regex = new RegExp(`/${allowedSite.meta.page}/([^/?]+)`);
        if (!regex.test(url)) return null;
    }
    
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

    return parsedData;
}

async function generateEmbed(message: Message, url: string, domain: string, parsedData: ParsedData) {
    const allowedSite = allowedSites[domain];
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
        .setLabel(domain)
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
