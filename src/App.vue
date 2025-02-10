<script setup>
import processor from './components/processor.vue'
</script>

<template>
  <div class="container">
    <div class="logo" title="Processor Rocket">
      &#128640;
    </div>
    <processor />
   
  </div>
  Made with <span style="color: #e25555;">&hearts;</span> by Ralf
</template>

<style scoped>
.container {
  border: 1px solid rgba(189, 189, 189, .5);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0px 0px 15px 0px rgba(100, 100, 100, .2);
  margin-bottom: 2rem;
 

}


.logo {
  font-size: 400%;
  padding: 10px 20px 10px 20px;
  will-change: filter;
  transition: all 300ms;
  cursor:   default ; 
  text-shadow: 10px 10px 10px #646cffaa;
  vertical-align: text-top;
  line-height: 60px;
}

.logo:hover {
   
  text-shadow: 10px 20px 10px #646cffaa;
  filter: drop-shadow(0 0 2em #646cffaa);
}

 
</style>
