<script setup>
import { ref } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';

import { task, testController, tasksResults, taskNum } from '../taskData';

testController.checkAnswers = () => checkAnswers();

const resetSelectionTimeout = ref(0);

if (tasksResults[taskNum.value]) {
    testController.canPerformClick.value = false;
    highlightCorrect();
}

// Обработчик клика для выбора одного ответа
function onSingleAnswerClick(selectedIndex) {
    if (!testController.canPerformClick.value) return;

    const buttons = document.querySelectorAll('.but');
    buttons.forEach((button, index) => {
        if (index === selectedIndex) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });
}

// Функция проверки ответа
function checkAnswers() {
    if (task.value.taskType != "singleAnswer") return null;

    if (!testController.canPerformClick.value) return null;
    testController.canPerformClick.value = false;

    let correct = true;

    const selectedButton = document.querySelector('.but.selected');
    if (!selectedButton) {
        testController.canPerformClick.value = true;
        return null;
    }

    const selectedAnswer = task.value.answers.indexOf(selectedButton.textContent);
    if (selectedAnswer !== task.value.correctAnswer) {
        selectedButton.classList.add('incorrect');
        selectedButton.classList.remove('selected');
        correct = false;

        resetSelectionTimeout.value = setTimeout(() => {
            const buttons = document.querySelectorAll('.but');
            buttons.forEach(button => {
                button.classList.remove('selected');
                button.classList.remove('correct');
                button.classList.remove('incorrect');
            });
            testController.canPerformClick.value = true;
        }, 2000);
    } else {
        selectedButton.classList.add('correct');
        selectedButton.classList.remove('selected');
    }

    return correct;
}

function highlightCorrect() {
    if (task.value.taskType != "singleAnswer") return null;
    
    const buttons = document.querySelectorAll('.but');
    buttons.forEach((button) => {
        const answerIndex = task.value.answers.indexOf(button.textContent);
        if (answerIndex === task.value.correctAnswer) {
            button.classList.add('correct');
        }
    });
}

onBeforeRouteUpdate(() => {
    clearTimeout(resetSelectionTimeout.value);
    testController.reset();

    const buttons = document.querySelectorAll('.but')
    buttons.forEach(button => {
        button.classList.remove('selected')
        button.classList.remove('correct')
        button.classList.remove('incorrect')
    })

    if (tasksResults[taskNum.value]) {
        testController.canPerformClick.value = false;
        highlightCorrect();
    }
});
</script>

<template>
    <button class="but" @click="onSingleAnswerClick(index)" v-for="(ans, index) in task.answers" :key="index">
        {{ ans }}
    </button>
</template>

<style></style>