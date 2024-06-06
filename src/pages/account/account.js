import { ref, computed } from "vue";
import loginController from "../../components/login";

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

export const isLoadCourseVisible = ref(false);

/**
 * @type {Ref<{courses: {courseName: string, coursePath: string}[]} | null>}
 */
export const courses = ref(null);

/**
 * @returns {Promise<{success: true} | {success: false, reason: string}>}
 */
export async function loadCourses() {
    const response = await loginController.sendGet('api/courses/');
    if (response === null) {
        return {
            success: false,
            reason: "User not loggined",
        };
    }

    if (!response.ok) {
        return {
            success: false,
            reason: await response.text(),
        };
    }

    courses.value = await response.json();

    return {
        success: true,
    };
}

/**
 * Удаляет указанный курс
 * @param {string} coursePath - название курса (файловое)
 */
export async function deleteCourse(coursePath) {
    const response = await loginController.sendDelete(`api/courses/${coursePath}`);
    if (response === null) {
        return {
            success: false,
            reason: "User not loggined",
        };
    }
    if (!response.ok) {
        return {
            success: false,
            reason: await response.text(),
        };
    }

    const result = await loadCourses();
    return result;
}

/**
 * 
 * @param {*} file 
 * @returns {Promise<{success: false, reason: string} | {success: true, courseInfo: {status: string, loadedFile: string, coursePath: string, courseName: string}}>}
 */
export async function loadFileToServer(file) {
    if (!file) {
        return {
            success: false,
            reason: "Файл не выбран",
        };
    }

    const formData = new FormData();
    formData.append('archive', file);

    const response = await loginController.sendForm(
        'api/courses/upload',
        formData,
    );

    if (response === null) {
        return {
            success: false,
            reason: "Пользователь не вошёл в учётную запись",
        };
    }

    if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes("Error while extracting archive")) {
            return {
                success: false,
                reason: "Ошибка при распаковке архива",
            };
        } else if (errorText.includes('is already exists')) {
            return {
                success: false,
                reason: "Курс с таким файловым именем уже существует. Переименуйте корневую папку курса",
            };
        } else if (errorText.includes('has whitespaces in folder name')) {
            return {
                success: false,
                reason: "Курс содержит пробелы в своём файловом имени. Уберите их либо замените на символы подчёркивания (`_`)",
            };
        } else if (errorText.includes('has whitespaces in folder name')) {
            return {
                success: false,
                reason: "Курс содержит пробелы в своём файловом имени. Уберите их либо замените на символы подчёркивания (`_`)",
            };
        } else {
            return {
                success: false,
                reason: errorText,
            };
        }
    }

    await loadCourses();

    /**
     * @type {{status: string, loadedFile: string, coursePath: string, courseName: string}}
     */
    const courseJson = await response.json();

    return {
        success: true,
        courseInfo: courseJson,
    }
}
