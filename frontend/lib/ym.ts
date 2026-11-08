declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string, params?: unknown) => void;
  }
  function ym(id: number, action: string, goal: string, params?: unknown): void;
}

const YM_ID = 112272348;

export function ymGoal(goal: string, params?: unknown) {
  if (typeof window !== 'undefined') {
    const ymFn = window.ym || (typeof ym !== 'undefined' ? ym : undefined);
    if (typeof ymFn === 'function') {
      if (params !== undefined) {
        ymFn(YM_ID, 'reachGoal', goal, params);
      } else {
        ymFn(YM_ID, 'reachGoal', goal);
      }
    }
  }
}
