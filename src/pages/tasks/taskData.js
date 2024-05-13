import { ref } from 'vue'
import baseUrl from '/src/components/baseUrl';

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

/**
 * @typedef {object} singleAnswerTaskType
 * @property {"singleAnswer"} taskType
 * @property {string} question
 * @property {string[]} answers
 * @property {number} correctAnswer
 * @property {number} taskNumber
 */

/**
 * @typedef {object} multipleAnswersTaskType
 * @property {"multipleAnswers"} taskType
 * @property {string} question
 * @property {string[]} answers
 * @property {number[]} correctAnswers
 * @property {number} taskNumber
 */

/**
 * @typedef {object} textFieldTaskType
 * @property {"textField"} taskType
 * @property {string} question
 * @property {string[]} correctAnswers
 * @property {number} taskNumber
 */


class TestController {
    /** @type {() => boolean | null} */
    checkAnswers = null;

    /** @type {Ref<boolean>} */
    canPerformClick = ref(true);

    reset = () => {
        this.canPerformClick.value = true;
    }
}

class HeroController {
    heroImgUrl = ref("");
    heroPhrase = ref("");

    errorTimeoutMs = 2000;
    _timeoutNumber = 0;

    showIdle() {
        this.heroImgUrl.value = reactions.value.onIdle.emotionImgPath;
        this.heroPhrase.value = reactions.value.onIdle.phrase;
    }

    async showError() {        
        this.heroImgUrl.value = reactions.value.onError.emotionImgPath;
        this.heroPhrase.value = reactions.value.onError.phrase;

        this._timeoutNumber = setTimeout(() => {
            this.showIdle();
        }, this.errorTimeoutMs);

        await getHeroTestReactions(attemptCount.value);
    }

    showSuccess() {
        this.heroImgUrl.value = reactions.value.onSuccess.emotionImgPath;
        this.heroPhrase.value = reactions.value.onSuccess.phrase;
    }

    reset() {
        clearTimeout(this._timeoutNumber);
    }
}

/** @type {Ref<number>} */
export const moduleNum = ref(null);

/** @type {Ref<number>} */
export const lessonNum = ref(null);

/** @type {Ref<singleAnswerTaskType | multipleAnswersTaskType | textFieldTaskType>} */
export const task = ref(null);

/** @type {Ref<{ onSuccess: {emotionImgPath: string, phrase: string}, onError:  {emotionImgPath: string, phrase: string}, onIdle:  {emotionImgPath: string, phrase: string} }>} */
export const reactions = ref(null);

export const testController = new TestController();

export const heroController = new HeroController();

export const attemptCount = ref(0);


export async function getTaskData(_module, _lesson, _task) {
    const fetchUrl = `${baseUrl}api/getTaskData/${_module}/${_lesson}/${_task}`;
    console.info(`Sending request to ${fetchUrl}`);

    const response = await fetch(fetchUrl, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
        const desc = await response.text();
        console.error(`Server responsed ${response.status}: ${desc}`)
        return false
    }
    task.value = await response.json();
    moduleNum.value = _module;
    lessonNum.value = _lesson;

    console.info("Task was founded");

    attemptCount.value = 0;
    await getHeroTestReactions(0);

    return true;
}

/**
 * Функция запроса реакций для теста
 * @param {number} attempt - номер попытки (начинается с 0)
 * @returns {Promise<boolean>} - результат получения реакций с сервера
 */
export async function getHeroTestReactions(attempt) {
    const fetchUrl = `${baseUrl}api/hero/testReactions/${attempt}`;
    console.info(`Sending request to ${fetchUrl}`);

    const response = await fetch(fetchUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
    });
    if (!response.ok) {
        const desc = await response.text();
        console.error(`Server responsed ${response.status}: ${desc}`);
        return false;
    }
    /**
     * @type { { data: { onSuccess: {emotionImgPath: string, phrase: string}, onError:  {emotionImgPath: string, phrase: string}, onIdle:  {emotionImgPath: string, phrase: string} } } }
     */
    const respJson = await response.json();
    reactions.value = respJson.data;

    return true;
}


