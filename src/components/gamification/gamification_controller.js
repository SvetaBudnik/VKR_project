import loginController from "../login";
import { showDialog } from "./dialog/dialog";
import gamificationEventController from "./gamification_event_controller";


class Variables {
    /** @type {GamificationController} */
    gameController = null;

    courseName = "";
    /** @type {Object<string, Number>} */
    vars = {};

    /**
     * @param {GamificationController} gameController
     * @param {string} courseName
     * @param {string[]} variables 
     * @param {GamificationController} gameController - контроллер геймификации
     */
    constructor(courseName, variables, gameController) {
        this.gameController = gameController;
        this.courseName = courseName;

        variables.forEach((e) => {
            this.vars[e] = 0
        });

        // Заполняем переменные, если их значения уже сохранены в прогрессе
        Object.entries(gameController.progressJson.meta_fields.variables).forEach(([name, value]) => {
            this.vars[name] = value;
        })
    }

    /**
     * Возвращает текущее значение переменной
     * @param {string} name - название переменной
     * @returns {Number | undefined} `undefined`, если переменная не определена
     */
    get(name) {
        // TODO: подумать, как получать доступ к баллам за тестовые задания
        // Пока оставляю такую реализацию
        if (name === "tests_score") {
            let sum = 0;
            for (const value of Object.values(this.gameController.progressJson.tasks)) {
                sum += +value;
            }
            return sum;
        }

        const res = this.vars[name];
        if (!res) {
            return undefined;
        }
        return res;
    }

    /**
     * Меняет значение переменной на указанное
     * @param {string} name - название переменной
     * @param {Number} value - новое значение переменной
     * @returns {Promise<Number | undefined>} `undefined`, если переменная не определена
     */
    async set(name, value) {
        const res = this.vars[name];
        if (!res) {
            return undefined;
        }

        this.vars[name] = value;

        const putVar = {};
        putVar[name] = value;
        loginController.sendPut(`api/user/stats/${this.courseName}`, {
            meta_fields: {
                variables: putVar,
            },
        });

        await gamificationEventController.emit("onPointsRetrieve", name, value);
        return value
    }

    /**
     * Добавляет к прошлому значению переменной значение `amount`
     * @param {string} name - название переменной
     * @param {Number} amount - добавочное к переменной число
     * @returns {Promise<Number | undefined>} `undefined`, если переменная не определена
     */
    async add(name, amount) {
        const prev_value = this.get(name);
        if (!prev_value) {
            return undefined;
        }

        return await this.set(name, +prev_value + amount);
    }
}


class Achievements {
    /** @type {GamificationController} */
    gameController = null;
    courseName = "";

    /** @type {Object<string, {description: string, image: string, claimed: boolean}>} */
    list = {};

    /**
     * @param {string} courseName
     * @param {{name: string, description: string, image: string}[]} achievements 
     * @param {GamificationController} gameController - список уже полученных достижений
     */
    constructor(courseName, achievements, gameController) {
        this.gameController = gameController;
        this.courseName = courseName;

        achievements.forEach((e) => {
            this.list[e.name] = {
                description: e.description,
                image: e.image,
                claimed: gameController.progressJson.meta_fields.achievements.includes(e),
            };
        });
    }

    /**
     * Выполняет проверку, выдано ли это достижение или нет
     * @param {string} name - название достижения
     */
    isClaimed(name) {
        const resp = this.list[name];
        if (!resp) {
            return undefined;
        }

        return resp.claimed;
    }

    /**
     * Выдаёт достижение, если оно не было выдано до этого
     * @param {string} name - название достижения
     */
    claim(name) {
        const claimed = this.isClaimed(name);
        if (claimed === undefined || claimed === true) {
            return undefined;
        }
        this.list[name].claimed = true;

        loginController.sendPut(`api/user/stats/${this.courseName}`, {
            meta_fields: {
                achievements: [
                    name,
                ],
            },
        });

        return true;
    }
}

class GamificationController {
    /** 
     * @typedef ActionsTypes
     * @type {"dialog"}
     */

    loadedCourseName = "";

    /** @type {null | Achievements} */
    achievements = null;
    /** @type {null | Variables} */
    variables = null;

