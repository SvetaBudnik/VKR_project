<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
    <div class="centerDiv">
        <h1>Данной страницы не существует</h1>
        <RouterLink :to="{ name: 'HomePage' }">Вернуться на главную</RouterLink>
    </div>
</template>

<style>
.centerDiv {
    display: flex;
    width: 100%;
    height: 50%;
    margin: auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.centerDiv a {
    border: 2px solid black;
    border-radius: 10px;
    padding: 10px;
    color: black;
    text-decoration: none;
    font-size: 1.2rem;
}
</style>