<script setup>
import ListItem from "./ListItem.vue"

const props = defineProps({
    module: {
        type: Object,
        required: true,
    },
})
</script>

<template>
    <div class="container_module">
        <ul class="container_name_module">
            <li>
                <h2 class="right-text"> {{ props.module.moduleTitle }} </h2>
            </li>
            <li>
                <h2 class="left-text"> {{ props.module.moduleName }} </h2>
            </li>
        </ul>
        <div v-for="(lesson, index) in props.module.lessons">
            <ListItem :lesson="lesson" />
            <hr v-if="index != Object.keys(props.module.lessons).length" class="custom-hr">
        </div>
    </div>
</template>

<style>
.custom-hr {
    /* margin-left: 27px;
    margin-right: 27px; */
    grid-column: 1/3;
    /* margin: 20px 0; */
    /* Задаем отступы */
    border: none;
    /* Убираем стандартные границы */
    border-top: 1px solid #000000;
    /* Устанавливаем стиль верхней границы */
}

.container_name_module h2 {
    white-space: nowrap;
    /* добавлено */
    text-align: center;
}

/* .container_name_module a {
    color: #080808;
    text-decoration: none;
    font-size: 16px;
} */

.container_name_module {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    /* Выравнивание по вертикали */
    gap: 100px;
    /* Отступ между элементами */

    max-width: 1200px;
    /* Ограничиваем максимальную ширину */
    margin: 10px auto;
    /* Центрируем по горизонтали */

    justify-content: space-around;
    /* align-items: center; */
    list-style-type: none;

    /* width: 1215px;
    height: 40px; */
    background: #D9D9D9;
    text-align: center;

    /* margin: 15px auto;
    padding: 15px 0; */
}

.container_name_module li {
    /* float: right;
    display: block;
    margin-right: 40px;

    width: 180px;
    height: 18px; */
    /* font-family: Arial, sans-serif; */
    /* border-radius: 10px;
    padding: 10px 16px; */
    /* cursor: pointer; */

    text-align: center;

    display: inline-block;
    /* изменено */
    margin-right: 40px;

}

.right-text {
    margin-right: 100px;
}

.left-text {
    margin-left: 10px;
}
</style>