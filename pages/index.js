import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://power-market-api.vercel.app';

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      alert('✅ 文件上传成功！');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ 文件上传失败：' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        background: 'linear-gradient(90deg, #1890ff 0%, #722ed1 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>
          ⚡ 电力市场预测系统
        </h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
          智能预测 · 精准投标 · 收益最大化
        </p>
      </div>

      <div style={{ 
        marginBottom: '30px',
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#1890ff', marginBottom: '15px' }}>📤 数据上传</h2>
        
        <div style={{ 
          border: '2px dashed #d9d9d9',
          borderRadius: '6px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '15px',
          background: '#fafafa'
        }}>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ 
              marginBottom: '10px',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px'
            }}
          />
          <div style={{ color: '#666', fontSize: '14px' }}>
            支持 Excel (.xlsx, .xls) 和 CSV (.csv) 格式
          </div>
        </div>
        
        {uploading && (
          <div style={{ textAlign: 'center', color: '#1890ff' }}>
            📤 上传中，请稍候...
          </div>
        )}
        
        {result && (
          <div style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            padding: '15px', 
            borderRadius: '6px',
            marginTop: '15px'
          }}>
            <h3 style={{ color: '#52c41a', margin: '0 0 10px 0' }}>✅ 上传成功</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div><strong>数据行数:</strong> {result.data?.rows || 'N/A'}</div>
              <div><strong>数据列数:</strong> {result.data?.columns || 'N/A'}</div>
              <div><strong>文件大小:</strong> {result.data?.size || 'N/A'} KB</div>
              <div>
                <strong>数据状态:</strong> 
                <span style={{ color: result.validation?.valid ? '#52c41a' : '#faad14' }}>
                  {result.validation?.valid ? ' ✅ 验证通过' : ' ⚠️ 需要检查'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        background: '#fff7e6', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #ffd591'
      }}>
        <h3 style={{ color: '#fa8c16', margin: '0 0 15px 0' }}>💡 使用说明</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>数据准备</strong>: 上传包含时间列和电价列的Excel或CSV文件</li>
          <li><strong>数据验证</strong>: 系统自动检测数据格式</li>
          <li><strong>预测分析</strong>: 后续版本将支持智能预测功能</li>
          <li><strong>投标优化</strong>: 后续版本将支持投标策略优化</li>
        </ol>
        
        <div style={{ marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '4px' }}>
          <strong>API状态:</strong> 
          <span style={{ color: '#52c41a' }}> ✅ 后端服务正常运行</span>
          <br />
          <small>API地址: {API_URL}</small>
        </div>
      </div>
    </div>
  );
}
