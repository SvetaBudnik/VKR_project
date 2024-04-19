<script setup>
import { ref, computed } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';

import { task } from '../taskData';

const isModalVisible = ref(false);
const canPerformClick = ref(true);
const modalMessage = ref("");


// Обработчик клика для выбора нескольких ответов
function onMultipleAnswersClick(index) {
    if (!canPerformClick.value) return;

    const button = document.querySelectorAll('.but')[index];
    const selected = button.dataset.selected === 'true';

    button.dataset.selected = !selected;

    button.classList.toggle('selected');
}

function checkAnswers() {
    if (!canPerformClick.value) return;
    canPerformClick.value = false;

    let correct = true;

    const selectedButtons = document.querySelectorAll('.but.selected');
    const selectedAnswers = Array.from(selectedButtons).map(button => button.textContent);
    const correctAnswers = task.value.correctAnswers.map(index => task.value.answers[index]);

    // Проверяем соответствие выбранных ответов и правильных ответов
    if (selectedAnswers.length !== correctAnswers.length) {
        correct = false;
    } else {
        for (let i = 0; i < selectedAnswers.length; i++) {
            if (!correctAnswers.includes(selectedAnswers[i])) {
                correct = false;
                break;
            }
        }
    }

    if (correct) {
        openModal('Ты молодец, так держать!');
    } else {
        selectedButtons.forEach(button => {
            button.classList.add('incorrect');
            button.classList.remove('selected');
        });
        openModal('К сожалению, ты ошибся :(');
    }

    // Подсвечиваем правильные ответы
    const allButtons = document.querySelectorAll('.but');
    allButtons.forEach((button, index) => {
        if (task.value.correctAnswers.includes(index)) {
            button.classList.add('correct');
            button.classList.remove('incorrect');
            button.classList.remove('selected');
        }
    });

}

// Функция открытия модального окна
function openModal(label) {
    modalMessage.value = label
    isModalVisible.value = true
    setTimeout(() => {
        closeModal()
    }, 5000)
}

// Функция закрытия модального окна
function closeModal() {
    isModalVisible.value = false
}

onBeforeRouteUpdate(() => {
    isModalVisible.value = false
    canPerformClick.value = true
    modalMessage.value = ""

    const buttons = document.querySelectorAll('.but')
    buttons.forEach(button => {
        button.classList.remove('selected')
        button.classList.remove('correct')
        button.classList.remove('incorrect')
    })
});

defineExpose({
    checkAnswers,
});
</script>

<template>
    <button class="but" @click="onMultipleAnswersClick(index)" v-for="(ans, index) in task.answers" :key="index"
        :data-selected="false">
        {{ ans }}
    </button>

    <div class="modal" v-show="isModalVisible">
        <div class="modal-content">
            <p>{{ modalMessage }}</p>
        </div>
    </div>
</template>

<style></style>