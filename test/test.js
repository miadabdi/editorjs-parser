const testObject = require("./testData.json");
const edjsParser = require("../build/Parser.node");

const parser = new edjsParser({
    embed: { useProvidedLength: false },
    quote: { applyAlignment: true },
}, {}, {
    youtube: '<THIS IS YOUTUBE EMBED><%data.embed%><%data.length%><THIS IS FOR TESTING>'
});
const html = parser.parse(testObject);
console.log("HTML:\n" + html);