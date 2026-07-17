const API_URL = 'https://autoresgate-backend.onrender.com/api';

const clienteData = localStorage.getItem('clienteLogado');

if (!clienteData) {
    alert('Acesso negado! Por favor, faça login para acessar seus veículos.');
    window.location.href = 'login-cliente.html';
}

const cliente = JSON.parse(clienteData);

let carroEmEdicao = null; // guarda o id do veículo quando o modal está em modo de edição
let veiculosCache = [];   // guarda a última lista carregada, usada para preencher o modal de edição

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const dadosAtuais = localStorage.getItem('clienteLogado');
        if (!dadosAtuais) {
            window.location.href = 'login-cliente.html';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nomeCliente').textContent = `Olá, ${cliente.nome}`;

    configurarModal();
    carregarVeiculos();
    configurarLogout();
});

function configurarModal() {
    const modal = document.getElementById('modalCarro');
    const btnAbrir = document.getElementById('btnAbrirModal');
    const btnFechar = document.getElementById('btnFecharModal');
    const formCarro = document.getElementById('formCadastroCarro');
    const modalTitulo = document.getElementById('modalCarroTitulo');
    const btnSalvar = document.getElementById('btnSalvarCarro');

    btnAbrir.addEventListener('click', () => {
        carroEmEdicao = null;
        formCarro.reset();
        if (modalTitulo) modalTitulo.textContent = 'Cadastrar Novo Veículo';
        if (btnSalvar) btnSalvar.textContent = 'Salvar Veículo';
        modal.classList.add('active');
    });

    btnFechar.addEventListener('click', () => fecharModalCarro());

    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalCarro();
    });

    function fecharModalCarro() {
        modal.classList.remove('active');
        carroEmEdicao = null;
        formCarro.reset();
    }

    formCarro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dadosCarro = {
            marca: document.getElementById('marca').value.trim(),
            modelo: document.getElementById('modelo').value.trim(),
            ano: document.getElementById('ano').value,
            placa: document.getElementById('placa').value.trim(),
            id_cliente: cliente.id_cliente
        };

        try {
            const editando = carroEmEdicao !== null;
            const url = editando
                ? `${API_URL}/veiculos/${carroEmEdicao}`
                : `${API_URL}/veiculos/cadastro`;
            const method = editando ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCarro)
            });

            const dados = await response.json();

            if (response.ok) {
                alert(editando ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!');
                fecharModalCarro();
                carregarVeiculos();
            } else {
                alert(dados.erro || 'Erro ao salvar veículo.');
            }
        } catch (erro) {
            console.error(erro);
            alert('Erro ao conectar com o servidor.');
        }
    });
}

async function carregarVeiculos() {
    const grid = document.getElementById('gridCarros');

    try {
        const response = await fetch(`${API_URL}/veiculos?id_cliente=${cliente.id_cliente}`);
        const carros = await response.json();

        if (!response.ok) throw new Error(carros.erro || 'Erro ao buscar veículos.');

        veiculosCache = carros;

        if (carros.length === 0) {
            grid.innerHTML = '<div class="loading">Você ainda não possui veículos cadastrados.</div>';
            return;
        }

        grid.innerHTML = carros.map(carro => `
            <div class="car-card">
                <h4>${carro.marca} ${carro.modelo}</h4>
                <p class="car-info">Ano: <span>${carro.ano}</span></p>
                <div class="car-placa">${carro.placa.toUpperCase()}</div>
                <div class="car-acoes">
                    <button class="btn-edit" onclick="editarVeiculo(${carro.id_veiculos})">Editar</button>
                    <button class="btn-delete" onclick="excluirVeiculo(${carro.id_veiculos})">Excluir</button>
                </div>
            </div>
        `).join('');

    } catch (erro) {
        console.error(erro);
        grid.innerHTML = '<div class="loading" style="color: #f75a68;">Erro ao carregar dados do servidor.</div>';
    }
}

function editarVeiculo(idVeiculo) {
    const carro = veiculosCache.find(c => c.id_veiculos === idVeiculo);
    if (!carro) return;

    carroEmEdicao = idVeiculo;

    document.getElementById('marca').value = carro.marca;
    document.getElementById('modelo').value = carro.modelo;
    document.getElementById('ano').value = carro.ano;
    document.getElementById('placa').value = carro.placa;

    const modalTitulo = document.getElementById('modalCarroTitulo');
    const btnSalvar = document.getElementById('btnSalvarCarro');
    if (modalTitulo) modalTitulo.textContent = 'Editar Veículo';
    if (btnSalvar) btnSalvar.textContent = 'Salvar Alterações';

    document.getElementById('modalCarro').classList.add('active');
}

async function excluirVeiculo(idVeiculo) {
    if (!confirm('Tem certeza que deseja excluir este veículo? Essa ação não pode ser desfeita.')) return;

    try {
        const response = await fetch(`${API_URL}/veiculos/${idVeiculo}`, {
            method: 'DELETE'
        });

        const dados = await response.json().catch(() => ({}));

        if (!response.ok) throw new Error(dados.erro || 'Erro ao excluir veículo.');

        alert('Veículo excluído com sucesso!');
        carregarVeiculos();
    } catch (erro) {
        console.error(erro);
        alert(erro.message);
    }
}

function configurarLogout() {
    document.getElementById('btnSair').addEventListener('click', () => {
        localStorage.removeItem('clienteLogado');
        window.location.href = 'login-cliente.html';
    });
}