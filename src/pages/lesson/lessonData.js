import { ref } from 'vue';
import baseUrl from '/src/components/baseUrl';
import { course, getLessonsIn, getNumLessonsInModule } from '../home/homeData';

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

/**
 * @type {Ref<{moduleNumber: number, moduleName: string, moduleTitle: string}>}
 */
export const module = ref({});

/**
 * @type {Ref<Array.<{lessonName: string, teorHtmlRef: string}>>}
 */
export const lessonsList = ref([]);

/**
 * @type {Ref<{lessonNumber: number, lessonTitle: string, lessonName: string, lessonBody: string}>}
 */
export const lesson = ref({});

/**
 * @type {Ref<number>}
 */
export const numOfLessons = ref(0);

/**
 * 
 * @param {number} _module - номер модуля
 * @param {number} _lesson - номер урока
 * @returns `true`, если данные нашлись; `false` в противном случае.
 */
export async function getLessonData(_module, _lesson) {
    const response = await fetch(`${baseUrl}api/getLessonData/${_module}/${_lesson}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
        const desc = await response.text();
        console.log(`Server responded error: ${response.status}, ${desc}`);
        return false;
    }

    const data = await response.json();
    
    const moduleInfo = course.value.modules[_module];
    const lessonInfo = moduleInfo.lessons[_lesson];

    module.value = {
        moduleNumber: moduleInfo.moduleNumber,
        moduleTitle: moduleInfo.moduleTitle,
        moduleName: moduleInfo.moduleName,
    }
    lesson.value = {
        lessonNumber: lessonInfo.lessonNumber,
        lessonTitle: lessonInfo.lessonTitle,
        lessonName: lessonInfo.lessonName,
        lessonBody: data.lesson,
    }

    lesson.value.lessonBody = await matchDocument(lesson.value.lessonBody);

    lessonsList.value = [];
    const rawLessonsData = getLessonsIn(_module);
    for (const lessonNum in rawLessonsData) {
        const rawLesson = rawLessonsData[lessonNum];
        lessonsList.value.push({
            lessonName: rawLesson.lessonName,
            teorHtmlRef: rawLesson.teorHtmlRef,
        });
    }

    numOfLessons.value = getNumLessonsInModule(module.value.moduleNumber);
    return true;
}

// ------------------------------------------------------------------------
// Обработка действий с героем

class OnTimeActions {
    /**@type Action[] */ actions = [];
    /**@type Array.<NodeJS.Timeout|Number> */ timers = [];
    /**@type {(action: Action) => boolean | null} */ callbackFunction = null;

    /**
     * 
     * @param {Action} action - действие, которое должно сработать по таймеру (параметр `onTime != null`) 
     * @returns {boolean} - `true`, если `action` добавлено в очередь; `false` если нет или уже есть в очереди
     */
    addAction(action) {
        if (action.onTime == null) {
            return false;
        }

        if (this.actions.find((act) => act.actionName == action.actionName) != undefined) {
            return false;
        }
        this.actions.push(action);
    }
    
    /**
     * Устанавливает таймеры для всех заданных событий, используя стороннюю функцию-обработчик
     */
    setTimers() {
        if (this.callbackFunction == null) {
            console.error("SetTimers: callback function must be setted up before setTimers call!");
        }

        for (const action of this.actions) {
            const timeoutNumber = setTimeout(() => {
                this.callbackFunction(action);
            }, action.onTime * 1000);
            this.timers.push(timeoutNumber);
        }

        this.actions = [];
    }

    resetTimers() {
        for (const timerNumber of this.timers) {
            clearTimeout(timerNumber);
        }

        this.timers = [];
    }
};

class ActionWrapper {
    /**@type Action */ action;
    /**@type boolean */ isShowed = false;

    /**
     * @param {Action} action 
     */
    constructor(action) {
        this.action = action;
    }
};

class OnScrollActions {
    /**@type ActionWrapper[] */ actions = [];
    /**@type {(action: Action) => boolean | null} */ callbackFunction = null;

    /**
     * @param {Action} action 
     * @returns {boolean}
     */
    addAction(action) {
        if (action.onTime != null) {
            return false;
        }
        if (this.actions.find((el) => el.action.actionName == action.actionName) != undefined) {
            return false;
        }

        this.actions.push(new ActionWrapper(action));
        return true;
    }

    handleScroll() {
        if (this.callbackFunction == null) {
            console.error("Функция callbackFunction должна быть установлена перед вызовом метода handleScroll!");
            return;
        }
        for (const action of this.actions) {
            if (action.isShowed) continue;

            // Эта строчка запрещает повторное отображение одних и тех же сообщений!!!
            action.isShowed = this.callbackFunction(action.action);
        }
    }

    cleanScrollActions() {
        this.actions = [];
    }
};

export const timerListener = new OnTimeActions();
export const scrollListener = new OnScrollActions();

const regex = /<p>@action=&quot;([^&]+)&quot;<\/p>/gm;

export class Action {
    /**@type string */ phrase = "";
    /**@type string */ emotion = "";
    /**@type string */ actionName = "";
    /**@type number|null */ onTime = null;

    /**
     * @param {string} actionName - название события
     * @param {string} phrase - фраза героя
     * @param {string} emotion - эмоция героя
     * @param {Number} [onTime = null] - время срабатывания события (если оно по времени)
     */
    constructor(actionName, phrase, emotion, onTime = null) {
        this.actionName = actionName;
        this.phrase = phrase;
        this.emotion = emotion;
        this.onTime = onTime;
    }
};

/**
 * Создаёт запрос к серверу, получает `Action` либо null, если героя нет
 * @param {string} action - текстовое название действия героя
 * @returns {Promise<Action|null>} - итоговое действие
 */
async function fetchAction(action) {
    const response = await fetch(`${baseUrl}api/getAction/${module.value.moduleNumber}/${lesson.value.lessonNumber}/${action}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
        const desc = await response.text();
        console.error(`Server responded error: ${response.status}, ${desc}`);
        return null;
    }

    const data = await response.json();
    const result = new Action(
        action,
        data.phrase,
        data.emotionImgPath,
        data.onTime
    );

    return result;
}

/**
 * Парсит документ на наличие элементов событий. Если находит, обрабатывает их соответствующим образом
 * @param {string} document - строка с документом
 * @returns {Promise<string>} новый документ с соответствующими заменами
 */
async function matchDocument(document) {
    timerListener.resetTimers();
    scrollListener.cleanScrollActions();

    let newDocument = document;
    const matches = [...document.matchAll(regex)];

    for (const match of matches) {
        const matchBody = match[0];
        const matchText = match[1];

        const action = await fetchAction(matchText);
        if (action == null) {
            const error = `Ошибка чтения события. Событие ${matchText} не найдено`;
            console.error(error);
            newDocument = newDocument.replace(matchBody, `<p style="color:red;">${error}</p>`);
        } else if (action.onTime != null) {
            console.debug(`Событие ${matchText} по времени. В документ НЕ встраивается`);
            newDocument = newDocument.replace(matchBody, "");
            timerListener.addAction(action);
        } else {
            console.debug(`Событие ${matchText} по скроллу. В документ встраивается`);
            newDocument = newDocument.replace(matchBody, `<div id="${action.actionName}"></div>`);
            scrollListener.addAction(action);
        }
    }

    return newDocument;
}

