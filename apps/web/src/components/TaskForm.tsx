import { useId, useState, type SubmitEvent } from 'react';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from '../api/types';
import { parseTagInput } from '../lib/tags';

interface TaskFormProps {
  task?: Task | undefined;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: TaskInput) => void;
  onCancel: () => void;
}

export function TaskForm({ task, submitting, error, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [tags, setTags] = useState(task?.tags.join(', ') ?? '');
  const [titleError, setTitleError] = useState<string | null>(null);
  const id = useId();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || null,
      tags: parseTagInput(tags),
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field__label" htmlFor={`${id}-title`}>
          Title
        </label>
        <input
          id={`${id}-title`}
          className="input"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleError(null);
          }}
          maxLength={200}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? `${id}-title-error` : undefined}
          autoFocus
        />
        {titleError && (
          <span id={`${id}-title-error`} className="field__error">
            {titleError}
          </span>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${id}-description`}>
          Description
        </label>
        <textarea
          id={`${id}-description`}
          className="input input--textarea"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          rows={3}
          maxLength={5000}
        />
      </div>

      <div className="form__row">
        <div className="field">
          <label className="field__label" htmlFor={`${id}-status`}>
            Status
          </label>
          <select
            id={`${id}-status`}
            className="input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TaskStatus);
            }}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${id}-priority`}>
            Priority
          </label>
          <select
            id={`${id}-priority`}
            className="input"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as TaskPriority);
            }}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${id}-due`}>
            Due date
          </label>
          <input
            id={`${id}-due`}
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${id}-tags`}>
          Tags
        </label>
        <input
          id={`${id}-tags`}
          className="input"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
          }}
          placeholder="frontend, bug"
          aria-describedby={`${id}-tags-hint`}
        />
        <span id={`${id}-tags-hint`} className="field__hint">
          Separate tags with commas.
        </span>
      </div>

      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}

      <div className="form__actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Saving…' : task ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
