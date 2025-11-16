<script setup lang="ts">
import InvoiceForm from './components/InvoiceForm.vue'
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>請求書作成システム</h1>
      <p>請求書を作成してPDFで出力できます</p>
    </header>
    <main>
      <InvoiceForm />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.app-header p {
  margin: 10px 0 0;
  font-size: 16px;
  opacity: 0.9;
}

main {
  padding: 20px;
}
</style>
