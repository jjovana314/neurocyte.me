import PDFDocument from 'pdfkit';
import { once } from 'events';
import {
  COLOR_DIVIDER,
  COLOR_FOOTER,
  COLOR_MUTED,
  COLOR_TEXT,
  FIELD_INDENT,
  FONT_BOLD,
  FONT_REGULAR,
  FOOTER_OFFSET,
  PAGE_MARGIN,
  SIZE_BODY,
  SIZE_FOOTER,
  SIZE_RECORD_TITLE,
  SIZE_SECTION,
  SIZE_SUBTITLE,
  SIZE_TITLE,
} from '../utils/pdf-constants';

export type PdfInfoRow = [label: string, value: string];

export interface PdfRecordSectionOptions<T> {
  emptyMessage: string;
  title: (record: T) => string;
  fields: (record: T) => PdfInfoRow[];
}

/**
 * Thin wrapper around pdfkit that lays out a patient report (title, sections
 * of label/value rows or numbered records, and a per-page footer) and
 * collects the output into a Buffer.
 *
 * Content is written strictly top to bottom and is never split across pages:
 * every block (a record, an info row, a section heading together with its
 * first block) is measured before it is drawn, and if it doesn't fit in the
 * space left on the current page it is moved to a new page as a whole.
 */
export class PatientPdfDocument {
  private readonly doc = new PDFDocument({
    margin: PAGE_MARGIN,
    bufferPages: true,
  });
  private readonly buffers: Buffer[] = [];
  private readonly ended: Promise<unknown[]>;

  constructor() {
    this.doc.on('data', (chunk: Buffer) => this.buffers.push(chunk));
    this.ended = once(this.doc, 'end');
  }

  addTitle(title: string, subtitle?: string): this {
    this.doc
      .fontSize(SIZE_TITLE)
      .font(FONT_BOLD)
      .fillColor(COLOR_TEXT)
      .text(title, { align: 'center' });
    this.doc.moveDown(0.5);
    if (subtitle) {
      this.doc
        .fontSize(SIZE_SUBTITLE)
        .font(FONT_REGULAR)
        .fillColor(COLOR_MUTED)
        .text(subtitle, { align: 'center' });
    }
    this.addSpacing();
    return this;
  }

  /** A section of "Label: value" rows; each row is kept on one page. */
  addInfoSection(title: string, rows: PdfInfoRow[]): this {
    const rowHeights = rows.map((row) => this.infoRowHeight(row));
    this.addSectionHeading(title, rowHeights[0] ?? 0);

    rows.forEach(([label, value], index) => {
      this.keepTogether(rowHeights[index]);
      this.doc
        .fontSize(SIZE_BODY)
        .font(FONT_BOLD)
        .fillColor(COLOR_TEXT)
        .text(`${label}: `, { continued: true })
        .font(FONT_REGULAR)
        .text(value);
    });
    return this;
  }

  /** A section of numbered records; each record is kept on one page. */
  addRecordSection<T>(
    title: string,
    records: T[],
    options: PdfRecordSectionOptions<T>,
  ): this {
    if (!records?.length) {
      this.addSectionHeading(title, this.bodyTextHeight(options.emptyMessage));
      this.useBodyFont().text(options.emptyMessage);
      return this;
    }

    const blocks = records.map((record, index) => ({
      title: `${index + 1}. ${options.title(record)}`,
      lines: options
        .fields(record)
        .map(([label, value]) => `${FIELD_INDENT}${label}: ${value}`),
    }));
    const blockHeights = blocks.map((block) => this.recordHeight(block));

    this.addSectionHeading(title, blockHeights[0]);

    blocks.forEach((block, index) => {
      this.keepTogether(blockHeights[index]);
      this.doc
        .fontSize(SIZE_RECORD_TITLE)
        .font(FONT_BOLD)
        .fillColor(COLOR_TEXT)
        .text(block.title);
      this.useBodyFont();
      for (const line of block.lines) {
        this.doc.text(line);
      }
      this.doc.moveDown(0.5);
    });
    return this;
  }

