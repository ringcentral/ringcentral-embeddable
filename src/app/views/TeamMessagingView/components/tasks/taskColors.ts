import type { TeamMessagingTask } from '../../../../services/TeamMessaging';

type TaskColor = NonNullable<TeamMessagingTask['color']>;

/** The left bar of a task card, in the task's color. */
const TASK_COLOR_CLASSES: Record<TaskColor, string> = {
  Black: 'border-neutral-b0',
  Red: 'border-danger',
  Orange: 'border-extra-tangerine',
  Yellow: 'border-extra-mango',
  Green: 'border-success',
  Blue: 'border-primary-b',
  Purple: 'border-extra-amethyst',
  Magenta: 'border-extra-wildberry',
};

export function getTaskColorClass(color?: TaskColor): string {
  return (color && TASK_COLOR_CLASSES[color]) || 'border-neutral-b3';
}
