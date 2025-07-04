import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CachedReport {
  content: string;
  timestamp: number;
  expiresAt?: number; // Para relatórios temporários (blog, dia pessoal)
}

interface ReportStore {
  reports: Record<string, CachedReport>;
  setReport: (key: string, content: string, expiresInHours?: number) => void;
  getReport: (key: string) => string | null;
  clearExpiredReports: () => void;
  clearAllReports: () => void;
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      reports: {},

      setReport: (key, content, expiresInHours) => {
        const timestamp = Date.now();
        const expiresAt = expiresInHours
          ? timestamp + expiresInHours * 60 * 60 * 1000
          : undefined;

        set((state) => ({
          reports: {
            ...state.reports,
            [key]: { content, timestamp, expiresAt },
          },
        }));
      },

      getReport: (key) => {
        const report = get().reports[key];
        if (!report) return null;

        // Verificar se o relatório expirou
        if (report.expiresAt && Date.now() > report.expiresAt) {
          set((state) => {
            const { [key]: removed, ...rest } = state.reports;
            return { reports: rest };
          });
          return null;
        }

        return report.content;
      },

      clearExpiredReports: () => {
        const now = Date.now();
        set((state) => {
          const validReports: Record<string, CachedReport> = {};

          Object.entries(state.reports).forEach(([key, report]) => {
            if (!report.expiresAt || now <= report.expiresAt) {
              validReports[key] = report;
            }
          });

          return { reports: validReports };
        });
      },

      clearAllReports: () => set({ reports: {} }),
    }),
    {
      name: "report-storage",
      version: 1,
    },
  ),
);

// Hook para facilitar o uso
export const useReports = () => {
  const {
    reports,
    setReport,
    getReport,
    clearExpiredReports,
    clearAllReports,
  } = useReportStore();

  // Função para gerar chave do relatório
  const generateReportKey = (type: string, data: any) => {
    const dataStr = typeof data === "object" ? JSON.stringify(data) : data;
    return `${type}_${dataStr}`;
  };

  // Função para salvar relatório com configuração automática de expiração
  const saveReport = async (type: string, data: any, content?: string) => {
    const key = generateReportKey(type, data);

    // Se não temos o conteúdo, buscar da API
    if (!content) {
      try {
        const response = await fetch("/api/ai/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, data }),
        });

        if (response.ok) {
          const result = await response.json();
          content = result.content;
        } else {
          throw new Error("Erro ao gerar relatório");
        }
      } catch (error) {
        console.error("Erro ao buscar relatório:", error);
        return null;
      }
    }

    // Verificar se content está definido
    if (!content) {
      console.error("Conteúdo do relatório não encontrado");
      return null;
    }

    // Configurar tempo de expiração baseado no tipo
    let expiresInHours: number | undefined;
    if (type === "blog" || type === "dia-pessoal") {
      expiresInHours = 24; // 24 horas
    }
    // Outros relatórios ficam salvos permanentemente (até logout)

    setReport(key, content, expiresInHours);

    // Salvar no banco de dados também (exceto temporários)
    if (!expiresInHours) {
      try {
        await fetch("/api/ai/reports/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, data, content }),
        });
      } catch (error) {
        console.error("Erro ao salvar relatório no banco:", error);
      }
    }

    return content;
  };

  // Função para buscar relatório (cache-first)
  const fetchReport = async (type: string, data: any) => {
    const key = generateReportKey(type, data);

    // Primeiro, tentar buscar do cache
    const cached = getReport(key);
    if (cached) {
      return cached;
    }

    // Se não tiver no cache, gerar novo
    return await saveReport(type, data);
  };

  // Limpar relatórios expirados na inicialização
  const initialize = () => {
    clearExpiredReports();
  };

  return {
    reports,
    saveReport,
    fetchReport,
    clearExpiredReports,
    clearAllReports,
    initialize,
  };
};
