const { PDFParse } = require('pdf-parse');
console.log("PDFParse:", PDFParse.toString());
console.log("Methods:", Object.getOwnPropertyNames(PDFParse.prototype));
