import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [activeTab, setActiveTab] = useState('database');
  const [sidebarConfig, setSidebarConfig] = useState({
    useRF: true,
    useXGB: true,
    useLR: true,
    useGradientBoosting: true,
    predictionHours: 24,
    confidenceLevel: 0.95,
    enableOptimization: true,
    autoOptimize: true,
    costG: 380.0,
    costUp: 500.0,
    costDn: 300.0
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://power-market-api.vercel.app';

  // 下载CSV文件函数
  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('没有数据可下载');
      return;
    }

    // 转换数据为CSV格式
    const headers = ['时间', '预测价格(元/MWh)', '置信区间下限', '置信区间上限'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        new Date(item.time).toLocaleString('zh-CN'),
        item.predicted_price,
        item.confidence_lower,
        item.confidence_upper
      ].join(','))
    ].join('\n');

    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchDatabaseStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/database/status`);
      setDatabaseStatus(response.data);
    } catch (error) {
      console.error('Database status error:', error);
      alert('❌ 获取数据库状态失败：' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据库状态
  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  const handlePredict = async () => {
    if (!databaseStatus || !databaseStatus.database) {
      alert('请先检查数据库状态');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/predict`, {
        config: {
          prediction_hours: sidebarConfig.predictionHours,
          models: [
            ...(sidebarConfig.useRF ? ['random_forest'] : []),
            ...(sidebarConfig.useXGB ? ['xgboost'] : []),
            ...(sidebarConfig.useLR ? ['linear_regression'] : []),
            ...(sidebarConfig.useGradientBoosting ? ['gradient_boosting'] : [])
          ],
          confidence_level: sidebarConfig.confidenceLevel,
          auto_optimize: sidebarConfig.autoOptimize
        }
      });

      setPredictions(response.data);
      alert('✅ 预测分析完成！');
    } catch (error) {
      console.error('Prediction error:', error);
      alert('❌ 预测失败：' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
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
            { key: 'useGradientBoosting', label: '梯度提升' }
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

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '15px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={sidebarConfig.autoOptimize}
              onChange={(e) => setSidebarConfig(prev => ({
                ...prev,
                autoOptimize: e.target.checked
              }))}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '14px' }}>🤖 自动超参数优化</span>
          </label>
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
            { key: 'database', label: '🗄️ 数据库状态', icon: '🗄️' },
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
          {/* 数据库状态标签页 */}
          {activeTab === 'database' && (
            <div>
              <h2 style={{ color: '#1f77b4', marginBottom: '20px', fontSize: '24px' }}>🗄️ 数据库状态</h2>
              
              <div style={{ 
                border: '2px solid #1f77b4',
                borderRadius: '10px',
                padding: '30px',
                textAlign: 'center',
                marginBottom: '20px',
                background: '#f8fbff'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗄️</div>
                <h3 style={{ color: '#1f77b4', marginBottom: '15px' }}>电力市场历史数据库</h3>
                <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
                  系统已内置完整的电力市场历史数据，包含15分钟频率的实时出清电价、系统负荷、新能源出力等数据
                </p>
                
                <button
                  onClick={fetchDatabaseStatus}
                  disabled={loading}
                  style={{
                    background: '#1f77b4',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? '🔄 检查中...' : '🔍 检查数据库状态'}
                </button>
              </div>
              
              {databaseStatus && (
                <div style={{ 
                  background: '#f0f2f6', 
                  padding: '20px', 
                  borderRadius: '8px',
                  marginTop: '20px'
                }}>
                  <h3 style={{ color: '#1f77b4', margin: '0 0 15px 0' }}>📊 数据库信息</h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f77b4' }}>
                        {databaseStatus.database.totalRecords.toLocaleString()}
                      </div>
                      <div style={{ color: '#666' }}>总数据点</div>
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f77b4' }}>
                        {databaseStatus.database.dataFrequency}
                      </div>
                      <div style={{ color: '#666' }}>数据频率</div>
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f77b4' }}>
                        {databaseStatus.database.recentStats.avgPrice}
                      </div>
                      <div style={{ color: '#666' }}>近期平均电价 (元/MWh)</div>
                    </div>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                        ✅
                      </div>
                      <div style={{ color: '#666' }}>数据状态</div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <strong>数据时间范围:</strong> 
                    <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
                      从 {new Date(databaseStatus.database.timeRange.start).toLocaleString('zh-CN')} 
                      到 {new Date(databaseStatus.database.timeRange.end).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <strong>数据列:</strong> {databaseStatus.database.columns.join(', ')}
                  </div>
                  
                  <div style={{ 
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    padding: '15px',
                    borderRadius: '6px',
                    marginTop: '15px'
                  }}>
                    <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      ✅ 数据库连接正常，数据完整，可以进行预测分析
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 预测分析标签页 */}
          {activeTab === 'predict' && (
            <div>
              <h2 style={{ color: '#1f77b4', marginBottom: '20px', fontSize: '24px' }}>📊 预测分析</h2>
              
              {!databaseStatus && (
                <div style={{ 
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                  <p style={{ fontSize: '18px' }}>请先在'数据库状态'标签页检查数据库连接</p>
                </div>
              )}
              
              {databaseStatus && (
                <div>
                  <button
                    onClick={handlePredict}
                    disabled={loading || !databaseStatus.database}
                    style={{
                      background: (!loading && databaseStatus.database) ? '#1f77b4' : '#d9d9d9',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '8px',
                      fontSize: '18px',
                      cursor: (!loading && databaseStatus.database) ? 'pointer' : 'not-allowed',
                      marginBottom: '30px',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? '🔄 分析中...' : '🚀 开始预测分析'}
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
                      
                      {/* 自动分析结果 */}
                      {predictions.analysis && (
                        <div style={{ 
                          background: 'white',
                          borderRadius: '8px',
                          padding: '20px',
                          marginBottom: '20px',
                          border: '1px solid #e9ecef'
                        }}>
                          <h4 style={{ marginBottom: '15px', color: '#1f77b4' }}>🤖 智能分析报告</h4>
                          
                          {/* 价格趋势 */}
                          <div style={{ marginBottom: '15px' }}>
                            <strong>📈 价格趋势：</strong>
                            <span style={{ 
                              color: predictions.analysis.price_trend.direction === '上升' ? '#52c41a' : '#fa8c16',
                              marginLeft: '8px'
                            }}>
                              {predictions.analysis.price_trend.direction} 
                              ({predictions.analysis.price_trend.change_percentage > 0 ? '+' : ''}
                              {predictions.analysis.price_trend.change_percentage}%)
                            </span>
                          </div>
                          
                          {/* 波动性 */}
                          <div style={{ marginBottom: '15px' }}>
                            <strong>📊 市场波动：</strong>
                            <span style={{ 
                              color: predictions.analysis.volatility.level === '低' ? '#52c41a' : 
                                     predictions.analysis.volatility.level === '中' ? '#fa8c16' : '#ff4d4f',
                              marginLeft: '8px'
                            }}>
                              {predictions.analysis.volatility.level}波动 ({predictions.analysis.volatility.value}元/MWh)
                            </span>
                          </div>
                          
                          {/* 投标建议 */}
                          {predictions.analysis.bidding_recommendations.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                              <strong>💡 投标建议：</strong>
                              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                {predictions.analysis.bidding_recommendations.map((rec, index) => (
                                  <li key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* 风险评估 */}
                          <div style={{ marginBottom: '15px' }}>
                            <strong>⚠️ 风险评估：</strong>
                            <span style={{ 
                              color: predictions.analysis.risk_assessment.level === '低' ? '#52c41a' : 
                                     predictions.analysis.risk_assessment.level === '中' ? '#fa8c16' : '#ff4d4f',
                              marginLeft: '8px'
                            }}>
                              {predictions.analysis.risk_assessment.level}风险 
                              (置信度: {Math.round(predictions.analysis.risk_assessment.confidence_score * 100)}%)
                            </span>
                          </div>
                          
                          {/* 模型质量 */}
                          <div>
                            <strong>🎯 模型质量：</strong>
                            <span style={{ marginLeft: '8px' }}>
                              综合评分 {predictions.analysis.model_quality.overall_score}/100
                              (MAE: {predictions.analysis.model_quality.mae_performance}, 
                               R²: {predictions.analysis.model_quality.r2_performance})
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* 超参数优化结果 */}
                      {predictions.optimization_results && (
                        <div style={{ 
                          background: 'white',
                          borderRadius: '8px',
                          padding: '20px',
                          marginBottom: '20px',
                          border: '1px solid #e9ecef'
                        }}>
                          <h4 style={{ marginBottom: '15px', color: '#1f77b4' }}>🔧 自动优化结果</h4>
                          {Object.entries(predictions.optimization_results).map(([modelName, result]) => (
                            <div key={modelName} style={{ marginBottom: '10px' }}>
                              <strong>{modelName}:</strong>
                              <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                                最佳评分 {Math.round(result.best_score * 1000) / 1000}
                                (优化迭代: {result.optimization_history.length}次)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
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
