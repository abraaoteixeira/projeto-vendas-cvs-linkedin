const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  try {
    const buffer = fs.readFileSync('abraao_cv.pdf');
    console.log("Buffer size:", buffer.length);
    const data = await pdfParse(buffer);
    console.log("Text length:", data.text.length);
    console.log("First 100 chars:", JSON.stringify(data.text.slice(0, 100)));
  } catch (err) {
    console.error("Error parsing pdf:", err);
  }
}

test();
