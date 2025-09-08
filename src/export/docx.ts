import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell } from 'docx';
import { db } from '@/data/db';
import { getDocument, getClausesByDocument } from '@/data/dao';
import { createInternalBypass } from '@/security/locks';

/**
 * Configurações de estilo para o documento .docx
 */
const DOCUMENT_STYLES = {
  title: {
    size: 28,
    bold: true,
    color: '2E2E2E'
  },
  subtitle: {
    size: 16,
    bold: true,
    color: '4A4A4A'
  },
  heading1: {
    size: 20,
    bold: true,
    color: '1A1A1A'
  },
  heading2: {
    size: 16,
    bold: true,
    color: '2A2A2A'
  },
  normal: {
    size: 24, // 12pt
    color: '000000'
  },
  clause: {
    size: 24,
    color: '1A1A1A',
    spacing: 240 // espaçamento após parágrafo
  }
};

/**
 * Interface para estrutura de documento Lexical serializado
 */
interface LexicalNode {
  type: string;
  version: number;
  children?: LexicalNode[];
  text?: string;
  format?: number;
  style?: string;
  direction?: string;
  indent?: number;
  tag?: string;
  [key: string]: any;
}

/**
 * Converte formato Lexical em runs do Word
 */
function convertLexicalToRuns(node: LexicalNode): TextRun[] {
  if (!node.children && node.text) {
    // Nó de texto
    return [new TextRun({
      text: node.text,
      bold: (node.format && (node.format & 1)) ? true : undefined,
      italics: (node.format && (node.format & 2)) ? true : undefined,
      underline: (node.format && (node.format & 4)) ? {} : undefined,
      strike: (node.format && (node.format & 8)) ? true : undefined,
      size: DOCUMENT_STYLES.normal.size,
      color: DOCUMENT_STYLES.normal.color
    })];
  }

  if (node.children) {
    return node.children.flatMap(child => convertLexicalToRuns(child));
  }

  return [];
}

/**
 * Converte nós Lexical em parágrafos do Word
 */
