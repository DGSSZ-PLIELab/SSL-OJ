import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Submission, Language } from '../types';
import { useAuth } from '../hooks/useAuth';

const Submissions: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    language: '',
    problemId: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [viewMode, setViewMode] = useState<'user' | 'all'>('user');

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
      fetchLanguages();
    }
  }, [filters, pagination.page, viewMode, isAuthenticated]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        language: filters.language || undefined,
        problemId: filters.problemId || undefined,
      };

      const response = viewMode === 'user' 
        ? await apiService.getUserSubmissions(params)
        : await apiService.getSubmissions(params);

      if (response.success) {
        setSubmissions(response.data.items);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.totalPages,
        }));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取提交记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const response = await apiService.getSupportedLanguages();
      if (response.success && response.data) {
        setLanguages(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewModeChange = (mode: 'user' | 'all') => {
    setViewMode(mode);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'badge-success';
      case 'Wrong Answer': return 'badge-danger';
      case 'Time Limit Exceeded': return 'badge-warning';
      case 'Memory Limit Exceeded': return 'badge-warning';
      case 'Runtime Error': return 'badge-danger';
      case 'Compile Error': return 'badge-danger';
      case 'Pending': return 'badge-info';
      case 'Running': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Accepted': return '通过';
      case 'Wrong Answer': return '答案错误';
      case 'Time Limit Exceeded': return '超时';
      case 'Memory Limit Exceeded': return '内存超限';
      case 'Runtime Error': return '运行错误';
      case 'Compile Error': return '编译错误';
      case 'Pending': return '等待中';
      case 'Running': return '运行中';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const getLanguageName = (langId: string) => {
    const lang = languages.find(l => l.id === langId);
    return lang ? lang.name : langId;
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center mt-4">
        <p>请先登录查看提交记录</p>
        <Link to="/login" className="btn btn-primary">
          登录
        </Link>
      </div>
    );
  }

  if (loading && submissions.length === 0) {
    return (
      <div className="text-center mt-4">
        <div>等会马上好，再怎么急也没那么快有新校区</div>
      </div>
    );
  }

  return (
    <div className="submissions-page">
      <div className="page-header">
        <h1>提交记录</h1>
        {isAdmin && (
          <div className="view-mode-selector">
            <button
              className={`btn ${viewMode === 'user' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleViewModeChange('user')}
            >
              我的提交
            </button>
            <button
              className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'} ml-2`}
              onClick={() => handleViewModeChange('all')}
            >
              全部提交
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="card">
          <div className="card-body">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">题目ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="输入题目ID..."
                  value={filters.problemId}
                  onChange={(e) => handleFilterChange('problemId', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">状态</label>
                <select
                  className="form-input"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">全部状态</option>
                  <option value="Accepted">通过</option>
                  <option value="Wrong Answer">答案错误</option>
                  <option value="Time Limit Exceeded">超时</option>
                  <option value="Memory Limit Exceeded">内存超限</option>
                  <option value="Runtime Error">运行错误</option>
                  <option value="Compile Error">编译错误</option>
                  <option value="Pending">等待中</option>
                  <option value="Running">运行中</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">语言</label>
                <select
                  className="form-input"
                  value={filters.language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                >
                  <option value="">全部语言</option>
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Submissions Table */}
      <div className="submissions-section">
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>提交ID</th>
                  <th>题目</th>
                  {viewMode === 'all' && <th>用户</th>}
                  <th>状态</th>
                  <th>语言</th>
                  <th>执行时间</th>
                  <th>内存使用</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(submission => (
                  <tr key={submission._id}>
                    <td>
                      <code className="submission-id">
                        {submission._id.slice(-8)}
                      </code>
                    </td>
                    <td>
                      <Link 
                        to={`/problems/${submission.problemId}`}
                        className="problem-link"
                      >
                        {submission.problemId.slice(-8)}
                      </Link>
                    </td>
                    {viewMode === 'all' && (
                      <td>
                        <span className="user-id">
                          {submission.userId.slice(-8)}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className={`badge ${getStatusColor(submission.status)}`}>
                        {getStatusText(submission.status)}
                      </span>
                    </td>
                    <td>
                      <span className="language">
                        {getLanguageName(submission.language)}
                      </span>
                    </td>
                    <td>
                      <span className="execution-time">
                        {submission.executionTime ? `${submission.executionTime}ms` : '-'}
                      </span>
                    </td>
                    <td>
                      <span className="memory-usage">
                        {submission.memoryUsage ? `${submission.memoryUsage}MB` : '-'}
                      </span>
                    </td>
                    <td>
                      <span className="submit-time">
                        {formatDate(submission.createdAt)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {/* TODO: View submission detail */}}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submissions.length === 0 && !loading && (
            <div className="empty-state">
              <p>暂无提交记录</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination-section">
          <div className="pagination">
            <button
              className="btn btn-secondary"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              上一页
            </button>
            
            <span className="pagination-info">
              第 {pagination.page} 页，共 {pagination.totalPages} 页
            </span>
            
            <button
              className="btn btn-secondary"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              下一页
            </button>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .submissions-page {
          padding: 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }

        .view-mode-selector {
          display: flex;
        }

        .filters-section {
          margin-bottom: 24px;
        }

        .card-body {
          padding: 20px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          font-weight: 500;
          margin-bottom: 4px;
          color: #333;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          border: 1px solid #f5c6cb;
        }

        .submissions-section {
          margin-bottom: 24px;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .submission-id {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          background: #f8f9fa;
          padding: 2px 4px;
          border-radius: 2px;
        }

        .problem-link {
          color: #007bff;
          text-decoration: none;
          font-weight: 500;
        }

        .problem-link:hover {
          text-decoration: underline;
        }

        .user-id {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #6c757d;
        }

        .language {
          font-size: 12px;
          color: #6c757d;
        }

        .execution-time,
        .memory-usage {
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .submit-time {
          font-size: 12px;
          color: #6c757d;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }

        .pagination-section {
          display: flex;
          justify-content: center;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .pagination-info {
          color: #6c757d;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .table {
            font-size: 12px;
          }

          .table th,
          .table td {
            padding: 8px 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default Submissions;