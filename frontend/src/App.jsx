import { SignedIn, SignedOut, SignInButton, SignOutButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react'
import { Navigate, Route, Routes } from "react-router-dom"
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ProblemPage from './pages/ProblemPage'
import ProbPage from './pages/ProbPage'
import SessionPage from './pages/SessionPage'
import { Toaster } from 'react-hot-toast'

function App() {
  const { isSignedIn, isLoaded } = useUser();

  // /this will get rid of flikering effect
  if (!isLoaded) return null;

  return (
    <>
      <Routes>
        <Route path='/' element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"}/>}/>
        <Route path='/dashboard' element={isSignedIn ? <DashboardPage /> : <Navigate to={"/"}/>}/>
        <Route path='/problems' element={ isSignedIn ? <ProblemPage /> : <Navigate to={"/"}/>}/>
        <Route path='/problem/:id' element={ isSignedIn ? <ProbPage /> : <Navigate to={"/"}/>}/>
        <Route path='/session/:sessionId' element={ isSignedIn ? <SessionPage /> : <Navigate to={"/"}/>}/>
      </Routes>

      <Toaster toastOptions={{duration: 3000}}/>
    </>
  )
}

export default App
