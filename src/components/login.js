import { ref, computed } from "vue";
import baseUrl from "./baseUrl";

/**
 * @template T
 * @typedef {object} Ref
 * @property {T} value
 */

class LoginController {
    login = ref("");

    /** @type {Ref<"user" | "admin" | "">} */
    role = ref("");

    isAdmin = computed(() => {
        return this.role.value === "admin";
    })

    token = ref("");

    isUserLoggined() {
        if (this.token.value !== "") {
            return true;
        }

        const token = window.localStorage.getItem("token");
        if (token === null) {
            return false;
        }

        this.token.value = token;
        this.login.value = window.localStorage.getItem("login");
        this.role.value = window.localStorage.getItem("userRole");

        return true;
    };

    /**
     * Отправить GET-запрос на сервер
     * @param {string} path - путь GET запроса к серверу (например, `api/getUserInfo`)
     * @returns {Promise<Response | null>} `null`, если пользователь не залогинен, иначе Response
     */
    async sendGet(path) {
        if (!this.isUserLoggined()) {
            return null;
        }
        const authToken = this.token.value;

        const response = await fetch(`${baseUrl}${path}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": authToken,
            }
        });

        return response;
    }

    /**
     * Отправить POST-запрос на сервер (требует логина)
     * @param {string} path - путь POST-запроса к серверу
     * @param {object} body - тело POST-запроса 
     * @returns {Promise<Response | null>} `null`, если пользователь не залогинен, иначе Response
     */
    async sendPost(path, body) {
        if (!this.isUserLoggined()) {
            return null;
        }
        const authToken = this.token.value;

        const response = await fetch(`${baseUrl}${path}`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "content-type": "application/json",
                "Authorization": authToken,
            },
            body: JSON.stringify(body),
        });

        return response;
    }

    /**
     * Метод запроса на логин на сторону сервера (в случае успеха - логинится автоматически)
     * @param {string} login - логин пользователя
     * @param {string} password - пароль пользователя
     */
    async tryLogin(login, password) {
        const response = await fetch(`${baseUrl}api/login`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                username: login,
                password: password,
            }),
        });

        if (response.ok) {
            const token = await response.json();

            this.token.value = `Bearer ${token.token}`;
            this.login.value = login;
            this.role.value = token.role;

            window.localStorage.setItem("token", this.token.value);
            window.localStorage.setItem("userRole", this.role.value);
            window.localStorage.setItem("login", this.login.value);
        }

        return response;
    }

    logout() {
        this.token.value = "";
        this.login.value = "";
        this.role.value = "";

        window.localStorage.removeItem("token");
        window.localStorage.removeItem("userRole");
        window.localStorage.removeItem("login");
    }
}

export const loginController = new LoginController();

export default loginController;
