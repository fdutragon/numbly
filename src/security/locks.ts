export function enableReadOnlyLocks(root: HTMLElement) {
  root.style.userSelect = 'none';
  const handler = (e: Event) => e.preventDefault();
  root.addEventListener('copy', handler);
  root.addEventListener('cut', handler);
  root.addEventListener('paste', handler);
  root.addEventListener('contextmenu', handler);
  return () => {
    root.style.userSelect = '';
    root.removeEventListener('copy', handler);
    root.removeEventListener('cut', handler);
    root.removeEventListener('paste', handler);
    root.removeEventListener('contextmenu', handler);
  };
}
