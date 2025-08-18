import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  addTodos,
  deleteTodo,
  getTodos,
  patchTodos,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList';
import { FormTodo } from './components/FormTodos';
import { FooterTodos } from './components/FooterTodos';
import { ErrorTodos } from './components/ErrorTodos';

type Filter = 'All' | 'Active' | 'Completed';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState('');
  const [filterSelect, setFilterSelected] = useState<Filter>('All');
  const [isDisabledInput, setIsDisabledInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Утиліта для видалення порожніх todo
  const cleanTodos = (todoList: Todo[]) =>
    todoList.filter(t => t.title.trim() !== '');

  // Завантаження з localStorage або API
  useEffect(() => {
    const saved = localStorage.getItem('todos');

    if (saved) {
      setTodos(cleanTodos(JSON.parse(saved)));
    } else {
      getTodos()
        .then(fetched => setTodos(cleanTodos(fetched)))
        .catch(() => setError('Unable to load todos'));
    }
  }, []);

  // Збереження в localStorage при зміні todos
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(cleanTodos(todos)));
  }, [todos]);

  const filteredTodos = cleanTodos(todos).filter(todo => {
    if (filterSelect === 'Active') {
      return !todo.completed;
    }

    if (filterSelect === 'Completed') {
      return todo.completed;
    }

    return true;
  });

  async function postTodos(title: string) {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Title should not be empty');
      inputRef.current?.focus();

      return;
    }

    setIsDisabledInput(true);

    const tempTodo: Todo = {
      id: 0,
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    };

    setTodos(prev => [...prev, tempTodo]);

    try {
      const newTodo = await addTodos(tempTodo);

      setTodos(prev => prev.map(todo => (todo.id === 0 ? newTodo : todo)));
      setSearchTerm('');
    } catch {
      setError('Unable to add a todo');
      setTodos(prev => prev.filter(todo => todo.id !== 0));
    } finally {
      setIsDisabledInput(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  async function removeTodos(todoId: number) {
    try {
      await deleteTodo(todoId);
      setTodos(prev => cleanTodos(prev.filter(todo => todo.id !== todoId)));
      inputRef.current?.focus();
    } catch {
      setError('Unable to delete a todo');
    }
  }

  async function changeTodo(todoId: number, title: string, completed: boolean) {
    try {
      await patchTodos({ id: todoId, title, completed, userId: USER_ID });
      setTodos(prev =>
        prev.map(todo =>
          todo.id === todoId ? { ...todo, title, completed } : todo,
        ),
      );
    } catch {
      setError('Unable to update a todo');
    }
  }

  function changeComplite() {
    const isAllCompleted = todos.every(todo => todo.completed);
    const todosToUpdate = todos.filter(
      todo => todo.completed === isAllCompleted,
    );

    if (todosToUpdate.length === 0) {
      return;
    }

    const updatedTodos = todos.map(todo =>
      todosToUpdate.some(t => t.id === todo.id)
        ? { ...todo, completed: !isAllCompleted }
        : todo,
    );

    setTodos(updatedTodos);

    Promise.all(
      todosToUpdate.map(todo =>
        patchTodos({
          id: todo.id,
          title: todo.title,
          completed: !isAllCompleted,
          userId: todo.userId,
        }),
      ),
    ).catch(() => setError('Unable to update todos'));
  }

  function filter(type: Filter) {
    setFilterSelected(type);
  }

  function clearCompleted() {
    const completedTodos = todos.filter(todo => todo.completed);

    Promise.allSettled(completedTodos.map(todo => deleteTodo(todo.id)))
      .then(results => {
        const failedTodos = completedTodos.filter(
          (_, index) => results[index].status === 'rejected',
        );

        setTodos(prev =>
          cleanTodos(prev).filter(
            todo => !todo.completed || failedTodos.some(f => f.id === todo.id),
          ),
        );
        inputRef.current?.focus();
        if (failedTodos.length > 0) {
          setError('Unable to delete a todo');
        }
      })
      .catch(() => setError('Unexpected error'));
  }

  function clearError() {
    setError('');
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <FormTodo
          postTodos={postTodos}
          onToggleAll={changeComplite}
          todos={todos}
          isDisabledInput={isDisabledInput}
          inputRef={inputRef}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {cleanTodos(todos).length > 0 && (
          <>
            <TodoList
              todos={filteredTodos}
              deleteTodo={removeTodos}
              changeTodo={changeTodo}
              toggleAll={changeComplite}
              showError={setError}
            />
            <FooterTodos
              todos={todos}
              filter={filter}
              clearCompleted={clearCompleted}
              selected={filterSelect}
            />
          </>
        )}
      </div>
      <ErrorTodos error={error} clearError={clearError} />
    </div>
  );
};
