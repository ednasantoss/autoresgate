const API_URL = 'https://autoresgate-backend.onrender.com/api';

const funcionarioData = localStorage.getItem('funcionarioLogado');

if (!funcionarioData) {
    alert('Acesso restrito! Por favor, faça login com suas credenciais de funcionário.');
    window.location.href = 'login-funcionario.html';
}

const funcionarioLogado = JSON.parse(funcionarioData);
const isAdmin = (funcionarioLogado.cargo || '').toLowerCase() === 'administrador';

// Esta página é exclusiva do administrador — atualizar cargo/remover um colega
// não pode ser feito por um funcionário comum.
if (!isAdmin) {
    alert('Acesso restrito! Apenas administradores podem gerenciar a equipe.');
    window.location.href = 'dashboard-funcionario.html';
}

let funcionarioEmEdicao = null;
let funcionariosCache = [];

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const dadosAtuais = localStorage.getItem('funcionarioLogado');
        if (!dadosAtuais) {
            window.location.href = 'login-funcionario.html';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nomeFuncionario').textContent = funcionarioLogado.nome;

    carregarFuncionarios();
    configurarModal();
    configurarLogout();
});

async function carregarFuncionarios() {
    const grid = document.getElementById('gridFuncionarios');

    try {
        const response = await fetch(`${API_URL}/funcionarios`);
        const funcionarios = await response.json();

        if (!response.ok) throw new Error(funcionarios.erro || 'Erro ao carregar funcionários.');

        funcionariosCache = funcionarios;

        if (funcionarios.length === 0) {
            grid.innerHTML = '<div class="loading">Nenhum funcionário cadastrado.</div>';
            return;
        }

        grid.innerHTML = funcionarios.map(f => {
            const iniciais = f.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
            const ehAdmin = (f.cargo || '').toLowerCase() === 'administrador';
            const ehVoceMesmo = f.id_funcionario === funcionarioLogado.id_funcionario;

            return `
                <div class="func-card">
                    <div class="func-header">
                        <div class="func-avatar">${iniciais}</div>
                        <div>
                            <div class="func-nome">${f.nome} ${ehAdmin ? '<span class="badge-admin">ADMIN</span>' : ''}</div>
                            <div class="func-cargo">${f.cargo}</div>
                        </div>
                    </div>
                    <p class="func-info">E-mail: <span>${f.email}</span></p>
                    <div class="func-acoes">
                        <button class="btn-edit" onclick="editarFuncionario(${f.id_funcionario})">Editar</button>
                        <button class="btn-delete" onclick="excluirFuncionario(${f.id_funcionario})" ${ehVoceMesmo ? 'disabled title="Você não pode excluir seu próprio usuário"' : ''}>Excluir</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (erro) {
        console.error(erro);
        grid.innerHTML = '<div class="loading" style="color:#f75a68;">Erro ao carregar dados do servidor.</div>';
    }
}

function configurarModal() {
    const modal = document.getElementById('modalFuncionario');
    const btnFechar = document.getElementById('btnFecharModal');
    const form = document.getElementById('formEditarFuncionario');

    btnFechar.addEventListener('click', () => fecharModal());

    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });

    function fecharModal() {
        modal.classList.remove('active');
        funcionarioEmEdicao = null;
        form.reset();
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!funcionarioEmEdicao) return;

        const dadosAtualizados = {
            nome: document.getElementById('nome').value.trim(),
            email: document.getElementById('email').value.trim(),
            cargo: document.getElementById('cargo').value,
            cargoQuemAlterou: funcionarioLogado.cargo
        };

        try {
            const response = await fetch(`${API_URL}/funcionarios/${funcionarioEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            });

            const dados = await response.json();

            if (!response.ok) throw new Error(dados.erro || 'Erro ao atualizar funcionário.');

            alert('Funcionário atualizado com sucesso!');
            fecharModal();
            carregarFuncionarios();

        } catch (erro) {
            console.error(erro);
            alert(erro.message);
        }
    });
}

function editarFuncionario(idFuncionario) {
    const f = funcionariosCache.find(func => func.id_funcionario === idFuncionario);
    if (!f) return;

    funcionarioEmEdicao = idFuncionario;

    document.getElementById('nome').value = f.nome;
    document.getElementById('email').value = f.email;
    document.getElementById('cargo').value = f.cargo;

    document.getElementById('modalFuncionario').classList.add('active');
}

async function excluirFuncionario(idFuncionario) {
    if (idFuncionario === funcionarioLogado.id_funcionario) {
        alert('Você não pode excluir seu próprio usuário.');
        return;
    }

    if (!confirm('Tem certeza que deseja excluir este funcionário? Essa ação não pode ser desfeita.')) return;

    try {
        const response = await fetch(`${API_URL}/funcionarios/${idFuncionario}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cargoQuemAlterou: funcionarioLogado.cargo })
        });

        const dados = await response.json().catch(() => ({}));

        if (!response.ok) throw new Error(dados.erro || 'Erro ao excluir funcionário.');

        alert('Funcionário excluído com sucesso!');
        carregarFuncionarios();
    } catch (erro) {
        console.error(erro);
        alert(erro.message);
    }
}

function configurarLogout() {
    document.getElementById('btnSairAdmin').addEventListener('click', () => {
        localStorage.removeItem('funcionarioLogado');
        window.location.href = 'login-funcionario.html';
    });
}