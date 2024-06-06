<script setup>
import { ref, onMounted, computed } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { scrollListener, timerListener, Action } from '../lessonData';

/**
 * @template T
 * @typedef {Object} Ref
 * @property {T} value
 */

/** @type {Ref<HTMLElement>} */
const bubbleMessage = ref(null);

/** @type {Ref<HTMLElement>} */
const bubbleCharacter = ref(null);

function handleScrollCall() {
    scrollListener.handleScroll();
}

const isHeroVisible = ref(false);

function setHero(phrase, emotion) {
    isHeroVisible.value = phrase !== "";

    bubbleMessage.value.innerHTML = phrase;
    bubbleCharacter.value.innerHTML = `<img src="${emotion}" />`
}

function handleEvents() {
    // Определяем действие с событиями по скроллу
    scrollListener.callbackFunction = (/**@type Action */ action) => {
        const winHeight = window.innerHeight;

        const elem = document.getElementById(action.actionName);
        if (elem == null) {
            return false;
        }

        const { top } = elem.getBoundingClientRect();

        if (top < winHeight / 1.5) {
            setHero(action.phrase, action.emotion);
            return true;
        }

        return false;
    }

    // Запускаем таймеры, добавляем обработчики событий
    timerListener.callbackFunction = (/**@type Action */ action) => {
        setHero(action.phrase, action.emotion);
    };

    timerListener.setTimers();
    window.addEventListener("scroll", handleScrollCall);
    handleScrollCall(); // Вызываем сразу одну проверку, чтобы подключить приветственные фразы документа
}

// Запускаем обработчики событий
onMounted(() => {
    handleEvents();
});


// Перед навигацией на другой урок не забываем перезапустить все обработчики!
onBeforeRouteUpdate(() => {
    setHero("", "");

    timerListener.setTimers();
    handleScrollCall();
});

// Перед выходом с текущей страницы очищаем все события
onBeforeRouteLeave(() => {
    timerListener.resetTimers();
    window.removeEventListener('scroll', handleScrollCall);
    scrollListener.cleanScrollActions();
});

</script>

<template>
    <div v-show="isHeroVisible" class="bubble-wrapper">
        <div class="bubble">
            <span ref="bubbleMessage" class="bubble-message"></span>
            <span class="bubble-triangle"></span>
            <div ref="bubbleCharacter" class="bubble-character"></div>
        </div>
    </div>
</template>

<style>
.bubble-wrapper {
    position: fixed;
    bottom: 0px;
    right: 15px;

    display: flex;
    flex-direction: column;
    align-items: flex-end;
    max-width: 30%;

    pointer-events: none;
}

.bubble {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    min-width: 100px;
    width: fit-content;
}

.bubble .bubble-message {
    display: block;

    background-color: #fff;
    font-size: 1em;
    color: #333;

    padding: 10px;
    width: fit-content;
    min-width: 50px;
    max-width: 100%;

    position: relative;
    margin: 20px;
    text-align: center;
    font-family: 'Press Start 2P', cursive;
    line-height: 1.3em;
    box-shadow: 0 -4px #fff, 0 -8px #000, 4px 0 #fff, 4px -4px #000, 8px 0 #000, 0 4px #fff, 0 8px #000, -4px 0 #fff, -4px 4px #000, -8px 0 #000, -4px -4px #000, 4px 4px #000;
    box-sizing: border-box;

    z-index: 999;
}

.bubble .bubble-message::after {
    content: '';
    display: block;
    position: absolute;
    box-sizing: border-box;

    height: 4px;
    width: 4px;
    bottom: -8px;
    right: 32px;
    box-shadow: 0 4px #000, 0 8px #000, 0 12px #000, 0 16px #000, -4px 12px #000, -8px 8px #000, -12px 4px #000, -4px 4px #fff, -8px 4px #fff, -4px 8px #fff, -4px 0 #fff, -8px 0 #fff, -12px 0 #fff;
}


.bubble .bubble-character {
    width: 150px;
    height: 150px;
    align-self: flex-end;

    display: flex;
    align-items: center;
    justify-content: center;
}

.bubble .bubble-character img {
    max-width: 100%;
    max-height: 100%;
}
</style>