function safeCell(value: unknown): string {
  const text = String(value ?? '');
  return /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
}
function filename(title: string) { return title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 150) || 'School report'; }

export async function createExcelBuffer(title: string, headers: string[], rows: unknown[][]) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('School report');
  sheet.addRow([safeCell(title)]);
  sheet.addRow(['Fictional sample data']);
  sheet.addRow(headers.map(safeCell));
  rows.forEach(row => sheet.addRow(row.map(safeCell)));
  sheet.getRow(3).font = { bold: true };
  sheet.columns.forEach(column => { column.width = 23; });
  return workbook.xlsx.writeBuffer();
}
export async function downloadExcel(title: string, headers: string[], rows: unknown[][]) {
  const data = await createExcelBuffer(title, headers, rows);
  saveBlob(new Blob([new Uint8Array(data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename(title)}.xlsx`);
}
// Standard PDF fonts support Latin text. Use explicit INR and ASCII punctuation in reports.
function pdfText(value: unknown) { return String(value ?? '').replace(/₹/g, 'INR ').replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"'); }
export async function createPdfDocument(title: string, headers: string[], rows: unknown[][]) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: headers.length > 5 ? 'landscape' : 'portrait' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const columnWidth = (width - 28) / Math.max(1, headers.length);
  let y = 34;
  function heading() {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    const titleLines = doc.splitTextToSize(pdfText(title), width - 28);
    doc.text(titleLines, 14, 16);
    y = 16 + titleLines.length * 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('ShalaTrack | Fictional sample data', 14, y); y += 10;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    const labels = headers.map(header => doc.splitTextToSize(pdfText(header), columnWidth - 3));
    labels.forEach((label, index) => doc.text(label, 14 + index * columnWidth, y));
    y += Math.max(1, ...labels.map(label => label.length)) * 4 + 7;
    doc.setFont('helvetica', 'normal');
  }
  heading();
  for (const row of rows) {
    const lines = row.map(value => doc.splitTextToSize(pdfText(value), columnWidth - 3));
    let offset = 0;
    const count = Math.max(1, ...lines.map(line => line.length));
    while (offset < count) {
      if (y + 8 > height - 16) { doc.addPage(); heading(); }
      const capacity = Math.max(1, Math.floor((height - 23 - y) / 4));
      const take = Math.min(capacity, count - offset);
      lines.forEach((line, index) => {
        const portion = line.slice(offset, offset + take);
        if (portion.length) doc.text(portion, 14 + index * columnWidth, y);
      });
      y += take * 4 + 7; offset += take;
      if (offset < count) { doc.addPage(); heading(); }
    }
  }
  if (!rows.length) doc.text('No records for these filters.', 14, y);
  return doc;
}
export async function downloadPdf(title: string, headers: string[], rows: unknown[][]) {
  const doc = await createPdfDocument(title, headers, rows);
  doc.save(`${filename(title)}.pdf`);
}
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function downloadMonthlyRegister(title: string, days: string[], rows: {name: string; days: string[]}[]) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape' });
  const nameWidth = 48; const dayWidth = (269 - nameWidth) / days.length; let y = 40;
  const heading = () => {
    doc.setFontSize(14); doc.text(pdfText(title), 14, 16); doc.setFontSize(8);
    doc.text('Fictional sample data | Each cell: present/eligible periods; dash: no marks', 14, 24);
    doc.setFontSize(7); doc.text('Student', 14, 33);
    days.forEach((day, index) => doc.text(day, 14 + nameWidth + index * dayWidth, 33));
  };
  heading();
  for (const row of rows) {
    if (y > 190) { doc.addPage(); heading(); y = 40; }
    doc.setFontSize(7); doc.text(doc.splitTextToSize(pdfText(row.name), nameWidth - 3).slice(0, 2), 14, y);
    row.days.forEach((value, index) => doc.text(pdfText(value), 14 + nameWidth + index * dayWidth, y)); y += 9;
  }
  doc.save(`${filename(title)}.pdf`);
}
