import React, { useState, useEffect } from 'react'
import Auth from './components/Auth'
import TodoList from './components/TodoList'
// import { Auth as AmplifyAuth } from 'aws-amplify'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if a user is already authenticated on app load
    AmplifyAuth.currentAuthenticatedUser()
      .then(user => setUser(user))
      .catch(() => setUser(null))
  }, [])

  const handleSignOut = async () => {
    await AmplifyAuth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">To-Do App</h1>
        {user && (
          <button 
            onClick={handleSignOut} 
            className="bg-red-500 px-3 py-1 rounded">
            Sign Out
          </button>
        )}
      </header>
      <main className="p-4">
        {!user ? <Auth onSignIn={setUser} /> : <TodoList user={user} />}
      </main>
    </div>
  )
}

export default App
