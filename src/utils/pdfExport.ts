import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/logo.png';
import type { RecordEntry } from '../types/record';
import type { FollowUpItem } from '../types/followup';
import type { CustomFieldDefinition } from '../types/customField';
import type { AccountActivityRecord } from '../types/auth';
import { formatDateDisplay, formatTimeDisplay } from './dateUtils';

// Brand Color Palette (Forest Green & Warm Ivory)
const COLORS = {
  primary: [36, 71, 53] as [number, number, number],       // #244735 Forest Green
  primaryDark: [24, 48, 36] as [number, number, number],   // #183024 Deep Forest
  secondary: [49, 92, 70] as [number, number, number],     // #315C46 Medium Sage
  accentBg: [247, 248, 245] as [number, number, number],   // #F7F8F5 Warm Ivory
  softGreen: [234, 241, 235] as [number, number, number],  // #EAF1EB Light Green
  textDark: [37, 43, 39] as [number, number, number],      // #252B27
  textMuted: [95, 105, 98] as [number, number, number],    // #5F6962
  borderColor: [229, 233, 227] as [number, number, number],// #E5E9E3
  white: [255, 255, 255] as [number, number, number],
  amber: [180, 83, 9] as [number, number, number],
  red: [185, 28, 28] as [number, number, number],
};

/**
 * Loads the company logo image safely into an HTMLImageElement for jsPDF.
 */
function loadLogoImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback: try public root path
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => resolve(null);
      fallback.src = '/logo.png';
    };
    img.src = src;
  });
}

/**
 * Sanitizes strings for safe rendering in standard jsPDF fonts.
 */
function sanitizeText(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  return str;
}

/**
 * Formats ISO or raw timestamp into readable local date and time.
 */
function formatDateTime(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const datePart = d.toISOString().slice(0, 10);
    const timePart = d.toTimeString().slice(0, 5);
    return `${formatDateDisplay(datePart)} at ${formatTimeDisplay(timePart)}`;
  } catch {
    return isoStr;
  }
}

// ----------------------------------------------------------------------
// 1. EXPORT WORK RECORDS (PDF)
// ----------------------------------------------------------------------

export interface WorkRecordsExportData {
  user: {
    full_name?: string;
    email: string;
  };
  records: RecordEntry[];
  followUps: FollowUpItem[];
  categories?: string[];
  customFields?: CustomFieldDefinition[];
}

