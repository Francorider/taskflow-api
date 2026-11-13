import { PRIORITY_LABELS, STATUS_LABELS, type Task } from '../api/types';
import { formatDueDate, isOverdue } from '../lib/dates';
import { CalendarIcon, EditIcon, TrashIcon } from './Icons';

interface TaskItemProps {
  task: Task;
  onToggleDone: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskItem({ task, onToggleDone, onEdit, onDelete }: TaskItemProps) {
  const done = task.status === 'done';
  const overdue = isOverdue(task);

  return (
    <li className={`task${done ? ' task--done' : ''}`}>
      <input
        type="checkbox"
        className="task__check"
        checked={done}
        onChange={() => {
          onToggleDone(task);
        }}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
      />

      <div className="task__body">
        <h3 className="task__title">{task.title}</h3>
        {task.description && <p className="task__description">{task.description}</p>}

        <div className="task__meta">
          <span className={`pill pill--${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
          {task.status === 'in_progress' && (
            <span className="pill pill--progress">{STATUS_LABELS.in_progress}</span>
          )}
          {task.dueDate && (
            <span className={`due${overdue ? ' due--overdue' : ''}`}>
              <CalendarIcon />
              {formatDueDate(task.dueDate)}
              {overdue && <span className="visually-hidden"> (overdue)</span>}
            </span>
          )}
          {task.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="task__actions">
        <button
          type="button"
          className="icon-button"
          onClick={() => {
            onEdit(task);
          }}
          aria-label={`Edit "${task.title}"`}
        >
          <EditIcon />
        </button>
        <button
          type="button"
          className="icon-button icon-button--danger"
          onClick={() => {
            onDelete(task);
          }}
          aria-label={`Delete "${task.title}"`}
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
