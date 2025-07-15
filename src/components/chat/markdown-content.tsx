'use client';

import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  // Função para processar markdown simples
  const processMarkdown = (text: string): React.ReactNode => {
    // Divide o texto em linhas para processar
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentListItems: string[] = [];
    
    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-none space-y-2 my-3 ml-0">
            {currentListItems.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed flex items-start gap-2">
                {processInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        currentListItems = [];
      }
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Headers
      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-lg font-bold mt-4 mb-3 text-violet-700 dark:text-violet-300 border-b border-violet-200 dark:border-violet-700 pb-1">
            {processInlineMarkdown(trimmedLine.slice(3))}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-base font-semibold mt-3 mb-2 text-violet-600 dark:text-violet-400">
            {processInlineMarkdown(trimmedLine.slice(4))}
          </h3>
        );
      }
      // Lista com emojis
      else if (/^[✅❌🎯💡📊🚀⚡💰🏆🔥💎⭐]\s/.test(trimmedLine)) {
        currentListItems.push(trimmedLine);
      }
      // Lista com - ou *
      else if (/^[-*]\s/.test(trimmedLine)) {
        currentListItems.push('• ' + trimmedLine.slice(2));
      }
      // Linha vazia
      else if (trimmedLine === '') {
        flushList();
        if (elements.length > 0) {
          elements.push(<div key={`br-${index}`} className="h-2" />);
        }
      }
      // Texto normal
      else if (trimmedLine.length > 0) {
        flushList();
        elements.push(
          <p key={index} className="text-sm leading-relaxed mb-2">
            {processInlineMarkdown(trimmedLine)}
          </p>
        );
      }
    });
    
    flushList(); // Flush any remaining list items
    
    return elements;
  };
  
  // Processa markdown inline (negrito, links, etc)
  const processInlineMarkdown = (text: string): React.ReactNode => {
    // Bold **text**
    let processed = text.replace(/\*\*(.*?)\*\*/g, (_, content) => 
      `<strong class="font-semibold text-violet-700 dark:text-violet-300">${content}</strong>`
    );
    
    // Emojis especiais com destaque
    processed = processed.replace(/(🚀|💰|⚡|🎯|✅|❌|🔥|💡)/g, 
      '<span class="text-base">$1</span>'
    );
    
    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
  };
  
  return (
    <div className={`markdown-content ${className}`}>
      {processMarkdown(content)}
    </div>
  );
}
