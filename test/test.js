const testObject = require("./testData.json");
const edjsParser = require("../src/Parser");

const parser = new edjsParser();
const html = parser.parse(testObject);
console.log(html);