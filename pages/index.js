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
    prediction_date: '2025-07-01',
    prediction_hours: 96,
    models: ['random_forest', 'xgboost', 'gradient_boosting', 'linear_regression'],
    confidence_level: 0.95
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

  // API调用函数
  const fetchDatabaseStatus = async () => {
    console.log('🔍 [按钮1] 开始获取数据库状态...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ [按钮1] 数据库状态获取成功:', data);
      setDatabaseStatus(data);
    } catch (error) {
      console.error('❌ [按钮1] 获取数据库状态失败:', error);
      setError(`获取数据库状态失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    console.log('📈 [按钮2] 开始获取历史数据...');
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        timeRange: historicalConfig.timeRange,
        includePredictions: historicalConfig.includePredictions.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/api/historical-prices?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ [按钮2] 历史数据获取成功:', data);
      setHistoricalData(data);
    } catch (error) {
      console.error('❌ [按钮2] 获取历史数据失败:', error);
      setError(`获取历史数据失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async () => {
    console.log('🚀 [按钮3] 开始预测分析...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: predictionConfig })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ [按钮3] 预测分析完成:', data);
      setPredictionResults(data);
    } catch (error) {
      console.error('❌ [按钮3] 预测分析失败:', error);
      setError(`预测分析失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async () => {
    console.log('🎯 [按钮4] 开始投标优化...');
    
    if (!predictionResults?.predictions) {
      console.log('⚠️ [按钮4] 没有预测数据，无法进行优化');
      setError('请先运行预测分析');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictions: predictionResults.predictions,
          config: optimizationConfig
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ [按钮4] 投标优化完成:', data);
      setOptimizationResults(data);
    } catch (error) {
      console.error('❌ [按钮4] 投标优化失败:', error);
      setError(`投标优化失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试按钮函数
  const testButton = (buttonNumber) => {
    console.log(`🔘 [测试] 按钮${buttonNumber}被点击`);
    setError(`按钮${buttonNumber}点击测试成功 - ${new Date().toLocaleTimeString()}`);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Head>
        <title>电力市场预测系统 - 调试版</title>
        <meta name="description" content="基于2025年真实数据的电力市场预测与投标优化系统" />
      </Head>

      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
        ⚡ 电力市场预测系统 - 调试版
      </h1>

      {/* 标签页导航 */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ecf0f1' }}>
        {[
          { key: 'database', label: '🗄️ 数据库状态' },
          { key: 'historical', label: '📈 历史数据' },
          { key: 'prediction', label: '📊 预测分析' },
          { key: 'optimization', label: '🎯 投标优化' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              console.log(`🔘 [标签页] 切换到: ${tab.label}`);
              setActiveTab(tab.key);
            }}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: activeTab === tab.key ? '#3498db' : '#ecf0f1',
              color: activeTab === tab.key ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px 5px 0 0',
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
          <div>
            <button
              onClick={() => {
                console.log('🔘 [点击] 数据库状态按钮');
                fetchDatabaseStatus();
              }}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#95a5a6' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              {loading ? '⏳ 检查中...' : '🔍 检查2025年真实数据状态'}
            </button>
            
            <button
              onClick={() => testButton(1)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🧪 测试按钮1
            </button>
          </div>
        )}

        {activeTab === 'historical' && (
          <div>
            <button
              onClick={() => {
                console.log('🔘 [点击] 历史数据按钮');
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
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              {loading ? '⏳ 获取中...' : '📊 获取2025年真实历史数据'}
            </button>
            
            <button
              onClick={() => testButton(2)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🧪 测试按钮2
            </button>
          </div>
        )}

        {activeTab === 'prediction' && (
          <div>
            <button
              onClick={() => {
                console.log('🔘 [点击] 预测分析按钮');
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
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              {loading ? '⏳ 预测中...' : '🚀 开始基于真实数据预测'}
            </button>
            
            <button
              onClick={() => testButton(3)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🧪 测试按钮3
            </button>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div>
            <button
              onClick={() => {
                console.log('🔘 [点击] 投标优化按钮');
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
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              {loading ? '⏳ 优化中...' : !predictionResults?.predictions ? '⚠️ 需要先运行预测' : '🎯 开始基于真实数据优化'}
            </button>
            
            <button
              onClick={() => testButton(4)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🧪 测试按钮4
            </button>
          </div>
        )}
      </div>

      {/* 错误显示 */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>💬 消息:</strong> {error}
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

      {/* 调试信息显示 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>🔧 调试信息</h3>
        <p><strong>当前标签页:</strong> {activeTab}</p>
        <p><strong>加载状态:</strong> {loading ? '是' : '否'}</p>
        <p><strong>数据库状态:</strong> {databaseStatus ? '已获取' : '未获取'}</p>
        <p><strong>历史数据:</strong> {historicalData ? '已获取' : '未获取'}</p>
        <p><strong>预测结果:</strong> {predictionResults ? '已获取' : '未获取'}</p>
        <p><strong>优化结果:</strong> {optimizationResults ? '已获取' : '未获取'}</p>
        <p><strong>API地址:</strong> {API_BASE_URL}</p>
      </div>

      {/* 结果显示区域 */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        minHeight: '200px'
      }}>
        <h3>📊 结果显示</h3>
        
        {activeTab === 'database' && databaseStatus && (
          <div>
            <h4>数据库状态</h4>
            <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(databaseStatus, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'historical' && historicalData && (
          <div>
            <h4>历史数据</h4>
            <p>数据点数量: {historicalData.data?.length || 0}</p>
            <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(historicalData, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'prediction' && predictionResults && (
          <div>
            <h4>预测结果</h4>
            <p>预测点数量: {predictionResults.predictions?.length || 0}</p>
            <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(predictionResults, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'optimization' && optimizationResults && (
          <div>
            <h4>优化结果</h4>
            <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(optimizationResults, null, 2)}
            </pre>
          </div>
        )}
        
        {!loading && (
          activeTab === 'database' && !databaseStatus ||
          activeTab === 'historical' && !historicalData ||
          activeTab === 'prediction' && !predictionResults ||
          activeTab === 'optimization' && !optimizationResults
        ) && (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
            点击上方按钮开始操作...
          </p>
        )}
      </div>
    </div>
  );
}
