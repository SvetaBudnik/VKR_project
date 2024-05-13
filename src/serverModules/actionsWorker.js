/**
 * ACTIONS TYPE DEFINES
 * 
 * @typedef HeroPhraseType
 * @type {Object}
 * @property {string} phrase
 * @property {string} emotion
 * @property {?number} onTime
 * 
 * @typedef {object.<String, HeroPhraseType>} HeroPhrasesType
 * 
 * @typedef LessonPhrasesType
 * @type {Object}
 * @property {?HeroPhrasesType} lesson
 * 
 * @typedef ModulePhrasesType
 * @type {Object}
 * @property {?HeroPhrasesType} module
 * @property {object.<String, LessonPhrasesType>} lessons
 * 
 * @typedef CoursePhrasesType
 * @type {object}
 * @property {?HeroPhrasesType} course
 * @property {object.<String, ModulePhrasesType>} modules
 */

import fs from 'fs';
import path from 'path';

import { coursePaths } from "./serverModuleWorker.js";
import { getHeroEmotion } from './heroProvider.js';


export const actions = getActionsForCourse();

/**
 * Получает действие по имени, для модуля, для урока
 * @param {string} actionName название действия
 * @param {number} module номер модуля
 * @param {number} lesson номер урока
 * @returns {{success: false, reason: string, response: undefined} | {success: true, reason: undefined, response: {phrase: string, emotionImgPath: string, onTime: Number|null}}}
 */
export function getActionForLesson(actionName, module, lesson) {
    const _lesson = actions["modules"][module]["lessons"][lesson];
    if (_lesson != null) {
        const lessonJsons = _lesson.lesson;
        if (lessonJsons != null) {
            const actionInfo = lessonJsons[actionName];
            if (actionInfo != null) {
                return getAction(actionInfo, actionName);
            }
        }
    }

    const _module = actions["modules"][module]["module"];
    if (_module != null) {
        const moduleJsons = _module.module;
        if (moduleJsons != null) {
            const actionInfo = moduleJson[actionName];
            if (actionInfo != null) {
                return getAction(actionInfo, actionName);
            }
        }
    }

    const courseJson = actions["course"];
    if (courseJson != null) {
        const actionInfo = courseJson[actionName];
        if (actionInfo != null) {
            return getAction(actionInfo, actionName);
        }
    }

    return {
        success: false,
        reason: `Action ${actionName} not founded`
    }
}

/**
 * Получить действие с картинкой
 * @param {HeroPhraseType} actionInfo - информация о действии (json формат)
 * @param {string} actionName - название действия (необходимо для вывода ошибок)
 * @returns {{success: false, reason: string, response: undefined} | {success: true, reason: undefined, response: {phrase: string, emotionImgPath: string, onTime: Number|null}}}
 */
function getAction(actionInfo, actionName) {
    let response = {
        "phrase": "",
        "emotionImgPath": "",
        /**@type {Number | null} */ "onTime": null
    };

    const emotion = actionInfo.emotion;
    const { success, emotionImgPath } = getHeroEmotion(emotion);
    if (success) {
        response.emotionImgPath = emotionImgPath;
    }
    else {
        return {
            success: false,
            reason: `Emotion ${emotion} of Hero not founded for action ${actionName}`,
        };
    }

    response.phrase = actionInfo.phrase;
    response.onTime = actionInfo.onTime;
    return {
        success: true,
        response: response,
    };
}


function getActionsForCourse() {
    const coursePath = path.join(coursePaths.course, "..");

    // Чтение общих для всего курса фраз
    const coursePhrases = getPhrasesInFolder(coursePath);

    /**
     * @type {object.<string, ModulePhrasesType>}
     */
    let modules = {};
    for (const [moduleNumber, module] of Object.entries(coursePaths.modules)) {
        const modulePath = path.join(module.module, "..");
        const actions = getPhrasesInFolder(modulePath);

        /**
         * @type {object.<string, LessonPhrasesType>}
         */
        let lessons = {};
        for (const [lessonNumber, lesson] of Object.entries(module.lessons)) {
            const lessonPath = path.join(lesson.theory, "..");
            const actions = getPhrasesInFolder(lessonPath);
            if (actions.success) {
                /** @type {LessonPhrasesType} */
                const lessonPhrases = {
                    lesson: actions.fileData,
                }
                lessons[lessonNumber] = lessonPhrases;
            }
        }

        /** @type {ModulePhrasesType} */
        const modulePhrases = {
            lessons: lessons,
        };
        if (actions.success) {
            modulePhrases.module = actions.fileData;
        }

        modules[moduleNumber] = modulePhrases;
    }

    /** @type {CoursePhrasesType} */
    const courseInfo = {
        modules: modules,
    }
    if (coursePhrases.success) {
        courseInfo.course = coursePhrases.fileData;
    }

    console.log("\n********************************************************\n");
    console.log("Найдены следующие действия для курса: ");
    console.dir(courseInfo, {depth: null});
    console.log("\n********************************************************\n");

    return courseInfo;
}


/**
 * @param {string} dirpath 
 * @returns {{success: false, reason: string, fileData: undefined}|{success:true, reason: undefined, fileData: HeroPhrasesType}}
 */
function getPhrasesInFolder(dirpath) {
    const filepath = path.join(dirpath, 'hero-phrases.json');
    let filetext = "";
    try {
        filetext = fs.readFileSync(filepath).toString();
    } catch (err) {
        return {
            success: false,
            reason: `file ${filepath} not found`,
        };
    }
    if (filetext == "") {
        return {
            success: false,
            reason: `file ${filepath} is empty`,
        };
    }

    /**
     * @type {HeroPhrasesType}
     */
    const fileJson = JSON.parse(filetext);
    return {
        success: true,
        fileData: fileJson,
    };
}

