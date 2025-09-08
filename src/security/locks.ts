/**
 * Sistema de bloqueios de segurança para modo read-only
 * Previne copy/paste/context menu quando o documento está protegido
 */

export interface SecurityLockConfig {
  disableCopy?: boolean;
  disablePaste?: boolean;
  disableCut?: boolean;
  disableContextMenu?: boolean;
  disableSelection?: boolean;
  disableDragDrop?: boolean;
  disableKeyboardShortcuts?: boolean;
}

export interface SecurityLockInstance {
  unlock: () => void;
  isLocked: boolean;
  config: SecurityLockConfig;
}

// Mapa global de elementos bloqueados
const lockedElements = new Map<HTMLElement, SecurityLockInstance>();

/**
 * Configuração padrão de bloqueio para modo read-only
 */
const DEFAULT_READ_ONLY_CONFIG: SecurityLockConfig = {
  disableCopy: true,
  disablePaste: true,
  disableCut: true,
  disableContextMenu: true,
  disableSelection: true,
  disableDragDrop: true,
  disableKeyboardShortcuts: true
};

/**
 * Ativa bloqueios de segurança em um elemento
 */
export function enableReadOnlyLocks(
  root: HTMLElement,
  config: SecurityLockConfig = DEFAULT_READ_ONLY_CONFIG
): SecurityLockInstance {
  // Se já está bloqueado, desbloquear primeiro
  if (lockedElements.has(root)) {
    lockedElements.get(root)!.unlock();
  }

  const handlers: Array<() => void> = [];

  // Desabilitar seleção via CSS
  if (config.disableSelection) {
    const style = root.style as any;
    style.userSelect = 'none';
    style.webkitUserSelect = 'none';
    style.mozUserSelect = 'none';
    style.msUserSelect = 'none';
    root.setAttribute('unselectable', 'on');
    
    handlers.push(() => {
      const style = root.style as any;
      style.userSelect = '';
      style.webkitUserSelect = '';
      style.mozUserSelect = '';
      style.msUserSelect = '';
      root.removeAttribute('unselectable');
    });
  }

  // Handler genérico para prevenir eventos
  const preventEvent = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Desabilitar copy
  if (config.disableCopy) {
    root.addEventListener('copy', preventEvent, { capture: true });
    handlers.push(() => root.removeEventListener('copy', preventEvent, { capture: true }));
  }

  // Desabilitar paste
  if (config.disablePaste) {
    root.addEventListener('paste', preventEvent, { capture: true });
    handlers.push(() => root.removeEventListener('paste', preventEvent, { capture: true }));
  }

  // Desabilitar cut
  if (config.disableCut) {
    root.addEventListener('cut', preventEvent, { capture: true });
    handlers.push(() => root.removeEventListener('cut', preventEvent, { capture: true }));
  }

  // Desabilitar context menu
  if (config.disableContextMenu) {
    root.addEventListener('contextmenu', preventEvent, { capture: true });
    handlers.push(() => root.removeEventListener('contextmenu', preventEvent, { capture: true }));
  }

  // Desabilitar drag & drop
  if (config.disableDragDrop) {
    const dragEvents = ['dragstart', 'drag', 'dragend', 'drop'];
    dragEvents.forEach(event => {
      root.addEventListener(event, preventEvent, { capture: true });
      handlers.push(() => root.removeEventListener(event, preventEvent, { capture: true }));
    });
  }

  // Desabilitar atalhos de teclado
  if (config.disableKeyboardShortcuts) {
    const keydownHandler = (e: KeyboardEvent) => {
      // Lista de atalhos bloqueados
      const blockedShortcuts = [
        { ctrl: true, key: 'c' }, // Copy
        { ctrl: true, key: 'v' }, // Paste
        { ctrl: true, key: 'x' }, // Cut
        { ctrl: true, key: 'a' }, // Select All
        { ctrl: true, key: 's' }, // Save (pode interferir com auto-save)
        { ctrl: true, key: 'p' }, // Print
        { key: 'F12' }, // Dev Tools
        { ctrl: true, shift: true, key: 'I' }, // Dev Tools
        { ctrl: true, shift: true, key: 'J' }, // Console
        { ctrl: true, key: 'u' }, // View Source
      ];

      const isBlocked = blockedShortcuts.some(shortcut => {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
        
        return ctrlMatch && shiftMatch && keyMatch;
      });

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    root.addEventListener('keydown', keydownHandler, { capture: true });
    handlers.push(() => root.removeEventListener('keydown', keydownHandler, { capture: true }));
  }

  // Prevenir seleção via mouse
  if (config.disableSelection) {
    const selectStartHandler = (e: Event) => {
      e.preventDefault();
      return false;
    };

    root.addEventListener('selectstart', selectStartHandler);
    handlers.push(() => root.removeEventListener('selectstart', selectStartHandler));
  }

  // Função para desbloquear
  const unlock = () => {
    handlers.forEach(handler => handler());
    lockedElements.delete(root);
  };

  // Criar instância
  const instance: SecurityLockInstance = {
    unlock,
    isLocked: true,
    config
  };

  // Armazenar referência
  lockedElements.set(root, instance);

  console.log('Bloqueios de segurança ativados', { element: root, config });

  return instance;
}

/**
 * Remove todos os bloqueios de um elemento
 */
export function disableReadOnlyLocks(root: HTMLElement): void {
  const instance = lockedElements.get(root);
  if (instance) {
    instance.unlock();
    console.log('Bloqueios de segurança removidos', { element: root });
  }
}

/**
 * Verifica se um elemento está bloqueado
 */
export function isElementLocked(root: HTMLElement): boolean {
  return lockedElements.has(root);
}

/**
 * Ativa/desativa bloqueios baseado em status do documento
 */
export function toggleDocumentLocks(
  root: HTMLElement,
  isReadOnly: boolean,
  config?: SecurityLockConfig
): SecurityLockInstance | null {
  if (isReadOnly) {
    return enableReadOnlyLocks(root, config);
  } else {
    disableReadOnlyLocks(root);
    return null;
  }
}

/**
 * Ativa bloqueios temporários (ex: durante operações de IA)
 */
export function enableTemporaryLocks(
  root: HTMLElement,
  durationMs: number = 3000,
  config?: Partial<SecurityLockConfig>
): Promise<void> {
  return new Promise((resolve) => {
    const tempConfig: SecurityLockConfig = {
      disableSelection: true,
      disableKeyboardShortcuts: true,
      ...config
    };

    const instance = enableReadOnlyLocks(root, tempConfig);
    
    setTimeout(() => {
      instance.unlock();
      resolve();
    }, durationMs);
  });
}

/**
 * Proteção especial para bypass interno (IA/export)
 * Permite operações programáticas mesmo com bloqueios ativos
 */
export function createInternalBypass(): {
  copyText: (text: string) => Promise<boolean>;
  getSelectedText: (element: HTMLElement) => string;
  selectAllText: (element: HTMLElement) => void;
} {
  return {
    /**
     * Copia texto para clipboard sem triggerar eventos bloqueados
     */
    copyText: async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error('Erro ao copiar texto:', error);
        return false;
      }
    },

    /**
     * Obtém texto selecionado sem triggerar eventos
     */
    getSelectedText: (element: HTMLElement): string => {
      try {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (element.contains(range.commonAncestorContainer)) {
            return selection.toString();
          }
        }
        return '';
      } catch (error) {
        console.error('Erro ao obter texto selecionado:', error);
        return '';
      }
    },

    /**
     * Seleciona todo texto programaticamente
     */
    selectAllText: (element: HTMLElement): void => {
      try {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (error) {
        console.error('Erro ao selecionar texto:', error);
      }
    }
  };
}

