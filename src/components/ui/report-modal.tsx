"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Clock, Sparkles, Download, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "./button";

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
  icon,
}: ReportModalProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          reportNumber,
          userData,
          language: "pt",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erro ao gerar relatório");
      }

      if (result.success && result.data) {
        setReportData(result.data);
      } else {
        throw new Error("Resposta inválida da API");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao gerar relatório");
      console.error("Erro na geração do relatório:", err);
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

    const blob = new Blob([reportData.report], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${reportType}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareReport = async () => {
    if (
      !reportData ||
      typeof navigator === "undefined" ||
      !("share" in navigator)
    )
      return;

    try {
      await navigator.share({
        title: `Relatório ${title}`,
        text: reportData.report.substring(0, 200) + "...",
        url: window.location.href,
      });
    } catch (err) {
      console.log("Compartilhamento cancelado ou não suportado");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-50 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fixo minimalista */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-lg">
                  {icon}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h1>
                  {reportData && (
                    <p className="text-xs text-gray-500">
                      {reportData.wordCount} palavras •{" "}
                      {new Date(reportData.generatedAt).toLocaleDateString(
                        "pt-BR",
                      )}
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
                      className="p-2 hover:bg-gray-100"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {typeof navigator !== "undefined" &&
                      "share" in navigator && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareReport}
                          className="p-2 hover:bg-gray-100"
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
                  className="p-2 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content full screen */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center max-w-md"
                >
                  <div className="relative mb-8">
                    <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Gerando seu relatório
                  </h3>
                  <p className="text-gray-600 mb-2 text-lg">
                    Analisando seus dados numerológicos...
                  </p>
                  <p className="text-gray-500">
                    A IA está processando informações personalizadas para você
                  </p>

                  {/* Pontos de loading animados */}
                  <div className="flex justify-center mt-6 space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-purple-600 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {error && (
              <div className="max-w-4xl mx-auto px-4 py-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-6"
                >
                  <div className="flex items-start">
                    <div className="text-red-600 mr-3 text-xl">⚠️</div>
                    <div className="flex-1">
                      <h3 className="text-red-800 font-semibold text-lg mb-2">
                        Erro na geração do relatório
                      </h3>
                      <p className="text-red-700 mb-4">{error}</p>
                      <Button
                        onClick={generateReport}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        Tentar Novamente
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {reportData && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-4xl mx-auto px-4 py-8 pb-16"
              >
                {/* Conteúdo do relatório */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12"
                >
                  <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-em:text-gray-600 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-blockquote:text-gray-600 prose-blockquote:border-purple-300 prose-lg">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-6 first:mt-0 border-b border-gray-200 pb-4">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 first:mt-0">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3 first:mt-0">
                            {children}
                          </h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-lg font-medium text-gray-800 mt-6 mb-2">
                            {children}
                          </h4>
                        ),
                        p: ({ children }) => (
                          <p className="text-gray-700 leading-relaxed mb-6 text-base">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-purple-600 font-medium">
                            {children}
                          </em>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2 pl-4">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-6 text-gray-700 space-y-2 pl-4">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-700">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-purple-300 bg-purple-50 pl-6 py-4 mb-6 text-gray-700 italic rounded-r-lg">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {reportData.report}
                    </ReactMarkdown>
                  </div>

                  {/* Footer do relatório */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="mt-12 pt-8 border-t border-gray-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          {reportData.wordCount} palavras
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {reportData.processingTime}ms
                        </span>
                        <span className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          {reportData.cached
                            ? "Relatório salvo"
                            : "Gerado agora"}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p className="font-medium">
                          Relatório gerado por Numbly.Life
                        </p>
                        <p>
                          {new Date(reportData.generatedAt).toLocaleString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