    /**
     * @type {{lessons: Object<string, boolean>, tasks: Object<string, number>, meta_fields: {achievements: string[], variables: Object<string, number>}}}
     */
    progressJson = null;

    /**
     * @param {string} courseName 
     * @returns {Promise<void>} 
     */
    async loadCourse(courseName) {
        if (courseName === this.loadedCourseName) {
            return;
        }

        const response = await loginController.sendGet(`${courseName}/static/gaming.json`);
        if (!response) {
            throw Error("Юзер не залогинен!!");
        }

        if (!response.ok) {
            console.error(`Геймификация в курсе ${courseName} не найдена`);
            return;
        }

        /**
         * @type {{actions: {event: string, type: ActionsTypes, actionPath: string}[], variables: string[], achievements: {name: string, description: string, image: string}[]}}
         */
        const respJson = await response.json();

        const progressInfo = await loginController.sendGet(`api/user/stats/${courseName}`);
        if (!progressInfo.ok) {
            console.error(`Информация о прогрессе в указанном курсе '${courseName}' не найдена`);
            return;
        }

        /**
         * @type {{lessons: Object<string, boolean>, tasks: Object<string, number>, meta_fields: {achievements: string[], variables: Object<string, number>}}}
         */
        this.progressJson = await progressInfo.json();

        this.variables = new Variables(courseName, respJson.variables, this);
        this.achievements = new Achievements(courseName, respJson.achievements, this);
        this.#parseActions(respJson.actions);

        this.loadedCourseName = courseName;
    }

    /**
     * Обрабатывает начало указанного урока и создаёт соответствующие события (если требуется):
     * - `onLessonStart(module, lesson)`
     * - `onModuleStart(module)`
     * - `onCourseStart()`
     * @param {number} module - номер модуля
     * @param {number} lesson - номер урока
     */
    async startLesson(module, lesson) {
        const name = `${module}-${lesson}`;
        if (this.progressJson.lessons[name]) {
            return;
        }

        // Вызываем событие начала урока
        await gamificationEventController.emit("onLessonStart", module, lesson);

        // Проверяем, является ли это началом модуля, путём проверки
        // пройден ли хоть один урок или тест этого модуля
        let isModuleStarted = false;

        for (const name of Object.keys(this.progressJson.lessons)) {
            // Если имя урока не содержит в себе номер текущего модуля, то пропускаем
            if (!name.includes(`${module}-`)) {
                continue;
            }

            const isLessonCompleted = this.progressJson.lessons[name];
            const test = this.progressJson.tasks[name];
            let isTestCompleted = false;
            if (test) {
                isTestCompleted = test > 0;
            }

            if (isLessonCompleted || isTestCompleted) {
                isModuleStarted = true;
                break;
            }
        }

        if (!isModuleStarted) {
            await gamificationEventController.emit("onModuleStart", module);
        }

        // Проверяем, является ли это началом курса, путём проверки
        // пройден ли хоть один урок или тест этого курса
        let isCourseStarted = false;
        for (const name of Object.keys(this.progressJson.lessons)) {
            const isLessonCompleted = this.progressJson.lessons[name];
            const test = this.progressJson.tasks[name];
            let isTestCompleted = false;
            if (test) {
                isTestCompleted = test > 0;
            }

            if (isLessonCompleted || isTestCompleted) {
                isCourseStarted = true;
                break;
            }
        }

        if (!isCourseStarted) {
            await gamificationEventController.emit("onCourseStart");
        }
    }

