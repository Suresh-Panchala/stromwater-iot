const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

console.log('Testing PDF generation...');

try {
  const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
  const output = fs.createWriteStream(path.join(__dirname, 'test.pdf'));

  doc.pipe(output);

  // Simple content
  doc.fontSize(18).text('Test PDF Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text('This is a test');

  doc.end();

  output.on('finish', () => {
    console.log('✅ PDF created successfully: test.pdf');
  });

  output.on('error', (err) => {
    console.error('❌ Error creating PDF:', err);
  });

} catch (error) {
  console.error('❌ Exception:', error);
}
