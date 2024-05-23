<script setup>
import { onMounted } from 'vue';
import { errorMsg, loginField, passwordField, tryLogin } from './loginData';

onMounted(() => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("userRole");
});
</script>

<template>
    <div class="page-filler">
        <div class="login-card">
            <h3>Вход в аккаунт</h3>
            <p> {{ errorMsg }} </p>

            <input type="text" placeholder="Логин" :value="loginField" @input="e => loginField = e.target.value">
            <input type="text" placeholder="Пароль" :value="passwordField"
                @input="e => passwordField = e.target.value">

            <button @click="tryLogin">Войти</button>
        </div>
    </div>
</template>

<style>
.page-filler {
    width: 100%;
    height: 60vh;

    display: flex;
    align-items: center;
    justify-content: center;
}

.login-card {
    padding: 20px;
    border: 1px solid black;
    border-radius: 8px;

    width: 350px;

    display: flex;
    flex-direction: column;
    align-items: center;
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