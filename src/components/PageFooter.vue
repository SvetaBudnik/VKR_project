<script setup>

</script>

<template>
    <footer class="main-footer">
        <a class="logo"> SB academy </a>
        <div class="footer-text">
            <!-- TODO: что за стиль текста "text"? -->
            <span class="text"> Developer and creator Budnik Sveta, </span>
            <span class="text"> 2024 </span>
        </div>
    </footer>
</template>

<style>
.main-footer {
    background: #BEE5F1;
    width: 100%;
    height: 70px;
    padding: 0;
    margin-top: 20px;

    border: none;
    border-radius: 10px;

    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    width: 200px;
    /* height: 75px; */
    color: #4665D2;
    font-size: 30px;
    font-family: Arial, sans-serif;
    font-style: italic;
    font-weight: 700;
    float: left;
    text-decoration: none;
    margin-left: 40px;
}
.footer-text {
    margin-right: 40.5%;
}
</style>