import { createWebHistory, createRouter } from 'vue-router';

import loginController from './components/login';
import gamificationEventController from './components/gamification/gamification_event_controller';

import Home from './pages/home/Home.vue';
import Course from './pages/course/Course.vue';
import Tasks from './pages/tasks/Tasks.vue';
import Lesson from './pages/lesson/lesson.vue';
import PageNotFound from './pages/PageNotFound.vue';
import Login from './pages/login/Login.vue';
import Account from './pages/account/Account.vue';
import Dialog from './components/gamification/dialog/Dialog.vue';

import { getTaskData } from './pages/tasks/taskData';
import { getLessonData } from './pages/lesson/lessonData';
import { getModules } from './pages/course/courseData';
import { fetchCoursesInfo } from './pages/home/homeData';
import gamificationController from './components/gamification/gamification_controller';
import { isDialogVisible } from './components/gamification/dialog/dialog';

const routes = [
    {
        path: "/login",
        name: "LoginPage",
        component: Login,
    },
    {
        path: '/',
        name: "HomePage",
        component: Home,
        meta: {
            requiresCoursesData: true,
        },
    },
    {
        path: '/account',
        name: "AccountPage",
        component: Account,
    },
    {
        path: '/courses/:course',
        name: "CoursePage",
        component: Course,
        meta: {
            requiresModulesData: true,
        },
    },
    {
        path: '/courses/:course/tasks/:module/:lesson/:task',
        name: "task",
        component: Tasks,
        meta: {
            requiresTaskData: true,
            requiresModulesData: true,
        },
    },
    {
        path: '/courses/:course/lessons/:module/:lesson',
        name: 'lesson',
        component: Lesson,
        meta: {
            requiresLessonData: true,
            requiresModulesData: true,
        },
    },
    {
        path: '/dialog',
        name: 'DialogPage',
        component: Dialog,
    },
    { path: '/:pathMatch(.*)*', name: "PageNotFound", component: PageNotFound }
]



const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // always scroll to top
        return { top: 0 }
    },
})

router.beforeEach(async (to, from, next) => {
    console.log("BeforeEach");

    if (to.name !== "LoginPage" && !loginController.isUserLoggined()) {
        console.log("token is empty. Redirect to login page");
        gamificationEventController.reset();

        next({ name: "LoginPage" });
        return;
    }

    if (to.meta.requiresCoursesData) {
        console.log("Requires courses data");
        gamificationEventController.reset();

        if (!await fetchCoursesInfo()) {
            console.log("Redirect to PageNotFound");
            next({ name: "PageNotFound" });
            return;
        }
    }

    if (to.meta.requiresModulesData) {
        console.log("Requires modules data");
        if (!await getModules(to.params.course)) {
            console.log("Redirect to Homepage");
            next({ name: "HomePage" });
            return;
        }
        await gamificationController.loadCourse(to.params.course);
    }
    if (to.meta.requiresTaskData) {
        console.log("Requires task data")
        if (!await getTaskData(to.params.course, to.params.module, to.params.lesson, to.params.task)) {
            console.log("Redirect to homepage");
            next({ name: "HomePage" });
            return;
        }
    }
    if (to.meta.requiresLessonData) {
        console.log("Requires lesson data");
        if (!await getLessonData(to.params.course, to.params.module, to.params.lesson)) {
            console.log("Redirecting to homepage");
            next({ name: "HomePage" });
            return;
        }
    }

    console.log("Navigating to next page...");
    next();
})

export default router
