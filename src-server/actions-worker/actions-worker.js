import fs from 'fs';
import path from 'path';

import { CourseWorker } from '../course-worker/course-worker.js';

/**
 * ACTIONS TYPE DEFINES
 * 
 * @typedef HeroPhraseType
 * @type {Object}
 * @property {string} phrase
 * @property {string} emotion
 * @property {?number} onTime
 * 
 * @typedef {Object<string, HeroPhraseType>} HeroPhrasesType
 * 
 * @typedef LessonPhrasesType
 * @type {Object}
 * @property {?HeroPhrasesType} lesson
 * 
 * @typedef ModulePhrasesType
 * @type {Object}
 * @property {?HeroPhrasesType} module
 * @property {Object<number, LessonPhrasesType>} lessons
 * 
 * @typedef CoursePhrasesType
 * @type {object}
 * @property {?HeroPhrasesType} course
 * @property {Object<number, ModulePhrasesType>} modules
 */

export class ActionsWorker {
    _courseFolder = "";
    _actionsFilename = "static/actions.json";

    /** @type {CourseWorker} */
    _course = null;


    /** @type {CoursePhrasesType} */
    get actions() {
        return this._readActions();
    }

    /** @type {HeroWorker} */
    hero = null;

    /**
     * @param {CourseWorker} course 
     * @param {HeroWorker} hero
     */
    constructor(course, hero) {
        this.hero = hero;
        this._courseFolder = path.join(course.coursePaths.course, "../..");

        this._course = course;
        this._readActions();    // Читаем события из файлов (либо сканируем курс, если файлов нет)
    }

