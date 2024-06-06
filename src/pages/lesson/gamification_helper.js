import { ref } from 'vue';
import { module, lesson } from './lessonData';
import gamificationEventController from '../../components/gamification/gamification_event_controller';
import gamificationController from '../../components/gamification/gamification_controller';

// INSERT GAMIFICATION EVENTER
const moduleNum = ref();
const lessonNum = ref();
export const gaming__is_last_lesson_ever = ref(false);

/**
 * Создаёт ивенты при загрузке нового модуля теории
 */
export async function onTheoryLoad() {
    lessonNum.value = lesson.value.lessonNumber;
    moduleNum.value = module.value.moduleNumber;

    await gamificationController.startLesson(moduleNum.value, lessonNum.value);
}

/** @type {import('vue-router').NavigationGuard} */
export const beforeRouteUpdate = async (to, from) => {
    // Обработчик будет срабатывать по многу раз на одни и те же страницы, но это норма, потому что
    // слушатели событий должны отписываться после того, как они сработают, следовательно,
    // лишний раз кино им показывать никто не будет

    await gamificationController.endLesson(moduleNum.value, lessonNum.value)

    // Если идём на следующий урок, то считаем, что текущий урок был прочитан полностью
    // if (to.params.lesson > from.params.lesson) {
    //     await gamificationEventController.emit("onLessonEnd", moduleNum.value, lessonNum.value);
    // }

    // // Если идём на следующий модуль, то считаем, что текущий модуль был прочитан полностью
    // if (to.params.module > from.params.module) {
    //     await gamificationEventController.emit("onModuleEnd", moduleNum.value)
    // }

    // Вызываем новые ивенты по загрузке следующей страницы теории
    onTheoryLoad();
}


/** @type {import('vue-router').NavigationGuard} */
export const beforeRouteLeave = async (to, from) => {
    // Если переходим на страницу тестов либо миссии, то текущий урок закончился
    // (при переходе на следующую теорию, маршрут не изменится, поэтому вызовется `beforeRouteUpdate` вместо этого)
    if (to.name == "task" || to.name == "mission") {
        // await gamificationEventController.emit("onLessonEnd", moduleNum.value, lessonNum.value);
        await gamificationController.endLesson(moduleNum.value, lessonNum.value);
        return;
    }

    // Если переходим на главную страницу, то, если это последний урок по теории вообще 
    // и больше в курсе ничего нет, то говорим о конце всего
    if (to.name == "CoursePage" && gaming__is_last_lesson_ever) {
        await gamificationController.endLesson(moduleNum.value, lessonNum.value);
        return;
    }

    // В остальных случаях - юзер просто выходит с теории куда-либо, поэтому засчитывать ему тем самым прохождение теории - не стоит)
}

