import { ActionsWorker, HeroWorker } from "./actions-worker/actions-worker.js";
import { CourseWorker } from "./course-worker/course-worker.js";
import express from "express";
import fs from 'fs';
import path from 'path';

/**
 * @type {Object<string, {course: CourseWorker, hero: HeroWorker, action: ActionsWorker}>}
 */
export const courses = {};

/**
 * @typedef CoursesInfo
 * @type {Object}
 * @property {string[]} courses
 */

export const coursesDir = "courses";

/**
 * @type {Express}
 */
let _app = null;

/**
 * Загрузить уже лежащие на сервере курсы
 * @param {Express} app 
 * @param {string} dir
 */
export function loadExistenceCourses(app) {
    _app = app;

    const coursesNames = fs.readdirSync(coursesDir);

    for (const name of coursesNames) {
        const coursePath = path.join(coursesDir, name);
        const result = addCourse(coursePath);

        if (!result.success) {
            console.error(`[ERRO]: ${result.reason}`);
        } else {
            console.log(`[INFO]: ${name} was loaded with path ${result.courseName}`);
        }
    }

    return true;
}

/**
 * Добавляет новый курс на сервер
 * @param {string} dir - путь до папки с курсом 
 * @returns {{success: true, courseName: string} | {success: false, reason: string}}
 */
export function addCourse(dir) {
    const courseName = dir.replace('\\', '/').split('/').at(-1);

    if (courseName.includes(' ')) {
        return {
            success: false,
            reason: `Course ${courseName} has whitespaces in folder name. Please, replace spaces to underscores`,
        };
    }

    let courseWorker = null;
    let heroWorker = null;
    let actionsWorker = null;

    _app.use(`/${courseName}`, express.static(dir));
    try {
        courseWorker = new CourseWorker(dir);
        heroWorker = new HeroWorker(courseWorker);
        actionsWorker = new ActionsWorker(courseWorker, heroWorker);

    } catch (err) {
        if (err instanceof Error) {
            return {
                success: false,
                reason: err.message + "\n" + err.stack,
            };
        }
        return {
            success: false,
            reason: err,
        };
    };

    courses[courseName] = {
        course: courseWorker,
        hero: heroWorker,
        action: actionsWorker,
    };

    return {
        success: true,
        courseName: courseName,
    };
}

/**
 * Проверяет, существует ли данный курс УЖЕ или нет
 * @param {string} coursename - название загружаемого курса
 * @returns {{success: false, reason: string} | {success: true}}
 */
export function isCourseExists(coursename) {
    const coursesNames = fs.readdirSync(coursesDir);

    if (coursesNames.includes(coursename)) {
        return {
            success: false,
            reason: `Course ${coursename} is already exists. Please, change the name of course`,
        }
    }

    return {
        success: true,
    }
}

/**
 * Получить курс по имени
 * @param {string} name - имя курса (файловое)
 */
export function getCourseByPath(name) {
    return courses[name];
}

