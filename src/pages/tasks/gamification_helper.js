import { ref } from 'vue';
import { moduleNum as external__moduleNum, lessonNum as external__lessonNum } from './taskData'
import gamificationController from '../../components/gamification/gamification_controller';

const moduleNum = ref();
const lessonNum = ref();
export const gaming__is_last_test_ever = ref(false);
export const gaming__total_score = ref(0);


export async function onTasksLoaded() {
    lessonNum.value = external__lessonNum.value;
    moduleNum.value = external__moduleNum.value;
    gaming__total_score.value = 0;

    await gamificationController.startTest(moduleNum.value, lessonNum.value);
}

/** @type {import('vue-router').NavigationGuard} */
export const beforeRouteUpdate = (to, from) => {
    // Этот обработчик вызывается при переходе между тестовыми заданиями, так что
    // создавать события завершения прежнего тестирования и начала нового не будем
    // Да и в целом, пусть будет пустой
}

/** @type {import('vue-router').NavigationGuard} */
export const beforeRouteLeave = async (to, from) => {
    // Если переходим на следующую теорию или миссию, то отправляем прохождение этого теста
    // (т.к. они проходятся последовательно)
    if (to.name == "lesson" || to.name == "mission") {
        await gamificationController.endTest(moduleNum.value, lessonNum.value, gaming__total_score.value); 
        return;
    }

    // Если выходим на главную страницу, и это последний тест в курсе, то тоже завершаем тест
    if (to.name == "CoursePage" && gaming__is_last_test_ever.value) {
        await gamificationController.endTest(moduleNum.value, lessonNum.value, gaming__total_score.value); 
        return;
    }

    // В остальных случаях считаем, что юзер сбежал с тестов
}
