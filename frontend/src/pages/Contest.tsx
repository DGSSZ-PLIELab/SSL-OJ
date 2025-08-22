import React from 'react';

const Contest: React.FC = () => {
  return (
    <div className="contest-page">
      <div className="page-header">
        <h1 className="page-title">Contest</h1>
        <p className="page-subtitle">Programming contests and competitions</p>
      </div>

      <div className="contest-container">
        <div className="coming-soon">
          <h2>Coming Soon</h2>
          <p>Contest feature is under development.</p>
        </div>
      </div>

      <style jsx>{`
        .contest-page {
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

        .contest-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 60px;
          text-align: center;
        }

        .coming-soon h2 {
          color: #333;
          margin-bottom: 16px;
        }

        .coming-soon p {
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default Contest;