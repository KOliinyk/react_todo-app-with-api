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
  showError,
}) => {
  const [isEditingId, setIsEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoadingId, setIsLoadingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Фокусуємо інпут при початку редагування
  useEffect(() => {
    if (isEditingId !== null) {
      inputRef.current?.focus();
    }
  }, [isEditingId]);

  const cancelEditing = () => {
    setIsEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (id: number) => {
    setIsLoadingId(id);
    try {
      await deleteTodo(id);
    } catch {
      showError('Unable to delete a todo');
    } finally {
      setIsLoadingId(null);
    }
  };

  const handleChangeStatus = async (todo: Todo) => {
    setIsLoadingId(todo.id);
    try {
      await changeTodo(todo.id, todo.title, !todo.completed);
    } catch {
      showError('Unable to update a todo');
    } finally {
      setIsLoadingId(null);
    }
  };

  const saveEditing = async (todo: Todo) => {
    const trimmedTitle = editTitle.trim();

    if (trimmedTitle === todo.title) {
      cancelEditing();

      return;
    }

    if (trimmedTitle.length === 0) {
      await handleDelete(todo.id);
      cancelEditing();

      return;
    }

    setIsLoadingId(todo.id);
    try {
      await changeTodo(todo.id, trimmedTitle, todo.completed);
      cancelEditing();
    } catch {
      showError('Unable to update a todo');
    } finally {
      setIsLoadingId(null);
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
              onChange={() => handleChangeStatus(todo)}
              className="todo__status"
              data-cy="TodoStatus"
            />
            <span className="visually-hidden">Позначити як виконане</span>
          </label>

          {isEditingId === todo.id ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                saveEditing(todo);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="todo__title-field"
                data-cy="TodoTitleField"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => saveEditing(todo)}
                onKeyDown={e => e.key === 'Escape' && cancelEditing()}
                placeholder="Empty todo will be deleted"
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
                onClick={() => handleDelete(todo.id)}
              >
                ×
              </button>
            </>
          )}

          <div
            className={`modal overlay ${isLoadingId === todo.id ? 'is-active' : ''}`}
            data-cy="TodoLoader"
            aria-hidden="true"
          >
            <div className="modal-background has-background-white-ter" />
            <div className="loader" />
          </div>
        </div>
      ))}
    </section>
  );
};
