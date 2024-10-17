import cache from '@/utils/cache';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import { config } from '@/config';
import { CookieJar } from 'tough-cookie';

import ConfigNotFoundError from '@/errors/types/config-not-found';
const allowDomain = new Set(['www.ruigirlw.uk']);

const cookieJar = new CookieJar();

const ProcessTagItems = async (ctx, currentUrl) => {
    const domain = ctx.req.query('domain') ?? 'www.ruigirlw.uk';

    const url = new URL(currentUrl, `https://${domain}`);
    if (!config.feature.allow_user_supply_unsafe_domain && !allowDomain.has(url.hostname)) {
        throw new ConfigNotFoundError(`This RSS is disabled unless 'ALLOW_USER_SUPPLY_UNSAFE_DOMAIN' is set to 'true'.`);
    }

    const cookie: string = config.ruigirls.session ?? '';
    cookieJar.setCookie(cookie, url.href);

    const response = await ofetch(url.href, { headers: { Cookie: cookie } });
    const $ = load(response);

    // $('.container').remove();

    const items = $('article')
        .slice(0, ctx.req.query('limit') ? Number.parseInt(ctx.req.query('limit')) : 20)
        .toArray()
        .map((item) => {
            const cheerioItem = $(item);
            return {
                title: cheerioItem.text(),
                link: String(cheerioItem.find('a').attr('href')),
                pubDate: cheerioItem.find('time').text(),
            };
        });

    let result_items = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await ofetch(item.link, { headers: { Cookie: cookie } });

                const content = load(response);
                const description = content('article').html();
                const images = content('article img').toArray();
                if (images.length < 10) {
                    return '';
                }
                return {
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    category: content('.item-3').find('a').text(),
                    author: content('body > section > div.content-wrap > div > article > p:nth-child(1) > a').text(),
                    description,
                };
            })
        )
    );
    if (items.length === 0) {
        return {
            title: '',
            link: url.href,
            item: [],
        };
    }
    if (!items[0]) {
        return {
            title: '',
            link: url.href,
            item: [],
        };
    }
    const source = items[0].title.match(/\[(.*?)\]/)?.[1] || '';
    let author = '';
    result_items = result_items.filter((item) => item !== '');
    if (typeof result_items[0] === 'object' && result_items[0] !== null) {
        author = result_items[0].author;
    }
    const title = `${source} - ${author}`;

    return {
        title,
        link: url.href,
        item: result_items,
    };
};

export default { ProcessTagItems };
