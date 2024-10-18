import { Route } from '@/types';
import { CheerioAPI, Element, load } from 'cheerio';
import got from '@/utils/got';
// import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

const DOMAIN = 'ai.meta.com';

export const route: Route = {
    path: '/blog',
    categories: ['programming'],
    example: '/meta-ai/blog',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['ai.meta.com'],
        },
    ],
    name: 'AI at meta Blog',
    url: DOMAIN,
    maintainers: ['GarethNg'],
    handler,
};

const extractPostInfo = ($: CheerioAPI, postEle: Element) => {
    const title = $(postEle).find('.post-title').text().trim();
    const authors = $(postEle).find('.m-post-nick').text().trim();
    const date = $(postEle)
        .find('.m-post-date')
        .text()
        .replaceAll(/[年月]/g, '-')
        .replace('日', '')
        .trim();
    const description = $(postEle).find('.post-content').text();
    const tags = $(postEle).find('.tag-links').text().trim();
    const link = $(postEle).find('a.more-link').attr('href')!;
    return {
        title,
        link,
        description: description.replace(/阅读全文$/, '').trim(),
        pubDate: parseDate(date),
        author: authors,
        category: tags.split(',').map((tag) => tag.trim()),
    };
};

async function handler() {
    const baseUrl = `https://ai.meta.com/blog/`;
    const { data: response } = await got(baseUrl);
    const $ = load(response);
    const postEls = $('.post-container-wrapper div.post-container').toArray();
    const posts = postEls.map((el) => extractPostInfo($, el));

    return {
        title: '美团技术团队',
        link: baseUrl,
        item: posts,
        logo: 'https://awps-assets.meituan.net/mit/blog/v20190629/asset/icon/android-icon-192x192.png',
    };
}
