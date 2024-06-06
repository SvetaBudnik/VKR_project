/**
 * @typedef GamingEvents
 * @type {"onCourseStart" | "onCourseEnd" | "onModuleStart" | "onModuleEnd" | "onLessonStart" | "onLessonEnd" | "onPracticeStart" | "onPracticeEnd" | "onTestStart" | "onTestEnd" | "onPointsRetrieve"}
 */

const noParamEvents = [
    "onCourseStart",
    "onCourseEnd",
];
const singleParamEvents = [
    "onModuleStart",
    "onModuleEnd",
];
const doubleParamEvents = [
    "onLessonStart",
    "onLessonEnd",
    "onPracticeStart",
    "onPracticeEnd",
    "onTestStart",
    "onTestEnd",
    "onPointsRetrieve",
];
const allEvents = [
    ...noParamEvents,
    ...singleParamEvents,
    ...doubleParamEvents,
];

class GamificationEventController {
    /** 
     * @typedef {Object} EventHandlersType
     * @property {Array<null | function(): Promise<boolean | void>>} onCourseStart
     * @property {Array<null | function(): Promise<boolean | void>>} onCourseEnd
     * @property {Array<null | function(number): Promise<boolean | void>>} onModuleStart
     * @property {Array<null | function(number): Promise<boolean | void>>} onModuleEnd
     * @property {Array<null | function(number, number): Promise<boolean | void>>} onLessonStart
     * @property {Array<null | function(number, number): Promise<boolean | void>>} onLessonEnd
     * @property {Array<null | function(number, number): Promise<boolean | void>>} onPracticeStart
     * @property {Array<null | function(number, number): Promise<boolean | void>>} onPracticeEnd
     * @property {Array<null | function(number, number): Promise<boolean | void>>} onTestStart
     * @property {Array<null | function(number, number): Promise<boolean | void>>} onTestEnd
     * @property {Array<null | function(string, number): Promise<boolean | void>>} onPointsRetrieve
     */

    /**
     * @type {EventHandlersType}
     */
    #eventHandlers = {
        onCourseStart: [],
        onCourseEnd: [],
        onModuleStart: [],
        onModuleEnd: [],
        onLessonStart: [],
        onLessonEnd: [],
        onPracticeStart: [],
        onPracticeEnd: [],
        onTestStart: [],
        onTestEnd: [],
        onPointsRetrieve: [],
    };

    /**
     * Создаёт указанное событие
     * @param {GamingEvents} eventName - название события
     * @param {any?} param1 - номер модуля либо название переменной
     * @param {any?} param2 - номер урока либо новое значение переменной
     */
    async emit(eventName, param1 = null, param2 = null) {
        console.info(`Emmited ${eventName}(${param1}, ${param2})`);

        if (doubleParamEvents.includes(eventName)) {
            if (param1 === null || param2 === null) {
                throw Error(`On double param events, params 'module' and 'lesson' must be setted`);
            }

            for (const key in this.#eventHandlers[eventName]) {
                const e = this.#eventHandlers[eventName][key];
                if (e) {
                    const res = await e(param1, param2);
                    if (res) {
                        this.#eventHandlers[eventName][key] = null;
                    }
                }
            }
            return;
        }

        if (singleParamEvents.includes(eventName)) {
            if (param1 === null) {
                throw Error(`On single param events, param 'module' must be setted`);
            }

            for (const key in this.#eventHandlers[eventName]) {
                const e = this.#eventHandlers[eventName][key];
                if (e) {
                    const res = await e(param1, param2);
                    if (res) {
                        this.#eventHandlers[eventName][key] = null;
                    }
                }
            }

            return;
        }

        if (noParamEvents.includes(eventName)) {
            for (const key in this.#eventHandlers[eventName]) {
                const e = this.#eventHandlers[eventName][key];
                if (e) {
                    const res = await e(param1, param2);
                    if (res) {
                        this.#eventHandlers[eventName][key] = null;
                    }
                }
            }
            return;
        }

        throw Error(`Unknown event name: '${eventName}'`);
    }


    /**
     * Добавляет функцию-слушателя события (будет реагировать на любое происходящее событие!)
     * @param {GamingEvents} eventName - название события 
     * @param {Array<function(number | string, number): Promise> | Array<function(number): Promise> | Array<function(): Promise>} callback - функция реакции
     */
    subscribe(eventName, callback) {
        if (!allEvents.includes(eventName)) {
            throw Error(`Unknown event name: ${eventName}`);
        }

        this.#eventHandlers[eventName].push(callback);
    }

    /**
     * Убирает функцию-слушателя события
     * @param {GamingEvents} eventName - название события 
     * @param {Array<function(number, number): Promise> | Array<function(number): Promise> | Array<function(): Promise>} callback - функция реакции
     */
    unsubscribe(eventName, callback) {
        if (!allEvents.includes(eventName)) {
            throw Error(`Unknown event name: ${eventName}`);
        }

        const ind = this.#eventHandlers[eventName].indexOf(callback);
        if (ind === -1) {
            return;
        }
        this.#eventHandlers[eventName][ind] = null;
    }

    /** */
    reset() {
        Object.keys(this.#eventHandlers).forEach((e) => {
            this.#eventHandlers[e] = [];
        });

        console.info("Gamification event controller resetted");
    }
}

const gamificationEventController = new GamificationEventController();



export default gamificationEventController;



