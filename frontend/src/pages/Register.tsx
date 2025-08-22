import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RegisterRequest } from '../types';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    studentId: '',
    role: 'student',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('请填写所有必填字段');
      return false;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return false;
    }

    if (formData.password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const registerData = { ...formData };
      if (!registerData.studentId) {
        delete registerData.studentId;
      }
      
      await register(registerData);
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <h1 className="register-title">注册</h1>
            <p className="register-subtitle">加入 SSL Online Judge</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                用户名 *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="请输入用户名"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                邮箱地址 *
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
              <label htmlFor="studentId" className="form-label">
                学号（可选）
              </label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className="form-input"
                placeholder="请输入学号"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                角色
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
              >
                <option value="student">学生</option>
                <option value="teacher">教师</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                密码 *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="请输入密码（至少6位）"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                确认密码 *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="请再次输入密码"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="register-footer">
            <p>
              已有账号？
              <Link to="/login" className="link">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-page {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .register-container {
          width: 100%;
          max-width: 450px;
        }

        .register-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .register-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .register-title {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }

        .register-subtitle {
          color: #6c757d;
          font-size: 16px;
        }

        .register-form {
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

        .register-footer {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .register-footer p {
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
          .register-card {
            padding: 24px;
          }

          .register-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;