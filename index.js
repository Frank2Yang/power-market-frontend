import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://power-market-api.vercel.app';

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);
    setResult(null);
    setPredictions(null);
    setOptimization(null);

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

  const handlePredict = async () => {
    if (!result) {
      alert('请先上传数据文件');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/predict`, {
        data: result.data,
        config: {
          prediction_hours: 24,
          models: ['rf', 'xgb', 'ensemble']
        }
      });

      setPredictions(response.data);
      alert('✅ 预测分析完成！');
    } catch (error) {
      console.error('Prediction error:', error);
      alert('❌ 预测失败：' + (error.response?.data?.error || error.message));
    }
  };

  const handleOptimize = async () => {
    if (!predictions) {
      alert('请先完成预测分析');
      return;
    }
    
    setOptimizing(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/optimize`, {
        predictions: predictions.predictions,
        config: {
          cost_params: {
            cost_g: 400,
            cost_up: 50,
            cost_dn: 30
          }
        }
      });
      
      setOptimization(response.data);
      alert('✅ 投标优化完成！');
    } catch (error) {
      console.error('Optimization error:', error);
      alert('❌ 优化失败：' + (error.response?.data?.error || error.message));
    } finally {
      setOptimizing(false);
    }
  };

  const downloadCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 标题 */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        background: 'linear-gradient(90deg, #1890ff 0%, #722ed1 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>
          ⚡ 电力市场预测与投标优化系统
        </h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
          智能预测 · 精准投标 · 收益最大化
        </p>
      </div>

      {/* 数据上传部分 */}
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
              <div><strong>数据行数:</strong> {result.data.rows}</div>
              <div><strong>数据列数:</strong> {result.data.columns}</div>
              <div><strong>文件大小:</strong> {result.data.size} KB</div>
              <div>
                <strong>数据状态:</strong> 
                <span style={{ color: result.validation.valid ? '#52c41a' : '#faad14' }}>
                  {result.validation.valid ? ' ✅ 验证通过' : ' ⚠️ 需要检查'}
                </span>
              </div>
            </div>
            {result.validation.timeColumns && (
              <div style={{ marginTop: '10px' }}>
                <strong>时间列:</strong> {result.validation.timeColumns.join(', ')}
              </div>
            )}
            {result.validation.priceColumns && (
              <div>
                <strong>价格列:</strong> {result.validation.priceColumns.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 预测分析部分 */}
      <div style={{ 
        marginBottom: '30px',
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#1890ff', marginBottom: '15px' }}>📊 预测分析</h2>
        
        <button
          onClick={handlePredict}
          disabled={!result || !result.validation.valid}
          style={{
            background: result && result.validation.valid ? '#1890ff' : '#d9d9d9',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: result && result.validation.valid ? 'pointer' : 'not-allowed',
            marginBottom: '20px'
          }}
        >
          🚀 开始预测分析
        </button>

        {predictions && (
          <div style={{ 
            background: '#f0f5ff', 
            border: '1px solid #adc6ff',
            padding: '20px', 
            borderRadius: '6px'
          }}>
            <h3 style={{ color: '#1890ff', margin: '0 0 15px 0' }}>📈 预测结果</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {predictions.predictions.length}
                </div>
                <div style={{ color: '#666' }}>预测数据点</div>
              </div>
              <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {(predictions.predictions.reduce((sum, p) => sum + p.predicted_price, 0) / predictions.predictions.length).toFixed(2)}
                </div>
                <div style={{ color: '#666' }}>平均预测价格 (元/MWh)</div>
              </div>
              <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {predictions.metrics.r2.toFixed(3)}
                </div>
                <div style={{ color: '#666' }}>R² 决定系数</div>
              </div>
              <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {predictions.metrics.mae}
                </div>
                <div style={{ color: '#666' }}>MAE 平均绝对误差</div>
              </div>
            </div>
            
            <h4>预测数据（前10个时间点）:</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: '#e6f7ff' }}>
                    <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>时间</th>
                    <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>预测价格</th>
                    <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>置信区间下限</th>
                    <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>置信区间上限</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.predictions.slice(0, 10).map((pred, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#fafafa' : 'white' }}>
                      <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                        {new Date(pred.time).toLocaleString('zh-CN')}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#1890ff' }}>
                        {pred.predicted_price}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                        {pred.confidence_lower}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                        {pred.confidence_upper}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              onClick={() => downloadCSV(predictions.predictions, '电价预测结果.csv')}
              style={{
                background: '#52c41a',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                marginTop: '15px',
                cursor: 'pointer'
              }}
            >
              📥 下载预测结果
            </button>
          </div>
        )}
      </div>

      {/* 投标优化部分 */}
      <div style={{ 
        marginBottom: '30px',
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#1890ff', marginBottom: '15px' }}>🎯 投标优化</h2>
        
        <button
          onClick={handleOptimize}
          disabled={!predictions || optimizing}
          style={{
            background: predictions ? '#52c41a' : '#d9d9d9',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: predictions ? 'pointer' : 'not-allowed',
            marginBottom: '20px'
          }}
        >
          {optimizing ? '🔄 优化计算中...' : '🎯 开始投标优化'}
        </button>

        {optimization && (
          <div style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            padding: '20px', 
            borderRadius: '6px'
          }}>
            <h3 style={{ color: '#52c41a', margin: '0 0 15px 0' }}>🏆 最优投标策略</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {optimization.optimization.optimal_price}
                </div>
                <div style={{ color: '#666' }}>最优投标价格 (元/MWh)</div>
              </div>
              <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {optimization.optimization.optimal_power}
                </div>
                <div style={{ color: '#666' }}>最优投标出力 (MW)</div>
              </div>
              <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {optimization.optimization.expected_revenue}
                </div>
                <div style={{ color: '#666' }}>预期收益 (元)</div>
              </div>
            </div>
            
            <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>💡 投标建议</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>建议投标价格: <strong>{optimization.optimization.optimal_price} 元/MWh</strong></li>
                <li>建议投标出力: <strong>{optimization.optimization.optimal_power} MW</strong></li>
                <li>预期收益: <strong>{optimization.optimization.expected_revenue} 元</strong></li>
                <li style={{ color: '#fa8c16' }}>⚠️ 风险提示: 实际收益可能因市场变化而有所不同</li>
                <li style={{ color: '#1890ff' }}>💡 建议: 密切关注市场动态，适时调整策略</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div style={{ 
        background: '#fff7e6', 
        border: '1px solid #ffd591',
        padding: '20px', 
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#fa8c16', margin: '0 0 15px 0' }}>💡 使用说明</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>数据准备</strong>: 上传包含时间列和电价列的Excel或CSV文件</li>
          <li><strong>数据验证</strong>: 系统自动检测数据格式，确保包含必要的时间和价格信息</li>
          <li><strong>预测分析</strong>: 使用多种机器学习模型进行电价预测</li>
          <li><strong>投标优化</strong>: 基于预测结果计算最优投标策略</li>
          <li><strong>结果下载</strong>: 可下载详细的预测结果和优化策略</li>
        </ol>
        
        <div style={{ marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '4px' }}>
          <strong>数据格式示例:</strong>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', marginTop: '5px' }}>
            时间, 实时出清电价, 系统负荷, 新能源出力<br/>
            2025-01-01 00:15, 450.5, 85000, 12000<br/>
            2025-01-01 00:30, 448.2, 84500, 12100
          </div>
        </div>
      </div>
    </div>
  );
}
