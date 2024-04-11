import { ref } from 'vue'
import baseUrl from '/src/components/baseUrl';

export const moduleNum = ref(null)
export const lessonNum = ref(null)
export const task = ref(null)

export async function getTaskData(_module, _lesson, _task) {
    const fetchUrl = `${baseUrl}api/getTaskData/${_module}/${_lesson}/${_task}`;
    console.log(`Sending request to ${fetchUrl}`);

    const response = await fetch(fetchUrl, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
        const desc = await response.text();
        console.log(`Server responsed ${response.status}: ${desc}`)
        return false
    }
    task.value = await response.json();
    moduleNum.value = _module;
    lessonNum.value = _lesson;

    console.log("Task was founded")
    return true;
}
