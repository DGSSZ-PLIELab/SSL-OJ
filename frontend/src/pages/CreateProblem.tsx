import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CreateProblemRequest, TestCase } from '../types';

const CreateProblem: React.FC = () => {
  const navigate = useNavigate();
  const { user, isTeacher, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<CreateProblemRequest>({
    title: '',
    description: '',
    difficulty: 'easy',
    timeLimit: 1000,
    memoryLimit: 256,
    tags: [],
    testCases: [{
      input: '',
      expectedOutput: '',
      isPublic: true
    }],
    examples: [{
      input: '',
      output: '',
      explanation: ''
    }]
  });
  
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!isTeacher && !isAdmin) {
      navigate('/');
    }
  }, [isTeacher, isAdmin, navigate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: any) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = {
      ...newTestCases[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      testCases: newTestCases
    }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        {
          input: '',
          expectedOutput: '',
          isPublic: false
        }
      ]
    }));
  };

  const removeTestCase = (index: number) => {
    if (formData.testCases.length > 1) {
      const newTestCases = formData.testCases.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        testCases: newTestCases
      }));
    }
  };

  const handleExampleChange = (index: number, field: string, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = {
      ...newExamples[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      examples: newExamples
    }));
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [
        ...prev.examples,
        {
          input: '',
          output: '',
          explanation: ''
        }
      ]
    }));
  };

  const removeExample = (index: number) => {
    if (formData.examples.length > 1) {
      const newExamples = formData.examples.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        examples: newExamples
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title.trim()) {
      setError('请输入题目标题');
      return;
    }
    if (!formData.description.trim()) {
      setError('请输入题目描述');
      return;
    }
    if (formData.testCases.length === 0) {
      setError('至少需要一个测试用例');
      return;
    }
    if (formData.testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) {
      setError('所有测试用例的输入和输出都不能为空');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.createProblem(formData);
      
      if (response.success) {
        setSuccess('题目创建成功！');
        setTimeout(() => {
          navigate('/problems');
        }, 2000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建题目失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isTeacher && !isAdmin) {
    return null;
  }

  return (
    <div className="create-problem-page">
      <div className="page-header">
        <h1>创建题目</h1>
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => navigate('/problems')}
        >
          返回题目列表
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-problem-form">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h3>基本信息</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">题目标题 *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="输入题目标题..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">难度 *</label>
                <select
                  className="form-input"
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">时间限制 (ms) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.timeLimit}
                  onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                  min="100"
                  max="10000"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">内存限制 (MB) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.memoryLimit}
                  onChange={(e) => handleInputChange('memoryLimit', parseInt(e.target.value))}
                  min="64"
                  max="1024"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">题目描述 *</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="输入题目描述..."
                rows={8}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">标签</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  className="form-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="输入标签后按回车添加..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddTag}
                >
                  添加
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="tags-list">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => removeTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="card">
          <div className="card-header">
            <h3>示例</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addExample}
            >
              添加示例
            </button>
          </div>
          <div className="card-body">
            {formData.examples.map((example, index) => (
              <div key={index} className="example-item">
                <div className="example-header">
                  <h4>示例 {index + 1}</h4>
                  {formData.examples.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeExample(index)}
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">输入</label>
                    <textarea
                      className="form-textarea"
                      value={example.input}
                      onChange={(e) => handleExampleChange(index, 'input', e.target.value)}
                      placeholder="输入示例..."
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">输出</label>
                    <textarea
                      className="form-textarea"
                      value={example.output}
                      onChange={(e) => handleExampleChange(index, 'output', e.target.value)}
                      placeholder="输出示例..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">解释</label>
                  <textarea
                    className="form-textarea"
                    value={example.explanation}
                    onChange={(e) => handleExampleChange(index, 'explanation', e.target.value)}
                    placeholder="解释说明..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Cases */}
        <div className="card">
          <div className="card-header">
            <h3>测试用例</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addTestCase}
            >
              添加测试用例
            </button>
          </div>
          <div className="card-body">
            {formData.testCases.map((testCase, index) => (
              <div key={index} className="test-case-item">
                <div className="test-case-header">
                  <h4>测试用例 {index + 1}</h4>
                  <div className="test-case-controls">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={testCase.isPublic}
                        onChange={(e) => handleTestCaseChange(index, 'isPublic', e.target.checked)}
                      />
                      公开测试用例
                    </label>
                    {formData.testCases.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeTestCase(index)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">输入 *</label>
                    <textarea
                      className="form-textarea"
                      value={testCase.input}
                      onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                      placeholder="测试用例输入..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">期望输出 *</label>
                    <textarea
                      className="form-textarea"
                      value={testCase.expectedOutput}
                      onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                      placeholder="期望输出..."
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '创建中...' : '创建题目'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/problems')}
          >
            取消
          </button>
        </div>
      </form>

      <style jsx="true">{`
        .create-problem-page {
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

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          border: 1px solid #f5c6cb;
        }

        .success-message {
          background-color: #d4edda;
          color: #155724;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          border: 1px solid #c3e6cb;
        }

        .create-problem-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .card-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .form-label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
          color: #333;
        }

        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .tag-input-container {
          display: flex;
          gap: 8px;
        }

        .tag-input-container .form-input {
          flex: 1;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #e9ecef;
          color: #495057;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .tag-remove {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tag-remove:hover {
          color: #dc3545;
        }

        .example-item,
        .test-case-item {
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .example-header,
        .test-case-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .example-header h4,
        .test-case-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .test-case-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 20px 0;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .card-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .example-header,
          .test-case-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .test-case-controls {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateProblem;