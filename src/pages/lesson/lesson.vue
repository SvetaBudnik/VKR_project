<script setup>
import { RouterLink, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { computed } from 'vue';

import { module, lesson, lessonsList, numOfLessons, courseNum } from './lessonData';
import { hasTasks, getNextLessonNumber, getPrevLessonNumber } from '../course/courseData';
import SidebarMenu from './components/SidebarMenu.vue';
import LessonHero from './components/LessonHero.vue';
import { onTheoryLoad, beforeRouteUpdate, beforeRouteLeave, gaming__is_last_lesson_ever } from './gamification_helper';


await onTheoryLoad();

const prev = computed(() => {
    const prevLesson = getPrevLessonNumber(module.value.moduleNumber, lesson.value.lessonNumber);
    if (prevLesson != null) {
        return `/courses/${courseNum.value}/lessons/${prevLesson.module}/${prevLesson.lesson}`;
    }
    return `/courses/${courseNum.value}`;
});

const next = computed(() => {
    if (hasTasks(module.value.moduleNumber, lesson.value.lessonNumber)) {
        return `/courses/${courseNum.value}/tasks/${module.value.moduleNumber}/${lesson.value.lessonNumber}/1`;
    }
    const nextLesson = getNextLessonNumber(module.value.moduleNumber, lesson.value.lessonNumber);
    if (nextLesson != null) {
        return `/courses/${courseNum.value}/lessons/${nextLesson.module}/${nextLesson.lesson}`;
    }

    gaming__is_last_lesson_ever.value = true;
    return `/courses/${courseNum.value}`;
});

onBeforeRouteUpdate(beforeRouteUpdate);
onBeforeRouteLeave(beforeRouteLeave);
</script>

<template>
    <LessonHero />

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
            <div class="markdown-body" v-html="lesson.lessonBody.replace(/<h3>.+<\/h3>/g, '')"></div>
        </div>

    </div>

    <div class="navigation-buttons">
        <RouterLink :to="prev" id="previos"> Назад </RouterLink>
        <RouterLink :to="next" id="next"> Далее </RouterLink>
    </div>
</template>

<style>
@import url(/src/github-markdown-light.css);

#previos {
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

#next {
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