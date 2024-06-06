<script setup>
import { isLoadCourseVisible, loadFileToServer } from './account';
import { ref } from 'vue';

const states = {
    selectState: 1,
    loadState: 2,
    successState: 3,
    errorState: 4,
}

const currentState = ref(states.selectState);
const file = ref(null);

const successText = ref("");
const errorText = ref("");

function onCancelClick() {
    file.value = null;
    currentState.value = states.selectState;
    isLoadCourseVisible.value = false;
}

function loadFile() {
    if (!file.value) {
        return;
    }
    currentState.value = states.loadState;

    loadFileToServer(file.value).then((result) => {
        if (!result.success) {
            errorText.value = result.reason;
            currentState.value = states.errorState;
            return;
        }

        successText.value = `Курс "${result.courseInfo.courseName}" из файла "${result.courseInfo.loadedFile}" успешно загружен. Курс будет доступен по пути "courses/${result.courseInfo.coursePath}"`;
        currentState.value = states.successState;
    });
}
</script>

<template>
    <div v-if="isLoadCourseVisible" class="screen-spacer">
        <div class="card">
            <h3>Загрузить новый курс</h3>
            <form v-if="currentState === states.selectState" @submit.prevent="loadFile">
                <input type="file" name="archive-file" id="archive-file" accept=".zip"
                    @change="e => file = e.target.files[0]"> <br />
                <div class="buttons">
                    <button type="reset" @click="onCancelClick">Отменить</button>
                    <button type="submit">Загрузить курс</button>
                </div>
            </form>

            <div v-if="currentState === states.loadState">
                <div class="center-self custom-loader"></div>
            </div>
            <div v-if="currentState === states.successState">
                <p class="center-self">Успех!</p>
                <p> {{ successText }}</p>
                <button @click="onCancelClick">Выйти назад</button>
            </div>
            <div v-if="currentState === states.errorState">
                <p class="center-self">Ошибка...</p>
                <p> {{ errorText }}</p>
                <button @click="onCancelClick">Выйти назад</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.screen-spacer {
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;

    background-color: rgba(0, 0, 0, 0.3);

    display: flex;
    align-items: center;
    justify-content: center;
}

.card {
    background-color: white;
    border-radius: 7px;

    padding: 20px 40px 40px;

    width: 350px;
}

.card h3 {
    width: fit-content;
    margin: 0 auto 20px;
}

.buttons {
    margin-top: 20px;

    display: flex;
    justify-content: space-between;
}

input {
    width: 100%;
}

.center-self {
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
}

.custom-loader {
    width: 50px;
    height: 50px;
    --c: radial-gradient(farthest-side, #766DF4 92%, #0000);
    background:
        var(--c) 50% 0,
        var(--c) 50% 100%,
        var(--c) 100% 50%,
        var(--c) 0 50%;
    background-size: 10px 10px;
    background-repeat: no-repeat;
    animation: s8 1s infinite;
    position: relative;
}

.custom-loader::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: 3px;
    background: repeating-conic-gradient(#0000 0 35deg, #766DF4 0 90deg);
    -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 3px), #000 0);
    border-radius: 50%;
}

@keyframes s8 {
    100% {
        transform: rotate(.5turn)
    }
}
</style>
