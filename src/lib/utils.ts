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
  import('xlsx').then(({ utils, write }) => {
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

    // Dùng Blob + <a download> thay vì writeFile để tương thích iframe/webview
    const buf = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Inject nội dung vào document hiện tại rồi gọi window.print() — tương thích iframe/WebCake/mobile
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

  // Overlay toàn trang khi in — CSS visibility cho phép override trên child element
  const style = document.createElement('style');
  style.setAttribute('data-hd-print-style', '');
  style.textContent = `
    @media print {
      body > *:not([data-hd-print]) { visibility: hidden !important; }
      [data-hd-print] {
        visibility: visible !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: 99999 !important;
        background: #fff !important;
        padding: 24px !important;
        font-family: Arial, sans-serif !important;
        color: #111 !important;
      }
      @page { margin: 1.5cm; }
    }
    [data-hd-print] { display: none; }
  `;

  const el = document.createElement('div');
  el.setAttribute('data-hd-print', '');
  el.innerHTML = `
    <h1 style="font-size:18px;margin:0 0 4px">${title}</h1>
    <div style="font-size:12px;color:#6b7280;margin-bottom:20px">Xuất ngày: ${dateStr} &nbsp;|&nbsp; ${filename}</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#7c3aed">${headers.map((h) => `<th style="color:#fff;padding:9px 12px;text-align:left;font-size:13px;font-weight:600">${h}</th>`).join('')}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  document.head.appendChild(style);
  document.body.appendChild(el);

  const cleanup = () => {
    if (document.head.contains(style)) document.head.removeChild(style);
    if (document.body.contains(el)) document.body.removeChild(el);
  };

  window.addEventListener('afterprint', cleanup, { once: true });
  // Fallback nếu afterprint không fire (iOS Safari)
  setTimeout(cleanup, 60_000);

  window.print();
}
