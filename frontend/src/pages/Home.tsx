import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { ProblemStats, UserStats } from '../types';
import { measureApiCall } from '../utils/performance';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [problemStats, setProblemStats] = useState<ProblemStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 创建超时Promise
        const createTimeout = (ms: number) => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), ms)
        );

        try {
          const problemStatsResponse = await Promise.race([
            apiService.getProblemStats(),
            createTimeout(3000)
          ]);
          if (problemStatsResponse.success) {
            setProblemStats(problemStatsResponse.data!);
          } else {
            throw new Error('API response not successful');
          }
        } catch (error) {
          console.log('使用fallback数据 - 题目统计');
          // API调用失败时使用fallback数据
          setProblemStats({
            totalCount: 50,
            difficultyStats: { easy: 20, medium: 20, hard: 10 },
            popularTags: [
              { tag: '算法', count: 25 },
              { tag: '数据结构', count: 20 },
              { tag: '动态规划', count: 15 }
            ]
          });
        }

        if (isAuthenticated) {
          try {
            const userStatsResponse = await Promise.race([
              apiService.getUserStats(),
              createTimeout(3000)
            ]);
            if (userStatsResponse.success) {
              setUserStats(userStatsResponse.data!);
            } else {
              throw new Error('API response not successful');
            }
          } catch (error) {
            console.log('使用fallback数据 - 用户统计');
            // 用户统计fallback数据
            setUserStats({
              totalSubmissions: 0,
              acceptedSubmissions: 0,
              acceptanceRate: 0,
              solvedProblems: 0,
              rank: 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="text-center mt-4">
        <div>等会马上好，再怎么急也没那么快有新校区</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content"> 
          <h1 className="hero-title" style={{textAlign: 'left', display: 'flex', alignItems: 'center', gap: '15px'}}>
            <img src="https://pic1.imgdb.cn/item/6889728658cb8da5c8ee756e.jpg" alt="学校校徽" style={{width: '50px', height: '50px', objectFit: 'contain'}} />
            SSL Online Judge
          </h1>
          <p className="hero-subtitle" style={{textAlign: 'left'}}>
            Dongguan Middle School-SongshanLake School(Group)<br/>
            Dongguan No.13 High School Online Judege.
          </p>
          {!isAuthenticated ? (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                立即开始
              </Link>
              <Link to="/problems" className="btn btn-secondary btn-lg ml-2">
                浏览题目
              </Link>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/problems" className="btn btn-primary btn-lg">
                开始刷题
              </Link>
              <Link to="/submissions" className="btn btn-secondary btn-lg ml-2">
                查看提交
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {problemStats && (
            <>
              <div className="stat-card">
                <div className="stat-number">{problemStats.totalProblems}</div>
                <div className="stat-label">总题目数</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{problemStats.totalSubmissions}</div>
                <div className="stat-label">总提交数</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{problemStats.totalAccepted}</div>
                <div className="stat-label">通过提交</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {useMemo(() => 
                    problemStats.totalSubmissions > 0 
                      ? Math.round((problemStats.totalAccepted / problemStats.totalSubmissions) * 100)
                      : 0
                  , [problemStats.totalAccepted, problemStats.totalSubmissions])}%
                </div>
                <div className="stat-label">通过率</div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* User Stats Section */}
      {isAuthenticated && userStats && (
        <section className="user-stats-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">我的统计</h2>
            </div>
            <div className="user-stats-grid">
              <div className="user-stat-item">
                <div className="user-stat-number">{userStats.totalSubmissions}</div>
                <div className="user-stat-label">总提交数</div>
              </div>
              <div className="user-stat-item">
                <div className="user-stat-number">{userStats.acceptedSubmissions}</div>
                <div className="user-stat-label">通过提交</div>
              </div>
              <div className="user-stat-item">
                <div className="user-stat-number">{userStats.solvedProblems}</div>
                <div className="user-stat-label">解决题目</div>
              </div>
              <div className="user-stat-item">
                <div className="user-stat-number">{Math.round(userStats.acceptanceRate)}%</div>
                <div className="user-stat-label">通过率</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 友情链接部分 */}
      <section className="links-section">
        <div className="container">
          <h2 className="section-title">友情链接</h2>
          <div className="links-grid">
            <div className="link-item">
              <a href="http://office.sslgz.net:3333/login.html" target="_blank" rel="noopener noreferrer" className="link-card">
                <div className="link-title">松山湖学校学生信息管理平台</div>
                <div className="link-url">office.sslgz.net:3333</div>
              </a>
            </div>
            <div className="link-item">
              <a href="https://sslgz.net" target="_blank" rel="noopener noreferrer" className="link-card">
                <div className="link-title">东莞中学松山湖学校</div>
                <div className="link-url">sslgz.net</div>
              </a>
            </div>
            <div className="link-item">
              <a href="https://dgssz.dgjy.net" target="_blank" rel="noopener noreferrer" className="link-card">
                <div className="link-title">东莞市第十三高级中学</div>
                <div className="link-url">dgssz.dgjy.net</div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-page {
          padding: 0;
        }

        .hero {
          background: white;
          color: #333;
          padding: 80px 0;
          text-align: center;
          margin: -24px -20px 40px -20px;
          border-bottom: 1px solid #e9ecef;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero-title {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 16px;
        }

        .hero-subtitle {
          font-size: 20px;
          margin-bottom: 32px;
          opacity: 0.9;
        }

        .hero-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-lg {
          padding: 12px 24px;
          font-size: 16px;
        }

        .stats-section {
          margin-bottom: 40px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #6c757d;
          font-size: 14px;
        }

        .user-stats-section {
          margin-bottom: 40px;
        }

        .user-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
        }

        .user-stat-item {
          text-align: center;
          padding: 16px;
        }

        .user-stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #28a745;
          margin-bottom: 4px;
        }

        .user-stat-label {
          color: #6c757d;
          font-size: 14px;
        }

        .links-section {
          padding: 60px 0;
          background: #f8f9fa;
          margin: 40px -20px 0 -20px;
        }

        .section-title {
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 40px;
          color: #333;
        }

        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .link-item {
          display: flex;
        }

        .link-card {
          display: block;
          width: 100%;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }

        .link-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          text-decoration: none;
          color: inherit;
        }

        .link-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .link-url {
          font-size: 14px;
          color: #666;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .hero {
            padding: 60px 0;
          }

          .hero-title {
            font-size: 36px;
          }

          .hero-subtitle {
            font-size: 18px;
          }

          .hero-actions {
            flex-direction: column;
            align-items: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .links-section {
            padding: 40px 0;
          }

          .section-title {
            font-size: 24px;
            margin-bottom: 24px;
          }

          .links-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;