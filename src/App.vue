<script setup>
import { ref } from "vue";
const processing = ref(false);

import processor from './components/processor.vue'
import PWABadge from './components/PWABadge.vue'

const handleEvent = (message) => {
  processing.value = message;
};

</script>

<template>
  <div class="container">
    <div class="logo " :class="{ 'rotating-text': processing }" title="Processor Rocket">
      &#128640;
    </div>
    <processor @processing="handleEvent" />
  </div>
  <div>Made with <span style="color: #e25555;">&hearts;</span> by Ralf</div>
  <PWABadge />
</template>


<style scoped>
.container {
  border: 1px solid rgba(189, 189, 189, .5);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0px 0px 15px 0px rgba(100, 100, 100, .2);
  margin-bottom: 2rem;


}

.love {
  text-shadow: -1px 10px #fff, 0 1px #fff, 1px 0 #fff, 0 -1px #fff;
  position: sticky;
  bottom: 10px;
}

.logo {
  font-size: 400%;
  padding: 10px 20px 10px 20px;
  will-change: filter;
  transition: all 300ms;
  cursor: default;
  text-shadow: 10px 10px 10px #646cffaa;
  vertical-align: text-top;
  line-height: 60px;
}

.logo:hover {

  text-shadow: 10px 20px 10px #646cffaa;
  filter: drop-shadow(0 0 2em #646cffaa);
}


@keyframes bounce-7 {
  0% {
    transform: scale(1, 1) translateY(0);
  }

  10% {
    transform: scale(1.1, .9) translateY(0);
  }

  30% {
    transform: scale(.9, 1.1) translateY(-100px);
  }

  50% {
    transform: scale(1.05, .95) translateY(0);
  }

  57% {
    transform: scale(1, 1) translateY(-20px);
  }

  64% {
    transform: scale(1, 1) translateY(0);
  }

  100% {
    transform: scale(1, 1) translateY(0);
  }
}

.rotating-text {
  display: inline-block;
  animation-duration: 1.5s;
  animation-name: bounce-7;
  animation-timing-function: cubic-bezier(0.280, 0.840, 0.420, 1);

}
</style>
