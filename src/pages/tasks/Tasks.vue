<script setup>
import { ref, computed } from 'vue'
import { RouterLink, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

import { moduleNum, lessonNum, task, testController, taskNum, attemptCount, heroController, coursePath, tasksResults } from './taskData'
import { getTasksCountIn, getNextLessonNumber } from '../course/courseData';
import SingleAnswerTest from './components/SingleAnswerTest.vue';
import MultipleAnswersTest from './components/MultipleAnswersTest.vue';
import TextFieldTest from './components/TextFieldTest.vue';
import TasksHero from './components/TasksHero.vue';

import { beforeRouteUpdate, beforeRouteLeave, onTasksLoaded, gaming__is_last_test_ever, gaming__total_score } from './gamification_helper.js';

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

await onTasksLoaded();

tasksResults.length = 0;

async function checkAnswers() {
    const answerResult = testController.checkAnswers();
    if (answerResult === null) {
        return;
    }

    if (answerResult === true) {
        tasksResults[taskNum.value] = score.value;
        gaming__total_score.value += score.value;
        heroController.showSuccess();
    } else {
        attemptCount.value++;
        await heroController.showError();
    }
}

const prevTask = computed(() => {
    if (task.value.taskNumber - 1 <= 0) {
        return `/courses/${coursePath.value}/lessons/${moduleNum.value}/${lessonNum.value}`;
    }

    return `/courses/${coursePath.value}/tasks/${moduleNum.value}/${lessonNum.value}/${+task.value.taskNumber - 1}`
});

const nextTask = computed(() => {
    const tasksCount = getTasksCountIn(moduleNum.value, lessonNum.value);
    const nextTask = +task.value.taskNumber + 1;
    if (tasksCount >= nextTask) {
        return `/courses/${coursePath.value}/tasks/${moduleNum.value}/${lessonNum.value}/${nextTask}`
    }

    const nextLesson = getNextLessonNumber(moduleNum.value, lessonNum.value);
    if (nextLesson == null) {
        gaming__is_last_test_ever.value = true;
        return '/courses/${courseNum}';
    }
    return `/courses/${coursePath.value}/lessons/${nextLesson.module}/${nextLesson.lesson}`;
});

// TODO: Выдавать число баллов Тэгом
// TODO: Парсинг имени, парсинг баллов
// Вычисляем количество баллов в зависимости от номера попытки
const score = computed(() => {
    const scores = {
        1: 5,
        2: 4,
        3: 2,
    };

    return scores[attemptCount.value + 1] ?? 1;
});

onBeforeRouteUpdate(async (to, from) => {
    testController.reset();

    await beforeRouteUpdate(to, from);
});
onBeforeRouteLeave(beforeRouteLeave);
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