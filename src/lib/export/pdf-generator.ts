import { jsPDF } from 'jspdf';
import type { GenerationResult } from '@/lib/types';

export async function generatePDF(result: GenerationResult): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Visual Master Chart', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(result.metadata.subject, margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date(result.metadata.generatedAt).toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Domain Analysis', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const domainInfo = [
    `Domain: ${result.pass1.domain}`,
    `Role: ${result.pass1.roleScope}`,
    `Lifecycle: ${result.pass1.lifecycle.phase1} → ${result.pass1.lifecycle.phase2} → ${result.pass1.lifecycle.phase3}`,
  ];

  domainInfo.forEach((line) => {
    doc.text(line, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Quality Metrics', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const metrics = [
    `Lifecycle Consistency: ${result.validation.lifecycleConsistency}%`,
    `Positive Framing: ${result.validation.positiveFraming}%`,
    `Format Consistency: ${result.validation.formatConsistency}%`,
    `Completeness: ${result.validation.completeness}%`,
  ];

  metrics.forEach((line) => {
    doc.text(line, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Content', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont('courier', 'normal');
  
  const lines = doc.splitTextToSize(result.fullDocument, contentWidth);
  const lineHeight = 4;
  const pageHeight = doc.internal.pageSize.getHeight();

  for (const line of lines) {
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += lineHeight;
  }

  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
