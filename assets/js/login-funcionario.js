const API_URL = 'https://autoresgate-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    if (verificarLogado()) {
        window.location.href = 'dashboard-funcionario.html';
        return;
    }

    const form = document.getElementById('formLoginFuncionario');
    if (form) {
        form.addEventListener('submit', login);
    }
});

function getElementValue(elementId) {
    return document.getElementById(elementId).value;
}

function showErrorLoginMessage(mensagem) {
    alert(mensagem || 'E-mail e/ou senha incorretos!');
}

function verificarLogado() {
    return localStorage.getItem('funcionarioLogado') !== null;
}

async function login(event) {
    event.preventDefault();

    const email = getElementValue('email');
    const senha = getElementValue('senha');

    try {
        const response = await fetch(`${API_URL}/funcionarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await response.json();

        if (!response.ok) {
            showErrorLoginMessage(dados.erro);
            return;
        }

        localStorage.setItem('funcionarioLogado', JSON.stringify(dados.funcionario));
        window.location.href = 'dashboard-funcionario.html';

    } catch (erro) {
        console.error(erro);
        showErrorLoginMessage('Erro de conexão com o servidor.');
    }
}