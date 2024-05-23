import { ref } from "vue"
import loginController from "../../components/login";

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

/** @type {Ref<Array<{courseName: string, coursePath: string}>>} */
export const coursesInfo = ref(null); 

export async function fetchCoursesInfo() {
    const response = await loginController.sendGet(`api/courses`);
    if (response === null) {
        console.error("User not loggined??");
        return false;
    }

    if (!response.ok) {
        const desc = await response.text();
        console.error(`Server responsed ${response.status}: ${desc}`)
        return false
    }

    /** @type {{courses: Array<{courseName: string, coursePath: string}>}} */
    const respData = await response.json();
    coursesInfo.value = respData.courses;

    return true;
}
