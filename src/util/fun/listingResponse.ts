import { Events, type Message } from 'discord.js';
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
            page?: string,
            logoUrl?: string
        },
        url: { 
            [key: string]: {
                title: string
                value: (url: string) => string | null | undefined,
            }
        },
        html: {
            [key: string]: {
                title: string,
                selector: string
            }
        }
    }
}

/**
 * url: Function code to grab any elements from the url
 * html: Provide any selectors for grabbing content from html
 */
const allowedSites: AllowedSites = {
    'ebay.com': {
        meta: {
            title: 'eBay',
            page: 'itm',
            logoUrl: 'https://ir.ebaystatic.com/cr/v/c1/ebay-logo-1-1200x630-margin.png'
        },
        url: {
            'id': {
                title: 'ID',
                value: (url: string) => {
                    const id = url.match(/\/(\d+)\?/);
                    return id ? id[1] : null; 
                }
            }
        },
        html: {
            'item_name': {
                title: 'Item Name',
                selector: '.x-item-title__mainTitle > span'
            },
            'seller_name': {
                title: 'Seller Name',
                selector: '.x-sellercard-atf__info__about-seller > a > span'
            },
            'condition': {
                title: 'Condition',
                selector: '.x-item-condition-text .ux-textspans'
            },
            'price': {
                title: 'Price',
                selector: '.x-price-primary'
            },
            'shipping': {
                title: 'Shipping',
                selector: '.ux-labels-values__values-content span:first'
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

            parseSite(word, domain)
                .then((parsedData) => {
                    if (!parsedData) return;
                    generateEmbed(message, word, domain, parsedData);
                });
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
            parsedData[key] = {
                title: el.title,
                value: $(el?.selector).text()
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
    message.reply(JSON.stringify(parsedData));
    console.log(parsedData, url, domain);
}

export default listingResponse;
