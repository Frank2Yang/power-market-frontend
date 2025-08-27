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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#1890ff' }}>
        ⚡ 电力市场预测系统
      </h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>📤 数据上传</h2>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ marginBottom: '10px' }}
        />
        {uploading && <p>上传中...</p>}
        
        {result && (
          <div style={{ 
            background: '#f0f2f5', 
            padding: '15px', 
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            <h3>✅ 上传成功</h3>
            <p>数据行数: {result.data.rows}</p>
            <p>数据列数: {result.data.columns}</p>
            <p>文件大小: {result.data.size} KB</p>
          </div>
        )}
      </div>

      <div style={{ 
        background: '#fff7e6', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #ffd591'
      }}>
        <h3>💡 使用说明</h3>
        <ol>
          <li>上传包含时间列和电价列的Excel或CSV文件</li>
          <li>等待数据验证通过</li>
          <li>系统将自动进行预测分析</li>
        </ol>
      </div>
    </div>
  );
}
