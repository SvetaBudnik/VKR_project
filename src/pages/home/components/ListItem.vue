<script setup>
const props = defineProps({
    lesson: {
        type: Object,
        required: true,
    },
});

const teor_ref = props.lesson.teorHtmlRef == undefined ? "" : props.lesson.teorHtmlRef;
const test_ref = props.lesson.testHtmlRef == undefined ? "" : props.lesson.testHtmlRef;
const pract_ref = props.lesson.practHtmlRef == undefined ? "" : props.lesson.practHtmlRef;

</script>

<template>
    <div class="container_topic">
        <ul class="c_topic">
            <li>
                <h2 class="text_topic">{{ props.lesson.lessonTitle }}</h2>
            </li>
            <li>
                <h3 class="text_topic">{{ props.lesson.lessonName }}</h3>
            </li>
        </ul>
        <div class="button-row">
            <!-- TODO: Переделать кнопки, как это сделано в tests_task -->
            <RouterLink :to="teor_ref" class="button_teor"> Теор. материал </RouterLink>
            <RouterLink :to="test_ref" class="button_task"> Тестовые задания </RouterLink>
            <RouterLink :to="pract_ref" class="button_practice"> Практика </RouterLink>
        </div>
    </div>
</template>

<style>
.container_topic {
    display: grid;
    grid-template-columns: auto auto;
    /* Два столбца */
    align-items: center;
    /* Выравнивание по вертикали */
    gap: 20px;
    /* Отступ между элементами */

    max-width: 1210px;
    /* Ограничиваем максимальную ширину */
    margin: 5px auto;
    /* Центрируем по горизонтали */
}

.c_topic {
    /* display: block;
    justify-content:space-between; */
    /* align-items: center; */
    list-style-type: none;
    /* 
    width: 595px;
    height: 112px; */

    /* text-align: center; */

    margin: 0;
}

/* .c_topic li {
    text-align: center;
} */


.button-row {
    display: grid;

    grid-template-columns: repeat(3, auto);
    /* Три столбца для трех кнопок */
    justify-content: end;
    /* Центрируем содержимое по горизонтали */
    gap: 40px;
    /* Отступ между кнопками */
    grid-column: 2;
    /* Размещаем кнопки во втором столбце */

}

.button_teor {
    padding: 10px 20px;
    margin-right: 10px;
    border: 1px black solid;

    background-color: #96A2E2;
    color: black;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    cursor: pointer;
}

.button_task {
    padding: 10px 20px;
    margin-right: 10px;
    border: 1px black solid;


    background-color: #D6EADB;
    color: black;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    cursor: pointer;
}

.button_practice {
    padding: 10px 20px;
    margin-right: 10px;
    border: 1px black solid;


    background-color: #F0EDB9;
    color: black;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    cursor: pointer;
}

.button:last-child {
    margin-right: 0;
}
</style>
