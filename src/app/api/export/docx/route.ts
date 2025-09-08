import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ExportRequest {
  documentId: string;
  format?: 'docx';
  includeMetadata?: boolean;
  filename?: string;
}

interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  format?: number;
  tag?: string;
  listType?: string;
  value?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    
    if (!body.documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Buscar documento no Supabase
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', body.documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Buscar cláusulas do documento
    const { data: clauses, error: clausesError } = await supabase
      .from('clauses')
      .select('*')
      .eq('document_id', body.documentId)
      .order('order_index', { ascending: true });

    if (clausesError) {
      console.error('Error fetching clauses:', clausesError);
      return NextResponse.json(
        { error: 'Failed to fetch document clauses' },
        { status: 500 }
      );
    }

    // Converter conteúdo Lexical para DOCX
    const docxParagraphs: Paragraph[] = [];

    // Adicionar título do documento
    if (document.title) {
      docxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: document.title,
              bold: true,
              size: 32, // 16pt
            }),
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }

    // Processar cláusulas
    if (clauses && clauses.length > 0) {
      for (const clause of clauses) {
        // Título da cláusula
        if (clause.title) {
          docxParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: clause.title,
                  bold: true,
                  size: 24, // 12pt
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 },
            })
          );
        }

        // Conteúdo da cláusula
        if (clause.body) {
          try {
            const lexicalContent = typeof clause.body === 'string' 
              ? JSON.parse(clause.body) 
              : clause.body;
            
            const clauseParagraphs = convertLexicalToDocx(lexicalContent);
            docxParagraphs.push(...clauseParagraphs);
          } catch (error) {
            // Se não conseguir parsear como JSON, tratar como texto simples
            docxParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: clause.body.toString(),
                    size: 22, // 11pt
                  }),
                ],
                spacing: { after: 200 },
              })
            );
          }
        }
      }
    } else {
      // Se não há cláusulas, usar o conteúdo do documento
      if (document.content) {
        try {
          const lexicalContent = typeof document.content === 'string' 
            ? JSON.parse(document.content) 
            : document.content;
          
          const contentParagraphs = convertLexicalToDocx(lexicalContent);
          docxParagraphs.push(...contentParagraphs);
        } catch (error) {
          docxParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: document.content.toString(),
                  size: 22,
                }),
              ],
            })
          );
        }
      }
    }

    // Adicionar metadados se solicitado
    if (body.includeMetadata) {
      docxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `\n\nDocumento gerado em: ${new Date().toLocaleString('pt-BR')}`,
              italics: true,
              size: 18, // 9pt
            }),
          ],
          spacing: { before: 400 },
        })
      );
    }

    // Criar documento DOCX
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docxParagraphs,
        },
      ],
    });

    // Gerar buffer do documento
    const buffer = await Packer.toBuffer(doc);
    
    // Definir nome do arquivo
    const filename = body.filename || `${document.title || 'documento'}.docx`;
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Retornar arquivo como resposta
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting document:', error);
    return NextResponse.json(
      { error: 'Failed to export document' },
      { status: 500 }
    );
  }
}

function convertLexicalToDocx(lexicalContent: any): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (!lexicalContent || !lexicalContent.root || !lexicalContent.root.children) {
    return paragraphs;
  }

  for (const node of lexicalContent.root.children) {
    const paragraph = convertNodeToParagraph(node);
    if (paragraph) {
      paragraphs.push(paragraph);
    }
  }

  return paragraphs;
}

function convertNodeToParagraph(node: LexicalNode): Paragraph | null {
  if (!node) return null;

  switch (node.type) {
    case 'paragraph':
      return new Paragraph({
        children: convertChildrenToTextRuns(node.children || []),
        spacing: { after: 200 },
      });

    case 'heading':
      const headingLevel = getHeadingLevel(node.tag);
      return new Paragraph({
        children: convertChildrenToTextRuns(node.children || []),
        heading: headingLevel,
        spacing: { before: 200, after: 200 },
      });

    case 'list':
      // Para listas, criar parágrafos individuais para cada item
      const listItems: Paragraph[] = [];
      if (node.children) {
        for (const child of node.children) {
          if (child.type === 'listitem' && child.children) {
            listItems.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '• ' }), // Bullet simples
                  ...convertChildrenToTextRuns(child.children),
                ],
                spacing: { after: 100 },
              })
            );
          }
        }
      }
      return listItems[0] || null; // Retorna apenas o primeiro para manter a interface

    case 'quote':
      return new Paragraph({
        children: convertChildrenToTextRuns(node.children || []),
        spacing: { after: 200 },
        indent: { left: 720 }, // Indentação para citação
      });

    default:
      if (node.children) {
        return new Paragraph({
          children: convertChildrenToTextRuns(node.children),
          spacing: { after: 200 },
        });
      }
      return null;
  }
}

function convertChildrenToTextRuns(children: LexicalNode[]): TextRun[] {
  const textRuns: TextRun[] = [];

  for (const child of children) {
    if (child.type === 'text' && child.text) {
      const format = child.format || 0;
      textRuns.push(
        new TextRun({
          text: child.text,
          bold: (format & 1) !== 0, // Bold flag
          italics: (format & 2) !== 0, // Italic flag
          underline: (format & 8) !== 0 ? {} : undefined, // Underline flag
          size: 22, // 11pt default
        })
      );
    } else if (child.children) {
      textRuns.push(...convertChildrenToTextRuns(child.children));
    }
  }

  return textRuns;
}

function getHeadingLevel(tag?: string): HeadingLevel {
  switch (tag) {
    case 'h1':
      return HeadingLevel.HEADING_1;
    case 'h2':
      return HeadingLevel.HEADING_2;
    case 'h3':
      return HeadingLevel.HEADING_3;
    case 'h4':
      return HeadingLevel.HEADING_4;
    case 'h5':
      return HeadingLevel.HEADING_5;
    case 'h6':
      return HeadingLevel.HEADING_6;
    default:
      return HeadingLevel.HEADING_1;
  }
}