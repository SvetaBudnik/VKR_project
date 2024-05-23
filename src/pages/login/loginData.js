import { ref } from "vue";
import router from "../../router";
import loginController from "../../components/login";

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

export const loginField = ref("");
export const passwordField = ref("");
export const errorMsg = ref("");

export async function tryLogin() {
    if (loginField.value === "") {
        errorMsg.value = "Введите логин";
        return;
    }
    if (passwordField.value === "") {
        errorMsg.value = "Введите пароль";
        return;
    }

    const response = await loginController.tryLogin(loginField.value, passwordField.value);

    if (!response.ok && response.status === 401) {
        errorMsg.value = "Неверный логин или пароль";
        return;
    } else if (!response.ok) {
        errorMsg.value = "Произошла неизвестная ошибка";
        return;
    }

    passwordField.value = "";

    router.push({name: 'HomePage'});
}
