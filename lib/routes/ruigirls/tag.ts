import { Route } from '@/types';
import utils from './utils';

export const route: Route = {
    path: '/tag/:tag?',
    categories: ['picture'],
    example: '/ruigirls/tag/',
    parameters: { tag: '标签' },
    features: {
        requireConfig: [
            {
                name: 'RUIGIRLS_SESSION',
                description: 'ruigirls登陆后的session值，可在控制台的cookie下查找获取',
                optional: true,
            },
        ],
        requirePuppeteer: false,
        antiCrawler: true,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['ruigirlw.uk/'],
            target: '/tag',
        },
    ],
    name: 'Tag',
    maintainers: ['miffy'],
    handler,
    url: 'ruigirlw.uk/',
    description: ``,
};

async function handler(ctx) {
    const tag = ctx.req.param('tag');
    const currentUrl = `/tag/${tag}`;

    return await utils.ProcessTagItems(ctx, currentUrl);
}
