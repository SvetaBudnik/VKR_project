<script setup>
import { RouterLink } from 'vue-router';
import { coursesInfo } from './homeData';
</script>

<template>
    <div class="home-view">
        <h2>Список доступных курсов:</h2>
        <ul>
            <li v-for="course in coursesInfo">
                <span> {{ course.courseName }}: </span>
                <RouterLink :to="`/courses/${course.coursePath}`">Перейти</RouterLink>
            </li>
        </ul>
    </div>
</template>

<style>
.home-view {
    margin: 40px;
}

.home-view span {
    margin-right: 1em;
}

.home-view a {
    color: black;
    text-decoration: none;

    background-color: #e4f2df;

    border: 1px solid black;
    border-radius: 7px;
    padding: 5px 7px;
}

.home-view a:visited {
    color: black;
    text-decoration: none;
}
</style>