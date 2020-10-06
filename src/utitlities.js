exports.isObject = function(item) {
    return item && typeof item === "object" && !Array.isArray(item);
};

exports.mergeDeep = function(target, source) {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target)) Object.assign(output, {
                    [key]: source[key] });
                else output[key] = mergeDeep(target[key], source[key]);
            } else {
                Object.assign(output, {
                    [key]: source[key] });
            }
        });
    }
    return output;
};

exports.sanitizeHtml = function(markup) {
    markup = markup.replace(/&/g, "&amp;");
    markup = markup.replace(/</g, "&lt;");
    markup = markup.replace(/>/g, "&gt;");
    return markup;
};