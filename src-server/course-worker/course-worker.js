import { marked } from 'marked';
import fs, { stat } from 'fs';
import path from 'path';

/**
 * @typedef LessonPaths
 * @type {Object}
 * @property {string} theory
 * @property {string} tasks
 * 
 * @typedef ModulePaths
 * @type {Object}
 * @property {string} module
 * @property {Object<number, LessonPaths>} lessons
 * 
 * @typedef CoursePaths
 * @type {Object}
 * @property {string} course
 * @property {Object<number, ModulePaths>} modules
 * 
 * @typedef LessonHeaders
 * @type {Object}
 * @property {number} lessonNumber
 * @property {string} lessonTitle
 * @property {string} lessonName
 * @property {number} tasksCount
 * 
 * @typedef ModuleHeaders
 * @type {Object}
 * @property {number} moduleNumber
 * @property {string} moduleTitle
 * @property {string} moduleName
 * @property {Object<number, LessonHeaders>} lessons
 * 
 * @typedef CourseHeaders
 * @type {Object}
 * @property {string} courseName
 * @property {Object<number, ModuleHeaders>} modules
 */

export class CourseWorker {
    _coursePathsFilename = "coursePaths.json";
    _courseHeadersFilename = "courseHeaders.json";

    baseCourseDir = "";

    /** @type {CoursePaths | null} */
    coursePaths = null;

    /** @type {CourseHeaders | null} */
    courseHeaders = null;

    constructor(directory) {
        this.baseCourseDir = directory;
        this._readCourseInfo();  // Читаем инфу о курсе (если она есть - то просто из файлов, иначе сканируем курс)
        this._writeCourseInfo(); // Записываем инфу о курсе в файлы (неважно, были они или нет)
    }

    //TODO: Реализовать сохранение ранее сконвертированных .md файлов в html формате в отдельную директорию курса

    /**
     * Получить текст указанного урока
     * @param {number} _module 
     * @param {number} _lesson 
     * @returns {{success: false, reason: string} | {success: true, data: {lesson: string}}}
     */
    getLessonFor(_module, _lesson) {
        this._readCourseInfo();

        const module = this.coursePaths.modules[_module];
        if (module === null) {
            return {
                success: false,
                reason: `Module ${_module} not founded`,
            };
        }
        const lesson = module.lessons[_lesson];
        if (lesson === null) {
            return {
                success: false,
                reason: `Lesson ${_lesson} not founded`,
            };
        }

        let theoryText = "";

        const staticFilesFolder = path.join(this.baseCourseDir, 'static');
        if (!fs.existsSync(staticFilesFolder)) {
            fs.mkdirSync(staticFilesFolder, { recursive: true });
        }
        const staticFile = path.join(staticFilesFolder, `${_module}_${_lesson}_lesson.html`);

        if (fs.existsSync(staticFile)) {
            theoryText = fs.readFileSync(staticFile).toString();
        } else {
            const filepath = lesson.theory;
            let md;
            try {
                const rawMd = fs.readFileSync(filepath);
                md = rawMd.toString();
            } catch {
                console.error(`Lesson file for lesson ${_lesson} on module ${_module} not founded by path ${filepath}`);
                return {
                    success: false,
                    reason: `Lesson file for lesson ${_lesson} on module ${_module} not founded`,
                };
            }

            theoryText = marked(md);
            fs.writeFileSync(staticFile, theoryText);

            this._writeCourseInfo();
        }

        return {
            success: true,
            data: {
                lesson: theoryText,
            }
        }
    }

    /**
     * Находит тестовое задание в данном курсе
     * @param {number} _module номер модуля (аналогично тому, как определено в курсе)
     * @param {number} _lesson номер урока (аналогично тому, как определено в курсе)
     * @param {number} _task номер задания (отсчёт с единицы)
     * @returns {{success: false, reason: string} | {success: true, data: {taskNumber: number, taskType: string, question: string, answers: string[] | null, correctAnswer: number | null, correctAnswers: number[] | string[] | null}}}
     */
    findTaskParams(_module, _lesson, _task) {
        this._readCourseInfo();

        const module = this.coursePaths.modules[_module];
        if (module === null) {
            return {
                success: false,
                reason: `Module ${_module} wasn't founded on server`,
            };
        }

        const lesson = module.lessons[_lesson];
        if (lesson === null) {
            return {
                success: false,
                reason: `Lesson ${_lesson} wasn't founded on server for module ${_module}`,
            };
        }
        if (this.courseHeaders.modules[_module].lessons[_lesson].tasksCount === 0) {
            return {
                success: false,
                reason: `Lesson ${_lesson} in module ${_module} don't have any tasks`,
            };
        }

        const tasksPath = lesson.tasks;
        const tasks = JSON.parse(fs.readFileSync(tasksPath)).data;
        const requestedTaskInfo = tasks[_task - 1];
        if (requestedTaskInfo === null) {
            return {
                success: false,
                reason: `Task ${_task} not founded in lesson ${_lesson} on module ${_module}`,
            };
        }

        requestedTaskInfo.taskNumber = _task;
        return {
            success: true,
            data: requestedTaskInfo,
        };
    }