export async function exportWorkRecordsPDF(data: WorkRecordsExportData): Promise<void> {
  const { user, records, followUps, customFields = [] } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const now = new Date();
  const exportTimestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
  const dateStr = now.toISOString().slice(0, 10);

  // Map follow-ups by record_id to identify linked vs standalone
  const recordMap = new Map<string, RecordEntry>();
  records.forEach((r) => recordMap.set(r.id, r));

  const linkedFollowUpsCount = followUps.filter((f) => f.record_id && recordMap.has(f.record_id)).length;
  const standaloneFollowUpsCount = followUps.length - linkedFollowUpsCount;

  // Custom field lookup map (id -> definition) to display field names on records
  const cfMap = new Map<string, CustomFieldDefinition>();
  customFields.forEach((cf) => cfMap.set(cf.id, cf));

  // --- HEADER BANNER WITH COMPANY LOGO ---
  // Warm Ivory background with Forest Green top accent
  doc.setFillColor(...COLORS.accentBg);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 3.5, 'F');

  doc.setDrawColor(...COLORS.borderColor);
  doc.setLineWidth(0.3);
  doc.line(0, 38, pageWidth, 38);

  // Attempt to render the company logo replacing the headline text
  const logo = await loadLogoImage(logoImg);
  if (logo && logo.naturalWidth > 0) {
    // 2168 x 725 -> ratio is ~2.99:1
    const logoW = 38;
    const logoH = 38 / (logo.naturalWidth / logo.naturalHeight);
    doc.addImage(logo, 'PNG', margin, 7, logoW, logoH);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.primary);
    doc.text('WorkTrace', margin, 17);
  }

  // Subtitle under the logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('Work Records Backup', margin, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Your Work. Your Record. | Confidential Backup', margin, 30);

  // Right-aligned header metadata
  const userLabel = user.full_name ? `${user.full_name} (${user.email})` : user.email;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(userLabel, pageWidth - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Exported: ${exportTimestamp}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Total Records: ${records.length}  |  Follow-ups: ${followUps.length}`, pageWidth - margin, 26, { align: 'right' });

  let currentY = 46;

  // --- EXECUTIVE SUMMARY CARD ---
  doc.setFillColor(...COLORS.accentBg);
  doc.setDrawColor(...COLORS.borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('SUMMARY OF STORED BACKUP DATA', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textDark);

  const colW = contentWidth / 4;
  doc.text(`Total Records: ${records.length}`, margin + 4, currentY + 13);
  doc.text(`Total Follow-ups: ${followUps.length}`, margin + 4 + colW, currentY + 13);
  doc.text(`Linked Follow-ups: ${linkedFollowUpsCount}`, margin + 4 + colW * 2, currentY + 13);
  doc.text(`Standalone Follow-ups: ${standaloneFollowUpsCount}`, margin + 4 + colW * 3, currentY + 13);

  currentY += 26;

  // --- SECTION 1: WORK RECORDS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. Work Activity Records', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    `Comprehensive register of all ${records.length} recorded work activities and time-stamped notes.`,
    margin,
    currentY + 5
  );

  currentY += 9;

  if (records.length === 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [['No activity records stored in your WorkTrace account.']],
      theme: 'plain',
      styles: { fontSize: 9, textColor: COLORS.textMuted, fontStyle: 'italic' },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  } else {
    // Sort records chronologically (newest first)
    const sortedRecords = [...records].sort((a, b) => {
      const dtA = `${a.activity_date} ${a.activity_time || '00:00'}`;
      const dtB = `${b.activity_date} ${b.activity_time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });

    const recordsTableBody = sortedRecords.map((r, idx) => {
      const dateDisplay = `${formatDateDisplay(r.activity_date)} ${r.activity_time ? `(${formatTimeDisplay(r.activity_time)})` : ''}`;
      const title = r.title ? r.title : 'Untitled Activity';
      const category = r.category || 'General';

      // Build custom field details string for this record
      const detailsList: string[] = [];
      if (r.custom_field_values && typeof r.custom_field_values === 'object') {
        Object.entries(r.custom_field_values).forEach(([key, val]) => {
          if (val === undefined || val === null || val === '') return;
          const cfDef = cfMap.get(key);
          const fieldName = cfDef ? cfDef.name : key;
          const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
          detailsList.push(`${fieldName}: ${displayVal}`);
        });
      }

      // Check linked follow-ups for this record
      const linked = followUps.filter((f) => f.record_id === r.id);
      const linkedStr = linked.length > 0
        ? `\nLinked Follow-ups (${linked.length}): ` + linked.map((f) => `"${f.title}" [${f.status}]`).join('; ')
        : '';

      const detailsBlock = detailsList.length > 0
        ? `\nDetails: ${detailsList.join(' | ')}`
        : '';

      const description = sanitizeText(r.description);

      return [
        String(idx + 1),
        dateDisplay,
        title,
        category,
        description + detailsBlock + linkedStr,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Date & Time', 'Title', 'Category', 'Description & Details']],
      body: recordsTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
      },
      styles: {
        fontSize: 8,
        textColor: COLORS.textDark,
        cellPadding: 2.8,
        overflow: 'linebreak',
        lineColor: COLORS.borderColor,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 32 },
        2: { cellWidth: 34, fontStyle: 'bold' },
        3: { cellWidth: 24 },
        4: { cellWidth: 'auto' },
      },
      alternateRowStyles: {
        fillColor: COLORS.accentBg,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Check if we need a new page for Section 2
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  // --- SECTION 2: FOLLOW-UPS & COMMITMENTS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.text('2. Follow-ups & Commitments', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    `All ${followUps.length} follow-up tasks with due dates, priority, status, and linked parent record references.`,
    margin,
    currentY + 5
  );

  currentY += 9;

  if (followUps.length === 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [['No follow-up items recorded in your WorkTrace workspace.']],
      theme: 'plain',
      styles: { fontSize: 9, textColor: COLORS.textMuted, fontStyle: 'italic' },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  } else {
    // Sort follow-ups (due date chronological)
    const sortedFollowUps = [...followUps].sort((a, b) => {
      const d1 = a.due_date || '9999-99-99';
      const d2 = b.due_date || '9999-99-99';
      return d1.localeCompare(d2);
    });

    const followUpsTableBody = sortedFollowUps.map((f, idx) => {
      const linkedRecord = f.record_id ? recordMap.get(f.record_id) : null;
      const parentRecordInfo = linkedRecord
        ? `Linked to Record: "${linkedRecord.title || 'Untitled'}" (${formatDateDisplay(linkedRecord.activity_date)})`
        : 'Standalone Follow-up';

      const dueDateStr = f.due_date ? formatDateDisplay(f.due_date) : 'No due date';
      const priorityStr = (f.priority || 'medium').toUpperCase();
      const descStr = f.description ? `\nNote: ${sanitizeText(f.description)}` : '';

      return [
        String(idx + 1),
        sanitizeText(f.title) + descStr,
        parentRecordInfo,
        dueDateStr,
        f.status,
        priorityStr,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Follow-up Title & Notes', 'Parent Record (Linked / Standalone)', 'Due Date', 'Status', 'Priority']],
      body: followUpsTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
      },
      styles: {
        fontSize: 8,
        textColor: COLORS.textDark,
        cellPadding: 2.8,
        overflow: 'linebreak',
        lineColor: COLORS.borderColor,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 22, halign: 'center' },
      },
      alternateRowStyles: {
        fillColor: COLORS.accentBg,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // --- FOOTERS & PAGE NUMBERS (Applied to all pages) ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('WorkTrace – Personal Work Activity Record | Confidential', margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Trigger browser download directly
  const filename = `worktrace-records-backup-${dateStr}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 2. EXPORT ACCOUNT DETAILS (PDF)
// ----------------------------------------------------------------------

export interface AccountDetailsExportData {
  user: {
    id: string;
    full_name?: string;
    email: string;
    created_at?: string;
  };
  activityHistory: AccountActivityRecord[];
  currentStatus: 'Active' | 'Currently Paused' | 'Scheduled to Resume';
  pausedUntil?: string | null;
}

export async function exportAccountDetailsPDF(data: AccountDetailsExportData): Promise<void> {
  const { user, activityHistory, currentStatus, pausedUntil } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const now = new Date();
  const exportTimestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
  const dateStr = now.toISOString().slice(0, 10);

  // Categorize historical activity records
  const normalPasswordChanges = activityHistory.filter((a) => a.event_type === 'password_changed');
  const forgotPasswordResets = activityHistory.filter((a) => a.event_type === 'password_reset');
  const totalPasswordOperations = normalPasswordChanges.length + forgotPasswordResets.length;

  const pauseEvents = activityHistory.filter((a) => a.event_type === 'account_paused');
  const totalPauseEvents = pauseEvents.length;

  let totalPausedDays = 0;
  pauseEvents.forEach((p) => {
    const days = p.metadata?.pause_days;
    if (typeof days === 'number' && days > 0) {
      totalPausedDays += days;
    }
  });

  // --- HEADER BANNER WITH COMPANY LOGO ---
  doc.setFillColor(...COLORS.accentBg);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 3.5, 'F');

  doc.setDrawColor(...COLORS.borderColor);
  doc.setLineWidth(0.3);
  doc.line(0, 38, pageWidth, 38);

  // Render company logo
  const logo = await loadLogoImage(logoImg);
  if (logo && logo.naturalWidth > 0) {
    const logoW = 38;
    const logoH = 38 / (logo.naturalWidth / logo.naturalHeight);
    doc.addImage(logo, 'PNG', margin, 7, logoW, logoH);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.primary);
    doc.text('WorkTrace', margin, 17);
  }

  // Subtitle under the logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('Account Details & Security Report', margin, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Confidential Security Document', margin, 30);

  // Right-aligned header metadata
  const userLabel = user.full_name ? `${user.full_name} (${user.email})` : user.email;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(userLabel, pageWidth - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Exported: ${exportTimestamp}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Account Status: ${currentStatus}`, pageWidth - margin, 26, { align: 'right' });

  let currentY = 46;

  // --- EXECUTIVE ACCOUNT ACTIVITY SUMMARY ---
  doc.setFillColor(...COLORS.accentBg);
  doc.setDrawColor(...COLORS.borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('ACCOUNT ACTIVITY SUMMARY', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textDark);

  const colW = contentWidth / 3;
  const createdDateStr = user.created_at ? formatDateDisplay(user.created_at.slice(0, 10)) : '—';

  doc.text(`Account Created: ${createdDateStr}`, margin + 4, currentY + 13);
  doc.text(`Current Status: ${currentStatus}`, margin + 4 + colW, currentY + 13);
  doc.text(`Total Password Updates: ${totalPasswordOperations}`, margin + 4 + colW * 2, currentY + 13);

  doc.text(`Normal Password Changes: ${normalPasswordChanges.length}`, margin + 4, currentY + 20);
  doc.text(`Forgot Password Resets: ${forgotPasswordResets.length}`, margin + 4 + colW, currentY + 20);
  doc.text(`Total Pause Events: ${totalPauseEvents}`, margin + 4 + colW * 2, currentY + 20);

  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Total Recorded Paused Days: ${totalPausedDays} days`, margin + 4, currentY + 27);
  if (pausedUntil) {
    doc.text(`Active Pause Until: ${formatDateTime(pausedUntil)}`, margin + 4 + colW, currentY + 27);
  }

  currentY += 42;

  // --- SECTION 1: USER PROFILE & IDENTITY ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. User Profile & Account Identity', margin, currentY);

  currentY += 5;

  const profileTableData = [
    ['Full Name', user.full_name || 'Not specified'],
    ['Registered Email', user.email],
    ['Account ID (UUID)', user.id],
    ['Account Joining Date', formatDateTime(user.created_at)],
    ['Current Account Status', currentStatus],
  ];

  if (pausedUntil) {
    profileTableData.push(['Active Pause Until', formatDateTime(pausedUntil)]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Attribute', 'Value']],
    body: profileTableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: COLORS.borderColor,
      lineWidth: 0.2,
      textColor: COLORS.textDark,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: COLORS.accentBg },
      1: { cellWidth: 'auto' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // --- SECTION 2: PASSWORD ACTIVITY HISTORY ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.text('2. Password Activity History', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    'Records only successfully completed password operations. Failed attempts, invalid verification codes, and unverified reset requests are never recorded. Secrets, passwords, OTPs, and recovery tokens are never stored or exported.',
    margin,
    currentY + 5,
    { maxWidth: contentWidth }
  );

  currentY += 14;

  // Metrics Bar for Passwords
  doc.setFillColor(...COLORS.softGreen);
  doc.setDrawColor(...COLORS.borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 11, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(
    `Total Successful Password Operations: ${totalPasswordOperations}   |   Normal Password Changes: ${normalPasswordChanges.length}   |   Forgot Password Resets: ${forgotPasswordResets.length}`,
    margin + 4,
    currentY + 7
  );

  currentY += 15;

  const passwordEvents = activityHistory.filter(
    (a) => a.event_type === 'password_changed' || a.event_type === 'password_reset'
  );

  if (passwordEvents.length === 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [['No password activity recorded since activity tracking started.']],
      theme: 'plain',
      styles: { fontSize: 8.5, textColor: COLORS.textMuted, fontStyle: 'italic' },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  } else {
    // Sort chronological
    const sortedPasswordEvents = [...passwordEvents].sort(
      (a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()
    );

    const pwTableBody = sortedPasswordEvents.map((evt, idx) => {
      const isReset = evt.event_type === 'password_reset';
      const typeLabel = isReset ? 'Forgot Password Recovery' : 'Normal Password Change';
      const methodLabel = isReset ? 'Email Recovery Link Verification' : 'Settings Profile Change Password';
      return [
        String(idx + 1),
        formatDateTime(evt.event_timestamp),
        typeLabel,
        methodLabel,
        'Successfully Completed',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Date & Time', 'Operation Type', 'Recovery / Change Method', 'Status']],
      body: pwTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.8,
        lineColor: COLORS.borderColor,
        lineWidth: 0.2,
        textColor: COLORS.textDark,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 45, fontStyle: 'bold' },
        3: { cellWidth: 50 },
        4: { cellWidth: 'auto', textColor: COLORS.secondary, fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: COLORS.accentBg,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Check if we need a new page for Section 3
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // --- SECTION 3: ACCOUNT PAUSE HISTORY ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primary);
  doc.text('3. Account Pause History', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    'Audit record of all temporary account pauses, durations, scheduled resume dates, and active status.',
    margin,
    currentY + 5
  );

  currentY += 10;

  if (totalPauseEvents === 0) {
    // If the account has never been paused, clearly display: "No account pause history."
    doc.setFillColor(...COLORS.accentBg);
    doc.setDrawColor(...COLORS.borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.secondary);
    doc.text('No account pause history.', margin + 6, currentY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textDark);
    doc.text(
      'This account has never been paused. All workspace data, sessions, and daily records have remained continuously active since account registration.',
      margin + 6,
      currentY + 16,
      { maxWidth: contentWidth - 12 }
    );

    currentY += 30;
  } else {
    // Summary of pause history
    doc.setFillColor(...COLORS.softGreen);
    doc.setDrawColor(...COLORS.borderColor);
    doc.roundedRect(margin, currentY, contentWidth, 11, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(
      `Total Recorded Pause Events: ${totalPauseEvents}   |   Total Recorded Paused Days: ${totalPausedDays} days   |   Current Status: ${currentStatus}`,
      margin + 4,
      currentY + 7
    );

    currentY += 15;

    const resumeEvents = activityHistory.filter((a) => a.event_type === 'account_resumed');

    const pauseTableBody = pauseEvents.map((pe, idx) => {
      const days = pe.metadata?.pause_days ? `${pe.metadata.pause_days} days` : '—';
      const startDate = pe.metadata?.start_date ? formatDateTime(pe.metadata.start_date) : formatDateTime(pe.event_timestamp);
      const expectedResume = pe.metadata?.expected_resume_date ? formatDateTime(pe.metadata.expected_resume_date) : '—';

      const pauseTime = new Date(pe.event_timestamp).getTime();
      const resumeMatch = resumeEvents.find((re) => new Date(re.event_timestamp).getTime() >= pauseTime);
      const actualResume = resumeMatch
        ? formatDateTime(resumeMatch.event_timestamp)
        : (currentStatus === 'Currently Paused' ? 'Currently In Progress' : 'Resumed');

      return [
        String(idx + 1),
        formatDateTime(pe.event_timestamp),
        days,
        startDate,
        expectedResume,
        actualResume,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Pause Timestamp', 'Duration', 'Pause Start Date', 'Expected Resume Date', 'Actual Resume Status']],
      body: pauseTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primaryDark,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.8,
        lineColor: COLORS.borderColor,
        lineWidth: 0.2,
        textColor: COLORS.textDark,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 'auto', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: COLORS.accentBg,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // --- FOOTERS & PAGE NUMBERS ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('WorkTrace – Account Details & Security History | Confidential', margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Trigger browser download directly
  const filename = `worktrace-account-details-${dateStr}.pdf`;
  doc.save(filename);
}
