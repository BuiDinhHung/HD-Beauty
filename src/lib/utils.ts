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
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, `${filename}.xlsx`);
  });
}

export async function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Xuất ngày: ${formatDate(new Date())}`, 14, 32);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [167, 139, 250] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  doc.save(`${filename}.pdf`);
}
