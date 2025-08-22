import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <div className="layout">
      <header className="header">
        <nav className="navbar">
          <div className="container">
            <div className="navbar-left">
              <div className="navbar-brand">
                <Link to="/" className="brand-link">
                  SSL OJ
                </Link>
              </div>
              
              <div className="navbar-nav">
                <Link to="/" className={isActive('/')}>
                  Home
                </Link>
                <Link to="/problems" className={isActive('/problems')}>
                  Problem Sets
                </Link>
                <Link to="/contest" className={isActive('/contest')}>
                  Contest
                </Link>
                {isAuthenticated && (
                  <Link to="/submissions" className={isActive('/submissions')}>
                    Status
                  </Link>
                )}
                <Link to="/leaderboard" className={isActive('/leaderboard')}>
                  Rank
                </Link>
                <Link to="/faqs" className={isActive('/faqs')}>
                  Faqs
                </Link>
                <Link to="/discuss" className={isActive('/discuss')}>
                  Discuss
                </Link>
              </div>
            </div>

            <div className="navbar-user">
              {isAuthenticated ? (
                <div className="user-menu">
                  <span className="user-name">欢迎, {user?.username}</span>
                  <Link to="/profile" className="btn btn-secondary ml-2">
                    个人中心
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="btn btn-danger ml-2"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn btn-outline ml-2">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-outline ml-2">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2024 SSL Online Judge. All rights reserved.</p>
            <p>Powered by React & Node.js</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          background-color: #17a2b8;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar {
          padding: 12px 0;
        }

        .navbar .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .navbar-brand .brand-link {
          font-size: 24px;
          font-weight: bold;
          color: white;
          text-decoration: none;
        }

        .navbar-nav {
          display: flex;
          gap: 24px;
        }

        .nav-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 12px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-link.active {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .navbar-user {
          display: flex;
          align-items: center;
        }

        .user-menu {
          display: flex;
          align-items: center;
        }

        .user-name {
          color: white;
          font-weight: 500;
        }

        .auth-buttons {
          display: flex;
          align-items: center;
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 1px solid white;
        }

        .btn-outline:hover {
          background: white;
          color: #17a2b8;
        }

        .main-content {
          flex: 1;
          padding: 24px 0;
        }

        .footer {
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
          padding: 20px 0;
          margin-top: auto;
        }

        .footer-content {
          text-align: center;
          color: #6c757d;
        }

        .footer-content p {
          margin: 4px 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .navbar .container {
            flex-direction: column;
            gap: 16px;
          }

          .navbar-nav {
            gap: 16px;
          }

          .user-menu {
            flex-direction: column;
            gap: 8px;
          }

          .auth-buttons {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;