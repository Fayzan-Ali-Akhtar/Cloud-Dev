import React, { useState } from 'react'
import TodoItem from './TodoItem'

function TodoList({ user }) {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')

  const handleAddTodo = () => {
    if (newTodo.trim() === '') return
    const todo = {
      id: Date.now(),
      text: newTodo,
      owner: user.username,  // Using the authenticated user's username
      completed: false
    }
    setTodos([...todos, todo])
    setNewTodo('')
  }

  const handleDeleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Your To-Dos</h2>
      <div className="flex mb-4">
        <input
          type="text"
          className="flex-grow p-2 border border-gray-300 rounded-l"
          placeholder="Enter a new to-do"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <button 
          onClick={handleAddTodo} 
          className="bg-green-500 text-white px-4 rounded-r">
          Add
        </button>
      </div>
      <ul>
        {todos.map(todo => (
          <TodoItem key={todo.id} todo={todo} onDelete={handleDeleteTodo} />
        ))}
      </ul>
    </div>
  )
}

export default TodoList
