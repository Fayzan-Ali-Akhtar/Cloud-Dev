import React from 'react'

function TodoItem({ todo, onDelete }) {
  return (
    <li className="flex justify-between items-center border-b border-gray-200 py-2">
      <span>{todo.text}</span>
      <button 
        onClick={() => onDelete(todo.id)} 
        className="bg-red-500 text-white px-2 py-1 rounded">
        Delete
      </button>
    </li>
  )
}

export default TodoItem
