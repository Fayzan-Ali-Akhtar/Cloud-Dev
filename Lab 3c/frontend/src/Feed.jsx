import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  get_tasks_url,
  create_tasks_url,
  update_task_title_url,
  update_task_status_url,
  delete_task_url
} from './constants';
import LoadingSpinner from './components/LoadingSpinner';

const Feed = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [taskActionId, setTaskActionId] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchTasks();
    }
  }, [token, navigate]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(get_tasks_url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        alert('Session expired, please log in again.');
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to fetch tasks.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask) return;
    setActionLoading(true);
    try {
      const response = await axios.post(
        create_tasks_url,
        { text: newTask },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([response.data.task, ...tasks]);
      setNewTask('');
      setError('');
    } catch (err) {
      setError('Failed to create task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTask = (taskId, currentText) => {
    setEditingTaskId(taskId);
    setEditingTaskText(currentText);
  };

  const handleUpdateTask = async (taskId) => {
    setTaskActionId(taskId);
    setActionLoading(true);
    try {
      const response = await axios.put(
        `${update_task_title_url}/${taskId}`,
        { task: editingTaskText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(task => task.id === taskId ? response.data : task));
      setEditingTaskId(null);
      setEditingTaskText('');
      setError('');
    } catch (err) {
      setError('Failed to update task.');
    } finally {
      setActionLoading(false);
      setTaskActionId(null);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    setTaskActionId(taskId);
    setActionLoading(true);
    try {
      const updatedStatus = !currentStatus;
      await axios.put(
        `${update_task_status_url}/${taskId}`,
        { is_complete: updatedStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, is_complete: updatedStatus } : task
      ));
      setError('');
    } catch (err) {
      setError('Failed to update task status.');
    } finally {
      setActionLoading(false);
      setTaskActionId(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setTaskActionId(taskId);
    setActionLoading(true);
    try {
      await axios.delete(`${delete_task_url}/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.filter(task => task.id !== taskId));
      setError('');
    } catch (err) {
      setError('Failed to delete task.');
    } finally {
      setActionLoading(false);
      setTaskActionId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-feed-gradient">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-700">Task Manager for {userRole}</h2>
            <p className="text-gray-600 mt-1">Manage your daily tasks efficiently</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {userRole === 'SimpleUsers' && (
          <div className="mb-8 bg-white p-5 rounded-xl shadow-soft">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Add New Task</h3>
            <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none transition-all"
                disabled={actionLoading}
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                disabled={actionLoading || !newTask}
              >
                {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                {actionLoading ? "Adding..." : "Add Task"}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="xl" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-xl shadow-soft">
            <p className="text-lg text-gray-600">No tasks found. Add your first task!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className={`bg-white rounded-xl shadow-soft border-l-4 ${task.is_complete ? 'border-success-500' : 'border-warning-500'} transition-all animate-fade-in`}
              >
                <div className="p-5">
                  <div className="text-xs text-gray-500 mb-1">Task #{task.id}</div>
                  
                  {editingTaskId === task.id ? (
                    <div className="mb-3">
                      <input
                        type="text"
                        value={editingTaskText}
                        onChange={(e) => setEditingTaskText(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
                        disabled={actionLoading && taskActionId === task.id}
                      />
                    </div>
                  ) : (
                    <div className="mb-3">
                      <h3 className={`text-lg font-semibold ${task.is_complete ? 'text-gray-600 line-through' : 'text-gray-800'}`}>
                        {task.task}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm">
                        <span className="text-gray-600">Assigned to: <span className="font-medium">{task.user_id}</span></span>
                        <span className="mx-1 text-gray-400">•</span>
                        <span className={`font-medium ${task.is_complete ? 'text-success-600' : 'text-warning-600'}`}>
                          {task.is_complete ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {editingTaskId === task.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateTask(task.id)}
                          className="bg-primary hover:bg-primary-600 text-white px-3 py-1 rounded-md text-sm font-medium transition flex items-center disabled:opacity-70"
                          disabled={actionLoading && taskActionId === task.id}
                        >
                          {actionLoading && taskActionId === task.id ? <LoadingSpinner size="sm" className="mr-1.5" /> : null}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md text-sm font-medium transition"
                          disabled={actionLoading && taskActionId === task.id}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {userRole === 'Admins' && (
                          <>
                            <button
                              onClick={() => handleEditTask(task.id, task.task)}
                              className="bg-secondary hover:bg-secondary-600 text-secondary-foreground px-3 py-1 rounded-md text-sm font-medium transition"
                              disabled={actionLoading && taskActionId === task.id}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleComplete(task.id, task.is_complete)}
                              className={`${task.is_complete ? 'bg-warning-500 hover:bg-warning-600' : 'bg-success-500 hover:bg-success-600'} text-white px-3 py-1 rounded-md text-sm font-medium transition flex items-center disabled:opacity-70`}
                              disabled={actionLoading && taskActionId === task.id}
                            >
                              {actionLoading && taskActionId === task.id ? <LoadingSpinner size="sm" className="mr-1.5" /> : null}
                              {task.is_complete ? 'Mark Incomplete' : 'Mark Complete'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-destructive hover:bg-destructive/90 text-white px-3 py-1 rounded-md text-sm font-medium transition flex items-center disabled:opacity-70"
                          disabled={actionLoading && taskActionId === task.id}
                        >
                          {actionLoading && taskActionId === task.id ? <LoadingSpinner size="sm" className="mr-1.5" /> : null}
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;