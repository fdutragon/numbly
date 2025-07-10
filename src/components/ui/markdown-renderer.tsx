'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    // Split by markdown patterns while preserving them
    const parts = text.split(
      /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/
    );

    return parts.map((part, index) => {
      // Bold text (**text** or __text__)
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-inherit">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('__') && part.endsWith('__')) {
        return (
          <strong key={index} className="font-bold text-inherit">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic text (*text* or _text_)
      if (
        part.startsWith('*') &&
        part.endsWith('*') &&
        !part.startsWith('**')
      ) {
        return (
          <em key={index} className="italic text-inherit">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (
        part.startsWith('_') &&
        part.endsWith('_') &&
        !part.startsWith('__')
      ) {
        return (
          <em key={index} className="italic text-inherit">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Code inline (`code`)
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-inherit"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Links ([text](url))
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-500 hover:text-violet-600 underline"
          >
            {linkMatch[1]}
          </a>
        );
      }

      // Enhance emojis with colors
      const enhancedText = part
        .replace(/✅/g, '<span class="text-green-500">✅</span>')
        .replace(/❌/g, '<span class="text-red-500">❌</span>')
        .replace(/💡/g, '<span class="text-yellow-500">💡</span>')
        .replace(/🎉/g, '<span class="text-purple-500">🎉</span>')
        .replace(/🚀/g, '<span class="text-blue-500">🚀</span>')
        .replace(/💰/g, '<span class="text-yellow-600">💰</span>')
        .replace(/🤖/g, '<span class="text-purple-500">🤖</span>')
        .replace(/📈/g, '<span class="text-green-500">📈</span>')
        .replace(/⚡/g, '<span class="text-yellow-400">⚡</span>')
        .replace(/🔥/g, '<span class="text-orange-500">🔥</span>');

      if (enhancedText !== part) {
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: enhancedText }}
          />
        );
      }

      // Regular text with line breaks
      return part.split('\n').map((line, lineIndex, lines) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  // Process lists and other block elements
  const processContent = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Handle unordered lists
      if (
        line.startsWith('- ') ||
        line.startsWith('• ') ||
        line.startsWith('* ')
      ) {
        if (listType !== 'ul') {
          if (currentList.length > 0) {
            elements.push(renderList(currentList, listType, elements.length));
            currentList = [];
          }
          listType = 'ul';
        }
        currentList.push(line.substring(2));
      }
      // Handle ordered lists
      else if (/^\d+\.\s/.test(line)) {
        if (listType !== 'ol') {
          if (currentList.length > 0) {
            elements.push(renderList(currentList, listType, elements.length));
            currentList = [];
          }
          listType = 'ol';
        }
        currentList.push(line.replace(/^\d+\.\s/, ''));
      }
      // Handle checkboxes
      else if (
        line.startsWith('✅ ') ||
        line.startsWith('❌ ') ||
        line.startsWith('☑️ ')
      ) {
        if (listType !== 'ul') {
          if (currentList.length > 0) {
            elements.push(renderList(currentList, listType, elements.length));
            currentList = [];
          }
          listType = 'ul';
        }
        const icon = line.substring(0, 2);
        const text = line.substring(2);
        currentList.push(`${icon}${text}`);
      }
      // Regular paragraph
      else {
        if (currentList.length > 0) {
          elements.push(renderList(currentList, listType, elements.length));
          currentList = [];
          listType = null;
        }

        if (line) {
          elements.push(
            <p key={elements.length} className="mb-2 last:mb-0">
              {parseInlineMarkdown(line)}
            </p>
          );
        }
      }
    }

    // Handle remaining list items
    if (currentList.length > 0) {
      elements.push(renderList(currentList, listType, elements.length));
    }

    return elements;
  };

  const renderList = (
    items: string[],
    type: 'ul' | 'ol' | null,
    key: number
  ): React.ReactNode => {
    const ListComponent = type === 'ol' ? 'ol' : 'ul';

    return (
      <ListComponent
        key={key}
        className={`mb-2 ${type === 'ol' ? 'list-decimal' : 'list-none'} pl-0 space-y-1`}
      >
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            {type === 'ol' ? (
              <span className="mr-2 text-violet-500 font-medium">
                {index + 1}.
              </span>
            ) : item.startsWith('✅') ||
              item.startsWith('❌') ||
              item.startsWith('☑️') ? (
              <span className="mr-2">{item.substring(0, 2)}</span>
            ) : (
              <span className="mr-2 text-violet-500">•</span>
            )}
            <span className="flex-1">
              {parseInlineMarkdown(
                item.startsWith('✅') ||
                  item.startsWith('❌') ||
                  item.startsWith('☑️')
                  ? item.substring(2)
                  : item
              )}
            </span>
          </li>
        ))}
      </ListComponent>
    );
  };

  return (
    <div className={`markdown-content ${className}`}>
      {processContent(content)}
    </div>
  );
}
