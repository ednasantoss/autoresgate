document.getElementById('formCadastroCliente').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch('https://autoresgate-backend.onrender.com/api/clientes/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, telefone, senha })
        });

        const dados = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso!');
            window.location.href = 'login-cliente.html';
        } else {
            alert(dados.erro || 'Erro ao realizar cadastro.');
        }
    } catch (erro) {
        console.error(erro);
        alert('Erro ao conectar com o servidor.');
    }
});