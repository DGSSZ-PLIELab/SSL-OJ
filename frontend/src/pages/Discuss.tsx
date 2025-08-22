import React from 'react';

const Discuss: React.FC = () => {
  return (
    <div className="discuss-page">
      <div className="page-header">
        <h1 className="page-title">Discuss</h1>
        <p className="page-subtitle">Community discussions and forums</p>
      </div>

      <div className="discuss-container">
        <div className="coming-soon">
          <h2>Coming Soon</h2>
          <p>Discussion forum is under development.</p>
        </div>
      </div>

      <style jsx>{`
        .discuss-page {
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

        .discuss-container {
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

export default Discuss;