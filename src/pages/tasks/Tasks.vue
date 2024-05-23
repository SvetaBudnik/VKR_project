<script setup>
import { ref, computed } from 'vue'
import { RouterLink, onBeforeRouteUpdate } from 'vue-router'

import { moduleNum, lessonNum, task, testController, reactions, attemptCount, heroController, courseNum } from './taskData'
import { getTasksCountIn, getNextLessonNumber } from '../course/courseData';
import SingleAnswerTest from './components/SingleAnswerTest.vue';
import MultipleAnswersTest from './components/MultipleAnswersTest.vue';
import TextFieldTest from './components/TextFieldTest.vue';
import TasksHero from './components/TasksHero.vue';

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

const isModalVisible = ref(false);
const modalMessage = ref("");
const modalTimeoutNumber = ref(0);


async function checkAnswers() {
    resetModal();

    const answerResult = testController.checkAnswers();
    if (answerResult === null) {
        return;
    }
    attemptCount.value++;

    if (answerResult === true) {
        openModal(`${reactions.value.onSuccess.phrase} --- ${reactions.value.onSuccess.emotionImgPath}`);
        heroController.showSuccess();
    } else {
        openModal(`${reactions.value.onError.phrase} --- ${reactions.value.onError.emotionImgPath}`);
        heroController.showError();
    }
}

const prevTask = computed(() => {
    if (task.value.taskNumber - 1 <= 0) {
        return `/courses/${courseNum.value}/lessons/${moduleNum.value}/${lessonNum.value}`;
    }

    return `/courses/${courseNum.value}/tasks/${moduleNum.value}/${lessonNum.value}/${+task.value.taskNumber - 1}`
});

const nextTask = computed(() => {
    const tasksCount = getTasksCountIn(moduleNum.value, lessonNum.value);
    const nextTask = +task.value.taskNumber + 1;
    if (tasksCount >= nextTask) {
        return `/courses/${courseNum.value}/tasks/${moduleNum.value}/${lessonNum.value}/${nextTask}`
    }

    const nextLesson = getNextLessonNumber(moduleNum.value, lessonNum.value);
    if (nextLesson == null) {
        return '/courses/${courseNum}';
    }
    return `/courses/${courseNum.value}/lessons/${nextLesson.module}/${nextLesson.lesson}`;
});

// TODO: Выдавать число баллов Тэгом
// TODO: Парсинг имени, парсинг баллов
// Вычисляем количество баллов в зависимости от номера попытки
const score = computed(() => {
    const scores = {
        0: 0,
        1: 5,
        2: 4,
        3: 2,
    };

    return scores[attemptCount.value] ?? 1;
});

function openModal(label) {
    modalMessage.value = label;
    isModalVisible.value = true;
    modalTimeoutNumber.value = setTimeout(() => {
        closeModal()
    }, 5000)
}

// Функция закрытия модального окна
function closeModal() {
    isModalVisible.value = false
}

function resetModal() {
    clearTimeout(modalTimeoutNumber.value);
    closeModal();
}

onBeforeRouteUpdate(() => {
    testController.reset();

    resetModal();
});
</script>

<template>
    <section>
        <TasksHero />

        <div class="number_task">
            <h2> Задание {{ task.taskNumber }} </h2>
            <p>Попытка: {{ attemptCount }}</p>
            <p>Очки: {{ score }}</p>
        </div>

        <!-- Текст вопроса -->
        <div class="container_course">
            <div class="text_c">
                <h2> {{ task.question }} </h2>
            </div>

            <!-- Ответы на вопрос -->
            <div class="ans">
                <!-- Если тип вопроса - одиночный выбор -->
                <template v-if="task.taskType === 'singleAnswer'">
                    <SingleAnswerTest />
                </template>

                <!-- Если тип вопроса - множественный выбор -->
                <template v-else-if="task.taskType === 'multipleAnswers'">
                    <MultipleAnswersTest />
                </template>

                <!-- Если тип вопроса - текстовое написание -->
                <template class="text_test" v-else-if="task.taskType === 'textField'">
                    <TextFieldTest />
                </template>
            </div>

            <div class="function_buttons">
                <RouterLink :to="prevTask" id="previos_task"> Предыдущее задание </RouterLink>
                <button id="check_ans" @click="checkAnswers">Проверить задание </button>
                <RouterLink :to="nextTask" id="next_task"> Следующее задание </RouterLink>
            </div>
        </div>

        <div class="modal" v-show="isModalVisible">
            <div class="modal-content">
                <p>{{ modalMessage }}</p>
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

.text_test {
    position: relative;
    width: 100%;
    /* Ширина родительского элемента */
    height: 100%;
    /* Высота родительского элемента */
}

.text_test input[type=text] {
    border: 1px solid rgb(154, 154, 154);
    padding: 20px 20px;
    text-align: left;
    font-size: 14px;
    overflow: hidden;

    /* Центрирование содержимого */
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -80%);
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