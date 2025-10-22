const PDFDocument = require('pdfkit');
const fs = require('fs');

// Test if PDF generation works
const doc = new PDFDocument({ margin: 30, size: 'A4' });
const output = fs.createWriteStream('test-output.pdf');

doc.pipe(output);

// Header
doc.fontSize(18).fillColor('#2563EB').text('Test PDF', { align: 'center' });
doc.moveDown();

// Simple table test
const tableTop = doc.y;
const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

// Header row
doc.fontSize(8).fillColor('#FFFFFF');
doc.rect(doc.page.margins.left, tableTop, pageWidth, 20).fill('#2563EB');
doc.text('Time', doc.page.margins.left + 5, tableTop + 6);
doc.text('Value', doc.page.margins.left + 100, tableTop + 6);

// Data row
doc.fontSize(7).fillColor('#1F2937');
doc.rect(doc.page.margins.left, tableTop + 20, pageWidth, 20).fill('#F9FAFB');
doc.text('10:30', doc.page.margins.left + 5, tableTop + 26);
doc.text('100.5', doc.page.margins.left + 100, tableTop + 26);

doc.end();

output.on('finish', () => {
  console.log('✅ PDF generated successfully: test-output.pdf');
});

output.on('error', (err) => {
  console.error('❌ PDF generation failed:', err);
});
