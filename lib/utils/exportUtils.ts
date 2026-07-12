import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToCSV = (data: any[], filename: string, columns: { header: string; accessor: string | ((row: any) => string) }[]) => {
  if (!data || data.length === 0) return;

  const csvRows = [];
  const headers = columns.map(c => `"${c.header}"`);
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = columns.map(c => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : resolvePath(row, c.accessor);
      return `"${String(val || '').replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: any[], filename: string, columns: { header: string; accessor: string | ((row: any) => string) }[]) => {
  if (!data || data.length === 0) return;

  const formattedData = data.map(row => {
    const obj: any = {};
    columns.forEach(c => {
      obj[c.header] = typeof c.accessor === 'function' ? c.accessor(row) : resolvePath(row, c.accessor);
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (data: any[], title: string, filename: string, columns: { header: string; accessor: string | ((row: any) => string) }[]) => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

  const tableData = data.map(row => {
    return columns.map(c => {
      return typeof c.accessor === 'function' ? c.accessor(row) : resolvePath(row, c.accessor);
    });
  });

  const headers = columns.map(c => c.header);

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${filename}.pdf`);
};

export const printReport = (data: any[], title: string, columns: { header: string; accessor: string | ((row: any) => string) }[]) => {
  if (!data || data.length === 0) return;

  const headers = columns.map(c => `<th>${c.header}</th>`).join('');
  const rows = data.map(row => {
    const tds = columns.map(c => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : resolvePath(row, c.accessor);
      return `<td>${val || ''}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #333; }
          h1 { text-align: center; color: #111; }
          .date { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; color: #333; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="date">Generated: ${new Date().toLocaleString()}</div>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <script>
          window.onload = () => { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// Helper to resolve nested object paths like 'assetId.name'
function resolvePath(obj: any, path: string) {
  return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
}
