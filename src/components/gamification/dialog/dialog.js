import { ref } from "vue";
import loginController from "../../login";
import gamificationController from "../gamification_controller";
import router from "../../../router";

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

export const isDialogVisible = ref(false);


/** @type {Ref<{hero: string, emotionFilePath: string, text: string}[]>} */
export const dialogPhrases = ref([]);

/** @type {DialogRoot | null} */
let dialog = null;

export async function showDialog(dialogPath) {
    // TODO: пофиксить проблемку, которая возникнет при открытии нескольких диалогов одновременно (если автор курса ошибётся)
    // Суть беды: при открытии нового диалога, инфа о старом диалоге тупо затрётся
    const response = await loginController.sendGet(dialogPath);
    if (!response) {
        throw Error("Юзер не залогинен");
    }

    if (!response.ok) {
        throw Error(`Файл диалога ${dialogPath} не найден на сервере...`);
    }

    const dialogJson = await response.json();
    dialog = new DialogRoot(dialogJson)
    await getNextPhrase();

    isDialogVisible.value = true;
    router.push({name: "DialogPage"});
}

export async function getNextPhrase() {
    const next = await dialog.getNext();

    if (!next) {
        isDialogVisible.value = false;
        dialog = null;
        dialogPhrases.value = [];
        router.go(-1);

        return;
    }

    dialogPhrases.value.push({
        hero: next.hero,
        emotionFilePath: next.emotionFilePath,
        text: next.text,
    });
}


// DATATYPES

/** @typedef {DialogGivePoints | DialogGiveAchievements | DialogPhrase | DialogFork} DialogBodyItem */

class DialogPhrase {
    hero = "";
    emotionFilePath = "";
    text = "";

    /**
     * @param {Object} params
     * @param {string} params.hero
     * @param {string} params.emotionFilePath
     * @param {string} params.text
     */
    constructor({ hero, emotionFilePath, text }) {
        this.hero = hero;
        this.emotionFilePath = emotionFilePath;
        this.text = text;
    }
}

class DialogGivePoints {
    /** @type {{variable: string, value: Number}[]} */
    points = [];

    /**
     * @param {Object} params
     * @param {{variable: string, value: Number}[]} params.givePoints
     */
    constructor({ givePoints }) {
        this.points = givePoints;
    }

    async give() {
        for (const point of this.points) {
            await gamificationController.variables.add(point.value, point.value);
        }
    }
}

class DialogGiveAchievements {
    /** @type {string[]} */
    achievements = [];

    /**
     * @param {{giveAchievements: string[]}} params
     */
    constructor({ giveAchievements }) {
        this.achievements = giveAchievements;
    }

    give() {
        for (const achievement of this.achievements) {
            gamificationController.achievements.claim(achievement);
        }
    }
}

class DialogFork {
    variable = "";

    /** @type {{condition: {isElse: boolean, callback: (value) => boolean}, branch: DialogBodyItem[]}[]} */
    branches = [];

    /**
     * @param {Object} params
     * @param {Object} params.condition
     * @param {string} params.condition.variable
     * @param {Object<string, Array<object>>} params.condition.on
     */
    constructor({ condition: { variable, on } }) {
        this.variable = variable;
        Object.entries(on).forEach(([cond, body]) => {
            const conditionCallback = this.#getConditionCallback(cond);
            const isElse = cond.split(" ")[0] == "else";
            const constructedBody = constructBody(body);

            this.branches.push({
                condition: {
                    callback: conditionCallback,
                    isElse: isElse,
                },
                branch: constructedBody,
            });
        });
    }

    getBranch() {
        /** @type {DialogBodyItem[] | null} */
        let elseBranch = null;
        const valueOfVariable = gamificationController.variables.get(this.variable);

        for (const branch of this.branches) {
            if (branch.condition.isElse) {
                elseBranch = branch.branch;
                continue;
            }
            if (branch.condition.callback(valueOfVariable)) {
                return branch.branch;
            }
        }
        if (elseBranch) {
            return elseBranch;
        }

        throw Error("Ни одного условия не выполнилось");
    }

    /**
     * Возвращает коллбэк на переданное событие
     * @param {string} condition - условие вида `>= 4`, `< 25`, `else`
     */
    #getConditionCallback(condition) {
        const splittedCondition = condition.split(" ");
        const sign = splittedCondition[0];

        if (sign == "else") {
            return (val) => { return true; }
        }

        const value = Number(splittedCondition[1]);
        if (sign == ">") {
            return (val) => { return val > value; }
        }
        if (sign == "<") {
            return (val) => { return val < value; }
        }
        if (sign == ">=") {
            return (val) => { return val >= value; }
        }
        if (sign == "<=") {
            return (val) => { return val <= value; }
        }
        if (sign == "==") {
            return (val) => { return val == value; }
        }
        if (sign == "!=") {
            return (val) => { return val != value; }
        }

        throw Error(`Unsupported condition type: '${sign}'`);
    }
}

class DialogRoot {
    /** @type {DialogBodyItem[]} */
    body = [];

    /** Номер текущего элемента диалога */
    index = 0;

    /**
     * @param {{dialog: Array<object>}} params
     */
    constructor({ dialog }) {
        this.body = constructBody(dialog);
    }

    async getNext() {
        if (this.index >= this.body.length) {
            return null;
        }

        let current = this.body[this.index];
        this.index = this.index + 1;

        while (this.index <= this.body.length && !(current instanceof DialogPhrase)) {
            if (current instanceof DialogGiveAchievements) {
                current.give();
            }
            else if (current instanceof DialogGivePoints) {
                await current.give();
            }
            else if (current instanceof DialogFork) {
                const bodyBranch = current.getBranch();
                this.body = [
                    ...this.body.slice(0, this.index),
                    ...bodyBranch,
                    ...this.body.slice(this.index),
                ];
            }

            if (this.index < this.body.length) {
                current = this.body[this.index];
            }
            this.index = this.index + 1;
        }

        if (current instanceof DialogPhrase) {
            return current;
        }

        return null;
    }
}

/**
 * Обходит массив объектов, определяет их тип и добавляет в общее тело
 * @param {Object[]} body 
 */
function constructBody(body) {
    /** @type {DialogBodyItem[]} */
    const result = [];

    body.forEach((e) => {
        if (e.hero) {
            result.push(new DialogPhrase(e));
        }
        else if (e.condition) {
            result.push(new DialogFork(e));
        }
        else if (e.givePoints) {
            result.push(new DialogGivePoints(e));
        }
        else if (e.giveAchievements) {
            result.push(new DialogGiveAchievements(e));
        }
        else {
            console.error(`Объект ${JSON.stringify(e)} не поддерживается диалогами`);
        }
    });

    return result;
}
