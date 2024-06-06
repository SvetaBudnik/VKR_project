<script setup>
import { ref } from 'vue';
import { getNextPhrase, dialogPhrases } from './dialog'

async function onBtnClick() {
    await getNextPhrase();
}
</script>

<template>
    <div class="wrapper">
        <div class="dialog-item" v-for="phrase in dialogPhrases">
            <div class="hero">
                <img :src="phrase.emotionFilePath" :alt="phrase.hero">
            </div>
            <div class="cloud">
                <p>{{ phrase.text }}</p>
            </div>
        </div>

        <button @click="onBtnClick">Тык</button>
    </div>
</template>

<style scoped>
.dialog-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-around;
}

.dialog-item:nth-child(even) {
    flex-direction: row-reverse;
}

.hero {
    background-color: lightblue;

    width: 328.37px;
    height: 300px;
    margin-top: 50px;
    margin-bottom: 20px;
    margin-right: 50px;
    margin-left: 50px;

    box-sizing: border-box;

    border-radius: 40px;
    overflow: hidden;
}

.hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;

    max-width: 900px;
    margin: auto;
}

.wrapper button {
    font-size: 1.2em;
    padding: 15px;
    border-radius: 10px;
}

.wrapper button:hover {
    cursor: pointer;
}

.cloud {
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid #030303;
    border-radius: 10px;
    max-height: 10em;
    width: 500px;
    padding: 20px;
    position: relative;
    background-color: rgb(217, 229, 235);
}

.cloud p {
    text-align: center;
    margin: 0;
    width: 100%;
    max-height: 100%;
    font-size: 1.2em;
    overflow: hidden;
}

.dialog-item:nth-child(odd) .cloud::before,
.dialog-item:nth-child(odd) .cloud::after {
    content: '';
    position: absolute;
    border: 10px solid transparent;
    border-right: 10px solid #000000;
    left: -20px;
    top: 10px;
}

.dialog-item:nth-child(odd) .cloud::after {
    border-right: 10px solid rgb(217, 229, 235);
    top: 10px;
    left: -18px;
}

.dialog-item:nth-child(even) .cloud::before,
.dialog-item:nth-child(even) .cloud::after {
    content: '';
    position: absolute;
    border: 10px solid transparent;
    border-left: 10px solid #000000;
    right: -20px;
    top: 10px;
}

.dialog-item:nth-child(even) .cloud::after {
    border-left: 10px solid rgb(217, 229, 235);
    right: -18px;
    top: 10px;
}
</style>
