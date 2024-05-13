<script setup>
import { ref } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';

import { task, testController } from '../taskData';

// Создаем реактивную переменную для хранения текста из текстового поля
const inputText = ref('');

testController.checkAnswers = () => checkAnswers();

/**
 * Функция проверки ответа
 * @returns {boolean | null}
 */
function checkAnswers() {
    if (!inputText.value) {
        alert('Введите текст');
        return null;
    }
    let correct = false;

    task.value.correctAnswers.forEach((cor) => {
        const cor_lower = cor.toLowerCase().trim();
        const ans_lower = inputText.value.toLowerCase().trim();
        if (cor_lower == ans_lower) {
            correct = true;
        }
    });

    return correct;
}

onBeforeRouteUpdate(() => {
    testController.reset();

    inputText.value = ""
});
</script>

<template>
    <div class="text_test">
        <!-- Привязываем значение текстового поля к переменной inputText -->
        <input type="text" id="textInput" v-model="inputText" placeholder="Введите ответ" />
    </div>
</template>

<style></style>