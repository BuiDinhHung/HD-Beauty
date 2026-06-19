import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: vi });
}

export function formatDateTime(date: Date): string {
  return format(date, 'HH:mm dd/MM/yyyy', { locale: vi });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getGradientColor(index: number): string {
  const gradients = [
    '#A78BFA',
    '#D8B4FE',
    '#A7F3D0',
    '#FBC8D4',
    '#F7C59F',
    '#93C5FD',
    '#FCA5A5',
    '#6EE7B7',
  ];
  return gradients[index % gradients.length];
}

export function exportToExcel(data: Record<string, unknown>[], filename: string) {
  import('xlsx').then(({ utils, writeFile }) => {
    const ws = utils.json_to_sheet(data);

    // Auto column width based on content
    const cols = Object.keys(data[0] ?? {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row) => String(row[key] ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws['!cols'] = cols;

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Báo cáo');
    writeFile(wb, `${filename}.xlsx`);
  });
}

// Dùng HTML + browser print để đảm bảo tiếng Việt hiển thị đúng (jsPDF helvetica không hỗ trợ dấu)
export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const dateStr = formatDate(new Date());

  const rowsHtml = rows
    .map(
      (row, i) =>
        `<tr style="background:${i % 2 === 1 ? '#f5f3ff' : '#fff'}">
          ${row.map((cell) => `<td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${cell}</td>`).join('')}
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #7c3aed; }
    th { color: #fff; padding: 9px 12px; text-align: left; font-size: 13px; font-weight: 600; }
    @media print {
      body { padding: 12px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="sub">Xuất ngày: ${dateStr} &nbsp;|&nbsp; ${filename}</div>
  <table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Vui lòng cho phép popup để xuất PDF'); return; }
  win.document.write(html);
  win.document.close();
}
