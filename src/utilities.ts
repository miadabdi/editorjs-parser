export const isObject = function (item: unknown): item is Record<string, any> {
    return !!item && typeof item === "object" && !Array.isArray(item);
};

export const mergeDeep = function (
    target: Record<string, any>,
    source: Record<string, any>
): Record<string, any> {
    const output: Record<string, any> = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target)) output[key] = source[key];
                else output[key] = mergeDeep(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
};

export const sanitizeHtml = function (markup: string): string {
    // single pass, so the inserted entities are never re-escaped
    return markup.replace(/[&<>]/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" } as Record<string, string>)[c]
    );
};

export const embedMarkups: Record<string, string> = {
    youtube: `<div class="embed"><iframe class="embed-youtube" frameborder="0" src="<%data.embed%>" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen <%data.length%>></iframe></div>`,

    twitter: `<blockquote class="twitter-tweet" class="embed-twitter" <%data.length%>><a href="<%data.source%>"></a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>`,

    instagram: `<blockquote class="instagram-media" <%data.length%>><a href="<%data.embed%>/captioned"></a></blockquote><script async defer src="//www.instagram.com/embed.js"></script>`,

    codepen: `<div class="embed"><iframe <%data.length%> scrolling="no" src="<%data.embed%>" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe></div>`,

    defaultMarkup: `<div class="embed"><iframe src="<%data.embed%>" <%data.length%> class="embed-unknown" allowfullscreen="true" frameborder="0" ></iframe></div>`,
};
