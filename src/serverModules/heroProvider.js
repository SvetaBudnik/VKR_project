import fs from 'fs';
import path from 'path';

const configFileName = "config.json";
const heroTestReactionsFileName = "test-reactions.json";
const defaultHeroPath = '/hero';

export const hero = getHero(`.${defaultHeroPath}`);
export const testReactions = getTestReactions(`.${defaultHeroPath}`);


/**
 * Получить путь до картинки с эмоцией героя
 * @param {string} emotion - эмоция героя
 * @returns {{success: true, emotionImgPath: string} | {success: false, reason: string}}
 */
export function getHeroEmotion(emotion) {
    const emotionImg = hero["emotions"][emotion];
    if (emotionImg == null) {
        return {
            success: false,
            reason: "Emotion doesn't exist",
        };
    }

    /** @type {string} */
    const imgPath = path.join(defaultHeroPath, hero["hero"], emotionImg).replaceAll('\\', '/');
    return {
        success: true,
        emotionImgPath: imgPath,
    };
}

/**
 * 
 * @returns {{success: true, data: Array<{emotionImgPath: string, phrase: string}>} | {success: false, reason: string}}
 */
// export function getHeroTestReactions() {
//     /** @type {Array<{emotionImgPath: string, phrase: string}>} */
//     const response = [];
//     for (const react of testReactions) {
//         const imgPath = getHeroEmotion(react.emotion);
//         if (imgPath.success) {
//             response.push({
//                 emotionImgPath: imgPath.emotionImgPath,
//                 phrase: react.phrase,
//             });
//         } else {
//             return {
//                 success: false,
//                 reason: `Emotion ${react.emotion} of hero not founded`,
//             };
//         }
//     }

//     return {
//         success: true,
//         data: response,
//     };
// }

/**
 * Функция получения набора реакций по указанной попытке
 * @param {number} attempt - попытка, на которую нужны реакции (отчёт начинается с нуля)
 * @returns {{success: false, reason: string} | {success: true, result: {onIdle: {emotionImgPath: string, phrase: string}, onError: {emotionImgPath: string, phrase: string}, onSuccess: {emotionImgPath: string, phrase: string}}}}
 */
export function getHeroTestReactions(attempt) {
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

    /** @type {{emotion: string, phrases: string[]}} */
    let onSuccessReactions = null;
    if (testReactions.onSuccess.length > attempt) {
        onSuccessReactions = testReactions.onSuccess[attempt];
    } else {
        onSuccessReactions = testReactions.onSuccess.at(-1);
    }

    const successImgPath = getHeroEmotion(onSuccessReactions.emotion);
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

    const errorImgPath = getHeroEmotion(onErrorReactions.emotion);
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

    const idleImgPath = getHeroEmotion(onIdleReactions.emotion);
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

// Функция чтения информации о герое
function getHero(rootdir) {
    const configFile = getConfigFile(rootdir);
    if (!configFile.success) {
        console.error(`Возникла ошибка при добавлении героя: ${heroResult.reason}`);
        return null;
    }

    return configFile.result;
}

function getTestReactions(rootdir) {
    const reactions = getHeroTestReactionsConfig(rootdir);
    if (!reactions.success) {
        console.error(`Возникла ошибка при добавлении реакций героя на тест: ${reactions.reason}`);
        return null;
    }

    /**
     * @type {{onIdle: Array<{emotion: string, phrases: string[]}>, onError: Array<{emotion: string, phrases: string[]}>, onSuccess: Array<{emotion: string, phrases: string[]}>}
     */
    const reactionsArray = {
        onIdle: [],
        onError: [],
        onSuccess: [],
    };
    const reactionTypes = Object.keys(reactionsArray);

    for (const reactionType of reactionTypes) {
        for (const attempt of Object.keys(reactions.result[reactionType].attempts)) {
            const indices = parseReactionIndices(attempt);
            for (const ind of indices) {
                console.dir(reactionsArray, {depth: null});
                reactionsArray[reactionType][ind] = reactions.result[reactionType].attempts[attempt];
            }
        }
    }

    return reactionsArray;
}



/**
 * Парсит индексы реакции в формат человеческих индексов
 * @param {string} attempt - запись о индексах реакции. Возможные форматы: `1`, `2-3`, `4+`
 * @returns {number[]} массив индексов (отчёт попыток начинается с 0)
 */
function parseReactionIndices(attempt) {
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

/**
 * 
 * @param {string} directory - путь до директории, содержащей конфиг-файл героя
 * @returns {{success: true, result: {hero: string, emotions: Object<string, string>}} | {success:false, reason: string}}
 */
function getConfigFile(directory) {
    const configFilePath = path.join(directory, configFileName);
    let configText = "";
    try {
        configText = fs.readFileSync(configFilePath).toString();
    }
    catch (err) {
        console.error(err);
        return {
            success: false,
            reason: "Config file not found",
        };
    }
    if (configText == "") {
        return {
            success: false,
            reason: "Config file is empty",
        };
    }

    /** @type {{hero: string, emotions: Object<string, string>}} */
    const configJson = JSON.parse(configText);

    return {
        success: true,
        result: configJson,
    };
}

/**
 * Получить конфиг фраз на результаты тестирования для героя
 * @param {string} directory - путь до директории, содержащей файл с фразами на результат тестирования
 * @returns {{success: true, result: {onIdle: {attempts: Object<string, {emotion: string, phrases: string[]}>}, onError: {attempts: Object<string, {emotion: string, phrases: string[]}>}, onSuccess: {attempts: Object<string, {emotion: string, phrases: string[]}>}}} | {success: false, reason: string}}
 */
function getHeroTestReactionsConfig(directory) {
    const configFilePath = path.join(directory, heroTestReactionsFileName);
    let configText = "";
    try {
        configText = fs.readFileSync(configFilePath).toString();
    }
    catch (err) {
        console.error(err);
        return {
            success: false,
            reason: "Hero's test reactions file not found",
        };
    }
    if (configText == "") {
        return {
            success: false,
            reason: "Hero's test reactions file is empty"
        }
    }

    /**
     * @type {{onIdle: {attempts: Object<string, {emotion: string, phrases: string[]}>}, onError: {attempts: Object<string, {emotion: string, phrases: string[]}>}, onSuccess: {attempts: Object<string, {emotion: string, phrases: string[]}>}}
     */
    const configJson = JSON.parse(configText);

    return {
        success: true,
        result: configJson,
    };
}
