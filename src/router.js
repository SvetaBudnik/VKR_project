import { createWebHistory, createRouter } from 'vue-router';

import Home from '/src/pages/home/Home.vue';
import Tasks from '/src/pages/tasks/Tasks.vue';
import Lesson from '/src/pages/lesson/lesson.vue';
import PageNotFound from '/src/pages/PageNotFound.vue';

import { getTaskData } from '/src/pages/tasks/taskData';
import { getLessonData } from '/src/pages/lesson/lessonData';
import { getModules } from '/src/pages/home/homeData';

const routes = [
    {
        path: '/',
        name: "HomePage",
        component: Home,
        meta: { requiresModulesData: true },
    },
    {
        path: '/tests/:module/:lesson/:task',
        name: "task",
        component: Tasks,
        meta: { requiresTaskData: true},
    },
    {
        path: '/lessons/:module/:lesson',
        name: 'lesson',
        component: Lesson,
        meta: { requiresLessonData: true, requiresModulesData: true },
    },
    { path: '/:pathMatch(.*)*', name: "PageNotFound", component: PageNotFound }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
    console.log("BeforeEach")
    if (to.meta.requiresModulesData) {
        console.log("Requires modules data");
        if (!await getModules()) {
            console.log("Redirect to homepage");
            next({ name: "PageNotFound" });
            return;
        }
    }
    if (to.meta.requiresTaskData) {
        console.log("Requires task data")
        if (!await getTaskData(to.params.module, to.params.lesson, to.params.task)) {
            console.log("Redirect to homepage");
            next({ name: "HomePage" });
            return;
        }
    }
    if (to.meta.requiresLessonData) {
        console.log("Requires lesson data");
        if (!await getLessonData(to.params.module, to.params.lesson)) {
            console.log("Redirecting to homepage");
            next({ name: "HomePage" });
            return;
        }
    }

    console.log("Navigating to next page...");
    next();
})

export default router
