<template>
  <div class="stats-screen">
    <!-- ヘッダー -->
    <header class="header">
      <h1 class="title">📊 統計</h1>
    </header>

    <!-- メインコンテンツ -->
    <main class="main-content">
      <div class="coming-soon">
        <p class="coming-icon">🚧</p>
        <p class="coming-text">統計機能は準備中です</p>
        <p class="coming-description">
          ここでは費用の推移、走行距離の分析などが表示される予定です。
        </p>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'StatisticsScreen'
}
</script>

<style scoped>
.stats-screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 1px;
}

.main-content {
  flex: 1;
  padding: 24px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coming-soon {
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 60px 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.coming-icon {
  font-size: 64px;
  margin: 0 0 16px;
}

.coming-text {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.coming-description {
  margin: 0;
  font-size: 14px;
  color: #95a5a6;
  line-height: 1.6;
}
</style>
