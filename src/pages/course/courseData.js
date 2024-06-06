import loginController from '../../components/login';
import { lesson } from '../lesson/lessonData';
import baseUrl from '/src/components/baseUrl';
import { ref } from 'vue';

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */


/**
 * @type {Ref<null | {courseName: string, modules: Object<string, {moduleNumber: string, moduleTitle: string, moduleName: string, lessons: Object<string, {lessonNumber: string, lessonTitle: string, lessonName:string, tasksCount: number}>}>}>}
 */
export const course = ref(null);

/** @type {Ref<null | number>} */
export const courseNum = ref(null);
// TODO: переименовать в coursePath

function generateLinksForLessons() {
    const modules = course.value.modules;

    for (const moduleNum in modules) {
        const module = modules[moduleNum];

        for (const lessonNum in module.lessons) {
            const lesson = module.lessons[lessonNum];
            lesson.teorHtmlRef = `/courses/${courseNum.value}/lessons/${module.moduleNumber}/${lesson.lessonNumber}`;
            if (lesson.tasksCount > 0) {
                lesson.testHtmlRef = `/courses/${courseNum.value}/tasks/${module.moduleNumber}/${lesson.lessonNumber}/1`;
            }
        }
    }
}

/**
 * @param {number} courseNumber - номер курса
 * @returns {Promise<boolean>}
 */
export async function getModules(courseNumber) {
    if (course.value !== null && courseNum.value === courseNumber) {
        console.log('Данные модулей уже загружены. Пропускаем...');
        return true;
    }

    const response = await loginController.sendGet(`api/courses/${courseNumber}`);   
    if (response === null) {
        console.error("User not loggined ???");
        return false;
    }
    if (!response.ok) {
        const desc = await response.text();
        console.error(`Server responsed ${response.status}: ${desc}`)
        return false;
    }

    const data = await response.json();
    course.value = data;
    courseNum.value = courseNumber;

    generateLinksForLessons();

    return true;
}

export function getNumLessonsInModule(_module) {
    const module = course.value.modules[_module];
    if (module == null)
        return null;
    return Object.keys(module.lessons).length;
}

export function getLessonsIn(_module) {
    const module = course.value.modules[_module];
    if (module == null) {
        return null;
    }

    return module.lessons;
}

export function getTasksCountIn(_module, _lesson) {
    const module = course.value.modules[_module];
    if (module == null) {
        return null;
    }
    const lesson = module.lessons[_lesson];
    if (lesson == null) {
        return null;
    }

    return lesson.tasksCount;
}

export function hasTasks(_module, _lesson) {
    return getTasksCountIn(_module, _lesson) > 0;
}

/**
 * Получить номер модуля и следующего урока относительно текущего, если они ещё есть
 * @param {string} _module - номер текущего модуля
 * @param {string} _lesson - номер текущего урока
 * @returns {{module:string, lesson:string}|null} номер модуля и следующего урока, либо null, если больше уроков нет
 */
export function getNextLessonNumber(_module, _lesson) {
    const module = course.value.modules[_module];
    if (module == null) {
        return null;
    }

    let founded = false;
    for (const lessonNumber in module.lessons) {
        if (founded) {
            return {
                module: _module,
                lesson: lessonNumber,
            };
        }
        if (lessonNumber == _lesson) {
            founded = true;
        }
    }

    founded = false;
    let moduleNumber = "-1";
    for (const moduleNum in course.value.modules) {
        if (founded) {
            moduleNumber = moduleNum;
            break;
        }
        if (moduleNum == _module) {
            founded = true;
        }
    }

    if (moduleNumber == "-1") {
        return null;
    }

    for (const lessonNumber in course.value.modules[moduleNumber].lessons) {
        return {
            module: moduleNumber,
            lesson: lessonNumber,
        };
    }

    return null;
}

/**
 * Метод получения предыдущего урока (если он есть)
 * @param {string} _module - номер текущего модуля
 * @param {string} _lesson - номер текущего урока
 * @returns {{module:string, lesson: string} | null}
 */
export function getPrevLessonNumber(_module, _lesson) {
    const module = course.value.modules[_module];
    if (module == null) {
        return null;
    }

    let prevLesson = "-1";
    for (const lessonNumber in module.lessons) {
        if (lessonNumber == _lesson && prevLesson != "-1") {
            return {
                module: _module,
                lesson: prevLesson,
            }
        }
        prevLesson = lessonNumber;
    }

    let prevModule = "-1";
    let founded = false;
    for (const moduleNum in course.value.modules) {
        if (moduleNum == _module && prevModule != "-1") {
            founded = true;
            break;
        }
        prevModule = moduleNum;
    }

    if (!founded) {
        return null;
    }

    const lessons = Object.keys(course.value.modules[prevModule].lessons).reverse();
    if (lessons.length != 0) {
        return {
            module: prevModule,
            lesson: lessons[0],
        };
    }

    return null;
}
