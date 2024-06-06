import { ActionsWorker, HeroWorker } from "./actions-worker/actions-worker.js";
import { CourseWorker } from "./course-worker/course-worker.js";
import express from "express";
import fs from 'fs';
import path from 'path';
import { GamificationParser } from "./gamifications/parsers/gamification_parses.js";
import prisma from "./prisma-object.js";

/**
 * @typedef CoursesBundle
 * @type {{course: CourseWorker, hero: HeroWorker, action: ActionsWorker}}
 */

/**
 * @type {Object<string, CoursesBundle>}
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
export async function loadExistenceCourses(app) {
    _app = app;

    const coursesNames = fs.readdirSync(coursesDir);

    for (const name of coursesNames) {
        const coursePath = path.join(coursesDir, name);
        const result = await addCourse(coursePath);

        if (!result.success) {
            console.error(`[ERRO]: ${result.reason}`);
        } else {
            console.log(`[INFO]: ${name} was loaded with path ${result.coursePath}`);
        }
    }

    return true;
}

/**
 * Добавляет новый курс на сервер
 * @param {string} dir - путь до папки с курсом 
 * @returns {Promise<{success: true, coursePath: string, courseName: string} | {success: false, reason: string}>}
 */
export async function addCourse(dir) {
    const courseName = dir.replace('\\', '/').split('/').at(-1);

    if (courseName.includes(' ')) {
        return {
            success: false,
            reason: `Course ${courseName} has whitespaces in folder name. Please, replace spaces to underscores`,
        };
    }

    let courseBundle = null;
    let courseWorker = null;
    let heroWorker = null;
    let actionsWorker = null;
    let gameParser = null;

    if (fs.existsSync(path.join(dir, "static"))) {
        console.log("Удаляем статические файлы курсов, пока в режиме разработки, чтобы можно было спокойно менять курс");
        fs.rmSync(path.join(dir, "static"), { force: true, recursive: true });
    }

    _app.use(`/${courseName}`, express.static(dir));
    try {
        courseWorker = new CourseWorker(dir);
        heroWorker = new HeroWorker(courseWorker);
        actionsWorker = new ActionsWorker(courseWorker, heroWorker);
        courseBundle = {
            course: courseWorker,
            hero: heroWorker,
            action: actionsWorker,
        };

        gameParser = new GamificationParser();
        await gameParser.parseCourse(courseBundle);
    } catch (err) {
        if (err instanceof Error) {
            return {
                success: false,
                reason: err.message,
            };
        }
        return {
            success: false,
            reason: err,
        };
    };

    courses[courseName] = courseBundle;

    return {
        success: true,
        coursePath: courseName,
        courseName: courseWorker.courseHeaders.courseName,
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

/**
 * Удалить курс по имени
 * @param {string} name - имя курса (файловое)
 * @returns {boolean} `true`, если курс удалён. `false`, если нет
 */
export function removeCourseByName(name) {
    const courseBundle = courses[name];
    if (!courseBundle) {
        return false;
    }

    const courseDir = courseBundle.course.baseCourseDir;
    courses[name] = undefined;
    fs.rmdirSync(courseDir, { recursive: true });

    // Результата можем не дожидаться, пусть само в фоне удаляется
    prisma.progress.deleteMany({
        where: {
            coursename: name,
        }
    });
    return true;
}
