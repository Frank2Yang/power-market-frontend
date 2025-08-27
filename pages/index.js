import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [sidebarConfig, setSidebarConfig] = useState({
    useRF: true,
    useXGB: true,
    useLR: false,
    useEnsemble: true,
    predictionHours: 24,
    confidenceLevel: 0.95,
    enableOptimization: true,
    costG: 400.0,
    costUp: 50.0,
    costDn: 30.0
  });

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
          prediction_hours: sidebarConfig.predictionHours,
          models: [
            ...(sidebarConfig.useRF ? ['rf'] : []),
            ...(sidebarConfig.useXGB ? ['xgb'] : []),
            ...(sidebarConfig.useLR ? ['lr'] : []),
            ...(sidebarConfig.useEnsemble ? ['ensemble'] : [])
          ]
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
            cost_g: sidebarConfig.costG,
            cost_up: sidebarConfig.costUp,
            cost_dn: sidebarConfig.costDn
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
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 侧边栏 */}
      <div style={{
        width: '300px',
        backgroundColor: '#f0f2f6',
        padding: '20px',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto'
      }}>
        <h2 style={{
          color: '#1f77b4',
          marginBottom: '20px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🔧 系统配置
        </h2>

        {/* 预测模型配置 */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            marginBottom: '15px',
            color: '#262730'
          }}>预测模型</h3>

          {[
            { key: 'useRF', label: '随机森林' },
            { key: 'useXGB', label: 'XGBoost' },
            { key: 'useLR', label: '线性回归' },
            { key: 'useEnsemble', label: '智能集成' }
          ].map(({ key, label }) => (
            <label key={key} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={sidebarConfig[key]}
                onChange={(e) => setSidebarConfig(prev => ({
                  ...prev,
                  [key]: e.target.checked
                }))}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px' }}>{label}</span>
            </label>
          ))}
        </div>

        {/* 预测参数 */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            marginBottom: '15px',
            color: '#262730'
          }}>预测参数</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px'
            }}>
              预测时长(小时): {sidebarConfig.predictionHours}
            </label>
            <input
              type="range"
              min="1"
              max="168"
              value={sidebarConfig.predictionHours}
              onChange={(e) => setSidebarConfig(prev => ({
                ...prev,
                predictionHours: parseInt(e.target.value)
              }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontSize: '14px'
            }}>
              置信度: {sidebarConfig.confidenceLevel}
            </label>
            <input
              type="range"
              min="0.8"
              max="0.99"
              step="0.01"
              value={sidebarConfig.confidenceLevel}
              onChange={(e) => setSidebarConfig(prev => ({
                ...prev,
                confidenceLevel: parseFloat(e.target.value)
              }))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* 投标优化 */}
        <div>
          <h3 style={{
            fontSize: '16px',
            marginBottom: '15px',
            color: '#262730'
          }}>投标优化</h3>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '15px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={sidebarConfig.enableOptimization}
              onChange={(e) => setSidebarConfig(prev => ({
                ...prev,
                enableOptimization: e.target.checked
              }))}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '14px' }}>启用投标优化</span>
          </label>

          {[
            { key: 'costG', label: '发电成本(元/MWh)' },
            { key: 'costUp', label: '上调成本(元/MWh)' },
            { key: 'costDn', label: '下调成本(元/MWh)' }
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px'
              }}>
                {label}
              </label>
              <input
                type="number"
                value={sidebarConfig[key]}
                onChange={(e) => setSidebarConfig(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value) || 0
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{
        flex: 1,
        padding: '20px',
        backgroundColor: '#ffffff'
      }}>
        {/* 标题 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#1f77b4',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            ⚡ 电力市场预测与投标优化系统
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: 0
          }}>
            智能预测 · 精准投标 · 收益最大化
          </p>
        </div>

        {/* 标签页导航 */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #f0f2f6',
          marginBottom: '20px'
        }}>
          {[
            { key: 'upload', label: '📤 数据上传', icon: '📤' },
            { key: 'predict', label: '📊 预测分析', icon: '📊' },
            { key: 'optimize', label: '🎯 投标优化', icon: '🎯' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: activeTab === key ? '#1f77b4' : 'transparent',
                color: activeTab === key ? 'white' : '#666',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                marginRight: '4px',
                fontWeight: activeTab === key ? 'bold' : 'normal'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minHeight: '500px'
        }}>
          {/* 数据上传标签页 */}
          {activeTab === 'upload' && (
            <div>
              <h2 style={{ color: '#1f77b4', marginBottom: '20px', fontSize: '24px' }}>📤 数据上传</h2>

              <div style={{
                border: '2px dashed #cccccc',
                borderRadius: '10px',
                padding: '40px',
                textAlign: 'center',
                marginBottom: '20px',
                background: '#fafafa'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📁</div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{
                    marginBottom: '15px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
                <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                  <p>选择电力市场数据文件</p>
                  <p>支持Excel和CSV格式，文件应包含时间列和电价列</p>
                </div>
              </div>

              {uploading && (
                <div style={{
                  textAlign: 'center',
                  color: '#1f77b4',
                  fontSize: '16px',
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                  正在上传和处理文件...
                </div>
              )}

              {result && (
                <div style={{
                  background: '#f0f2f6',
                  padding: '20px',
                  borderRadius: '8px',
                  marginTop: '20px'
                }}>
                  <h3 style={{ color: '#1f77b4', margin: '0 0 15px 0' }}>✅ 文件处理完成</h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f77b4' }}>
                        {result.data.rows}
                      </div>
                      <div style={{ color: '#666' }}>数据行数</div>
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f77b4' }}>
                        {result.data.columns}
                      </div>
                      <div style={{ color: '#666' }}>数据列数</div>
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f77b4' }}>
                        {result.data.size} KB
                      </div>
                      <div style={{ color: '#666' }}>文件大小</div>
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: result.validation.valid ? '#52c41a' : '#faad14'
                      }}>
                        {result.validation.valid ? '✅' : '⚠️'}
                      </div>
                      <div style={{ color: '#666' }}>数据验证</div>
                    </div>
                  </div>

                  {result.validation.timeColumns && (
                    <div style={{ marginBottom: '10px' }}>
                      <strong>检测到时间列:</strong> {result.validation.timeColumns.join(', ')}
                    </div>
                  )}
                  {result.validation.priceColumns && (
                    <div style={{ marginBottom: '10px' }}>
                      <strong>检测到价格列:</strong> {result.validation.priceColumns.join(', ')}
                    </div>
                  )}

                  {result.validation.valid && (
                    <div style={{
                      background: '#f6ffed',
                      border: '1px solid #b7eb8f',
                      padding: '15px',
                      borderRadius: '6px',
                      marginTop: '15px'
                    }}>
                      <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        ✅ 数据格式验证通过，可以进行预测分析
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 预测分析标签页 */}
          {activeTab === 'predict' && (
            <div>
              <h2 style={{ color: '#1f77b4', marginBottom: '20px', fontSize: '24px' }}>📊 预测分析</h2>

              {!result && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                  <p style={{ fontSize: '18px' }}>请先在'数据上传'标签页上传数据文件</p>
                </div>
              )}

              {result && (
                <div>
                  <button
                    onClick={handlePredict}
                    disabled={!result.validation.valid}
                    style={{
                      background: result.validation.valid ? '#1f77b4' : '#d9d9d9',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '8px',
                      fontSize: '18px',
                      cursor: result.validation.valid ? 'pointer' : 'not-allowed',
                      marginBottom: '30px',
                      fontWeight: 'bold'
                    }}
                  >
                    🚀 开始预测分析
                  </button>

                  {predictions && (
                    <div style={{
                      background: '#f0f2f6',
                      padding: '20px',
                      borderRadius: '8px'
                    }}>
                      <h3 style={{ color: '#1f77b4', margin: '0 0 20px 0', fontSize: '20px' }}>📈 预测结果</h3>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginBottom: '30px'
                      }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f77b4' }}>
                            {predictions.predictions.length}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>预测数据点</div>
                        </div>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f77b4' }}>
                            {(predictions.predictions.reduce((sum, p) => sum + p.predicted_price, 0) / predictions.predictions.length).toFixed(2)}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>平均预测价格</div>
                          <div style={{ color: '#999', fontSize: '12px' }}>元/MWh</div>
                        </div>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f77b4' }}>
                            {predictions.metrics.r2.toFixed(3)}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>R² 决定系数</div>
                        </div>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f77b4' }}>
                            {predictions.metrics.mae}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>MAE 平均绝对误差</div>
                        </div>
                      </div>

                      <h4 style={{ marginBottom: '15px' }}>📋 详细预测数据</h4>
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '20px'
                      }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#1f77b4', color: 'white' }}>
                                <th style={{ padding: '15px', textAlign: 'left' }}>时间</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>预测价格</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>置信区间下限</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>置信区间上限</th>
                              </tr>
                            </thead>
                            <tbody>
                              {predictions.predictions.slice(0, 10).map((pred, index) => (
                                <tr key={index} style={{
                                  background: index % 2 === 0 ? '#f8f9fa' : 'white',
                                  borderBottom: '1px solid #e9ecef'
                                }}>
                                  <td style={{ padding: '12px' }}>
                                    {new Date(pred.time).toLocaleString('zh-CN')}
                                  </td>
                                  <td style={{
                                    padding: '12px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    color: '#1f77b4'
                                  }}>
                                    {pred.predicted_price}
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'center' }}>
                                    {pred.confidence_lower}
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'center' }}>
                                    {pred.confidence_upper}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <button
                        onClick={() => downloadCSV(predictions.predictions, '电价预测结果.csv')}
                        style={{
                          background: '#52c41a',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '16px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        📥 下载预测结果
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 投标优化标签页 */}
          {activeTab === 'optimize' && (
            <div>
              <h2 style={{ color: '#1f77b4', marginBottom: '20px', fontSize: '24px' }}>🎯 投标优化</h2>

              {!predictions && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                  <p style={{ fontSize: '18px' }}>请先完成预测分析</p>
                </div>
              )}

              {predictions && (
                <div>
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    style={{
                      background: '#52c41a',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '8px',
                      fontSize: '18px',
                      cursor: 'pointer',
                      marginBottom: '30px',
                      fontWeight: 'bold'
                    }}
                  >
                    {optimizing ? '🔄 优化计算中...' : '🎯 开始投标优化'}
                  </button>

                  {optimization && (
                    <div style={{
                      background: '#f0f2f6',
                      padding: '20px',
                      borderRadius: '8px'
                    }}>
                      <h3 style={{ color: '#52c41a', margin: '0 0 20px 0', fontSize: '20px' }}>🏆 最优投标策略</h3>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginBottom: '30px'
                      }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                            {optimization.optimization.optimal_price}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>最优投标价格</div>
                          <div style={{ color: '#999', fontSize: '12px' }}>元/MWh</div>
                        </div>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                            {optimization.optimization.optimal_power}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>最优投标出力</div>
                          <div style={{ color: '#999', fontSize: '12px' }}>MW</div>
                        </div>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                            {optimization.optimization.expected_revenue}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>预期收益</div>
                          <div style={{ color: '#999', fontSize: '12px' }}>元</div>
                        </div>
                      </div>

                      <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                      }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#1f77b4' }}>💡 投标建议</h4>
                        <div style={{ lineHeight: '1.8' }}>
                          <div style={{ marginBottom: '10px' }}>
                            ✅ <strong>建议投标价格:</strong> {optimization.optimization.optimal_price} 元/MWh
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            ✅ <strong>建议投标出力:</strong> {optimization.optimization.optimal_power} MW
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            ✅ <strong>预期收益:</strong> {optimization.optimization.expected_revenue} 元
                          </div>
                          <div style={{ color: '#fa8c16', marginBottom: '10px' }}>
                            ⚠️ <strong>风险提示:</strong> 实际收益可能因市场变化而有所不同
                          </div>
                          <div style={{ color: '#1f77b4' }}>
                            💡 <strong>建议:</strong> 密切关注市场动态，适时调整策略
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
