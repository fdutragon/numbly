import React from 'react';

interface LeadData {
  score: number;
  stage: string;
  interests: string[];
  objections: string[];
  urgency: 'low' | 'medium' | 'high';
}

interface FunnelThermometerProps {
  score: number;
  stage: string;
  onExpand: () => void;
  expanded: boolean;
  leadData: LeadData | null;
}

const STAGES = [
  { label: 'Vazio', color: 'bg-gray-300', temp: 0 },
  { label: 'Frio', color: 'bg-blue-400', temp: 10 },
  { label: 'Frio+', color: 'bg-blue-500', temp: 20 },
  { label: 'Morno-', color: 'bg-yellow-300', temp: 30 },
  { label: 'Morno', color: 'bg-yellow-400', temp: 40 },
  { label: 'Morno+', color: 'bg-yellow-500', temp: 50 },
  { label: 'Quente-', color: 'bg-orange-400', temp: 60 },
  { label: 'Quente', color: 'bg-red-400', temp: 70 },
  { label: 'Quente+', color: 'bg-red-500', temp: 80 },
  { label: 'Fervendo', color: 'bg-red-600', temp: 90 },
];

function getThermoLevel(score: number) {
  if (score >= 90) return 9; // Fervendo
  if (score >= 80) return 8; // Quente+
  if (score >= 70) return 7; // Quente
  if (score >= 60) return 6; // Quente-
  if (score >= 50) return 5; // Morno+
  if (score >= 40) return 4; // Morno
  if (score >= 30) return 3; // Morno-
  if (score >= 20) return 2; // Frio+
  if (score >= 10) return 1; // Frio
  return 0; // Vazio
}

export const FunnelThermometer: React.FC<FunnelThermometerProps> = ({ score, expanded, onExpand, leadData }) => {
  const level = getThermoLevel(score);

  return (
    <div className="fixed right-6 bottom-28 flex flex-col items-end z-[60] select-none pointer-events-none">
      {/* Botão de expandir - sempre visível */}
      <button
        onClick={onExpand}
        className="mb-2 w-8 h-8 flex items-center justify-center rounded-lg bg-background/90 backdrop-blur-sm border border-border/50 shadow-md hover:bg-accent transition-all duration-200 hover:scale-105 pointer-events-auto"
        aria-label="Expandir métricas do funil"
        tabIndex={0}
      >
        <span className="text-sm font-bold text-foreground">{expanded ? '−' : '+'}</span>
      </button>

      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        {/* Termômetro + números */}
        <div className="flex flex-row items-end gap-1">
          {/* Coluna dos números */}
          <div className="flex flex-col justify-between h-40 text-right mr-1">
            {STAGES.slice().reverse().map((stage, idx) => {
              const originalIdx = STAGES.length - 1 - idx;
              const showTemp = [0, 20, 60, 90].includes(stage.temp);
              return (
                <div key={stage.label} className="flex items-center justify-end" style={{ height: '10%' }}>
                  {showTemp && (
                    <span className={`text-[10px] font-medium px-0.5 py-0.5 rounded ${
                      originalIdx === level 
                        ? 'bg-foreground text-background shadow-md' 
                        : 'text-muted-foreground'
                    }`} style={{ marginRight: '2px' }}>
                      {stage.temp}°
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Barra do termômetro */}
          <div className="flex flex-col justify-end h-40 w-6 rounded-full bg-muted/50 relative shadow-inner border border-border/30 overflow-hidden">
            {STAGES.slice().reverse().map((stage, idx) => {
              const originalIdx = STAGES.length - 1 - idx;
              return (
                <div
                  key={stage.label}
                  className={`transition-all duration-500 w-full ${stage.color} ${
                    originalIdx === level ? 'ring-1 ring-white/50 shadow-sm' : ''
                  }`}
                  style={{
                    height: '10%',
                    opacity: originalIdx <= level ? 1 : 0.15,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Métricas do funil: só aparecem se expandido */}
      {expanded && (
        <div className="absolute right-0 bottom-full mb-2 p-3 rounded-lg bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl w-56 text-xs text-foreground transition-all duration-300 pointer-events-auto">
          <div className="mb-2 font-semibold text-sm text-foreground">Métricas do Funil</div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Score:</span> 
              <span className="font-bold text-foreground">{leadData?.score ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Estágio:</span> 
              <span className="font-bold text-foreground capitalize">{leadData?.stage ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Urgência:</span> 
              <span className="font-bold text-foreground capitalize">{leadData?.urgency ?? '-'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium text-muted-foreground">Interesses:</span> 
              <span className="text-foreground text-xs break-words">{leadData?.interests?.join(', ') || '-'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium text-muted-foreground">Objeções:</span> 
              <span className="text-foreground text-xs break-words">{leadData?.objections?.join(', ') || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
