<script setup>
import { RouterLink } from 'vue-router'
import { computed } from 'vue';
import loginController from '../components/login';
import { courseNum } from '../pages/course/courseData';

const showMenu = computed(() => {
    return loginController.login.value !== "";
});
</script>

<template>
    <header>
        <div class="main-header">
            <RouterLink to="/" class="logo"> SB academy </RouterLink>
            <nav v-if="showMenu">
                <ul class="menu">
                    <!-- Бесполезная кнопка, лого сайта делает ту же самую работу -->
                    <!-- <li>
                        <RouterLink to="/">Главная страница</RouterLink>
                    </li> -->

                    <li v-if="courseNum !== null">
                        <RouterLink :to="`/courses/${courseNum}`">К курсу</RouterLink>
                    </li>
                    <li>
                        <RouterLink :to="{ name: 'AccountPage' }">Личный кабинет</RouterLink>
                    </li>
                    <li>
                        <RouterLink :to="{ name: 'LoginPage' }">Выйти</RouterLink>
                    </li>
                </ul>
            </nav>
        </div>
    </header>
</template>

<style>
.main-header {
    border-radius: 0px 0px 10px 10px;
    width: 100%;
    height: 85px;
    padding: 0;
    margin: 0 auto;
    border: none;
    background-color: #BEE5F1;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.logo {
    width: 200px;
    /* height: 75px; */
    color: #4665D2;
    font-size: 30px;
    font-family: Arial, sans-serif;
    font-style: italic;
    font-weight: 700;
    float: left;
    text-decoration: none;
    margin-left: 40px;
}

.menu {
    padding: 0;
    margin: 0;
    display: block;
}

.menu li {
    float: right;
    display: block;
    margin-right: 40px;
}

.menu a {
    background: #e4f2df;
    font-family: Arial, sans-serif;
    border-radius: 10px;
    border: 1px black solid;
    padding: 10px 16px;
    cursor: pointer;

    text-align: center;

    color: #080808;
    text-decoration: none;
    font-size: 16px;
}
</style>