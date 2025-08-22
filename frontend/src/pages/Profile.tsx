import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UserStats, Submission } from '../types';

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserData();
    }
  }, [isAuthenticated, user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user statistics
      const statsResponse = await apiService.getUserStats();
      if (statsResponse.success && statsResponse.data) {
        setUserStats(statsResponse.data);
      }

      // Fetch recent submissions
      const submissionsResponse = await apiService.getUserSubmissions({
        page: 1,
        limit: 10,
      });
      if (submissionsResponse.success) {
        setRecentSubmissions(submissionsResponse.data.items);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取用户数据失败');
    } finally {
      setLoading(false);
    }
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
    return date.toLocaleDateString('zh-CN');
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'teacher': return '教师';
      case 'student': return '学生';
      default: return role;
    }
  };

  const calculateAcceptanceRate = () => {
    if (!userStats || userStats.totalSubmissions === 0) return 0;
    return Math.round((userStats.acceptedSubmissions / userStats.totalSubmissions) * 100);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center mt-4">
        <p>请先登录查看个人资料</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center mt-4">
        <div>等会马上好，再怎么急也没那么快有新校区</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>个人资料</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="profile-content">
        {/* User Info Card */}
        <div className="card user-info-card">
          <div className="card-body">
            <div className="user-avatar">
              <div className="avatar-circle">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="user-details">
              <h2 className="username">{user?.username}</h2>
              <p className="email">{user?.email}</p>
              <span className={`role-badge badge ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'teacher' ? 'badge-warning' : 'badge-info'}`}>
                {getRoleText(user?.role || '')}
              </span>
              <p className="join-date">
                加入时间: {user?.createdAt ? formatDate(user.createdAt) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-icon solved">
                ✓
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{userStats?.solvedProblems || 0}</h3>
                <p className="stat-label">已解决题目</p>
              </div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-icon submissions">
                📝
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{userStats?.totalSubmissions || 0}</h3>
                <p className="stat-label">总提交数</p>
              </div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-icon accepted">
                ✅
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{userStats?.acceptedSubmissions || 0}</h3>
                <p className="stat-label">通过提交</p>
              </div>
            </div>
          </div>

          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-icon rate">
                📊
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{calculateAcceptanceRate()}%</h3>
                <p className="stat-label">通过率</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="card recent-submissions-card">
          <div className="card-header">
            <h3>最近提交</h3>
          </div>
          <div className="card-body">
            {recentSubmissions.length > 0 ? (
              <div className="submissions-list">
                {recentSubmissions.map(submission => (
                  <div key={submission._id} className="submission-item">
                    <div className="submission-info">
                      <span className="problem-id">
                        题目 {submission.problemId.slice(-8)}
                      </span>
                      <span className={`badge ${getStatusColor(submission.status)}`}>
                        {getStatusText(submission.status)}
                      </span>
                    </div>
                    <div className="submission-meta">
                      <span className="language">{submission.language}</span>
                      <span className="submit-time">
                        {formatDate(submission.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>暂无提交记录</p>
              </div>
            )}
          </div>
        </div>

        {/* Problem Difficulty Distribution */}
        {userStats && (
          <div className="card difficulty-card">
            <div className="card-header">
              <h3>题目难度分布</h3>
            </div>
            <div className="card-body">
              <div className="difficulty-stats">
                <div className="difficulty-item">
                  <div className="difficulty-label easy">
                    <span className="difficulty-dot"></span>
                    简单
                  </div>
                  <div className="difficulty-count">
                    {userStats.problemsByDifficulty?.easy || 0}
                  </div>
                </div>
                <div className="difficulty-item">
                  <div className="difficulty-label medium">
                    <span className="difficulty-dot"></span>
                    中等
                  </div>
                  <div className="difficulty-count">
                    {userStats.problemsByDifficulty?.medium || 0}
                  </div>
                </div>
                <div className="difficulty-item">
                  <div className="difficulty-label hard">
                    <span className="difficulty-dot"></span>
                    困难
                  </div>
                  <div className="difficulty-count">
                    {userStats.problemsByDifficulty?.hard || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .profile-page {
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

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          border: 1px solid #f5c6cb;
        }

        .profile-content {
          display: grid;
          gap: 24px;
        }

        .user-info-card .card-body {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 24px;
        }

        .user-avatar {
          flex-shrink: 0;
        }

        .avatar-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f8f9fa;
          border: 2px solid #007bff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #007bff;
          font-size: 32px;
          font-weight: bold;
        }

        .user-details {
          flex: 1;
        }

        .username {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: bold;
        }

        .email {
          margin: 0 0 8px 0;
          color: #6c757d;
          font-size: 16px;
        }

        .role-badge {
          margin-bottom: 8px;
        }

        .join-date {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-card .card-body {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .stat-icon.solved {
          background: #d4edda;
          color: #155724;
        }

        .stat-icon.submissions {
          background: #d1ecf1;
          color: #0c5460;
        }

        .stat-icon.accepted {
          background: #d4edda;
          color: #155724;
        }

        .stat-icon.rate {
          background: #fff3cd;
          color: #856404;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .submissions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .submission-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .submission-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .problem-id {
          font-weight: 500;
          color: #333;
        }

        .submission-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #6c757d;
        }

        .difficulty-stats {
          display: flex;
          gap: 24px;
        }

        .difficulty-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .difficulty-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .difficulty-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .difficulty-label.easy .difficulty-dot {
          background: #28a745;
        }

        .difficulty-label.medium .difficulty-dot {
          background: #ffc107;
        }

        .difficulty-label.hard .difficulty-dot {
          background: #dc3545;
        }

        .difficulty-count {
          font-weight: bold;
          color: #333;
        }

        .empty-state {
          text-align: center;
          padding: 20px;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .user-info-card .card-body {
            flex-direction: column;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stat-card .card-body {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }

          .submission-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .difficulty-stats {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;