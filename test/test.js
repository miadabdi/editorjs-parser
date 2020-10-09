const testObject = require("./testData.json");
const edjsParser = require("../build/Parser.node");

const parser = new edjsParser();
const html = parser.parse(testObject);
console.log(html);