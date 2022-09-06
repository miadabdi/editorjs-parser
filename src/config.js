export default {
    simpleImage: {
        use: "figure",
        imgClass: "img-simple",
        figureClass: "fig-img-simple",
        figCapClass: "fig-cap-simple",
        path: "absolute",
    },
    image: {
        use: "figure", // figure or img (figcaption will be used for caption of figure)
        imgClass: "img",
        figureClass: "fig-img",
        figCapClass: "fig-cap",
        path: "absolute",
    },
    paragraph: {
        pClass: "paragraph",
    },
    code: {
        codeBlockClass: "code-block",
    },
    embed: {
        useProvidedLength: false,
        // set to true if you want the returned width and height of editorjs to be applied
        // NOTE: sometimes source site overrides the lengths so it does not work 100%
    },
    quote: {
        applyAlignment: false,
        // if set to true blockquote element will have text-align css property set
    },
    linkTool: {
        linkCardClass: 'link-tool-card',
        linkToolMainClass: 'link-tool-main',
        titleClass: 'tl-title',
        descriptionClass: 'tl-description',
        linkClass: 'tl-link',
        imgWrapperClass: 'link-image-wrapper',
        imgBgClass: 'link-img-bg'
    }
};