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

const Feed = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [error, setError] = useState('');
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
    try {
      const response = await axios.get(get_tasks_url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        alert('Session expired, please log in again.');
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to fetch tasks.');
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask) return;
    try {
      const response = await axios.post(
        create_tasks_url,
        { text: newTask },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([response.data.task, ...tasks]);
      setNewTask('');
    } catch {
      setError('Failed to create task.');
    }
  };

  const handleEditTask = (taskId, currentText) => {
    setEditingTaskId(taskId);
    setEditingTaskText(currentText);
  };

  const handleUpdateTask = async (taskId) => {
    try {
      const response = await axios.put(
        `${update_task_title_url}/${taskId}`,
        { task: editingTaskText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(task => task.id === taskId ? response.data : task));
      setEditingTaskId(null);
      setEditingTaskText('');
    } catch {
      setError('Failed to update task.');
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
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
    } catch {
      setError('Failed to update task status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${delete_task_url}/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch {
      setError('Failed to delete task.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-sky-100 to-lime-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-extrabold text-violet-600">Your Tasks</h2>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold shadow transition"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {userRole === 'SimpleUsers' && (
          <form onSubmit={handleCreateTask} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Enter new task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 px-4 py-2 border border-fuchsia-300 rounded focus:ring-2 focus:ring-fuchsia-300 outline-none"
            />
            <button
              type="submit"
              className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-4 py-2 rounded transition"
            >
              Add Task
            </button>
          </form>
        )}

        <ul className="space-y-6">
          {tasks.map(task => (
            <li key={task.id} className="bg-white shadow-md p-4 rounded-lg border-l-4 border-teal-400 animate-fade-in">
              <div className="text-sm text-gray-500">ID: {task.id}</div>
              <div className="font-bold text-lg mb-1">
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editingTaskText}
                    onChange={(e) => setEditingTaskText(e.target.value)}
                    className="w-full border border-sky-300 px-3 py-2 rounded focus:ring-2 focus:ring-sky-300"
                  />
                ) : (
                  task.task
                )}
              </div>
              <div className="text-sm text-gray-600">Assigned to: {task.user_id}</div>
              <div className="text-sm text-gray-600 mb-2">
                Status: <span className={task.is_complete ? "text-lime-600 font-semibold" : "text-orange-500 font-semibold"}>
                  {task.is_complete ? 'Completed' : 'Incomplete'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {editingTaskId === task.id ? (
                  <>
                    <button
                      onClick={() => handleUpdateTask(task.id)}
                      className="bg-sky-500 text-white px-3 py-1 rounded hover:bg-sky-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTaskId(null)}
                      className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
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
                          className="bg-fuchsia-500 text-white px-3 py-1 rounded hover:bg-fuchsia-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleComplete(task.id, task.is_complete)}
                          className="bg-lime-500 text-white px-3 py-1 rounded hover:bg-lime-600"
                        >
                          {task.is_complete ? 'Mark Incomplete' : 'Mark Complete'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Feed;