    /**
     * Получает действие по имени, для модуля, для урока
     * @param {string} actionName название действия
     * @param {number} module номер модуля
     * @param {number} lesson номер урока
     * @returns {{success: false, reason: string, response: undefined} | {success: true, reason: undefined, response: {phrase: string, emotionImgPath: string, onTime: Number|null}}}
     */
    getActionForLesson(actionName, module, lesson) {
        const actions = this.actions;

        const _lesson = actions.modules[module].lessons[lesson];
        if (_lesson) {
            const lessonJsons = _lesson.lesson;
            if (lessonJsons) {
                const actionInfo = lessonJsons[actionName];
                if (actionInfo) {
                    return this.getAction(actionInfo, actionName);
                }
            }
        }

        const _module = actions.modules[module].module;
        if (_module) {
            const moduleJsons = _module.module;
            if (moduleJsons) {
                const actionInfo = moduleJsons[actionName];
                if (actionInfo) {
                    return this.getAction(actionInfo, actionName);
                }
            }
        }

        const courseJson = actions.course;
        if (courseJson) {
            const actionInfo = courseJson[actionName];
            if (actionInfo) {
                return this.getAction(actionInfo, actionName);
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
    getAction(actionInfo, actionName) {
        let response = {
            phrase: "",
            emotionImgPath: "",
        /**@type {Number | null} */ onTime: null
        };

        const emotion = actionInfo.emotion;
        const { success, emotionImgPath } = this.hero.getHeroEmotion(emotion);
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

    _readActions() {
        const actionsFilePath = path.join(this._courseFolder, this._actionsFilename);
        /** @type {CoursePhrasesType} */
        let actions = {};

        if (fs.existsSync(actionsFilePath)) {
            actions = JSON.parse(fs.readFileSync(actionsFilePath));
        } else {
            actions = this._getActionsForCourse(this._course);
            fs.writeFileSync(actionsFilePath, JSON.stringify(actions));
        }

        return actions;
    }

    /**
     * Получение всех возможных реакций персонажа в теории для курса
     * @param {CourseWorker} course 
     */
    _getActionsForCourse(course) {
        const coursePath = path.join(course.coursePaths.course, "..");

        // Чтение общих для всего курса фраз
        const coursePhrases = this._getPhrasesInFolder(coursePath);

        /**
         * @type {object.<string, ModulePhrasesType>}
         */
        let modules = {};
        for (const [moduleNumber, module] of Object.entries(course.coursePaths.modules)) {
            const modulePath = path.join(module.module, "..");
            const actions = this._getPhrasesInFolder(modulePath);

            /**
             * @type {object.<string, LessonPhrasesType>}
             */
            let lessons = {};
            for (const [lessonNumber, lesson] of Object.entries(module.lessons)) {
                const lessonPath = path.join(lesson.theory, "..");
                const actions = this._getPhrasesInFolder(lessonPath);
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

        return courseInfo;
    }

    /**
     * @param {string} dirpath 
     * @returns {{success: false, reason: string}|{success:true, fileData: HeroPhrasesType}}
     */
    _getPhrasesInFolder(dirpath) {
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
        if (filetext === "") {
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
}


export class HeroWorker {
    heroFolderInCourse = "hero";
    configFileName = "config.json";
    testReactionsFileName = "test-reactions.json";

    heroFilePath = "";

    defaultHeroName = "";

    /**
     * Эмоции всех персонажей
     */
    get emotions() {
        return this._readConfigFile();
    };

    /** 
     * Реакции на тесты основного персонажа
     */
    get testReactions() {
        return this._getTestReactions();
    }

    /**
     * @param {CourseWorker} course
     */
    constructor(course) {
        this.heroFilePath = path.join(course.baseCourseDir, this.heroFolderInCourse);
        this._readConfigFile(path.join(this.heroFilePath, this.configFileName));
        this._getTestReactions(path.join(this.heroFilePath, this.testReactionsFileName));
    }

    /**
     * Получить путь до картинки с эмоцией героя
     * @param {string} emotion - эмоция героя
     * @param {string|null} heroName - имя героя
     * @returns {{success: true, emotionImgPath: string} | {success: false, reason: string}}
     */
    getHeroEmotion(emotion, heroName = null) {
        if (!heroName) {
            heroName = this.defaultHeroName;
        }

        const hero = this.emotions.find(h => h.hero === heroName);
        if (!hero) {
            return {
                success: false,
                reason: `Героя '${heroName}' не существует`,
            }
        }
        const emotionImg = hero.emotions[emotion];
        if (!emotionImg) {
            return {
                success: false,
                reason: `Эмоция ${emotion} для героя ${heroName} не существует`,
            };
        }

        /** @type {string} */
        const imgPath = path.join('/' + this.heroFilePath, hero.hero, emotionImg).replaceAll('\\', '/');
        return {
            success: true,
            emotionImgPath: imgPath,
        };
    }

    /**
     * Функция получения набора реакций по указанной попытке
     * @param {number} attempt - попытка, на которую нужны реакции (отчёт начинается с нуля)
     * @returns {{success: false, reason: string} | {success: true, result: {onIdle: {emotionImgPath: string, phrase: string}, onError: {emotionImgPath: string, phrase: string}, onSuccess: {emotionImgPath: string, phrase: string}}}}
     */
    getHeroTestReactions(attempt) {
        if (attempt < 0) {
            return {
                success: false,
                reason: "Attempt is lower than 0",
            };
        }

        /**
         * @type {{onIdle: {emotionImgPath: string, phrase: string}, onError: {emotionImgPath: string, phrase: string}, onSuccess: {emotionImgPath: string, phrase: string}}}
         */
        const reactionsSet = {
            onSuccess: {},
            onError: {},
            onIdle: {},
        };

        const testReactions = this.testReactions;

        /** @type {{emotion: string, phrases: string[]}} */
        let onSuccessReactions = null;
        if (testReactions.onSuccess.length > attempt) {
            onSuccessReactions = testReactions.onSuccess[attempt];
        } else {
            onSuccessReactions = testReactions.onSuccess.at(-1);
        }

        const successImgPath = this.getHeroEmotion(onSuccessReactions.emotion);
        if (!successImgPath.success) {
            return {
                success: false,
                reason: `Emotion ${onSuccessReactions.emotion} for succes reaction not founded for hero`,
            };
        }
        reactionsSet.onSuccess.emotionImgPath = successImgPath.emotionImgPath;
        reactionsSet.onSuccess.phrase = onSuccessReactions.phrases[Math.floor(Math.random() * onSuccessReactions.phrases.length)];

        /** @type {{emotion: string, phrases: string[]}} */
        let onErrorReactions = null;
        if (testReactions.onError.length > attempt) {
            onErrorReactions = testReactions.onError[attempt];
        } else {
            onErrorReactions = testReactions.onError.at(-1);
        }

        const errorImgPath = this.getHeroEmotion(onErrorReactions.emotion);
        if (!errorImgPath.success) {
            return {
                success: false,
                reason: `Emotion ${onErrorReactions.emotion} for error reaction not founded for hero`,
            };
        }
        reactionsSet.onError.emotionImgPath = errorImgPath.emotionImgPath;
        reactionsSet.onError.phrase = onErrorReactions.phrases[Math.floor(Math.random() * onErrorReactions.phrases.length)];

        /** @type {{emotion: string, phrases: string[]}} */
        let onIdleReactions = null;
        if (testReactions.onIdle.length > attempt) {
            onIdleReactions = testReactions.onIdle[attempt];
        } else {
            onIdleReactions = testReactions.onIdle.at(-1);
        }

        const idleImgPath = this.getHeroEmotion(onIdleReactions.emotion);
        if (!idleImgPath.success) {
            return {
                success: false,
                reason: `Emotion ${onIdleReactions.emotion} for idle reaction not founded for hero`
            };
        }
        reactionsSet.onIdle.emotionImgPath = idleImgPath.emotionImgPath;
        reactionsSet.onIdle.phrase = onIdleReactions.phrases[Math.floor(Math.random() * onIdleReactions.phrases.length)];

        return {
            success: true,
            result: reactionsSet,
        };
    }


    _readConfigFile(configFilePath = null) {
        if (!configFilePath) {
            configFilePath = path.join(this.heroFilePath, this.configFileName)
        }

        let configText = "";
        try {
            configText = fs.readFileSync(configFilePath).toString();
        }
        catch (err) {
            // TODO: избавиться от исключений по отсутствию героя (просто не добавлять обработчик героя в курс)
            console.error(`[ERRO]: ${configFilePath} - no such file`);
            throw Error(`${configFilePath} - файл конфига героя отсутствует`);
        }
        if (configText === "") {
            console.error(`[ERRO]: ${configFilePath} - file is empty`);
            throw Error(`${configFilePath} - файл конфига героя пустой`);
        }

        /** @type {{heroes: Array<{hero: string, default: true | undefined, emotions: Object<string, string>}>}} */
        const configJson = JSON.parse(configText);

        const defaultHero = configJson.heroes.find(h => h.default);
        if (!defaultHero) {
            console.error(`[ERRO]: ${configFilePath} - герой по умолчанию не определён (свойство 'default' не определено)`);
            throw Error(`${configFilePath} - герой по умолчанию не определён (свойство 'default' не определено)`);
        }
        this.defaultHeroName = defaultHero.hero;

        return configJson.heroes;
    }

    _getTestReactions(reactionsFilePath = null) {
        if (!reactionsFilePath) {
            reactionsFilePath = path.join(this.heroFilePath, this.testReactionsFileName);
        }

        const reactions = this._getHeroTestReactionsConfig(reactionsFilePath);
        if (!reactions.success) {
            console.error(`[ERRO]: Возникла ошибка при добавлении реакций героя на тест: ${reactions.reason}`);
            throw Error(`Возникла ошибка при добавлении реакций героя на тест: ${reactions.reason}`)
        }

        /**
         * @type {{onIdle: Array<{emotion: string, phrases: string[]}>, onError: Array<{emotion: string, phrases: string[]}>, onSuccess: Array<{emotion: string, phrases: string[]}>}}
         */
        const reactionsArray = {
            onIdle: [],
            onError: [],
            onSuccess: [],
        };
        const reactionTypes = Object.keys(reactionsArray);

        for (const reactionType of reactionTypes) {
            for (const attempt of Object.keys(reactions.result[reactionType].attempts)) {
                const indices = this._parseReactionIndices(attempt);
                for (const ind of indices) {
                    reactionsArray[reactionType][ind] = reactions.result[reactionType].attempts[attempt];
                }
            }
        }

        return reactionsArray;
    }

    /**
     * Получить конфиг фраз на результаты тестирования для героя
     * @param {string} directory - путь до директории, содержащей файл с фразами на результат тестирования
     * @returns {{success: true, result: {onIdle: {attempts: Object<string, {emotion: string, phrases: string[]}>}, onError: {attempts: Object<string, {emotion: string, phrases: string[]}>}, onSuccess: {attempts: Object<string, {emotion: string, phrases: string[]}>}}} | {success: false, reason: string}}
     */
    _getHeroTestReactionsConfig(reactionsFilePath) {
        let configText = "";
        try {
            configText = fs.readFileSync(reactionsFilePath).toString();
        }
        catch (err) {
            return {
                success: false,
                reason: `${reactionsFilePath} - Файл реакций на тесты героя отсутствует`,
            };
        }
        if (configText == "") {
            return {
                success: false,
                reason: `${reactionsFilePath} - Файл реакций на тесты героя пустой`,
            }
        }

        /**
         * @type {{onIdle: {attempts: Object<string, {emotion: string, phrases: string[]}>}, onError: {attempts: Object<string, {emotion: string, phrases: string[]}>}, onSuccess: {attempts: Object<string, {emotion: string, phrases: string[]}>}}}
         */
        const configJson = JSON.parse(configText);

        return {
            success: true,
            result: configJson,
        };
    }

    /**
     * Парсит индексы реакции в формат человеческих индексов
     * @param {string} attempt - запись о индексах реакции. Возможные форматы: `1`, `2-3`, `4+`
     * @returns {number[]} массив индексов (отчёт попыток начинается с 0)
     */
    _parseReactionIndices(attempt) {
        attempt = attempt.trim();
        const error = `Диапазон "${attempt}" является некорректным форматом. Необходим один из следующих форматов: 'X', 'X-Y', 'Y+'`;

        const hasMinus = attempt.includes('-');
        const hasPlus = attempt.includes('+');

        if (hasMinus && hasPlus) {
            console.error(error);
            throw error;
        }

        if (hasMinus) {
            const numbers = attempt.split('-');
            if (numbers.length != 2) {
                console.error(error);
                throw error;
            }
            const beginIndex = numbers[0] - 1;
            const endIndex = numbers[1] - 1;
            /** @type {number[]} */
            const indices = [];
            for (let i = beginIndex; i <= endIndex; i++) {
                indices.push(i);
            }
            return indices;
        } else if (hasPlus) {
            const number = attempt.split('+')[0];

            return [+number - 1];
        } else {
            const number = attempt;

            return [+number - 1];
        }
    }
}

