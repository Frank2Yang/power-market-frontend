# 电力市场预测系统 - 前端应用

⚡ **智能电力市场预测与投标优化系统前端界面** ⚡

## 🌟 功能特色

- 📤 **文件上传**: 支持Excel和CSV文件拖拽上传
- 🔍 **数据验证**: 自动检测时间列和价格列
- 📊 **预测分析**: 多模型电价预测
- 🎯 **投标优化**: 智能投标策略计算
- 📥 **结果下载**: 一键下载分析结果

## 🚀 技术栈

- **框架**: Next.js 14
- **语言**: JavaScript/React
- **HTTP客户端**: Axios
- **部署**: Vercel

## 🔗 API集成

本前端应用连接到后端API：
- **API地址**: https://power-market-api.vercel.app
- **健康检查**: /api/health
- **文件上传**: /api/upload
- **预测分析**: /api/predict
- **投标优化**: /api/optimize

## 📱 界面预览

- 🎨 **现代化设计**: 清晰的用户界面
- 📊 **数据可视化**: 表格展示预测结果
- 🔄 **实时反馈**: 上传和处理进度提示
- 📱 **响应式布局**: 支持移动端访问

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 🌐 环境变量

- `NEXT_PUBLIC_API_URL`: 后端API地址

## 📄 许可证

MIT License
