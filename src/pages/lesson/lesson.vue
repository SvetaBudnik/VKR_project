<script setup>
import { RouterLink, onBeforeRouteUpdate } from 'vue-router';
import { ref } from 'vue';

import { module, lesson, lessonsList } from './lessonData';
import { getNumLessonsInModule } from '../home/homeData';
import SidebarMenu from './components/SidebarMenu.vue';

const numOfLessons = getNumLessonsInModule(module.value.moduleNumber);

let timeoutId = setFirstTimeout();

function setFirstTimeout() {
    return setTimeout(() => {
        const bubMessage = document.getElementsByClassName('bubble-message')[0];
        bubMessage.innerHTML = "Давай, [Ник пользователя], осталось совсем чуть-чуть !";
    }, 2 * 2000);
}

onBeforeRouteUpdate(() => {
    clearTimeout(timeoutId);
    timeoutId = setFirstTimeout();
});

</script>

<template>
    <div class="bubble-wrapper">
        <div class="bubble">
            <span class="bubble-message">
                Приветственный текст
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam animi quos temporibus
                consequuntur
                dolorum sed distinctio voluptas, tempora natus, expedita totam sint officia in est mollitia
                ullam!
                Rerum, laboriosam beatae!
            </span>
            <span class="bubble-triangle"></span>
            <div class="bubble-character"></div>
        </div>
    </div>

    <div class="lesson-wrapper">
        <SidebarMenu title="Содержание">
            <ol>
                <li v-for="les in lessonsList">
                    <b v-if="les.lessonName == lesson.lessonName">
                        <RouterLink :to="les.teorHtmlRef">
                            {{ les.lessonName }}
                        </RouterLink>
                    </b>
                    <RouterLink :to="les.teorHtmlRef" v-else>
                        {{ les.lessonName }}
                    </RouterLink>
                </li>
            </ol>
        </SidebarMenu>

        <div class="lesson-body">
            <h1> {{ module.moduleTitle }}: {{ module.moduleName }} </h1>
            <h2> Тема {{ lesson.lessonNumber }} из {{ numOfLessons }} | {{ lesson.lessonName }} </h2>
            <!-- <hr> -->
            <div class="markdown-body" v-html="lesson.lessonBody.replace(/<h3>.+<\/h3>/g, '')"></div>
        </div>

    </div>
</template>

<style>
@import url(/src/github-markdown-light.css);

.bubble-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    margin-top: 20px;
    margin-left: 50px;
    margin-right: 50px;
    margin-bottom: 0px;
}

.bubble {
    display: flex;
    flex-direction: column;

    min-width: 100px;
    width: fit-content;
    max-width: 50%;
}

.bubble .bubble-triangle {
    display: block;
    align-self: flex-end;
    margin-right: 55px;

    width: 0;
    border-top: 20px solid aliceblue;
    border-left: 25px solid transparent;
    /* border-right: 10px solid transparent; */
    border-bottom: 0;
}

.bubble .bubble-message {
    display: block;

    background-color: aliceblue;
    font-size: 1em;
    color: #333;

    padding: 10px;
}

.bubble .bubble-character {
    width: 150px;
    height: 150px;
    border: 1px solid black;
    align-self: flex-end;

    margin-bottom: -150px;
}

@media (width < 1300px) {
    .bubble .bubble-character {
        margin-bottom: 0;
    }
}

.lesson-wrapper {
    display: grid;
    grid-template-columns: 2fr 7fr 2fr;
}

.lesson-body {
    max-width: 868px;
    margin: auto;
}

.markdown-body img {
    display: block;
    max-width: 50%;
    margin: auto;
}
</style>