import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { db } from '@/data/db';

export async function exportDocx(documentId: string) {
  const doc = await db.documents.get(documentId);
  const clauses = await db.clauses.where('document_id').equals(documentId).sortBy('order_index');

  const children = clauses.flatMap((c) => [
    new Paragraph({ text: c.title, heading: HeadingLevel.HEADING_2 }),
    ...c.body.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })),
  ]);

  const d = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(d);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${doc?.title ?? 'Contrato'}.docx`;
  a.click();
}
