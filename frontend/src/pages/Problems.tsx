import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Problem } from '../types';
import { useAuth } from '../hooks/useAuth';

const Problems: React.FC = () => {
  const { isTeacher } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    search: '',
    tags: [] as string[],
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    fetchProblems();
    fetchTags();
  }, [filters, pagination.page]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProblems({
        page: pagination.page,
        limit: pagination.limit,
        difficulty: filters.difficulty || undefined,
        search: filters.search || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
      });

      if (response.success) {
        setProblems(response.data.items);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.totalPages,
        }));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取题目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await apiService.getProblemTags();
      if (response.success && response.data) {
        setAvailableTags(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'badge-success';
      case 'Medium': return 'badge-warning';
      case 'Hard': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '简单';
      case 'Medium': return '中等';
      case 'Hard': return '困难';
      default: return difficulty;
    }
  };

  const getAcceptanceRate = (problem: Problem) => {
    if (problem.submissionCount === 0) return 0;
    return Math.round((problem.acceptedCount / problem.submissionCount) * 100);
  };

  if (loading && problems.length === 0) {
    return (
      <div className="text-center mt-4">
        <div>等会马上好，再怎么急也没那么快有新校区</div>
      </div>
    );
  }

  return (
    <div className="problems-page">
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <h1>题目列表</h1>
          {isTeacher && (
            <Link to="/problems/create" className="btn btn-primary">
              创建题目
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="card">
          <div className="card-body">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">搜索</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="搜索题目标题..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">难度</label>
                <select
                  className="form-input"
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <option value="">全部难度</option>
                  <option value="Easy">简单</option>
                  <option value="Medium">中等</option>
                  <option value="Hard">困难</option>
                </select>
              </div>
            </div>

            {availableTags.length > 0 && (
              <div className="tags-filter">
                <label className="filter-label">标签</label>
                <div className="tags-list">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      className={`tag-button ${
                        filters.tags.includes(tag) ? 'tag-button-active' : ''
                      }`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Problems Table */}
      <div className="problems-section">
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>题目</th>
                  <th>难度</th>
                  <th>标签</th>
                  <th>通过率</th>
                  <th>提交数</th>
                </tr>
              </thead>
              <tbody>
                {problems.map(problem => (
                  <tr key={problem._id}>
                    <td>
                      <Link 
                        to={`/problems/${problem._id}`}
                        className="problem-title-link"
                      >
                        {problem.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${getDifficultyColor(problem.difficulty)}`}>
                        {getDifficultyText(problem.difficulty)}
                      </span>
                    </td>
                    <td>
                      <div className="problem-tags">
                        {problem.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="problem-tag">
                            {tag}
                          </span>
                        ))}
                        {problem.tags.length > 3 && (
                          <span className="problem-tag-more">
                            +{problem.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="acceptance-rate">
                        {getAcceptanceRate(problem)}%
                      </span>
                    </td>
                    <td>
                      <span className="submission-count">
                        {problem.submissionCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {problems.length === 0 && !loading && (
            <div className="empty-state">
              <p>暂无题目</p>
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

      <style jsx>{`
        .problems-page {
          padding: 0;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }

        .filters-section {
          margin-bottom: 24px;
        }

        .card-body {
          padding: 20px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
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

        .tags-filter {
          margin-top: 16px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .tag-button {
          padding: 4px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tag-button:hover {
          border-color: #007bff;
          color: #007bff;
        }

        .tag-button-active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          border: 1px solid #f5c6cb;
        }

        .problems-section {
          margin-bottom: 24px;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .problem-title-link {
          color: #007bff;
          text-decoration: none;
          font-weight: 500;
        }

        .problem-title-link:hover {
          text-decoration: underline;
        }

        .problem-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .problem-tag {
          background: #f8f9fa;
          color: #6c757d;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .problem-tag-more {
          color: #6c757d;
          font-size: 11px;
        }

        .acceptance-rate {
          font-weight: 500;
        }

        .submission-count {
          color: #6c757d;
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
          .filters-grid {
            grid-template-columns: 1fr;
          }

          .page-header .d-flex {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .table {
            font-size: 14px;
          }

          .problem-tags {
            max-width: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default Problems;