    /**
     * Освобождает память, занимаемою курсом (если понадобится)
     */
    freeMemory() {
        this._writeCourseInfo();

        this.coursePaths = null;
        this.courseHeaders = null;
    }

    /**
     * Записывает информацию о курсе в соответствующие json файлы.
     */
    _writeCourseInfo() {
        const pathsFilePath = path.join(this.baseCourseDir, this._coursePathsFilename);
        const headersFilePath = path.join(this.baseCourseDir, this._courseHeadersFilename);

        fs.writeFileSync(pathsFilePath, JSON.stringify(this.coursePaths));
        fs.writeFileSync(headersFilePath, JSON.stringify(this.courseHeaders));
    }

    /**
     * Загружает информацию о курсе из соответствующих json файлов (либо сканирует директорию заново, если файлов нет).
     * Меняет при этом переменные `coursePaths` и `courseHeaders` (если они пусты)
     */
    _readCourseInfo() {
        if (this.coursePaths !== null && this.courseHeaders !== null) {
            return;
        }

        const courseName = this.baseCourseDir.split('/').at(-1);

        const pathsFilePath = path.join(this.baseCourseDir, this._coursePathsFilename);
        const headersFilePath = path.join(this.baseCourseDir, this._courseHeadersFilename);

        if (fs.existsSync(pathsFilePath) && fs.existsSync(headersFilePath)) {
            console.log(`[INFO]: ${courseName}._readCourseInfo: info exists`);
            this.coursePaths = JSON.parse(fs.readFileSync(pathsFilePath));
            this.courseHeaders = JSON.parse(fs.readFileSync(headersFilePath));
        } else {
            console.log(`[INFO]: ${courseName}._readCourseInfo: info exists`);
            this.coursePaths = this._readCourse(path.join(this.baseCourseDir, 'course'));
            this.courseHeaders = this._getCourseHeaders(this.coursePaths);
        }
    }


    /**
     * Находит пути до файлов, связанных с уроком
     * @param {string} directory - папка, содержащая файлы курса
     * @returns {LessonPaths} пути до файлов курса
     */
    _readLessonInfo(directory) {
        let result = {
            theory: "",
            tasks: "",
        };

        const filenames = fs.readdirSync(directory);

        filenames.forEach((file) => {
            const filepath = path.join(directory, file);
            const stats = fs.statSync(filepath);

            if (stats.isFile() && file.endsWith(".md")) {
                result.theory = filepath;
            } else if (stats.isFile() && file === "tasks.json") {
                result.tasks = filepath;
            }
        });

        return result;
    }

    /**
     * Находит пути до файлов, связанных с модулем
     * @param {string} directory - папка, содержащая файлы модуля
     * @returns {ModulePaths} пути до файлов модуля
     */
    _readModuleInfo(directory) {
        /** @type {ModulePaths} */
        let result = {
            module: "",
            lessons: {},
        };

        const filenames = fs.readdirSync(directory);

        filenames.forEach((file) => {
            const filepath = path.join(directory, file);
            const stats = fs.statSync(filepath);

            if (stats.isFile() && file.endsWith(".md")) {
                result.module = filepath;
            } else if (stats.isDirectory()) {
                const lessonInfo = this._readLessonInfo(filepath);
                const lessonNumber = parseInt(file.split(" ").filter((val, _, __) => val.length != 0)[1]);
                result.lessons[lessonNumber] = lessonInfo;
            }
        });

        return result;
    }

