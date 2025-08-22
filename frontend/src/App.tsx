import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { Home } from './pages/Home'
import { ProblemList } from './pages/ProblemList'
import { ProblemDetail } from './pages/ProblemDetail'
import { Contest } from './pages/Contest'
import { ContestDetail } from './pages/ContestDetail'
import { ContestCreate } from './pages/ContestCreate'
import { Ranking } from './pages/Ranking'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { NotFound } from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/problems" element={<ProblemList />} />
            <Route path="/problem/:id" element={<ProblemDetail />} />
            <Route path="/contest" element={<Contest />} />
            <Route path="/contest/:contestId" element={<ContestDetail />} />
            <Route path="/contest/create" element={<ContestCreate />} />
            <Route path="/contests" element={<Contest />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App