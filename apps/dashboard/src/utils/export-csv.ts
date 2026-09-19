export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(','),
    ...rows.map((row) =>
      keys
        .map((k) => {
          let val = row[k];
          if (val === null || val === undefined) val = '';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