    /**
     * Находит пути до файлов, связанных с курсом
     * @param {string} directory - папка, содержащая файлы курса
     * @returns {CoursePaths} пути до файлов курса
     */
    _readCourse(directory) {
        /** @type {CoursePaths} */
        let result = {
            course: "",
            modules: {},
        };

        const filenames = fs.readdirSync(directory);

        filenames.forEach((file) => {
            const filepath = path.join(directory, file);
            const stats = fs.statSync(filepath);

            if (stats.isFile() && file.endsWith(".md")) {
                result.course = filepath;
            } else if (stats.isDirectory()) {
                const moduleInfo = this._readModuleInfo(filepath);
                const moduleNumber = parseInt(file.split(" ").filter((val) => val.length != 0)[1]);
                result.modules[moduleNumber] = moduleInfo;
            }
        });

        return result;
    }

    /**
     * Находит название урока и число тестов для урока
     * @param {LessonPaths} lesson - пути файлов, связанных с уроком
     * @returns {{lessonName: string, tasksCount: number} | null} заголовок урока и число задач в уроке
     */
    _getLessonHeaders(lesson) {
        let headers = {
            lessonName: "",
            tasksCount: 0,
        };


        const lessonFile = fs.readFileSync(lesson.theory).toString();
        const lessonHeaders = lessonFile.match(/### .+/g);
        if (lessonHeaders === null) {
            console.error(`Заголовок урока ${lesson.theory} неверный. Ожидалось что-то типа '### Название урока'`);
            return null;
        }

        headers.lessonName = lessonHeaders[0].slice(4);

        if (lesson.tasks !== "") {
            const testsFile = fs.readFileSync(lesson.tasks).toString();
            if (testsFile !== "") {
                const testsJson = JSON.parse(testsFile);
                if (testsJson.data != null) {
                    headers.tasksCount = testsJson.data.length;
                }
            }
        }

        return headers;
    }

    /**
     * Находит название модуля и названия уроков этого модуля
     * @param {ModulePaths} module - информация о структуре файлов в модуле
     * @returns {{moduleName: string, lessons: Object<number, LessonHeaders>} | null}
     */
    _getModuleHeaders(module) {
        /** @type {{moduleName: string, lessons: Object<number, LessonHeaders>}} */
        let headers = {
            moduleName: "",
            lessons: {},
        };

        const moduleFile = fs.readFileSync(module.module).toString();
        const moduleHeaders = moduleFile.match(/## .+/g);
        if (moduleHeaders == null) {
            console.error(`Заголовок модуля ${module.module} неверный. Ожидалось что-то типа '## Название модуля'`);
            return null;
        }

        headers.moduleName = moduleHeaders[0].slice(3);
        for (const key in module.lessons) {
            let lessonHeader = {
                lessonNumber: key,
                lessonTitle: `Урок ${key}`,
                lessonName: "",
                tasksCount: 0,
            };

            const lesHeader = this._getLessonHeaders(module.lessons[key]);
            if (lesHeader === null) {
                console.error("Произошла ошибка при чтении хедера урока");
                return null;
            }
            lessonHeader.lessonName = lesHeader.lessonName;
            lessonHeader.tasksCount = lesHeader.tasksCount;

            headers.lessons[key] = lessonHeader;
        }

        return headers;
    }

    /**
     * Читает название курса и названия модулей
     * @param {CoursePaths} course - пути файлов курса
     * @returns {{courseName: string, modules: Object<number, ModuleHeaders>} | null}
     */
    _getCourseHeaders(course) {
        if (course === null) return null;

        /**
         * @type {{courseName: string, modules: ModuleHeaders}}
         */
        let headers = {
            courseName: "",
            modules: {},
        };

        const courseFile = fs.readFileSync(course.course).toString();
        const courseHeaders = courseFile.match(/# .+/g);
        if (courseHeaders == null) {
            console.error("Заголовок курса неверный. Ожидалось что-то типа '# Название курса'");
            return null;
        }
        headers.courseName = courseHeaders[0].slice(2);
        for (const key in course.modules) {
            let moduleHeaders = {
                moduleNumber: key,
                moduleTitle: `Модуль ${key}`,
                moduleName: "",
                lessons: {},
            };

            const modHeaders = this._getModuleHeaders(course.modules[key]);
            if (modHeaders == null) {
                console.error("Ошибка считывания заголовков модуля");
            } else {
                moduleHeaders.moduleName = modHeaders.moduleName;
                moduleHeaders.lessons = modHeaders.lessons;
                headers.modules[key] = moduleHeaders;
            }
        }

        // console.log("\n********************************************************\n");
        // console.log("Найдены следующие файлы курса: ");
        // console.dir(headers, { depth: null });
        // console.log("\n********************************************************\n");

        return headers;
    }
}