function redirecionar(pagina) {
    window.location.href = `assets/pages/${pagina}.html`;
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('active');
    });
});
