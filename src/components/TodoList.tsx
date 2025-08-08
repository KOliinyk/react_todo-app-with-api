import React, { useState, useEffect, useRef } from 'react';
import { Todo } from '../types/Todo';

type TodoListProps = {
  todos: Todo[];
  deleteTodo: (id: number) => Promise<void>;
  changeTodo: (id: number, title: string, completed: boolean) => Promise<void>;
  toggleAll: () => void;
  showError: (msg: string) => void;
};

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  deleteTodo,
  changeTodo,
  toggleAll,
  showError,
}) => {
  const [isEditingId, setIsEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoadingId, setIsLoadingId] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingId !== null) {
      inputRef.current?.focus();
    }
  }, [isEditingId]);

  const cancelEditing = () => {
    setIsEditingId(null);
    setEditTitle('');
  };

  const saveEditing = async (todo: Todo) => {
    const trimmedTitle = editTitle.trim();

    // Якщо назва не змінилась — просто скасовуємо редагування
    if (trimmedTitle === todo.title) {
      cancelEditing();

      return;
    }

    // Якщо назва порожня — видаляємо завдання
    if (trimmedTitle.length === 0) {
      setIsLoadingId(todo.id);
      try {
        await deleteTodo(todo.id);
      } catch {
        showError('Unable to delete a todo');
      } finally {
        setIsLoadingId(0);
        cancelEditing();
      }

      return;
    }

    // Інакше оновлюємо завдання
    setIsLoadingId(todo.id);
    try {
      await changeTodo(todo.id, trimmedTitle, todo.completed);
      cancelEditing();
    } catch {
      showError('Unable to update a todo');
    } finally {
      setIsLoadingId(0);
    }
  };

  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => (
        <div
          key={todo.id}
          className={`todo${todo.completed ? ' completed' : ''}`}
          data-cy="Todo"
        >
          <label
            htmlFor={`todo-status-${todo.id}`}
            className="todo__status-label"
          >
            <input
              id={`todo-status-${todo.id}`}
              type="checkbox"
              checked={todo.completed}
              onChange={async () => {
                setIsLoadingId(todo.id);
                try {
                  await changeTodo(todo.id, todo.title, !todo.completed);
                } catch {
                  showError('Unable to update a todo');
                } finally {
                  setIsLoadingId(0);
                }
              }}
              className="todo__status"
              data-cy="TodoStatus"
            />
            <span className="visually-hidden">Позначити як виконане</span>
          </label>

          {isEditingId === todo.id ? (
            <form
              onSubmit={async e => {
                e.preventDefault();
                await saveEditing(todo);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="todo__title-field"
                data-cy="TodoTitleField"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => saveEditing(todo)} // Зберігаємо на втраті фокусу
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    cancelEditing(); // Скасовуємо редагування
                  }
                }}
                placeholder="Empty todo will be deleted"
                autoFocus
              />
            </form>
          ) : (
            <>
              <span
                className="todo__title"
                data-cy="TodoTitle"
                onDoubleClick={() => {
                  setIsEditingId(todo.id);
                  setEditTitle(todo.title);
                }}
              >
                {todo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={async () => {
                  setIsLoadingId(todo.id);
                  try {
                    await deleteTodo(todo.id);
                  } catch {
                    showError('Unable to delete a todo');
                  } finally {
                    setIsLoadingId(0);
                  }
                }}
              >
                ×
              </button>
            </>
          )}

          {isLoadingId === todo.id && (
            <div
              className="modal overlay is-active"
              data-cy="TodoLoader"
              aria-hidden="true"
            >
              <div className="modal-background has-background-white-ter" />
              <div className="loader" />
            </div>
          )}
        </div>
      ))}

      <button
        className={`toggle-all ${
          todos.length > 0 && todos.every(t => t.completed) ? 'active' : ''
        }`}
        onClick={toggleAll}
        data-cy="ToggleAllButton"
      />
    </section>
  );
};
