<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

import { moduleNum, lessonNum, task } from './taskData'


const isModalVisible = ref(false)
const canPerformClick = ref(true)
const modalMessage = ref("")

function onAnswerClick(event) {
    if (!canPerformClick.value) return

    const selectedButton = event.target
    const buttons = document.querySelectorAll('.but')
    buttons.forEach(button => button.classList.remove('selected'))
    selectedButton.classList.add('selected')
}

function checkAnswers() {
    if (!canPerformClick.value) return
    canPerformClick.value = false;

    const correctAnswer = task.value.answers[task.value.correctAnswer]
    const selectedButton = document.querySelector('.but.selected')
    if (selectedButton) {
        selectedButton.classList.remove('selected')
    } else {
        canPerformClick.value = true
        return
    }

    if (selectedButton.textContent === correctAnswer) {
        openModal('Ты молодец, так держать!')
    }
    else {
        selectedButton.classList.add('incorrect')
        openModal('К сожалению ты ошибся :(')
    }

    const allButtons = document.querySelectorAll('.but')
    allButtons.forEach(button => {
        if (button.textContent === correctAnswer) {
            button.classList.add('correct')
        }
    })
}

function openModal(label) {
    modalMessage.value = label
    isModalVisible.value = true
    setTimeout(() => {
        closeModal()
    }, 5000)
}

function closeModal() {
    isModalVisible.value = false
}

const prevTask = computed(() => {
    return `/tests/${moduleNum.value}/${lessonNum.value}/${+task.value.taskNumber - 1}`
})

const nextTask = computed(() => {
    return `/tests/${moduleNum.value}/${lessonNum.value}/${+task.value.taskNumber + 1}`
})

function onChangeTestClick() {
    isModalVisible.value = false
    canPerformClick.value = true
    modalMessage.value = ""

    const buttons = document.querySelectorAll('.but')
    buttons.forEach(button => {
        button.classList.remove('selected')
        button.classList.remove('correct')
        button.classList.remove('incorrect')
    })
}
</script>

<template>
    <section>
        <div class="number_task">
            <h2> Задание {{ task.taskNumber }} </h2>
        </div>

        <!-- Пример тестового задания -->
        <div class="container_course">
            <div class="text_c">
                <h2> {{ task.question }} </h2>
            </div>

            <div class="ans">
                <button class="but" @click="onAnswerClick($event)" v-for="ans in task.answers">{{ ans }}</button>
            </div>

            <div class="function_buttons">
                <RouterLink :to="prevTask" id="previos_task" @click="onChangeTestClick"> Предыдущее задание </RouterLink>
                <button id="check_ans" @click="checkAnswers">Проверить задание</button>
                <RouterLink :to="nextTask" id="next_task" @click="onChangeTestClick"> Следующее задание </RouterLink>
            </div>

            <div class="modal" v-show="isModalVisible">
                <div class="modal-content">
                    <p>{{ modalMessage }}</p>
                </div>
            </div>
        </div>
    </section>
</template>

<style>
.ans {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 100px;
    /* Расстояние между кнопками */

    justify-content: center;
    align-items: center;

    margin: 40px 0px 20px 0px;
    /* margin-top: 40px; */
}



.function_buttons {
    display: flex;
    flex-direction: row;

    justify-content: space-around;
    margin-top: 60px;
}

#previos_task {
    width: 143px;
    height: 52px;
    background-color: #F0EDB9;

    color: #000000;
    border: 2px black solid;
    cursor: pointer;

    text-align: center;
    text-decoration: none;
    line-height: 25px;
    overflow-wrap: break-word;
}

#check_ans {
    width: 143px;
    height: 52px;
    background-color: #2ecc71;
    text-align: center;
    color: #000000;

    cursor: pointer;
}

.but {

    padding: 10px;
    font-size: 16px;

    width: 350px;
    height: 80px;
    border-radius: 20px;
    background: #D9D9D9;
    text-align: center;
    margin: auto;

    cursor: pointer;
}

.but.selected {
    background-color: #9FA3AC;
    color: black;
}

.correct {
    background-color: #78F06D;
    /* Зеленый цвет для правильного ответа */
    color: #000000;
}

.incorrect {
    background-color: #F00F0F;
    /* Красный цвет для неверного ответа */
    color: #000000;
}


/* Стили для модального окна */
.modal {
    /* display: none; */
    position: fixed;
    z-index: 1;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    width: 450px;
    height: 15px;
}

.modal-content {
    background-color: #F0E8BB;
    margin: 21% auto;
    width: 50%;

    text-align: center;
    padding: 10px;
}

.show-modal {
    display: block;
}

#next_task {
    width: 143px;
    height: 52px;
    background-color: #F0EDB9;
    color: #000000;
    border: 2px black solid;
    cursor: pointer;

    text-align: center;
    line-height: 52px;
    text-decoration: none;

    /* Перенос слов */
    overflow-wrap: break-word;
}
</style>