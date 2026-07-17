const API_URL = 'https://autoresgate-backend.onrender.com/api';

const clienteData = localStorage.getItem('clienteLogado');

if (!clienteData) {
    alert('Acesso restrito! Por favor, faça login.');
    window.location.href = 'login-cliente.html';
}

const cliente = JSON.parse(clienteData);

let chamadoEmEdicao = null; // guarda o id do chamado quando o modal está em modo de edição
let chamadosCache = [];     // guarda a última lista carregada, usada para preencher o modal de edição

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const dadosAtuais = localStorage.getItem('clienteLogado');
        if (!dadosAtuais) {
            window.location.href = 'login-cliente.html';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nomeCliente').textContent = cliente.nome;

    carregarChamados();
    configurarModal();
    configurarLogout();
});

async function carregarChamados() {
    const grid = document.getElementById('gridChamados');

    try {
        const response = await fetch(`${API_URL}/chamados/cliente/${cliente.id_cliente}`);
        const dados = await response.json();

        if (!response.ok) throw new Error(dados.erro || 'Erro ao carregar chamados.');

        chamadosCache = dados;

        if (dados.length === 0) {
            grid.innerHTML = `<div class="loading">Você ainda não abriu nenhum chamado.</div>`;
            return;
        }

        grid.innerHTML = dados.map(os => {
            let statusClass = 'analise';
            if (os.status === 'Em Reparo') statusClass = 'reparo';
            if (os.status === 'Finalizado') statusClass = 'finalizado';

            // Só permite editar/excluir enquanto o chamado ainda está em análise
            // (depois que entra em reparo, já está sendo tratado pela oficina)
            const podeEditar = os.status === 'Em Análise';

            const acoes = podeEditar ? `
                <div class="car-acoes">
                    <button class="btn-edit" onclick="editarChamado(${os.id_os})">Editar</button>
                    <button class="btn-delete" onclick="excluirChamado(${os.id_os})">Excluir</button>
                </div>
            ` : '';

            return `
                <div class="car-card">
                    <h4>#${os.id_os} - ${os.titulo}</h4>
                    <p class="car-info">${os.marca} ${os.modelo} — <span>${os.placa.toUpperCase()}</span></p>
                    <p class="car-info">${os.descricao || 'Sem descrição adicional.'}</p>
                    <span class="status-badge status-${statusClass}">${os.status}</span>
                    ${acoes}
                </div>
            `;
        }).join('');

    } catch (erro) {
        console.error(erro);
        grid.innerHTML = `<div class="loading" style="color:#f75a68;">Erro ao conectar com o servidor.</div>`;
    }
}

async function carregarVeiculosDoCliente() {
    const select = document.getElementById('veiculoSelect');

    try {
        const response = await fetch(`${API_URL}/veiculos?id_cliente=${cliente.id_cliente}`);
        const veiculos = await response.json();

        if (!response.ok) throw new Error(veiculos.erro || 'Erro ao carregar veículos.');

        if (veiculos.length === 0) {
            select.innerHTML = `<option value="">Nenhum veículo cadastrado</option>`;
            return;
        }

        select.innerHTML = veiculos.map(v =>
            `<option value="${v.id_veiculos}">${v.marca} ${v.modelo} - ${v.placa.toUpperCase()}</option>`
        ).join('');

    } catch (erro) {
        console.error(erro);
        select.innerHTML = `<option value="">Erro ao carregar veículos</option>`;
    }
}

function configurarModal() {
    const modal = document.getElementById('modalChamado');
    const btnAbrir = document.getElementById('btnAbrirModal');
    const btnFechar = document.getElementById('btnFecharModal');
    const form = document.getElementById('formAbrirChamado');
    const modalTitulo = document.getElementById('modalChamadoTitulo');
    const btnSalvar = document.getElementById('btnSalvarChamado');
    const veiculoGroup = document.getElementById('veiculoSelectGroup');

    btnAbrir.addEventListener('click', () => {
        chamadoEmEdicao = null;
        form.reset();
        if (modalTitulo) modalTitulo.textContent = 'Abrir Novo Chamado';
        if (btnSalvar) btnSalvar.textContent = 'Abrir Chamado';
        if (veiculoGroup) veiculoGroup.style.display = 'flex';
        modal.classList.add('active');
        carregarVeiculosDoCliente();
    });

    btnFechar.addEventListener('click', () => fecharModalChamado());

    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalChamado();
    });

    function fecharModalChamado() {
        modal.classList.remove('active');
        chamadoEmEdicao = null;
        form.reset();
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titulo = document.getElementById('titulo').value.trim();
        const descricao = document.getElementById('descricao').value.trim();

        try {
            const editando = chamadoEmEdicao !== null;

            if (editando) {
                const response = await fetch(`${API_URL}/chamados/${chamadoEmEdicao}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ titulo, descricao })
                });

                const dados = await response.json();
                if (!response.ok) throw new Error(dados.erro || 'Erro ao atualizar chamado.');

                alert('Chamado atualizado com sucesso!');
            } else {
                const id_veiculos = document.getElementById('veiculoSelect').value;
                if (!id_veiculos) {
                    alert('Selecione um veículo.');
                    return;
                }

                const response = await fetch(`${API_URL}/chamados`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_cliente: cliente.id_cliente,
                        id_veiculos,
                        titulo,
                        descricao
                    })
                });

                const dados = await response.json();
                if (!response.ok) throw new Error(dados.erro || 'Erro ao abrir chamado.');

                alert('Chamado aberto com sucesso!');
            }

            fecharModalChamado();
            carregarChamados();

        } catch (erro) {
            console.error(erro);
            alert(erro.message);
        }
    });
}

function editarChamado(idOs) {
    const chamado = chamadosCache.find(c => c.id_os === idOs);
    if (!chamado) return;

    chamadoEmEdicao = idOs;

    document.getElementById('titulo').value = chamado.titulo;
    document.getElementById('descricao').value = chamado.descricao || '';

    const modalTitulo = document.getElementById('modalChamadoTitulo');
    const btnSalvar = document.getElementById('btnSalvarChamado');
    const veiculoGroup = document.getElementById('veiculoSelectGroup');
    if (modalTitulo) modalTitulo.textContent = 'Editar Chamado';
    if (btnSalvar) btnSalvar.textContent = 'Salvar Alterações';
    if (veiculoGroup) veiculoGroup.style.display = 'none'; // não faz sentido trocar o veículo de um chamado já aberto

    document.getElementById('modalChamado').classList.add('active');
}

async function excluirChamado(idOs) {
    if (!confirm('Tem certeza que deseja excluir este chamado? Essa ação não pode ser desfeita.')) return;

    try {
        const response = await fetch(`${API_URL}/chamados/${idOs}`, {
            method: 'DELETE'
        });

        const dados = await response.json().catch(() => ({}));

        if (!response.ok) throw new Error(dados.erro || 'Erro ao excluir chamado.');

        alert('Chamado excluído com sucesso!');
        carregarChamados();
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