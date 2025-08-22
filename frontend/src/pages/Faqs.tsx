import React from 'react';

const Faqs: React.FC = () => {
  return (
    <div className="faqs-page">
      <div className="page-header">
        <h1 className="page-title">Frequently Asked Questions</h1>
        <p className="page-subtitle">Common questions and answers</p>
      </div>

      <div className="faqs-container">
        <div className="coming-soon">
          <h2>Coming Soon</h2>
          <p>FAQ section is under development.</p>
        </div>
      </div>

      <style jsx>{`
        .faqs-page {
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

        .faqs-container {
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

export default Faqs;