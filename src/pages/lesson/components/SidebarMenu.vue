<script setup>
import { ref } from 'vue';

const isNavbarHidden = ref(false);
defineProps({
    title: String,
})
</script>

<template>
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@40,500,0,0" />

    <aside class="sidebar">
        <button class="sidebar-button" @click="isNavbarHidden = !isNavbarHidden">
            <i class="material-symbols-outlined">
                {{ isNavbarHidden ? "menu" : "menu_open" }}
            </i>
            <span class="sidebar-button-text">
                {{ title }}
            </span>
        </button>
        <div class="sidebar-panel" :class="{ hidden: isNavbarHidden }">
            <slot></slot>
        </div>
    </aside>
</template>

<style>
.sidebar {
    margin: 10px;
    position: sticky;
    top: 10px;
    height: fit-content;
    width: fit-content;
}

.sidebar .sidebar-button {
    display: flex;
    align-items: center;
    background-color: transparent;
    border: 0;
}

.sidebar .material-symbols-outlined {
    font-size: 2.0em;
    margin-right: 5px;
}

.sidebar .sidebar-button-text {
    font-size: 1.5em;
}

.sidebar .sidebar-panel {
    width: 100%;
    height: fit-content;
    overflow: hidden;

    transition: transform 0.25s ease;

    transform: scaleY(1);
    transform-origin: top;
}

.sidebar .sidebar-panel a {
    text-decoration: none !important;
    color: black !important;
}

.sidebar .sidebar-panel a:visited {
    text-decoration: none !important;
    color: black !important;
}

.sidebar .sidebar-panel.hidden {
    transform: scaleY(0);
}
</style>