import { HeroWorker } from "../../../actions-worker/actions-worker.js";
import fs from 'fs';
import { Achievements, Variables } from "../gaming_config/gaming_config.js";

class _DialogElement {
    hero = "";
    emotion = "";
    text = "";

    jsonFilepath = "";

    /**
     * @param {string} jsonFilepath - путь до json-файла с данным диалогом
     * @param {Object} params
     * @param {string} params.hero - имя героя
     * @param {string} params.emotion - эмоция героя
     * @param {string} params.text - фраза героя
     */
    constructor(jsonFilepath, { hero, emotion, text }) {
        this.hero = hero;
        this.emotion = emotion;
        this.text = text;
        this.jsonFilepath = jsonFilepath;
    }

    /**
     * @param {HeroWorker} heroWorker
     * @throws `Error`, если нет реакции или героя
     */
    asResponse(heroWorker) {
        const result = heroWorker.getHeroEmotion(this.emotion, this.hero);
        if (!result.success) {
            throw Error(`Файл '${this.jsonFilepath}', ошибка при обработке диалога: ${result.reason}`);
        }
        return {
            hero: this.hero,
            emotionFilePath: result.emotionImgPath,
            text: this.text,
        };
    }
}

class _DialogFork {
    variable = "";

    /**
     * @type {Object<string, Array<DialogBodyTypes>>}
     */
    cases = {};

    jsonFilepath;

    acceptableKeys = [
        ">",
        "<",
        "==",
        ">=",
        "<=",
        "else",
    ];

    /**
     * @param {string} jsonFilepath - путь до json-файла с данным диалогом
     * @param {Object} params
     * @param {Object} params.condition
     * @param {string} params.condition.variable
     * @param {Object<string, Array<*>>} params.condition.on
     */
    constructor(jsonFilepath, { condition: { variable, on } }) {
        this.variable = variable;
        this.jsonFilepath = jsonFilepath;

        Object.entries(on).forEach(([key, val]) => {
            const keySign = key.split(" ")[0];
            if (!this.acceptableKeys.includes(keySign)) {
                throw Error(`Файл '${this.jsonFilepath}', некорректный ключ сравнения '${keySign}'. Применимы только '${this.acceptableKeys.join(', ')}'`)
            }

            const items = [];
            val.forEach((item) => {
                if (item.hero) {
                    items.push(new _DialogElement(jsonFilepath, item));
                } else if (item.type && item.type === "fork") {
                    items.push(new _DialogFork(jsonFilepath, item));
                }  else if (item.givePoints) {
                    items.push(new _Variables(jsonFilepath, item));
                } else if (item.giveAchievements) {
                    items.push(new _Achievements(jsonFilepath, item));
                }
                else {
                    throw Error(`Файл '${this.jsonFilepath}', элемент '${JSON.stringify(item)}' не является валидным типом диалога`)
                }
            });

            this.cases[key] = items;
        });
    }

    /**
     * @param {HeroWorker} heroWorker
     * @param {Variables} variables - считанные переменные курса
     * @param {Achievements} - считанные достижения курса
     * @throws `Error`, если нет реакции или героя
     */
    asResponse(heroWorker, variables, achievements) {
        if (!variables.has(this.variable)) {
            throw Error(`Файл '${this.jsonFilepath}': переменная '${this.variable}' не определена`);
        }

        const response = {
            type: "fork",
            condition: {
                variable: this.variable,
                on: {}
            }
        }
        Object.entries(this.cases).forEach(([key, val]) => {
            const resps = [];
            val.forEach((item) => {
                if (item instanceof _DialogElement) {
                    resps.push(item.asResponse(heroWorker));
                } else if (item instanceof _DialogFork) {
                    resps.push(item.asResponse(heroWorker, variables, achievements));
                } else if (item instanceof _Achievements) {
                    resps.push(item.asResponse(achievements));
                } else if (item instanceof _Variables) {
                    resps.push(item.asResponse(variables));
                } else {
                    throw Error(`Файл '${this.jsonFilepath}', элемент '${JSON.stringify(item)}' - тип элемента диалога пока не поддерживается`)
                }
            });

            response.condition.on[key] = resps;
        });

        return response;
    }
}

class _Variable {
    jsonFilepath = "";

    variable = "";
    value = 0;

    /**
     * @param {string} jsonFilepath - путь до json-файла с данным диалогом
     * @param {Object} params
     * @param {string} params.variable
     * @param {Number} params.value
     */
    constructor(jsonFilepath, { variable, value }) {
        this.jsonFilepath = jsonFilepath;
        this.value = value;
        this.variable = variable;
    }

