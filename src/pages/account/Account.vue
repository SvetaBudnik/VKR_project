<script setup>
import { onBeforeRouteLeave } from 'vue-router';
import loginController from '../../components/login';
import { ref } from 'vue';
import { loadCourses, deleteCourse, courses, isLoadCourseVisible } from './account';

import LoadCourse from './LoadCourse.vue';


await loadCourses();

const login_field = ref(loginController.login.value);
const password_field = ref("");

const msg_field = ref("");
const msg_field_timer = ref(0);

async function changeLogin() {
    const result = await loginController.changeLogin(login_field.value);
    if (!result.success) {
        changeMsgValue("Произошла ошибка при смене логина");
        return;
    }

    changeMsgValue("Логин успешно изменён");
    login_field.value = loginController.login.value;
}

async function changePassword() {
    const result = await loginController.changePassword(password_field.value);
    if (!result.success) {
        changeMsgValue("Произошла ошибка при смене пароля");
        return;
    }

    changeMsgValue("Пароль успешно изменён");
    password_field.value = "";
}

/**
 * @param {string} id - id кнопки
 * @param {string} courseName - название курса
 */
async function onDeleteCourse(id, courseName) {
    const deletePromise = deleteCourse(courseName);
    let button = document.getElementById(id);
    if (button === null) {
        return;
    }
    button.innerHTML = "Удаление...";
    button.disabled = true;

    const deleteResult = await deletePromise;

    if (deleteResult.success) {
        button = document.getElementById(id);
        if (button) {
            button.innerHTML = "Удалить курс";
            button.disabled = false;
        }
    }
}

/**
 * @param {string} msg 
 */
function changeMsgValue(msg) {
    clearTimeout(msg_field_timer.value);
    msg_field.value = msg;

    setTimeout(() => {
        msg_field.value = "";
    }, 3000);
}

function onLoadCourseClick() {
    isLoadCourseVisible.value = true;
}

onBeforeRouteLeave(() => {
    clearTimeout(msg_field_timer.value);
})
</script>

<template>
    <div class="page_account">
        <div class="login-account">
            <h3>Личный кабинет</h3>
            <p> {{ errorMsg }} </p>

            <form action="" class="form-account">
                <p> {{ msg_field }}</p>
                <div class="form-login">
                    <span class="input-text">Логин</span>
                    <input :value="login_field" @input="e => login_field = e.target.value" type="text"
                        placeholder="Новый логин">
                    <button @click="changeLogin" class="button-account">Изменить логин</button>
                </div>
                <div class="form-password">
                    <span class="input-text">Пароль</span>
                    <input :value="password_field" @input="e => password_field = e.target.value" type="text"
                        placeholder="Новый пароль">
                    <button @click="changePassword" class="button-account">Изменить пароль</button>
                </div>
            </form>

            <div v-if="loginController.isAdmin" id="app">
                <h3>Список курсов</h3>
                <p v-if="courses.value === null"> Произошла ошибка при загрузке курсов... </p>
                <ol v-else>
                    <template v-for="(item, index) in courses.courses">
                        <li> {{ item.courseName }}
                            <button @click="onDeleteCourse(`button-${index}`, item.coursePath)"
                                :id="`button-${index}`">Удалить курс</button>
                        </li>
                    </template>
                </ol>
                <button @click="onLoadCourseClick">Добавить курс</button>
            </div>

            <LoadCourse />
        </div>
    </div>
</template>

<style>
.page_account {
    width: 100%;
    /* height: 60vh; */

    display: flex;
    align-items: center;
    justify-content: center;
}


.login-account {
    width: 450px;

    display: flex;
    flex-direction: column;
    align-items: center;

}

.form-account .input-text {
    margin-right: 10px;
}

.form-account .button-account {
    margin-left: 50px;
}

.form-login {
    padding: 10px 10px 20px 10px;

    display: flex;
    align-items: center;
    justify-content: center;


}

.login-card h3 {
    align-self: flex-start;

    font-size: 1.5em;
    margin: 0;
}

.login-card p {
    width: 100%;
    margin: 5px;
}

.login-card input {
    width: 80%;
    border-radius: 8px;
    padding: 5px 10px;
    margin-top: 5px;
}

.login-card button {
    align-self: flex-end;
    margin-top: 20px;

    background-color: #e4f2df;

    padding: 5px 10px;
    border-radius: 8px;
}
</style>