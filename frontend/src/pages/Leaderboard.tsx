import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface LeaderboardUser {
  id: string;
  username: string;
  solvedCount: number;
  totalSubmissions: number;
  acceptanceRate: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // 模拟排行榜数据，实际应该从API获取
      const mockData: LeaderboardUser[] = [
        { id: '1', username: 'student1', solvedCount: 45, totalSubmissions: 120, acceptanceRate: 37.5, rank: 1 },
        { id: '2', username: 'student2', solvedCount: 38, totalSubmissions: 95, acceptanceRate: 40.0, rank: 2 },
        { id: '3', username: 'student3', solvedCount: 32, totalSubmissions: 88, acceptanceRate: 36.4, rank: 3 },
        { id: '4', username: 'student4', solvedCount: 28, totalSubmissions: 75, acceptanceRate: 37.3, rank: 4 },
        { id: '5', username: 'student5', solvedCount: 25, totalSubmissions: 68, acceptanceRate: 36.8, rank: 5 },
        { id: '6', username: 'student6', solvedCount: 22, totalSubmissions: 60, acceptanceRate: 36.7, rank: 6 },
        { id: '7', username: 'student7', solvedCount: 20, totalSubmissions: 55, acceptanceRate: 36.4, rank: 7 },
        { id: '8', username: 'student8', solvedCount: 18, totalSubmissions: 50, acceptanceRate: 36.0, rank: 8 },
        { id: '9', username: 'student9', solvedCount: 15, totalSubmissions: 45, acceptanceRate: 33.3, rank: 9 },
        { id: '10', username: 'student10', solvedCount: 12, totalSubmissions: 40, acceptanceRate: 30.0, rank: 10 },
      ];
      
      setTimeout(() => {
        setUsers(mockData);
        setLoading(false);
      }, 500);
    } catch (error) {
      setError('获取排行榜数据失败');
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>等会马上好，再怎么急也没那么快有新校区</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={fetchLeaderboard}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1 className="page-title">排行榜</h1>
        <p className="page-subtitle">根据解题数量和通过率排名</p>
      </div>

      <div className="leaderboard-container">
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="header-cell rank-cell">排名</div>
            <div className="header-cell user-cell">用户</div>
            <div className="header-cell solved-cell">解题数</div>
            <div className="header-cell submissions-cell">提交数</div>
            <div className="header-cell rate-cell">通过率</div>
          </div>
          
          <div className="table-body">
            {users.map((user) => (
              <div key={user.id} className={`table-row ${user.rank <= 3 ? 'top-rank' : ''}`}>
                <div className="table-cell rank-cell">
                  <span className="rank-badge">{getRankBadge(user.rank)}</span>
                </div>
                <div className="table-cell user-cell">
                  <span className="username">{user.username}</span>
                </div>
                <div className="table-cell solved-cell">
                  <span className="solved-count">{user.solvedCount}</span>
                </div>
                <div className="table-cell submissions-cell">
                  <span className="submissions-count">{user.totalSubmissions}</span>
                </div>
                <div className="table-cell rate-cell">
                  <span className="acceptance-rate">{user.acceptanceRate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .leaderboard-page {
          padding: 0;
        }

        .page-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 32px;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }

        .page-subtitle {
          color: #6c757d;
          font-size: 16px;
        }

        .loading-container,
        .error-container {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          color: #dc3545;
          margin-bottom: 16px;
        }

        .leaderboard-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .leaderboard-table {
          width: 100%;
        }

        .table-header {
          display: grid;
          grid-template-columns: 80px 1fr 100px 100px 100px;
          background: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }

        .header-cell {
          padding: 16px 12px;
          font-weight: 600;
          color: #495057;
          text-align: center;
        }

        .table-body {
          display: flex;
          flex-direction: column;
        }

        .table-row {
          display: grid;
          grid-template-columns: 80px 1fr 100px 100px 100px;
          border-bottom: 1px solid #dee2e6;
          transition: background-color 0.2s ease;
        }

        .table-row:hover {
          background-color: #f8f9fa;
        }

        .table-row.top-rank {
          background: linear-gradient(90deg, #fff8e1 0%, #ffffff 100%);
        }

        .table-row.top-rank:hover {
          background: linear-gradient(90deg, #fff3c4 0%, #f8f9fa 100%);
        }

        .table-cell {
          padding: 16px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rank-badge {
          font-size: 18px;
          font-weight: bold;
        }

        .username {
          font-weight: 500;
          color: #333;
        }

        .solved-count {
          font-weight: 600;
          color: #28a745;
        }

        .submissions-count {
          color: #6c757d;
        }

        .acceptance-rate {
          font-weight: 500;
          color: #007bff;
        }

        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 60px 1fr 80px 80px 80px;
          }

          .header-cell,
          .table-cell {
            padding: 12px 8px;
            font-size: 14px;
          }

          .page-title {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .table-header,
          .table-row {
            grid-template-columns: 50px 1fr 70px 70px;
          }

          .submissions-cell {
            display: none;
          }

          .header-cell,
          .table-cell {
            padding: 10px 6px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;