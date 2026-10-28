declare global {
  function ym(id: number, action: string, goal: string): void;
}

const YM_ID = 112272348;

export function ymGoal(goal: string) {
  if (typeof ym !== 'undefined') {
    ym(YM_ID, 'reachGoal', goal);
  }
}
