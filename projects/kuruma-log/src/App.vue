<template>
  <div id="app" class="app">
    <component :is="currentPage" />
  </div>
</template>

<script>
import Home from './views/Home.vue'

export default {
  components: {
    Home
  },
  data() {
    return {
      currentPage: 'Home'
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #FFFFFF;
  color: #333333;
}

.app {
  max-width: 480px;
  margin: 0 auto;
  background: #FFFFFF;
  min-height: 100vh;
}
</style>
