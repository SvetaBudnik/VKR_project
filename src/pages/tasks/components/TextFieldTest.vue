<script setup>
import { ref } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';

import { task, testController, tasksResults, taskNum } from '../taskData';

// Создаем реактивную переменную для хранения текста из текстового поля
const inputText = ref('');

testController.checkAnswers = () => checkAnswers();

if (tasksResults[taskNum.value]) {
    testController.canPerformClick.value = false;
    highlightCorrect();
}

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

function highlightCorrect() {
    if (task.value.taskType != "textField") return null;

    inputText.value = task.value.correctAnswers[0];
}

onBeforeRouteUpdate(() => {
    testController.reset();

    inputText.value = ""

    if (tasksResults[taskNum.value]) {
        testController.canPerformClick.value = false;
        highlightCorrect();
    }
});
</script>

<template>
    <div class="text_test">
        <!-- Привязываем значение текстового поля к переменной inputText -->
        <input type="text" id="textInput" v-model="inputText" placeholder="Введите ответ" />
    </div>
</template>

<style></style>