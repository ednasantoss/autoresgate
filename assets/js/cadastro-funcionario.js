const funcionarioLogadoData = localStorage.getItem('funcionarioLogado');

if (!funcionarioLogadoData) {
    alert('Acesso negado! Faça login primeiro.');
    window.location.href = 'login-funcionario.html';
}

const criador = JSON.parse(funcionarioLogadoData);

if (!criador.cargo || criador.cargo.toLowerCase() !== 'administrador') {
    alert('Acesso restrito! Apenas administradores podem cadastrar novos funcionários.');
    window.location.href = 'dashboard-funcionario.html';
}

document.getElementById('formCadastroFuncionario').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const cargo = document.getElementById('cargo').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch('https://autoresgate-backend.onrender.com/api/funcionarios/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome,
                email,
                cargo,
                senha,
                cargoQuemCadastrou: criador.cargo
            })
        });

        const dados = await response.json();

        if (response.ok) {
            alert('Novo colaborador cadastrado com sucesso!');
            window.location.href = 'dashboard-funcionario.html';
        } else {
            alert(dados.erro || 'Erro ao cadastrar funcionário.');
        }
    } catch (erro) {
        console.error(erro);
        alert('Erro de conexão com o servidor.');
    }
});