  addSpacing(lines = 1): this {
    this.doc.moveDown(lines);
    return this;
  }

  /**
   * Draws the footer inside the bottom margin of every page. Call this only
   * after all content has been added: it revisits the finished pages, so it
   * can never end up between two pieces of content.
   */
  addFooterToAllPages(text: string): this {
    const pages = this.doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      this.doc.switchToPage(i);
      this.withoutBottomMargin(() =>
        this.doc
          .fontSize(SIZE_FOOTER)
          .font(FONT_REGULAR)
          .fillColor(COLOR_FOOTER)
          .text(text, PAGE_MARGIN, this.doc.page.height - FOOTER_OFFSET, {
            align: 'center',
            width: this.contentWidth(),
            lineBreak: false,
          }),
      );
    }
    return this;
  }

  async toBuffer(): Promise<Buffer> {
    this.doc.end();
    await this.ended;
    return Buffer.concat(this.buffers);
  }

  // - Layout

  /** The heading is never left alone at the bottom of a page. */
  private addSectionHeading(title: string, firstBlockHeight: number): void {
    this.keepTogether(this.sectionHeadingHeight(title) + firstBlockHeight);
    this.doc
      .fontSize(SIZE_SECTION)
      .font(FONT_BOLD)
      .fillColor(COLOR_TEXT)
      .text(title);
    this.doc
      .moveTo(PAGE_MARGIN, this.doc.y)
      .lineTo(this.doc.page.width - PAGE_MARGIN, this.doc.y)
      .strokeColor(COLOR_DIVIDER)
      .stroke();
    this.doc.moveDown(0.5);
  }

  /**
   * Starts a new page when a block of the given height doesn't fit in the
   * remaining space. A block taller than a whole page is started on the
   * current page if it is still empty, since moving it wouldn't help.
   */
  private keepTogether(height: number): void {
    const { margins, height: pageHeight } = this.doc.page;
    const fits = this.doc.y + height <= pageHeight - margins.bottom;
    const pageIsEmpty = this.doc.y <= margins.top;
    if (!fits && !pageIsEmpty) {
      this.doc.addPage();
    }
  }

  // - Measuring (sets the same font that is used for drawing)

  private sectionHeadingHeight(title: string): number {
    this.doc.fontSize(SIZE_SECTION).font(FONT_BOLD);
    return (
      this.doc.heightOfString(title, { width: this.contentWidth() }) +
      this.doc.currentLineHeight(true) * 0.5
    );
  }

  private infoRowHeight([label, value]: PdfInfoRow): number {
    // Measured entirely in bold, which is at least as wide as the mixed
    // bold/regular line that is drawn, so the estimate never comes up short.
    this.doc.fontSize(SIZE_BODY).font(FONT_BOLD);
    return this.doc.heightOfString(`${label}: ${value}`, {
      width: this.contentWidth(),
    });
  }

  private recordHeight(block: { title: string; lines: string[] }): number {
    const width = this.contentWidth();
    this.doc.fontSize(SIZE_RECORD_TITLE).font(FONT_BOLD);
    let height = this.doc.heightOfString(block.title, { width });
    height += this.bodyTextHeight(...block.lines);
    return height;
  }

  private bodyTextHeight(...lines: string[]): number {
    const width = this.contentWidth();
    this.useBodyFont();
    return lines.reduce(
      (sum, line) => sum + this.doc.heightOfString(line, { width }),
      0,
    );
  }

  private useBodyFont(): PDFKit.PDFDocument {
    return this.doc
      .fontSize(SIZE_BODY)
      .font(FONT_REGULAR)
      .fillColor(COLOR_TEXT);
  }

  private contentWidth(): number {
    return this.doc.page.width - PAGE_MARGIN * 2;
  }

  // Writing below the bottom margin would otherwise make pdfkit start a new page.
  private withoutBottomMargin(draw: () => void): void {
    const bottomMargin = this.doc.page.margins.bottom;
    this.doc.page.margins.bottom = 0;
    draw();
    this.doc.page.margins.bottom = bottomMargin;
  }
}
