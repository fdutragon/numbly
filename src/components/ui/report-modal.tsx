'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Clock, Sparkles, Download, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './button';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportNumber?: number;
  userData?: any;
  title: string;
  icon: string;
}

interface ReportData {
  report: string;
  cached: boolean;
  generatedAt: Date;
  reportType: string;
  reportNumber?: number;
  wordCount: number;
  processingTime: number;
}

export function ReportModal({ 
  isOpen, 
  onClose, 
  reportType, 
  reportNumber, 
  userData, 
  title, 
  icon 
}: ReportModalProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType,
          reportNumber,
          userData,
          language: 'pt'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao gerar relatório');
      }

      if (result.success && result.data) {
        setReportData(result.data);
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
      console.error('Erro na geração do relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !reportData && !loading) {
      generateReport();
    }
  }, [isOpen]);

  const handleClose = () => {
    setReportData(null);
    setError(null);
    onClose();
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    const blob = new Blob([reportData.report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareReport = async () => {
    if (!reportData || typeof navigator === 'undefined' || !('share' in navigator)) return;
    
    try {
      await navigator.share({
        title: `Relatório ${title}`,
        text: reportData.report.substring(0, 200) + '...',
        url: window.location.href
      });
    } catch (err) {
      console.log('Compartilhamento cancelado ou não suportado');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{icon}</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                  {reportData && (
                    <p className="text-sm text-gray-600">
                      {reportData.wordCount} palavras • 
                      {reportData.cached ? ' Relatório salvo' : ' Relatório gerado'} • 
                      {new Date(reportData.generatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {reportData && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={downloadReport}
                      className="p-2"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={shareReport}
                        className="p-2"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-purple-600 absolute top-3 left-3" />
                  </div>
                  <p className="text-gray-600 mt-4 text-center">
                    Gerando seu relatório personalizado...
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Isso pode levar alguns segundos
                  </p>
                </div>
              )}

              {error && (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="text-red-600 mr-3">⚠️</div>
                      <div>
                        <h3 className="text-red-800 font-medium">Erro na geração do relatório</h3>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                    <Button
                      onClick={generateReport}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              )}

              {reportData && !loading && (
                <div className="p-6">
                  <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-em:text-gray-600 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-blockquote:text-gray-600 prose-blockquote:border-purple-300">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3 first:mt-0">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3 first:mt-0">{children}</h3>,
                        h4: ({children}) => <h4 className="text-base font-medium text-gray-800 mt-4 mb-2">{children}</h4>,
                        p: ({children}) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-700 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-gray-700">{children}</li>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-purple-300 pl-4 mb-4 text-gray-600 italic">{children}</blockquote>,
                      }}
                    >
                      {reportData.report}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Footer do relatório */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {reportData.wordCount} palavras
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {reportData.processingTime}ms
                        </span>
                      </div>
                      <div className="text-right">
                        <p>Relatório gerado por Numbly.Life</p>
                        <p>{new Date(reportData.generatedAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
