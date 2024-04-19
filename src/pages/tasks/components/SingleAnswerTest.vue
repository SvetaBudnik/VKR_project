<script setup>
import { ref, computed } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';

import { task } from '../taskData';

const isModalVisible = ref(false);
const canPerformClick = ref(true);
const modalMessage = ref("");


// Обработчик клика для выбора одного ответа
function onSingleAnswerClick(selectedIndex) {
    if (!canPerformClick.value) return;

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
    if (!canPerformClick.value) return;
    canPerformClick.value = false;

    let correct = true;

    const selectedButton = document.querySelector('.but.selected');
    if (!selectedButton) {
        canPerformClick.value = true;
        return;
    }

    const selectedAnswer = task.value.answers.indexOf(selectedButton.textContent);
    if (selectedAnswer === task.value.correctAnswer) {
        openModal('Ты молодец, так держать!');
    } else {
        selectedButton.classList.add('incorrect');
        selectedButton.classList.remove('selected');
        openModal('К сожалению, ты ошибся :(');
        correct = false;
    }

    const allButtons = document.querySelectorAll('.but');
    allButtons.forEach((button, index) => {
        if (index === task.value.correctAnswer) {
            button.classList.remove('selected');
            button.classList.add('correct');
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
    <button class="but" @click="onSingleAnswerClick(index)" v-for="(ans, index) in task.answers" :key="index">
        {{ ans }}
    </button>

    <div class="modal" v-show="isModalVisible">
        <div class="modal-content">
            <p>{{ modalMessage }}</p>
        </div>
    </div>
</template>

<style></style>