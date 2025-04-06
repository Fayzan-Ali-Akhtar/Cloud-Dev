import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Retrieve token and role from localStorage
  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole'); // 'SimpleUsers' or 'Admins'

  useEffect(() => {
    if (!token) {
      // If no token exists, redirect to login
      navigate('/login');
    } else {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        // Token expired or invalid
        alert('Session expired, please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
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
        'http://localhost:3000/tasks',
        { text: newTask },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Prepend the new task to the tasks list
      setTasks([response.data.task, ...tasks]);
      setNewTask('');
    } catch (err) {
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
        `http://localhost:3000/tasks/${taskId}`,
        { task: editingTaskText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update the task in the state
      setTasks(tasks.map(task => task.id === taskId ? response.data : task));
      setEditingTaskId(null);
      setEditingTaskText('');
    } catch (err) {
      setError('Failed to update task.');
    }
  };

  return (
    <div>
      <h2>Task Feed</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* If role is SimpleUsers, show the create task form */}
      {userRole === 'SimpleUsers' && (
        <form onSubmit={handleCreateTask}>
          <input
            type="text"
            placeholder="Enter new task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button type="submit">Add Task</button>
        </form>
      )}
      
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            {editingTaskId === task.id ? (
              <>
                <input
                  type="text"
                  value={editingTaskText}
                  onChange={(e) => setEditingTaskText(e.target.value)}
                />
                <button onClick={() => handleUpdateTask(task.id)}>Save</button>
                <button onClick={() => setEditingTaskId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span>{task.task}</span> <small>(Created at: {new Date(task.created_at).toLocaleString()})</small>
                {/* If role is Admin, provide edit option */}
                {userRole === 'Admins' && (
                  <button onClick={() => handleEditTask(task.id, task.task)}>Edit</button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Feed;
