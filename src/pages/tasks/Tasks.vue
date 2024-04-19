<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

import { moduleNum, lessonNum, task } from './taskData'
import SingleAnswerTest from './components/SingleAnswerTest.vue';
import MultipleAnswersTest from './components/MultipleAnswersTest.vue';


const singleAnswerTestObj = ref(null);
const multipleAnswersTestObj = ref(null);


function checkAnswers() {
    if(singleAnswerTestObj.value) {
        console.log("SingleAnswerTest");
        singleAnswerTestObj.value.checkAnswers();
    }
    else if (multipleAnswersTestObj.value) {
        console.log("MultipleAnswerTest");
        multipleAnswersTestObj.value.checkAnswers();
    }
}

const prevTask = computed(() => {
    return `/tests/${moduleNum.value}/${lessonNum.value}/${+task.value.taskNumber - 1}`
})

const nextTask = computed(() => {
    return `/tests/${moduleNum.value}/${lessonNum.value}/${+task.value.taskNumber + 1}`
})
</script>

<template>
    <section>
        <div class="number_task">
            <h2> Задание {{ task.taskNumber }} </h2>
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
                    <SingleAnswerTest ref="singleAnswerTestObj" />
                </template>

                <!-- Если тип вопроса - множественный выбор -->
                <template v-else-if="task.taskType === 'multipleAnswers'">
                    <MultipleAnswersTest ref="multipleAnswersTestObj" />
                </template>
            </div>

            <div class="function_buttons">
                <RouterLink :to="prevTask" id="previos_task" @click="onChangeTestClick"> Предыдущее задание
                </RouterLink>
                <button id="check_ans" @click="checkAnswers">Проверить задание</button>
                <RouterLink :to="nextTask" id="next_task" @click="onChangeTestClick"> Следующее задание </RouterLink>
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