function convertLexicalToParagraphs(node: LexicalNode): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (node.type === 'paragraph') {
    const runs = node.children ? node.children.flatMap(child => convertLexicalToRuns(child)) : [];
    
    paragraphs.push(new Paragraph({
      children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
      alignment: getAlignment(node.style),
      spacing: {
        after: DOCUMENT_STYLES.clause.spacing
      }
    }));
  } else if (node.type === 'heading') {
    const runs = node.children ? node.children.flatMap(child => convertLexicalToRuns(child)) : [];
    const level = getHeadingLevel(node.tag);
    
    paragraphs.push(new Paragraph({
      children: runs,
      heading: level,
      spacing: {
        before: 240,
        after: 120
      }
    }));
  } else if (node.type === 'list') {
    // Processar listas
    if (node.children) {
      node.children.forEach((listItem, index) => {
        if (listItem.type === 'listitem' && listItem.children) {
          const runs = listItem.children.flatMap(child => convertLexicalToRuns(child));
          
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. ` }),
              ...runs
            ],
            spacing: {
              after: 120
            }
          }));
        }
      });
    }
  } else if (node.type === 'quote') {
    const runs = node.children ? node.children.flatMap(child => convertLexicalToRuns(child)) : [];
    
    paragraphs.push(new Paragraph({
      children: runs,
      indent: {
        left: 720, // 0.5 inch
        right: 720
      },
      spacing: {
        before: 120,
        after: 120
      }
    }));
  } else if (node.children) {
    // Processar nós filhos recursivamente
    node.children.forEach(child => {
      paragraphs.push(...convertLexicalToParagraphs(child));
    });
  }

  return paragraphs;
}

/**
 * Obtém alinhamento baseado no formato Lexical
 */
function getAlignment(format?: string): typeof AlignmentType[keyof typeof AlignmentType] | undefined {
  switch (format) {
    case 'left': return AlignmentType.LEFT;
    case 'center': return AlignmentType.CENTER;
    case 'right': return AlignmentType.RIGHT;
    case 'justify': return AlignmentType.JUSTIFIED;
    default: return undefined;
  }
}

/**
 * Obtém nível de heading baseado na tag Lexical
 */
function getHeadingLevel(tag?: string): typeof HeadingLevel[keyof typeof HeadingLevel] {
  switch (tag) {
    case 'h1': return HeadingLevel.HEADING_1;
    case 'h2': return HeadingLevel.HEADING_2;
    case 'h3': return HeadingLevel.HEADING_3;
    case 'h4': return HeadingLevel.HEADING_4;
    case 'h5': return HeadingLevel.HEADING_5;
    case 'h6': return HeadingLevel.HEADING_6;
    default: return HeadingLevel.HEADING_1;
  }
}

/**
 * Exporta um documento para .docx
 */
export async function exportDocx(documentId: string): Promise<void> {
  try {
    console.log(`Iniciando export .docx do documento ${documentId}...`);

    // Buscar dados do documento
    const document = await getDocument(documentId);
    const clauses = await getClausesByDocument(documentId);

    if (!document) {
      throw new Error('Documento não encontrado');
    }

    console.log(`Exportando documento "${document.title}" com ${clauses.length} cláusulas`);

    // Criar elementos do documento Word
    const documentElements: (Paragraph | Table)[] = [];

    // Título do documento
    documentElements.push(new Paragraph({
      children: [
        new TextRun({
          text: document.title || 'Documento Legal',
          size: DOCUMENT_STYLES.title.size,
          bold: DOCUMENT_STYLES.title.bold,
          color: DOCUMENT_STYLES.title.color
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 480
      }
    }));

    // Data de criação
    const createdAt = new Date(document.created_at);
    documentElements.push(new Paragraph({
      children: [
        new TextRun({
          text: `Documento criado em: ${createdAt.toLocaleDateString('pt-BR')}`,
          size: DOCUMENT_STYLES.normal.size,
          italics: true,
          color: '666666'
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: {
        after: 240
      }
    }));

    // Status do documento
    documentElements.push(new Paragraph({
      children: [
        new TextRun({
          text: `Status: ${document.status === 'draft' ? 'Rascunho' : 'Somente Leitura'}`,
          size: DOCUMENT_STYLES.normal.size,
          bold: true,
          color: document.status === 'draft' ? 'FF6B35' : '28A745'
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: {
        after: 480
      }
    }));

    // Processar cláusulas
    for (const clause of clauses) {
      // Título da cláusula
      if (clause.title) {
        documentElements.push(new Paragraph({
          children: [
            new TextRun({
              text: clause.title,
              size: DOCUMENT_STYLES.heading2.size,
              bold: DOCUMENT_STYLES.heading2.bold,
              color: DOCUMENT_STYLES.heading2.color
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 360,
            after: 120
          }
        }));
      }

      // Corpo da cláusula
      if (clause.body) {
        try {
          // Tentar fazer parse do corpo como JSON Lexical
          const lexicalState = JSON.parse(clause.body) as { root: LexicalNode };
          
          if (lexicalState.root && lexicalState.root.children) {
            // Converter nós Lexical para parágrafos Word
            const paragraphs = lexicalState.root.children.flatMap(child => 
              convertLexicalToParagraphs(child)
            );
            
            documentElements.push(...paragraphs);
          } else {
            // Fallback: tratar como texto simples
            const lines = clause.body.split('\n').filter(line => line.trim().length > 0);
            
            lines.forEach(line => {
              documentElements.push(new Paragraph({
                children: [
                  new TextRun({
                    text: line.trim(),
                    size: DOCUMENT_STYLES.clause.size,
                    color: DOCUMENT_STYLES.clause.color
                  })
                ],
                spacing: {
                  after: DOCUMENT_STYLES.clause.spacing
                }
              }));
            });
          }
        } catch (error) {
          // Fallback: tratar como texto simples
          const lines = clause.body.split('\n').filter(line => line.trim().length > 0);
          
          lines.forEach(line => {
            documentElements.push(new Paragraph({
              children: [
                new TextRun({
                  text: line.trim(),
                  size: DOCUMENT_STYLES.clause.size,
                  color: DOCUMENT_STYLES.clause.color
                })
              ],
              spacing: {
                after: DOCUMENT_STYLES.clause.spacing
              }
            }));
          });
        }
      }
    }

    // Rodapé com informações do sistema
    documentElements.push(new Paragraph({
      children: [
        new TextRun({
          text: `\n\nDocumento gerado pelo Numbly em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
          size: 20,
          italics: true,
          color: '999999'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 720
      }
    }));

    // Criar documento Word
    const docx = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,  // 1 inch
              bottom: 1440, // 1 inch
              left: 1440    // 1 inch
            }
          }
        },
        children: documentElements
      }]
    });

    // Gerar blob
    const blob = await Packer.toBlob(docx);
    
    // Fazer download usando bypass de segurança
    const bypass = createInternalBypass();
    
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    
    link.href = url;
    link.download = `${document.title || 'Documento'}.docx`;
    link.style.display = 'none';
    
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    
    // Limpar URL temporária
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log(`Export .docx concluído: ${document.title}.docx`);

  } catch (error) {
    console.error('Erro no export .docx:', error);
    throw error;
  }
}

