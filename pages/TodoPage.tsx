
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Task } from '../types';
import { TrashIcon, CheckCircleIcon, PlusIcon, CircleIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTutorial, TutorialStepConfig } from '../contexts/TutorialContext';
import EmptyState from '../components/EmptyState';
import { emptyTodoImage } from '../assets/images';

const todoTutorialSteps: TutorialStepConfig[] = [
    {
        selector: '#add-task-form',
        title: 'Your Mission Control',
        content: "This is your mission control for tasks. Add your assignments, track your progress, and feel the satisfaction of checking things off.",
        placement: 'bottom',
    },
    {
        selector: '#pending-tasks-list',
        title: 'Pending Tasks',
        content: "New tasks appear here. Click the circle to mark a task as complete and move it to the 'Completed' section.",
        placement: 'bottom',
    },
    {
        selector: '#completed-tasks-list',
        title: 'Track Your Wins',
        content: "Completed tasks are your wins! They move down here to show you how much you've accomplished. You can un-check them or delete them.",
        placement: 'top',
    },
    {
        selector: '#nav-link-reminders',
        title: 'Set Timely Reminders',
        content: "For important, time-sensitive tasks, you can use Reminders to get a notification. Let's head there next.",
        placement: 'right',
        desktopOnly: true,
        nextPath: '/app/reminders',
    },
];

const TodoPage: React.FC = () => {
  const { user } = useAuth();
  const { tutorialProgress, startTutorial } = useTutorial();
  const [tasks, setTasks] = useLocalStorage<Task[]>(`studysync-todos-${user!.id}`, []);
  const [newTaskText, setNewTaskText] = useState('');
  const [tasksToAnimateOut, setTasksToAnimateOut] = useState<string[]>([]);

  useEffect(() => {
    if (tutorialProgress.todo === 'unseen') {
        const timer = setTimeout(() => {
            startTutorial('todo', todoTutorialSteps);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [tutorialProgress, startTutorial]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === '') return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText,
      completed: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasksToAnimateOut(prev => [...prev, id]);
    setTimeout(() => {
        setTasks(prev => prev.filter(task => task.id !== id));
        setTasksToAnimateOut(prev => prev.filter(taskId => taskId !== id));
    }, 300); // match animation duration
  };
  
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-8">To-Do List</h1>
      
      <div className="glass-pane p-6 mb-8">
        <form id="add-task-form" onSubmit={handleAddTask} className="flex gap-3">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="What needs to be done?"
            className="form-input"
          />
          <button
            type="submit"
            className="btn btn-primary flex-shrink-0"
            disabled={!newTaskText.trim()}
          >
            <PlusIcon className="w-5 h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </form>
      </div>

      <div className="space-y-8">
        <div id="pending-tasks-list">
          <h2 className="text-2xl font-semibold text-text-primary border-b border-border-color pb-3 mb-4">Pending</h2>
          {pendingTasks.length > 0 ? (
            <ul className="space-y-3">
              {pendingTasks.map(task => (
                <li
                  key={task.id}
                  className={`flex items-center p-4 glass-pane !bg-transparent transition-all duration-300 group ${tasksToAnimateOut.includes(task.id) ? 'animate-fade-out' : 'animate-fade-in'}`}
                >
                  <button onClick={() => toggleTask(task.id)} className="mr-4 flex-shrink-0">
                    <CircleIcon className="w-6 h-6 text-text-tertiary group-hover:text-primary-accent transition-colors"/>
                  </button>
                  <span className="flex-grow text-text-primary">{task.text}</span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="ml-4 p-2 text-text-tertiary hover:text-white rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete task"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              image={emptyTodoImage}
              title="All Clear!"
              description="You have no pending tasks. Add a new one above to get started."
            />
          )}
        </div>
        
        <div id="completed-tasks-list">
          <h2 className="text-2xl font-semibold text-text-primary border-b border-border-color pb-3 mb-4">Completed</h2>
          {completedTasks.length > 0 ? (
            <ul className="space-y-3">
              {completedTasks.map(task => (
                <li
                  key={task.id}
                  className={`flex items-center p-4 glass-pane !bg-transparent !border-primary-accent/10 group ${tasksToAnimateOut.includes(task.id) ? 'animate-fade-out' : 'animate-fade-in'}`}
                >
                  <button onClick={() => toggleTask(task.id)} className="mr-4 flex-shrink-0">
                     <CheckCircleIcon className="w-6 h-6 text-primary-accent" />
                  </button>
                  <span className="flex-grow text-text-tertiary line-through">{task.text}</span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="ml-4 p-2 text-text-tertiary hover:text-white rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete task"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-text-secondary italic pl-1">No tasks completed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoPage;