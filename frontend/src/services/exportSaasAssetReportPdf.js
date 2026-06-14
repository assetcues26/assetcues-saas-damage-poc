import { jsPDF } from 'jspdf';
import { pdfSafeText } from './assetReportPdf';

const MARGIN = 14;

/**
 * @param {{ asset: object, analysis?: object | null }} input
 */
export async function exportSaasAssetReportPdf({ asset, analysis }) {
  const doc = new jsPDF();
  let y = MARGIN;

  const line = (label, value) => {
    if (value == null || value === '') return;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfSafeText(`${label}:`), MARGIN, y);
    doc.setFont('helvetica', 'normal');
    const text = pdfSafeText(String(value));
    const lines = doc.splitTextToSize(text, 180 - MARGIN);
    doc.text(lines, MARGIN + 45, y);
    y += Math.max(lines.length * 5, 6);
    if (y > 270) {
      doc.addPage();
      y = MARGIN;
    }
  };

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfSafeText('SaaS Asset Report'), MARGIN, y);
  y += 10;

  doc.setFontSize(12);
  line('Asset ID', asset.assetid);
  line('Name', asset.assetname);
  line('Company', asset.company);
  line('Cost', asset.cost != null ? `Rs. ${Number(asset.cost).toLocaleString('en-IN')}` : null);
  line('Acquired', asset.acquisitiondate);
  line('AI Status', asset.ai_status);

  y += 4;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Registered vs Detected', MARGIN, y);
  y += 8;

  const resp = analysis?.response_json || {};
  const summary = analysis?.failure_summary || {};
  const fc = summary.field_comparison || {};

  Object.entries(fc).forEach(([key, comp]) => {
    line(key, `Registered: ${comp.registered ?? '—'} | Detected: ${comp.detected ?? '—'} | ${comp.match ? 'Match' : 'Mismatch'}`);
  });

  if (resp.detectedAsset) line('Detected asset', resp.detectedAsset);
  if (resp.condition) line('Condition', resp.condition);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Validation checks', MARGIN, y);
  y += 8;
  doc.setFont('helvetica', 'normal');

  const checks = summary.checks || {};
  const percents = {
    namedescriptionmatch: summary.namedescriptionmatchpercent,
    subcatmodelmatch: summary.subcatmodelmatchpercent,
    detectedtagnumbermatch: summary.detectedtagnumbermatchpercent,
    costmatch: summary.costmatchpercent,
    datematch: summary.datematchpercent,
  };
  Object.entries(checks).forEach(([k, passed]) => {
    const pct = percents[k];
    line(k, `${passed ? 'PASS' : 'FAIL'}${pct != null ? ` (${pct}%)` : ''}`);
  });

  if (resp.damage_assessment) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Damage assessment', MARGIN, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const dmg = doc.splitTextToSize(pdfSafeText(resp.damage_assessment), 180);
    doc.text(dmg, MARGIN, y);
  }

  const filename = `saas-asset-${asset.assetid || asset.id}.pdf`;
  doc.save(filename);
}
