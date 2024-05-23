<script setup>
import ModulesList from "./components/ModulesList.vue";
import { course } from './courseData';
</script>

<template>
    <section>
        <div class="text_course">
            <h2> {{ course.courseName }} </h2>
        </div>
        <div class="container_course">
            <ModulesList :modules="course.modules" /> 
        </div>
    </section>
</template>

<style>
.text_course {
    width: 715px;
    height: 60px;
    border-radius: 20px;
    background: #D9D9D9;
    text-align: center;

    margin: 15px auto;
    padding: 15px 0;

}

.container_course {
    max-width: 1287px;
    /* width: 1287px; */
    /* height: 620px; */
    border-radius: 10px;
    background: #EEEDED;
    margin: auto;
    margin-top: 10px;
    padding: 1px;
}


.topic-info {
    flex: 1;
}

.topic-actions {
    margin-left: 10px;
}

/* Стили для кнопки с перемещением */

/* .button-group {
    display: inline-flex;
    margin-right: auto;
}

.button:last-child {
    background: #9BC1DD;
}

.button:hover {
    background: #e7e6e6;
}

.button {
    width: 180px;
    height: 50px;
    background: #D9D9D9;
    border-radius: 10px;
    border: 1px black solid;
    padding: 10px 16px;
    cursor: pointer;


} */


.container {
    display: flex;
    justify-content: space-around;
    align-items: center;

    margin-top: 50px;
    margin-bottom: 50px;
}


.text_c {
    display: flex;
    text-align: center;
    justify-content: center;
    margin: 20px auto;

    color: black;
    font-size: 20px;
    font-family: Inter;
    font-weight: 300;
    word-wrap: break-word;

    width: 1142px;
    height: 100px;
}


.main-footer {
    background: #BEE5F1;
    width: 100%;
    height: 70px;
    padding: 0;
    margin-top: 20px;

    border: none;
    border-radius: 10px;

    display: flex;
    justify-content: space-between;
    align-items: center;
}


article h2 {
    font-size: 36px;
    font-weight: 500;

    margin: 5px 0px 20px 5px;
}

.footer-text {
    margin-right: 40.5%;
}
</style>