    /**
     * Обрабатывает начало теста указанного урока и создаёт соответствующие события (если требуется):
     * - `onTestStart(module, lesson)`
     * - `onModuleStart(module)`
     * - `onCourseStart()`
     * @param {number} module - номер модуля
     * @param {number} lesson - номер урока, которому принадлежит тест
     */
    async startTest(module, lesson) {
        const name = `${module}-${lesson}`;
        if (this.progressJson.tasks[name] != 0) {
            return;
        }

        // Вызываем событие начала урока
        await gamificationEventController.emit("onTestStart", module, lesson);

        // Проверяем, является ли это началом модуля, путём проверки
        // пройден ли хоть один урок или тест этого модуля
        let isModuleStarted = false;
        for (const name of Object.keys(this.progressJson.lessons)) {
            // Если имя урока не содержит в себе номер текущего модуля, то пропускаем
            if (!name.includes(`${module}-`)) {
                continue;
            }

            const isLessonCompleted = this.progressJson.lessons[name];
            const test = this.progressJson.tasks[name];
            let isTestCompleted = false;
            if (test) {
                isTestCompleted = test > 0;
            }

            if (isLessonCompleted || isTestCompleted) {
                isModuleStarted = true;
                break;
            }
        }

        if (!isModuleStarted) {
            await gamificationEventController.emit("onModuleStart", module);
        }

        // Проверяем, является ли это началом курса, путём проверки
        // пройден ли хоть один урок или тест этого курса
        let isCourseStarted = false;
        for (const name of Object.keys(this.progressJson.lessons)) {
            const isLessonCompleted = this.progressJson.lessons[name];
            const test = this.progressJson.tasks[name];
            let isTestCompleted = false;
            if (test) {
                isTestCompleted = test > 0;
            }

            if (isLessonCompleted || isTestCompleted) {
                isCourseStarted = true;
                break;
            }
        }

        if (!isCourseStarted) {
            await gamificationEventController.emit("onCourseStart");
        }
    }

    /**
     * Обрабатывает конец указанного урока и создаёт соответствующие события (если требуется):
     * - `onLessonEnd(module, lesson)`
     * - `onModuleEnd(module)`
     * - `onCourseEnd()`
     * Также синхронизирует данные с сервером
     * @param {number} module - номер модуля
     * @param {number} lesson - номер урока
     */
    async endLesson(module, lesson) {
        const name = `${module}-${lesson}`;

        // Если урок уже был пройден, то просто возвращаем
        if (this.progressJson.lessons[name]) {
            return;
        }

        this.progressJson.lessons[name] = true;

        const lessonPut = {};
        lessonPut[name] = true;
        loginController.sendPut(`api/user/stats/${this.loadedCourseName}`, {
            lessons: lessonPut,
        });

        // Вызываем событие конца урока
        await gamificationEventController.emit("onLessonEnd", module, lesson);

        // Проверяем, является ли это концом модуля, путём проверки
        // пройдены ли все роки и тесты этого модуля
        let isModuleEnded = true;
        for (const name of Object.keys(this.progressJson.lessons)) {
            // Если имя урока не содержит в себе номер текущего модуля, то пропускаем
            if (!name.includes(`${module}-`)) {
                continue;
            }

            const isLessonCompleted = this.progressJson.lessons[name];
            const test = this.progressJson.tasks[name];
            let isTestCompleted = true;
            if (test) {
                isTestCompleted = test > 0;
            }

            if (!isLessonCompleted || !isTestCompleted) {
                isModuleEnded = false;
                break;
            }
        }

        if (isModuleEnded) {
            await gamificationEventController.emit("onModuleEnd", module);
        }

        // Проверяем, является ли это концом курса, путём проверки
        // пройдены ли все роки и тесты этого модуля
        let isCourseEnded = true;
        for (const name of Object.keys(this.progressJson.lessons)) {
            const isLessonCompleted = this.progressJson.lessons[name];
            const test = this.progressJson.tasks[name];
            let isTestCompleted = true;
            if (test) {
                isTestCompleted = test > 0;
            }

            if (!isLessonCompleted || !isTestCompleted) {
                isCourseEnded = false;
                break;
            }
        }

        if (isCourseEnded) {
            await gamificationEventController.emit("onCourseEnd");
        }
    }