/**
 * Monitor global para detectar tentativas de burla
 */
export function startSecurityMonitor(): () => void {
  const suspiciousEvents: string[] = [];
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 60000; // 1 minuto

  const logSuspiciousActivity = (event: string, detail?: string) => {
    const now = Date.now();
    suspiciousEvents.push(`${now}:${event}:${detail || ''}`);
    
    // Limpar eventos antigos
    const cutoff = now - WINDOW_MS;
    const recentEvents = suspiciousEvents.filter(e => {
      const timestamp = parseInt(e.split(':')[0]);
      return timestamp > cutoff;
    });
    suspiciousEvents.length = 0;
    suspiciousEvents.push(...recentEvents);

    // Alertar se muitas tentativas
    if (recentEvents.length > MAX_ATTEMPTS) {
      console.warn('Atividade suspeita detectada:', recentEvents);
      // Aqui poderia disparar alguma ação adicional
    }
  };

  // Monitorar eventos suspeitos
  const monitorHandler = (e: Event) => {
    if (e.target instanceof HTMLElement && isElementLocked(e.target)) {
      logSuspiciousActivity(e.type, e.target.tagName);
    }
  };

  const events = ['copy', 'paste', 'cut', 'contextmenu', 'selectstart'];
  events.forEach(event => {
    document.addEventListener(event, monitorHandler, { capture: true });
  });

  // Retornar função de cleanup
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, monitorHandler, { capture: true });
    });
    console.log('Monitor de segurança desativado');
  };
}

/**
 * Utilitário para debug - mostrar status de bloqueios
 */
export function debugSecurityLocks(): void {
  console.group('Security Locks Debug');
  console.log('Elementos bloqueados:', lockedElements.size);
  
  lockedElements.forEach((instance, element) => {
    console.log('Elemento:', element);
    console.log('Config:', instance.config);
    console.log('Locked:', instance.isLocked);
  });
  
  console.groupEnd();
}

export default {
  enableReadOnlyLocks,
  disableReadOnlyLocks,
  isElementLocked,
  toggleDocumentLocks,
  enableTemporaryLocks,
  createInternalBypass,
  startSecurityMonitor,
  debugSecurityLocks
};
