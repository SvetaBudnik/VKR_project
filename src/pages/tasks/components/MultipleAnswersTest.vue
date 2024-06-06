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


// Обработчик клика для выбора нескольких ответов
function onMultipleAnswersClick(index) {
    if (!testController.canPerformClick.value) return;

    const button = document.querySelectorAll('.but')[index];
    const selected = button.dataset.selected === 'true';

    button.dataset.selected = !selected;

    button.classList.toggle('selected');
}

function checkAnswers() {
    if (task.value.taskType != "multipleAnswers") return null;

    if (!testController.canPerformClick.value) return null;
    testController.canPerformClick.value = false;

    let correct = true;

    const selectedButtons = document.querySelectorAll('.but.selected');
    const selectedAnswers = Array.from(selectedButtons).map(button => button.textContent);
    const correctAnswers = task.value.correctAnswers.map(index => task.value.answers[index]);

    if (selectedAnswers.length === 0) {
        return null;
    }

    // Проверяем соответствие выбранных ответов и правильных ответов
    if (selectedAnswers.length !== correctAnswers.length) {
        correct = false;
    } else {
        for (const el of selectedAnswers) {
            if (!correctAnswers.includes(el)) {
                correct = false;
                break;
            }
        }
    }

    if (correct) {
        selectedButtons.forEach(button => {
            button.classList.add('correct');
            button.classList.remove('selected');
        });
    } else {
        selectedButtons.forEach(button => {
            button.classList.add('incorrect');
            button.classList.remove('selected');
        });

        resetSelectionTimeout.value = setTimeout(() => {
            const buttons = document.querySelectorAll('.but');
            buttons.forEach(button => {
                button.classList.remove('selected');
                button.classList.remove('correct');
                button.classList.remove('incorrect');
            });
            testController.canPerformClick.value = true;
        }, 2000);
    }


    return correct;
}

function highlightCorrect() {
    if (task.value.taskType != "multipleAnswers") return null;
    
    const buttons = document.querySelectorAll('.but');
    buttons.forEach((button) => {
        if (task.value.correctAnswers.includes(task.value.answers.indexOf(button.textContent))) {
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
    <button class="but" @click="onMultipleAnswersClick(index)" v-for="(ans, index) in task.answers" :key="index"
        :data-selected="false">
        {{ ans }}
    </button>
</template>

<style></style>