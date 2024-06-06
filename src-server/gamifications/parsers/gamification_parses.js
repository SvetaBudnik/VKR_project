import path from 'path';
import fs from 'fs/promises';
import { Dialog } from './dialog/dialog.js';
import { Variables, Achievements } from './gaming_config/gaming_config.js';

/**
 * @typedef Action
 * @type {Object}
 * @property {string} event
 * @property {string} type
 * @property {string} actionPath
 */


export class GamificationParser {
    /**
     * Корневая директория курса (например, `/courses/html_course`)
     */
    #courseRootDir = ""; // TODO: Удалить, если не понадобится

    /**
     * Корневая директория статических файлов курса (например, `/courses/html_course/static`)
     */
    #courseStaticFolder = "";
    #courseName = "";

    /** @type{import("../../courses").CoursesBundle} */
    #courseBundle = null;

    /** @type {Variables} */
    #variables = null;
    /** @type {Achievements} */
    #achievements = null;

    /** @type {{actions: Action[], variables: string[], achievements: {name: string, description: string, image: string}[]}} */
    gamingJson = {
        actions: [],
        variables: [],
        achievements: [],
    };

    /**
     * Сканирует курс для нахождения конфиг-файлов сложной геймификации (такой как - диалоги, монологи, ...)
     * и сохраняет их в статическом формате, готовом для работы с клиентом 
     * @param {import("../../courses").CoursesBundle} courseBundle - обработчик курса со считанными директориями 
     */
    async parseCourse(courseBundle) {
        this.#courseBundle = courseBundle;
        const courseDirectory = courseBundle.course.coursePaths;

        const courseRootDirectory = path.join(courseDirectory.course, '../..');
        this.#courseRootDir = courseRootDirectory;
        this.#courseStaticFolder = path.join(courseRootDirectory, 'static');

        // Читаем конфиг геймификации, берём оттуда переменные и достижения
        const gaming_config = JSON.parse(await fs.readFile(path.join(courseRootDirectory, "gaming-config.json")));
        this.#variables = new Variables(gaming_config);
        this.#achievements = new Achievements(gaming_config);

        // СЧИТЫВАНИЕ ГЕЙМИФИКАЦИИ В КОРНЕ КУРСА
        const courseRootDir = path.join(courseRootDirectory, 'course');
        const dirItems = await fs.readdir(courseRootDir);

        for (const filename of dirItems) {
            const filepath = path.join(courseRootDir, filename);
            await this.#parseFile(filepath);
        }

        //СЧИТЫВАНИЕ ГЕЙМИФИКАЦИИ В МОДУЛЯХ
        /** @type {Array<[string, import('../../course-worker/course-worker').ModulePaths]>} */
        const modules = Object.entries(courseDirectory.modules);
        for (const [moduleNum, modulePaths] of modules) {

            const moduleRootDir = path.join(modulePaths.module, '..');
            const dirItems = await fs.readdir(moduleRootDir);

            for (const filename of dirItems) {
                const filepath = path.join(moduleRootDir, filename);
                await this.#parseFile(filepath, moduleNum);
            }

            //СЧИТЫВАНИЕ ГЕЙМИФИКАЦИИ В УРОКАХ
            /** @type {Array<[string, import('../../course-worker/course-worker').LessonPaths]>} */
            const lessons = Object.entries(modulePaths.lessons);
            for (const [lessonNum, lessonPath] of lessons) {

                const lessonRootDir = path.join(lessonPath.theory, '..');
                const dirItems = await fs.readdir(lessonRootDir);

                for (const filename of dirItems) {
                    const filepath = path.join(lessonRootDir, filename);
                    await this.#parseFile(filepath, moduleNum, lessonNum);
                }
            }
        }

        //ДОБАВЛЕНИЕ В ГЕЙМИНГ ЖСОН ПЕРЕМЕННЫЕ И ДОСТИЖЕНИЯ
        this.gamingJson.achievements = this.#achievements.asResponse().achievements;
        this.gamingJson.variables = this.#variables.asResponse().variables;

        //ЗАПИСЬ ГЕЙМИНГ ЖСОНА В СТАТИКУ
        await fs.writeFile(path.join(this.#courseStaticFolder, 'gaming.json'), JSON.stringify(this.gamingJson));
    }

    /**
     * Сканирует курс для нахождения конфиг-файлов сложной геймификации (такой как - диалоги, монологи, ...)
     * и сохраняет их в статическом формате, готовом для работы с клиентом 
     * @param {import("../../courses").CoursesBundle} courseBundle - обработчик курса со считанными директориями 
     */
    async #parseFile(filepath, module = null, lesson = null) {
        /** @type {Action | null} */
        let action = null;

        const fstats = await fs.stat(filepath);
        if (!fstats.isFile) {
            return;
        }
        const filename = getFilename(filepath);
        if (!filename.includes('.json')) {
            return;
        }

        if (filename.toLowerCase().includes("dialog")) {
            action = await this.#parseDialog(filepath, module, lesson);
        }
        else if (filename.toLowerCase().includes("monolog")) {
            // TODO: Обработка монолога
        }

        if (action) {
            this.gamingJson.actions.push(action);
        }
    }

    /**
     * Парсит файл с диалогом, проверяет его на ошибки, а затем записывает в новый статический файл, готовый для работы
     * @param {string} filepath 
     * @param {number?} module 
     * @param {number?} lesson 
     * @returns {Promise<Action>}
     */
    async #parseDialog(filepath, module = null, lesson = null) {
        const dialog = new Dialog(filepath);
        const event = this.#fullfillEvent(filepath, dialog.event, module, lesson);

        const staticFilename = `dialog-${getRandomInt()}.json`;
        const staticFilepath = path.join(this.#courseStaticFolder, staticFilename);
        await fs.writeFile(
            staticFilepath,
            JSON.stringify(
                dialog.asResponse(this.#courseBundle.hero, this.#variables, this.#achievements)
            )
        );

        return {
            event: event,
            type: "dialog",
            actionPath: staticFilepath.replace('\\', '/'),
        }
    }


    /**
     * @param {string} filepath 
     * @param {string} event 
     * @param {number} module 
     * @param {number} lesson 
     * @throws `Error`, если тип задан неверно
     */
    #fullfillEvent(filepath, event, module = null, lesson = null) {
        // TODO: Доделать функцию

        // События, возникающие на уровне всего курса
        if (event === "onCourseStart" || event === "onCourseEnd") {
            return event + "()";
        }

        if (event.includes("onPointsRetrieve")) {
            const matched = event.match(/onPointsRetrieve\((.*), (\d*)\)/);
            if (!matched || matched.length === 0) {
                throw Error(`Файл ${filepath}: событие '${event}' задано некорректно`);
            }
            if (!this.#variables.has(matched[0])) {
                throw Error(`Файл ${filepath}: событие '${event}' ссылается на переменную ${matched[0]}, которая не определена`);
            }

            return event;
        }

        // События, возникающие на уровне конкретного модуля
        if (!module) {
            throw Error(`Файл ${filepath}: событие '${event}' задано, но сам файл находится вне директории модуля`);
        }
        if (event === "onModuleStart" || event === "onModuleEnd") {
            return event + `(${module})`;
        }

        // События, возникающие на уровне конкретного урока
        if (!lesson) {
            throw Error(`Файл ${filepath}: событие '${event}' задано, но сам файл находится вне директории урока`);
        }

        const lessonEvents = [
            "onLessonStart",
            "onLessonEnd",
            "onPracticeStart",
            "onPracticeEnd",
            "onTestStart",
            "onTestEnd",
        ];
        if (lessonEvents.includes(event)) {
            return event + `(${module}, ${lesson})`;
        }

        throw Error(`Файл ${filepath}: событие '${event}' не поддерживается либо некорректно задано`);
    }
}




function getRandomInt(max = 1000000000) {
    return Math.floor(Math.random() * max);
}

/**
 * @param {string} filepath
 * @returns {string}
 * @throws - `Error`, если строка пустая либо криво задана
 */
function getFilename(filepath) {
    const filename = filepath.replace('\\', '/').split('/').at(-1);
    if (!filename) {
        throw Error(`[ERRO]: Файл '${filepath}' - плохой параметр`)
    }

    return filename;
} 
