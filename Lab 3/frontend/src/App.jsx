// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { AWS_CONFIG } from './constants';

const App = () => {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(async (usr) => {
        setUser(usr);
        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();
        setAuthToken(token);
        localStorage.setItem("authToken", token);
        fetchTasks(token);
      })
      .catch(() => console.log("User not signed in"));
  }, []);

  const signIn = async () => {
    try {
      await Auth.federatedSignIn(); // Redirects to Cognito Hosted UI
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      localStorage.removeItem("authToken");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const fetchTasks = async (token) => {
    try {
      const data = await API.get('tasksApi', '/tasks', {
        headers: { Authorization: token },
      });
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks", error);
    }
  };

  const addTask = async () => {
    try {
      await API.post('tasksApi', '/tasks', {
        body: { description: newTask },
        headers: { Authorization: authToken },
      });
      setNewTask("");
      fetchTasks(authToken);
    } catch (error) {
      console.error("Error adding task", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await API.del('tasksApi', `/tasks/${id}`, {
        headers: { Authorization: authToken },
      });
      fetchTasks(authToken);
    } catch (error) {
      console.error("Error deleting task", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">To-Do Application</h1>
      {user ? (
        <>
          <p>Welcome, {user.username}</p>
          <button onClick={signOut} className="px-4 py-2 bg-red-500 text-white rounded">Sign Out</button>
          <div className="mt-4">
            <input 
              type="text" 
              value={newTask} 
              onChange={(e) => setNewTask(e.target.value)} 
              placeholder="New Task" 
              className="border p-2 rounded"
            />
            <button onClick={addTask} className="ml-2 px-4 py-2 bg-green-500 text-white rounded">Add Task</button>
          </div>
          <ul className="mt-4 list-disc ml-6">
            {tasks.map(task => (
              <li key={task.id} className="my-1">
                {task.description}
                <button onClick={() => deleteTask(task.id)} className="ml-2 text-red-600">Delete</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button onClick={signIn} className="px-4 py-2 bg-blue-500 text-white rounded">Sign In</button>
      )}
    </div>
  );
};

export default App;
