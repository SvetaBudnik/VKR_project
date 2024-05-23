<script setup>

</script>

<template>
    <div class="page_account">
        <div class="login-account">
            <h3>Личный кабинет</h3>
            <p> {{ errorMsg }} </p>

            <form action="" method="get" class="form-account">
                <div class="form-login">
                    <span class="input-text">Логин</span>
                    <input type="text" placeholder="Логин">
                    <button @click="tryLogin" class="button-account">Изменить логин</button>
                </div>
                <div class="form-password">
                    <span class="input-text">Пароль</span>
                    <input type="text" placeholder="Пароль">
                    <button @click="tryLogin" class="button-account">Изменить пароль</button>
                </div>
            </form>

            <div id="app">
                <h3>Список курсов</h3>
                <ul>
                    <li v-for="(item, index) in items" :key="index">{{ index }}: {{ item.name }}</li>
                    <li><button @click="add">Удалить курс</button></li>
                </ul>
                <button @click="add">Добавить курс</button>
            </div>

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

.form-account .input-text{
    margin-right: 10px;
}

.form-account .button-account{
    margin-left: 50px;
}

.form-login{
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