import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginRequest } from '../types';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('请填写所有必填字段');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">登录</h1>
            <p className="login-subtitle">欢迎回到 SSL Online Judge</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                邮箱地址
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="请输入邮箱地址"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="请输入密码"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              还没有账号？
              <Link to="/register" className="link">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
        }

        .login-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-title {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }

        .login-subtitle {
          color: #6c757d;
          font-size: 16px;
        }

        .login-form {
          margin-bottom: 24px;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
          border: 1px solid #f5c6cb;
        }

        .btn-full {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          font-weight: 500;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .login-footer p {
          color: #6c757d;
          margin: 0;
        }

        .link {
          color: #007bff;
          text-decoration: none;
          font-weight: 500;
          margin-left: 4px;
        }

        .link:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 24px;
          }

          .login-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;