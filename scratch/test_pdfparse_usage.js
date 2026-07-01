const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function test() {
  const buffer = fs.readFileSync('abraao_cv.pdf');
  const parser = new PDFParse(new Uint8Array(buffer));
  const res = await parser.getText();
  console.log("res type:", typeof res);
  console.log("res keys:", Object.keys(res || {}));
  console.log("res text:", res);
}

test();