/**
 * Exporta múltiplos documentos como ZIP
 */
export async function exportMultipleDocx(documentIds: string[]): Promise<void> {
  try {
    console.log(`Exportando ${documentIds.length} documentos...`);
    
    // Para simplificar, vamos exportar um por vez
    // Em uma implementação mais robusta, poderia usar JSZip
    for (const docId of documentIds) {
      await exportDocx(docId);
      // Pequeno delay entre downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Export múltiplo concluído');
  } catch (error) {
    console.error('Erro no export múltiplo:', error);
    throw error;
  }
}

/**
 * Gera prévia do documento em HTML (para debug)
 */
export async function generateDocumentPreview(documentId: string): Promise<string> {
  try {
    const document = await getDocument(documentId);
    const clauses = await getClausesByDocument(documentId);

    if (!document) {
      return '<p>Documento não encontrado</p>';
    }

    let html = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: 'Times New Roman', serif;">
        <h1 style="text-align: center; color: #2E2E2E; margin-bottom: 30px;">
          ${document.title || 'Documento Legal'}
        </h1>
        
        <div style="text-align: right; color: #666; margin-bottom: 40px;">
          <p><em>Criado em: ${new Date(document.created_at).toLocaleDateString('pt-BR')}</em></p>
          <p><strong>Status: ${document.status === 'draft' ? 'Rascunho' : 'Somente Leitura'}</strong></p>
        </div>
    `;

    for (const clause of clauses) {
      if (clause.title) {
        html += `<h2 style="color: #2A2A2A; margin-top: 30px; margin-bottom: 15px;">${clause.title}</h2>`;
      }
      
      if (clause.body) {
        // Processar corpo da cláusula
        const lines = clause.body.split('\n').filter(line => line.trim().length > 0);
        lines.forEach(line => {
          html += `<p style="line-height: 1.6; margin-bottom: 15px; text-align: justify;">${line.trim()}</p>`;
        });
      }
    }

    html += `
        <div style="text-align: center; margin-top: 60px; color: #999; font-size: 12px;">
          <p><em>Documento gerado pelo Numbly em ${new Date().toLocaleDateString('pt-BR')}</em></p>
        </div>
      </div>
    `;

    return html;
  } catch (error) {
    console.error('Erro ao gerar prévia:', error);
    return `<p>Erro ao gerar prévia: ${error instanceof Error ? error.message : 'Erro desconhecido'}</p>`;
  }
}

export default {
  exportDocx,
  exportMultipleDocx,
  generateDocumentPreview
};
