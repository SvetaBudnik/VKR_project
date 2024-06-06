import fs from 'fs';
import path from 'path';

export class Variables {
    /** @type {string[]} */
    vars = [];

    constructor(json) {
        if (!json.variables) {
            throw Error(`Переменная 'variables' не определена в файле 'gaming-config.json'`);
        }

        this.vars = json.variables;
    }

    /**
     * @param {string} value 
     */
    has(value) {
        return this.vars.includes(value);
    }

    asResponse() {
        return {
            "variables": this.vars,
        };
    }
}

export class Achievement {
    name = "";
    description = "";
    image = "";

    /**
     * @param {Object} params
     * @param {string} params.name
     * @param {string} params.description
     * @param {string} params.image
     */
    constructor({ name, description, image }) {
        this.name = name;
        this.description = description;
        this.image = image;

        if (!fs.existsSync(path.join("courses", image))) {
            throw Error(`Изображение '${image}' для достижения '${name}' не найдено`);
        }
    }

    asResponse() {
        return {
            name: this.name,
            description: this.description,
            image: this.image,
        };
    }
}

export class Achievements {
    /** @type {Achievement[]} */
    list = [];

    constructor(json) {
        if (!json.achievements) {
            throw Error(`Переменная 'achievements' не определена в файле 'gaming-config.json'`);
        }

        json.achievements.forEach((a) => {
            this.list.push(new Achievement(a));
        })
    }

    /** @param {string} name */
    has(name) {
        let contains = false;
        this.list.forEach((a) => {
            if (a.name === name) {
                contains = true;
            }
        });
        return contains;
    }

    asResponse() {
        /**
         * @type {{achievements: {name: string, description: string, image: string}[]}}
         */
        const resp = {
            achievements: [],
        };

        this.list.forEach((a) => {
            resp.achievements.push(a.asResponse());
        });

        return resp;
    }
}
