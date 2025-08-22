import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Problem, Language, CreateSubmissionRequest } from '../types';
import { useAuth } from '../hooks/useAuth';

const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isTeacher } = useAuth();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [submission, setSubmission] = useState({
    code: '',
    language: 'cpp',
  });

  useEffect(() => {
    if (id) {
      fetchProblem();
      fetchLanguages();
    }
  }, [id]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProblem(id!);
      if (response.success && response.data) {
        setProblem(response.data);
      } else {
        setError('题目不存在');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取题目详情失败');
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

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/problems/${id}` } } });
      return;
    }

    if (!submission.code.trim()) {
      setError('请输入代码');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const submitData: CreateSubmissionRequest = {
        problemId: id!,
        code: submission.code,
        language: submission.language,
      };

      const response = await apiService.createSubmission(submitData);
      if (response.success) {
        navigate('/submissions');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
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

  const getAcceptanceRate = () => {
    if (!problem || problem.submissionCount === 0) return 0;
    return Math.round((problem.acceptedCount / problem.submissionCount) * 100);
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <div>等会马上好，再怎么急也没那么快有新校区</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center mt-4">
        <div>题目不存在</div>
      </div>
    );
  }

  return (
    <div className="problem-detail-page">
      <div className="problem-header">
        <div className="d-flex justify-content-between align-items-start">
          <div className="problem-info">
            <h1 className="problem-title">{problem.title}</h1>
            <div className="problem-meta">
              <span className={`badge ${getDifficultyColor(problem.difficulty)}`}>
                {getDifficultyText(problem.difficulty)}
              </span>
              <span className="meta-item">
                通过率: {getAcceptanceRate()}%
              </span>
              <span className="meta-item">
                提交数: {problem.submissionCount}
              </span>
              <span className="meta-item">
                时间限制: {problem.timeLimit}ms
              </span>
              <span className="meta-item">
                内存限制: {problem.memoryLimit}MB
              </span>
            </div>
            <div className="problem-tags">
              {problem.tags.map(tag => (
                <span key={tag} className="problem-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {isTeacher && (
            <div className="problem-actions">
              <button className="btn btn-secondary">
                编辑题目
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="problem-content">
        <div className="problem-layout">
          <div className="problem-description">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">题目描述</h3>
              </div>
              <div className="card-body">
                <div className="description-content">
                  {problem.description.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {(problem.sampleInput || problem.sampleOutput) && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">样例</h3>
                </div>
                <div className="card-body">
                  {problem.sampleInput && (
                    <div className="sample-section">
                      <h4>输入</h4>
                      <pre className="sample-code">{problem.sampleInput}</pre>
                    </div>
                  )}
                  {problem.sampleOutput && (
                    <div className="sample-section">
                      <h4>输出</h4>
                      <pre className="sample-code">{problem.sampleOutput}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="code-editor">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">代码提交</h3>
                <div className="language-selector">
                  <select
                    value={submission.language}
                    onChange={(e) => setSubmission(prev => ({ ...prev, language: e.target.value }))}
                    className="form-input"
                  >
                    {languages.map(lang => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="card-body">
                {error && (
                  <div className="error-message mb-3">
                    {error}
                  </div>
                )}
                
                <textarea
                  className="code-textarea"
                  value={submission.code}
                  onChange={(e) => setSubmission(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="请输入你的代码..."
                  rows={20}
                />
                
                <div className="submit-actions">
                  {isAuthenticated ? (
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? '提交中...' : '提交代码'}
                    </button>
                  ) : (
                    <div className="login-prompt">
                      <p>请先登录后再提交代码</p>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate('/login', { state: { from: { pathname: `/problems/${id}` } } })}
                      >
                        登录
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .problem-detail-page {
          padding: 0;
        }

        .problem-header {
          margin-bottom: 24px;
        }

        .problem-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 12px;
          color: #333;
        }

        .problem-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 12px;
        }

        .meta-item {
          color: #6c757d;
          font-size: 14px;
        }

        .problem-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .problem-tag {
          background: #f8f9fa;
          color: #6c757d;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .problem-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .problem-description .card {
          margin-bottom: 20px;
        }

        .description-content p {
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .sample-section {
          margin-bottom: 16px;
        }

        .sample-section h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        .sample-code {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 12px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          white-space: pre-wrap;
          overflow-x: auto;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .language-selector {
          min-width: 120px;
        }

        .code-textarea {
          width: 100%;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          resize: vertical;
          min-height: 400px;
        }

        .code-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .submit-actions {
          margin-top: 16px;
          text-align: right;
        }

        .login-prompt {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .login-prompt p {
          margin-bottom: 12px;
          color: #6c757d;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }

        @media (max-width: 1024px) {
          .problem-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .problem-title {
            font-size: 24px;
          }

          .problem-meta {
            flex-direction: column;
            gap: 8px;
          }

          .card-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .language-selector {
            width: 100%;
          }

          .submit-actions {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ProblemDetail;