    /**
     * @param {Variables} variables - считанные переменные курса
     * @throws `Error`, если нет переменной
     */
    asResponse(variables) {
        if (!variables.has(this.variable)) {
            throw Error(`Файл '${this.jsonFilepath}': переменная '${this.variable}' не определена`);
        }

        return {
            variable: this.variable,
            value: this.value,
        };
    }
}

class _Variables {
    jsonFilepath = "";

    /** @type {Array<_Variable>} */
    variables = [];

    /**
     * @param {string} jsonFilepath - путь до json-файла с данным диалогом
     * @param {Object} params
     * @param {Array<{variable: string, value: Number}>} params.givePoints
     */
    constructor(jsonFilepath, { givePoints }) {
        this.jsonFilepath = jsonFilepath;
        givePoints.forEach((e) => {
            this.variables.push(new _Variable(jsonFilepath, e));
        });
    }

    /**
     * @param {Variables} variables - считанные переменные курса
     * @throws `Error`, если нет переменной
     */
    asResponse(variables) {
        /** @type {{givePoints: Array<_Variable>}} */
        const resp = {
            givePoints: [],
        };

        this.variables.forEach((e) => {
            resp.givePoints.push(e.asResponse(variables));
        });

        return resp;
    }
}

class _Achievements {
    jsonFilepath = "";

    /** @type {Array<string>} */
    achievements = [];

    /**
     * @param {string} jsonFilepath - путь до json-файла с данным диалогом
     * @param {Object} params
     * @param {Array<string>} params.giveAchievements 
     */
    constructor(jsonFilepath, { giveAchievements }) {
        this.jsonFilepath = jsonFilepath;
        this.achievements = giveAchievements;
    }


    /**
     * @param {Achievements} achievements 
     */
    asResponse(achievements) {
        this.achievements.forEach((e) => {
            if (!achievements.has(e)) {
                throw Error(`Файл '${this.jsonFilepath}': достижение '${e}' не определено`);
            }
        });

        return {
            giveAchievements: this.achievements,
        };
    }
}


export class Dialog {
    event = "";

    /**
     * @typedef DialogBodyTypes
     * @type {_DialogElement | _DialogFork | _Achievements | _Variables}
     */

    /**
     * @type {Array<DialogBodyTypes>}
     */
    body = [];

    jsonFilepath = "";

    /**
     * @param {string} jsonFilepath - путь до json-файла с данным диалогом
     */
    constructor(jsonFilepath) {
        this.jsonFilepath = jsonFilepath;

        /**
         * @type {{event: string, dialog: Array<Object<string, any>>}}
         */
        const jsonFile = JSON.parse(fs.readFileSync(jsonFilepath));
        if (!jsonFile.event) {
            throw Error(`Файл '${jsonFilepath}': отсутствует поле 'event'`);
        }
        this.event = jsonFile.event;

        if (!jsonFile.dialog) {
            throw Error(`Файл '${jsonFilepath}': отсутствует поле 'dialog'`);
        }

        jsonFile.dialog.forEach((item) => {
            if (item.hero) {
                this.body.push(new _DialogElement(jsonFilepath, item));
            } else if (item.type && item.type === "fork") {
                this.body.push(new _DialogFork(jsonFilepath, item));
            } else if (item.givePoints) {
                this.body.push(new _Variables(jsonFilepath, item));
            } else if (item.giveAchievements) {
                this.body.push(new _Achievements(jsonFilepath, item));
            }
            else {
                throw Error(`Файл '${jsonFilepath}', элемент '${JSON.stringify(item)}' не является валидным типом диалога`)
            }
        });
    }

    /**
     * @param {HeroWorker} heroWorker
     * @param {Variables} variables - считанные переменные курса
     * @param {Achievements} achievements - считанные достижения курса
     * @throws `Error`, если нет реакции или героя
     */
    asResponse(heroWorker, variables, achievements) {
        /**
         * @type {{dialog: Array<DialogBodyTypes>}}
         */
        const response = {
            dialog: []
        }

        this.body.forEach((item) => {
            if (item instanceof _DialogElement) {
                response.dialog.push(item.asResponse(heroWorker));
            } else if (item instanceof _DialogFork) {
                response.dialog.push(item.asResponse(heroWorker, variables, achievements));
            } else if (item instanceof _Achievements) {
                response.dialog.push(item.asResponse(achievements));
            } else if (item instanceof _Variables) {
                response.dialog.push(item.asResponse(variables));
            }
            else {
                throw Error(`Файл '${this.jsonFilepath}', элемент '${JSON.stringify(item)}' - тип элемента диалога пока не поддерживается`)
            }
        });

        return response;
    }
}
