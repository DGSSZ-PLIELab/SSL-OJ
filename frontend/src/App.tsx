import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './hooks/useAuth';

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home'));
const Problems = lazy(() => import('./pages/Problems'));
const ProblemDetail = lazy(() => import('./pages/ProblemDetail'));
const Submissions = lazy(() => import('./pages/Submissions'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Contest = lazy(() => import('./pages/Contest'));
const Faqs = lazy(() => import('./pages/Faqs'));
const Discuss = lazy(() => import('./pages/Discuss'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const CreateProblem = lazy(() => import('./pages/CreateProblem'));

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Suspense fallback={
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>等会马上好，再怎么急也没那么快有新校区</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
            <Route path="/problems/create" element={<CreateProblem />} />
            <Route path="/submissions" element={<Submissions />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/contest" element={<Contest />} />
            <Route path="/faqs" element={<Faqs />} />
            <Route path="/discuss" element={<Discuss />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </Layout>
    </AuthProvider>
  );
}

export default App;