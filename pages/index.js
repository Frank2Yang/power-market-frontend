import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://power-market-api.vercel.app';

export default function PowerMarketDashboard() {
  // 状态管理
  const [activeTab, setActiveTab] = useState('database');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [predictionResults, setPredictionResults] = useState(null);
  const [optimizationResults, setOptimizationResults] = useState(null);

  // 调试信息
  useEffect(() => {
    console.log('🔧 [调试] 组件状态更新:', {
      activeTab,
      loading,
      hasError: !!error,
      hasDatabaseStatus: !!databaseStatus,
      hasHistoricalData: !!historicalData,
      hasPredictionResults: !!predictionResults,
      hasOptimizationResults: !!optimizationResults
    });
  }, [activeTab, loading, error, databaseStatus, historicalData, predictionResults, optimizationResults]);
  
  // 配置状态
  const [predictionConfig, setPredictionConfig] = useState({
    prediction_date: '2025-07-01', // 默认预测2025年7月1日（基于5-6月真实数据）
    prediction_hours: 96,
    models: ['random_forest', 'xgboost', 'gradient_boosting', 'linear_regression'],
    confidence_level: 0.95
  });
  
  // 数据范围状态
  const [dataRange, setDataRange] = useState({
    start: '2025-05-01',
    end: '2025-06-30',
    lastRealDataDate: '2025-06-30' // 最后一个真实数据的日期 - 2025年数据
  });
  
  const [historicalConfig, setHistoricalConfig] = useState({
    timeRange: '1d',
    includePredictions: false
  });
  
  const [optimizationConfig, setOptimizationConfig] = useState({
    cost_params: {
      generationCost: 375,
      upwardCost: 530,
      downwardCost: 310
    }
  });

  // API调用函数 - 增强错误处理
  const fetchDatabaseStatus = async () => {
    console.log('🔍 开始获取2025年真实数据库状态...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 API地址:', `${API_BASE_URL}/api/database/status`);
      const response = await fetch(`${API_BASE_URL}/api/database/status`);
      
      console.log('📊 响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ 获取到2025年真实数据:', data);
      setDatabaseStatus(data);
      
      // 更新数据范围
      if (data.database?.timeRange) {
        const startDate = new Date(data.database.timeRange.start);
        const endDate = new Date(data.database.timeRange.end);
        
        console.log('📅 真实数据时间范围:', {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        });
        
        setDataRange({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          lastRealDataDate: endDate.toISOString().split('T')[0]
        });
        
        // 自动设置预测日期为2025年7月1日（基于2025年5-6月真实数据预测7月）
        const nextMonth = new Date(endDate);
        nextMonth.setMonth(6); // 7月 (0-based)
        nextMonth.setDate(1);  // 1日
        const nextMonthStr = nextMonth.toISOString().split('T')[0];
        
        console.log('🔮 设置预测日期:', nextMonthStr);
        
        setPredictionConfig(prev => ({
          ...prev,
          prediction_date: nextMonthStr
        }));
      }
    } catch (error) {
      console.error('❌ 获取数据库状态失败:', error);
      setError(`获取数据库状态失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    console.log('📈 [按钮点击] 开始获取2025年真实历史数据...');
    console.log('🔧 [调试] fetchHistoricalData 函数被调用');
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeRange: historicalConfig.timeRange,
        includePredictions: historicalConfig.includePredictions.toString()
      });

      const url = `${API_BASE_URL}/api/historical-prices?${params}`;
      console.log('📡 API地址:', url);

      const response = await fetch(url);
      console.log('📊 响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ 获取到2025年真实历史数据:', data);
      setHistoricalData(data);
    } catch (error) {
      console.error('❌ 获取历史数据失败:', error);
      setError(`获取历史数据失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async () => {
    console.log('🚀 [按钮点击] 开始基于2025年真实数据的预测分析...');
    console.log('🔧 [调试] runPrediction 函数被调用');
    console.log('🔧 预测配置:', predictionConfig);
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/predict`;
      console.log('📡 API地址:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: predictionConfig })
      });

      console.log('📊 响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ 基于真实数据预测完成:', data);
      setPredictionResults(data);
    } catch (error) {
      console.error('❌ 预测分析失败:', error);
      setError(`预测分析失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async () => {
    console.log('🎯 [按钮点击] runOptimization 函数被调用');

    if (!predictionResults?.predictions) {
      console.log('⚠️ 没有预测数据，无法进行优化');
      setError('请先运行预测分析');
      return;
    }

    console.log('🎯 开始基于真实数据的投标优化...');
    console.log('🔧 优化配置:', optimizationConfig);
    setLoading(true);
    setError(null);
    
    try {
      const url = `${API_BASE_URL}/api/optimize`;
      console.log('📡 API地址:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictions: predictionResults.predictions,
          config: optimizationConfig
        })
      });
      
      console.log('📊 响应状态:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ 基于真实数据优化完成:', data);
      setOptimizationResults(data);
    } catch (error) {
      console.error('❌ 投标优化失败:', error);
      setError(`投标优化失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时自动获取数据库状态
  useEffect(() => {
    if (activeTab === 'database' && !databaseStatus) {
      fetchDatabaseStatus();
    }
  }, [activeTab]);

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <>
      <Head>
        <title>⚡ 电力市场预测与投标优化系统 - 2025年真实数据版</title>
        <meta name="description" content="基于2025年真实电力市场数据的智能预测与投标优化平台" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ 
        fontFamily: 'Arial, sans-serif', 
        backgroundColor: '#f5f5f5', 
        minHeight: '100vh',
        display: 'flex'
      }}>
        {/* 侧边栏 */}
        <div style={{
          width: '300px',
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px',
          boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>⚡ 电力市场预测系统</h2>
          <p style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '20px' }}>
            2025年真实数据驱动 · 精准预测 · 可验证准确性
          </p>
          
          {/* 预测配置 */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#ecf0f1' }}>📊 预测配置</h3>
            
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>预测日期:</label>
            <input 
              type="date"
              value={predictionConfig.prediction_date}
              onChange={(e) => setPredictionConfig({...predictionConfig, prediction_date: e.target.value})}
              min="2025-01-01"
              max="2025-12-31"
              style={{ width: '100%', padding: '5px', marginBottom: '5px', fontSize: '12px' }}
            />
            <div style={{ fontSize: '10px', color: '#bdc3c7', margin: '0 0 10px 0' }}>
              <div>📊 真实数据: 2025年5-6月 (5856个真实数据点)</div>
              <div>🔮 预测目标: 基于2025年5-6月数据预测其他时期</div>
              {predictionConfig.prediction_date >= '2025-05-01' && predictionConfig.prediction_date <= '2025-06-30' ? (
                <div style={{ color: '#e74c3c' }}>⚠️ 选择日期有真实数据，可用于验证准确性</div>
              ) : (
                <div style={{ color: '#27ae60' }}>✅ 预测模式，基于2025年5-6月真实数据预测</div>
              )}
              <div style={{ color: '#3498db' }}>💡 推荐: 2025-07-01 (预测7月电价)</div>
            </div>

            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>预测数据点:</label>
            <select
              value={predictionConfig.prediction_hours}
              onChange={(e) => setPredictionConfig({...predictionConfig, prediction_hours: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '5px', marginBottom: '10px', fontSize: '12px' }}
            >
              <option value={96}>96 (完整一天)</option>
              <option value={48}>48 (半天)</option>
              <option value={24}>24 (6小时)</option>
            </select>

            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>置信度:</label>
            <select
              value={predictionConfig.confidence_level}
              onChange={(e) => setPredictionConfig({...predictionConfig, confidence_level: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '5px', marginBottom: '10px', fontSize: '12px' }}
            >
              <option value={0.90}>90%</option>
              <option value={0.95}>95%</option>
              <option value={0.99}>99%</option>
            </select>
          </div>

          {/* 历史数据配置 */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#ecf0f1' }}>📈 历史数据配置</h3>

            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>时间范围:</label>
            <select
              value={historicalConfig.timeRange}
              onChange={(e) => setHistoricalConfig({...historicalConfig, timeRange: e.target.value})}
              style={{ width: '100%', padding: '5px', marginBottom: '10px', fontSize: '12px' }}
            >
              <option value="1d">最近1天</option>
              <option value="7d">最近7天</option>
              <option value="30d">最近30天</option>
              <option value="all">全部真实数据</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={historicalConfig.includePredictions}
                onChange={(e) => setHistoricalConfig({...historicalConfig, includePredictions: e.target.checked})}
                style={{ marginRight: '5px' }}
              />
              📈 显示预测值对比
            </label>
          </div>

          {/* 投标优化配置 */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#ecf0f1' }}>🎯 投标优化配置</h3>

            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>发电成本 (元/MWh):</label>
            <input
              type="number"
              value={optimizationConfig.cost_params.generationCost}
              onChange={(e) => setOptimizationConfig({
                ...optimizationConfig,
                cost_params: {...optimizationConfig.cost_params, generationCost: parseFloat(e.target.value)}
              })}
              style={{ width: '100%', padding: '5px', marginBottom: '10px', fontSize: '12px' }}
            />

            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>上调成本 (元/MWh):</label>
            <input
              type="number"
              value={optimizationConfig.cost_params.upwardCost}
              onChange={(e) => setOptimizationConfig({
                ...optimizationConfig,
                cost_params: {...optimizationConfig.cost_params, upwardCost: parseFloat(e.target.value)}
              })}
              style={{ width: '100%', padding: '5px', marginBottom: '10px', fontSize: '12px' }}
            />

            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>下调成本 (元/MWh):</label>
            <input
              type="number"
              value={optimizationConfig.cost_params.downwardCost}
              onChange={(e) => setOptimizationConfig({
                ...optimizationConfig,
                cost_params: {...optimizationConfig.cost_params, downwardCost: parseFloat(e.target.value)}
              })}
              style={{ width: '100%', padding: '5px', marginBottom: '10px', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* 主内容区域 */}
        <div style={{ flex: 1, padding: '20px' }}>
          {/* 标题 */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>⚡ 电力市场预测与投标优化系统</h1>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
              2025年真实数据驱动 · 原项目算法一致 · 自适应权重计算 · 神经动力学优化
            </p>
          </div>

          {/* 标签页导航 */}
          <div style={{ marginBottom: '20px' }}>
            {[
              { key: 'database', label: '🔍 数据库状态' },
              { key: 'historical', label: '📈 历史电价' },
              { key: 'prediction', label: '📊 预测分析' },
              { key: 'optimization', label: '🎯 投标优化' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px',
                  marginRight: '10px',
                  backgroundColor: activeTab === tab.key ? '#3498db' : '#ecf0f1',
                  color: activeTab === tab.key ? 'white' : '#2c3e50',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 操作按钮区域 */}
          <div style={{ marginBottom: '20px' }}>
            {activeTab === 'database' && (
              <button
                onClick={fetchDatabaseStatus}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#95a5a6' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? '⏳ 检查中...' : '🔍 检查2025年真实数据状态'}
              </button>
            )}

            {activeTab === 'historical' && (
              <button
                onClick={() => {
                  console.log('🔘 [点击事件] 历史数据按钮被点击');
                  fetchHistoricalData();
                }}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#95a5a6' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? '⏳ 获取中...' : '📊 获取2025年真实历史数据'}
              </button>
            )}

            {activeTab === 'prediction' && (
              <button
                onClick={() => {
                  console.log('🔘 [点击事件] 预测分析按钮被点击');
                  runPrediction();
                }}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#95a5a6' : '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? '⏳ 预测中...' : '🚀 开始基于真实数据预测'}
              </button>
            )}

            {activeTab === 'optimization' && (
              <button
                onClick={() => {
                  console.log('🔘 [点击事件] 投标优化按钮被点击');
                  console.log('🔍 [调试] 预测结果状态:', !!predictionResults?.predictions);
                  runOptimization();
                }}
                disabled={loading || !predictionResults?.predictions}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#95a5a6' : !predictionResults?.predictions ? '#bdc3c7' : '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading || !predictionResults?.predictions ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? '⏳ 优化中...' : !predictionResults?.predictions ? '⚠️ 需要先运行预测' : '🎯 开始基于真实数据优化'}
              </button>
            )}
          </div>

          {/* 错误显示 */}
          {error && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <strong>❌ 错误:</strong> {error}
              <button
                onClick={() => setError(null)}
                style={{
                  float: 'right',
                  background: 'none',
                  border: 'none',
                  color: '#721c24',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* 加载指示器 */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '18px', color: '#3498db' }}>⏳ 处理中...</div>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '10px' }}>
                基于2025年真实数据处理，请查看浏览器控制台获取详细信息
              </div>
            </div>
          )}

          {/* 内容区域 */}
          {!loading && (
            <>
              {/* 数据库状态页面 */}
              {activeTab === 'database' && !databaseStatus && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '20px' }}>
                    点击"🔍 检查2025年真实数据状态"按钮开始
                  </div>
                </div>
              )}

              {activeTab === 'database' && databaseStatus && (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h2 style={{ marginTop: 0, color: '#2c3e50' }}>🔍 2025年真实数据库状态</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#27ae60' }}>📊 真实数据规模</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{databaseStatus.database?.realDataRecords || 0}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>个2025年真实数据点</p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#3498db' }}>⏰ 数据频率</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{databaseStatus.database?.dataFrequency || 'N/A'}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>更新间隔</p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fef9e7', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#f39c12' }}>🎯 验证能力</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {databaseStatus.validation?.can_validate_accuracy ? '✅ 支持' : '❌ 不支持'}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>预测准确性验证</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#2c3e50' }}>📅 2025年真实数据分布</h3>
                    {databaseStatus.database?.monthlyDistribution && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {Object.entries(databaseStatus.database.monthlyDistribution).map(([month, count]) => (
                          <div key={month} style={{
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '5px',
                            border: '1px solid #dee2e6'
                          }}>
                            <strong>{month}</strong>: {count} 个真实数据点
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ color: '#2c3e50' }}>🧠 算法信息</h3>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                      <p><strong>预测算法:</strong> 基于2025年真实数据的集成模型 (自适应权重)</p>
                      <p><strong>优化算法:</strong> 神经动力学优化 (基于真实数据训练)</p>
                      <p><strong>数据来源:</strong> {databaseStatus.database?.dataSource}</p>
                      <p><strong>算法版本:</strong> 与原项目完全一致，基于真实数据增强</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 历史数据页面 */}
              {activeTab === 'historical' && !historicalData && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '20px' }}>
                    点击"📊 获取2025年真实历史数据"按钮开始
                  </div>
                </div>
              )}

              {activeTab === 'historical' && historicalData && (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h2 style={{ marginTop: 0, color: '#2c3e50' }}>📈 2025年真实历史电价数据</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#27ae60' }}>📊 数据点数</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{historicalData.data?.length || 0}</p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#3498db' }}>💰 平均电价</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {historicalData.statistics?.average_price?.toFixed(2) || 'N/A'} 元/MWh
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fef9e7', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#f39c12' }}>📈 最高电价</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {historicalData.statistics?.max_price?.toFixed(2) || 'N/A'} 元/MWh
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fdeaea', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#e74c3c' }}>📉 最低电价</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {historicalData.statistics?.min_price?.toFixed(2) || 'N/A'} 元/MWh
                      </p>
                    </div>
                  </div>

                  {historicalData.data && historicalData.data.length > 0 && (
                    <div>
                      <h3 style={{ color: '#2c3e50' }}>📋 最新数据预览</h3>
                      <div style={{ overflowX: 'auto', maxHeight: '400px', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>时间</th>
                              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>电价 (元/MWh)</th>
                              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>负荷 (MW)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historicalData.data.slice(0, 10).map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #f1f3f4' }}>
                                <td style={{ padding: '8px' }}>{item.timestamp}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{item.price?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{item.load?.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => exportToCSV(historicalData.data, 'historical_data.csv')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          📥 导出CSV
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 预测分析页面 */}
              {activeTab === 'prediction' && !predictionResults && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '20px' }}>
                    点击"🚀 开始基于真实数据预测"按钮开始预测分析
                  </div>
                </div>
              )}

              {activeTab === 'prediction' && predictionResults && (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h2 style={{ marginTop: 0, color: '#2c3e50' }}>📊 基于2025年真实数据的预测结果</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#27ae60' }}>🎯 预测准确度</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                        {predictionResults.accuracy ? `${(predictionResults.accuracy * 100).toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#3498db' }}>📈 预测数据点</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {predictionResults.predictions?.length || 0} 个
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fef9e7', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#f39c12' }}>💰 预测均价</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {predictionResults.statistics?.average_price?.toFixed(2) || 'N/A'} 元/MWh
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fdeaea', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#e74c3c' }}>🔮 预测日期</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {predictionConfig.prediction_date}
                      </p>
                    </div>
                  </div>

                  {predictionResults.predictions && predictionResults.predictions.length > 0 && (
                    <div>
                      <h3 style={{ color: '#2c3e50' }}>📋 预测结果预览</h3>
                      <div style={{ overflowX: 'auto', maxHeight: '400px', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>时间</th>
                              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>预测电价 (元/MWh)</th>
                              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>置信区间</th>
                            </tr>
                          </thead>
                          <tbody>
                            {predictionResults.predictions.slice(0, 10).map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #f1f3f4' }}>
                                <td style={{ padding: '8px' }}>{item.timestamp}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{item.predicted_price?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  [{item.confidence_lower?.toFixed(2)}, {item.confidence_upper?.toFixed(2)}]
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => exportToCSV(predictionResults.predictions, 'prediction_results.csv')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          📥 导出预测结果
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 投标优化页面 */}
              {activeTab === 'optimization' && !optimizationResults && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '20px' }}>
                    {!predictionResults?.predictions ?
                      '请先运行预测分析，然后点击"🎯 开始基于真实数据优化"按钮' :
                      '点击"🎯 开始基于真实数据优化"按钮开始投标优化'
                    }
                  </div>
                </div>
              )}

              {activeTab === 'optimization' && optimizationResults && (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h2 style={{ marginTop: 0, color: '#2c3e50' }}>🎯 基于真实数据的投标优化结果</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#27ae60' }}>💰 预期收益</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                        {optimizationResults.expected_profit?.toFixed(0) || 'N/A'} 元
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#3498db' }}>⚡ 最优容量</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {optimizationResults.optimal_capacity?.toFixed(1) || 'N/A'} MW
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fef9e7', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#f39c12' }}>📊 投标策略</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {optimizationResults.strategy || 'N/A'}
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#fdeaea', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#e74c3c' }}>⚠️ 风险评估</h4>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {optimizationResults.risk_level || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {optimizationResults.bidding_schedule && optimizationResults.bidding_schedule.length > 0 && (
                    <div>
                      <h3 style={{ color: '#2c3e50' }}>📋 投标计划</h3>
                      <div style={{ overflowX: 'auto', maxHeight: '400px', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>时间段</th>
                              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>投标价格 (元/MWh)</th>
                              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>投标容量 (MW)</th>
                              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>预期收益 (元)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {optimizationResults.bidding_schedule.slice(0, 10).map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #f1f3f4' }}>
                                <td style={{ padding: '8px' }}>{item.time_period}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{item.bid_price?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{item.bid_capacity?.toFixed(1)}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{item.expected_profit?.toFixed(0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => exportToCSV(optimizationResults.bidding_schedule, 'bidding_schedule.csv')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          📥 导出投标计划
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