    /**
     * Обрабатывает конец указанного теста и создаёт соответствующие события (если требуется):
     * - `onTestEnd(module, lesson)`
     * - `onModuleEnd(module)`
     * - `onCourseEnd()`
     * Также синхронизирует данные с сервером
     * @param {number} module - номер модуля
     * @param {number} lesson - номер урока
     * @param {number} score - количество полученных за тест баллов
     */
    async endTest(module, lesson, score) {
        const name = `${module}-${lesson}`;

        // Если тест уже был пройден, то просто возвращаем
        if (this.progressJson.tasks[name] > 0) {
            return;
        }

        console.log(`Полученные баллы за тест: ${score}`);
        this.progressJson.tasks[name] = score;

        const taskPut = {};
        taskPut[name] = score;
        loginController.sendPut(`api/user/stats/${this.loadedCourseName}`, {
            tasks: taskPut,
        });

        // Вызываем событие конца урока
        await gamificationEventController.emit("onTestEnd", module, lesson);

        // Проверяем, является ли это концом модуля, путём проверки
        // пройдены ли все роки и тесты этого модуля
        let isModuleEnded = true;
        for (const name of Object.keys(this.progressJson.lessons)) {
            // Если имя урока не содержит в себе номер текущего модуля, то пропускаем
            if (!name.includes(`${module}-`)) {
                continue;
            }

            const isLessonCompleted = this.progressJson.lessons[name];
            const test = this.progressJson.tasks[name];
            let isTestCompleted = true;
            if (test) {
                isTestCompleted = test > 0;
            }

            if (!isLessonCompleted || !isTestCompleted) {
                isModuleEnded = false;
                break;
            }
        }

        if (isModuleEnded) {
            await gamificationEventController.emit("onModuleEnd", module);
        }

        // Проверяем, является ли это концом курса, путём проверки
        // пройдены ли все роки и тесты этого модуля
        let isCourseEnded = true;
        for (const name of Object.keys(this.progressJson.lessons)) {
            const isLessonCompleted = this.progressJson.lessons[name];
            const test = this.progressJson.tasks[name];
            let isTestCompleted = true;
            if (test) {
                isTestCompleted = test > 0;
            }

            if (!isLessonCompleted || !isTestCompleted) {
                isCourseEnded = false;
                break;
            }
        }

        if (isCourseEnded) {
            await gamificationEventController.emit("onCourseEnd");
        }
    }

    /**
     * Обрабатывает заданные для данного курса реакции на события, и подписывает 
     * эти реакции на соответствующие им события
     * @param {{event: string, type: ActionsTypes, actionPath: string}[]} actions - события курса
     */
    #parseActions(actions) {
        actions.forEach((action) => {
            let actionName = "";
            let firstParam = null;
            let secondParam = null;

            // Ивенты задаются в трёх видах, поэтому парсим все три отдельно - авось один из них совпадёт
            const zeroParamsRegex = RegExp(/([a-zA-Z]*)\(\)/).exec(action.event);
            const oneParamsRegex = RegExp(/([a-zA-Z]*)\((\d+)\)/).exec(action.event);
            const twoParamsRegex = RegExp(/([a-zA-Z]*)\((\w+), (\d+)\)/).exec(action.event);

            // Заполняем соответствующие параметры, если совпало
            if (zeroParamsRegex) {
                actionName = zeroParamsRegex[1];
            }
            else if (oneParamsRegex) {
                actionName = oneParamsRegex[1];
                firstParam = oneParamsRegex[2];
            }
            else if (twoParamsRegex) {
                actionName = twoParamsRegex[1];
                firstParam = twoParamsRegex[2];
                secondParam = twoParamsRegex[3];
            }
            else {
                throw Error(`Непонятное: ${action.event}`);
            }

            // Обработчики будут похожими, так что
            if (action.type === "dialog") {
                let callback;
                if (actionName == "onPointsRetrieve") {
                    callback = async (variable, value) => {
                        if (variable == firstParam && value >= secondParam) {
                            await showDialog(action.actionPath);
                            return true;
                        }
                        return false;
                    }
                }
                else {
                    // Создаём функцию, принимающую до двух числовых параметров параметров
                    callback = async (module = null, lesson = null) => {
                        // null == null - true, поэтому даже если передадим только 1 или 0 параметров, всё будет работать
                        if (module == firstParam && lesson == secondParam) {
                            await showDialog(action.actionPath);
                            return true;
                        }
                        return false;
                    }
                }
                // Добавляем эту функцию как слушателя
                gamificationEventController.subscribe(actionName, callback);
            }
        });
    }
}

const gamificationController = new GamificationController();

export default gamificationController;
