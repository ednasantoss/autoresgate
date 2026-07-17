const API_URL = 'https://autoresgate-backend.onrender.com/api';

const funcionarioData = localStorage.getItem('funcionarioLogado');

if (!funcionarioData) {
    alert('Acesso restrito! Por favor, faça login com suas credenciais de funcionário.');
    window.location.href = 'login-funcionario.html';
}

const funcionario = JSON.parse(funcionarioData);
const isAdmin = (funcionario.cargo || '').toLowerCase() === 'administrador';

let ordemSelecionada = null;
let ordensCache = [];

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const dadosAtuais = localStorage.getItem('funcionarioLogado');
        if (!dadosAtuais) {
            window.location.href = 'login-funcionario.html';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('nomeFuncionario').textContent = funcionario.nome;
    document.getElementById('cargoFuncionario').textContent = funcionario.cargo || 'Funcionário';

    // Ações restritas ao administrador: cadastrar funcionário, gerenciar equipe, atribuir/excluir chamados
    if (isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = '';
        });
    }

    carregarOrdensServico();
    configurarLogout();
    configurarModalFuncionario();
});

async function carregarOrdensServico() {
    const tabela = document.getElementById('tabelaOrdensServico');

    try {
        const response = await fetch(`${API_URL}/chamados`);
        const dados = await response.json();

        if (!response.ok) throw new Error(dados.erro || 'Erro ao carregar Ordens de Serviço.');

        ordensCache = dados;

        if (dados.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="7" class="table-loading">Nenhuma ordem de serviço ativa no momento.</td>
                </tr>
            `;
            return;
        }

        tabela.innerHTML = dados.map(os => {

            let statusClass = 'analise';
            if (os.status === 'Em Reparo') statusClass = 'reparo';
            if (os.status === 'Finalizado') statusClass = 'finalizado';

            // Atribuir funcionário e excluir chamado são ações exclusivas do administrador.
            // Qualquer funcionário pode atualizar o status do serviço em andamento.
            return `
                <tr>
                    <td><strong>#${os.id_os}</strong></td>
                    <td>${os.nome_cliente}</td>
                    <td>${os.marca} ${os.modelo}</td>
                    <td><span style="font-family: monospace; font-size: 14px;">${os.placa.toUpperCase()}</span></td>
                    <td>${os.nome_funcionario ?? "Não atribuído"}</td>
                    <td><span class="status ${statusClass}">${os.status}</span></td>
                    <td>
                        <button class="btn-action" onclick="alterarStatus(${os.id_os}, '${os.status}')">
                            Atualizar
                        </button>

                        <button class="btn-action admin-only" style="display:none;" onclick="abrirModalFuncionario(${os.id_os})">
                            Atribuir
                        </button>

                        <button class="btn-action btn-delete admin-only" style="display:none;" onclick="excluirChamado(${os.id_os})">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Reaplica a visibilidade admin depois de re-renderizar a tabela
        if (isAdmin) {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = '';
            });
        }

    } catch (erro) {
        console.error(erro);
        tabela.innerHTML = `
            <tr>
                <td colspan="7" class="table-loading" style="color: #f75a68;">
                    Erro ao conectar com o banco de dados.
                </td>
            </tr>
        `;
    }
}

async function alterarStatus(idOs, statusAtual) {
    let novoStatus = '';

    if (statusAtual === 'Em Análise') novoStatus = 'Em Reparo';
    else if (statusAtual === 'Em Reparo') novoStatus = 'Finalizado';
    else {
        alert('Esta Ordem de Serviço já está finalizada!');
        return;
    }

    if (confirm(`Deseja alterar o status da Ordem de Serviço #${idOs} para "${novoStatus}"?`)) {
        try {
            const response = await fetch(`${API_URL}/chamados/${idOs}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: novoStatus })
            });

            if (response.ok) {
                alert('Status atualizado com sucesso!');
                carregarOrdensServico();
            } else {
                alert('Erro ao atualizar status da OS.');
            }
        } catch (erro) {
            console.error(erro);
            alert('Erro de conexão com o servidor.');
        }
    }
}

async function excluirChamado(idOs) {
    if (!isAdmin) {
        alert('Apenas administradores podem excluir chamados.');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir a Ordem de Serviço #${idOs}? Essa ação não pode ser desfeita.`)) return;

    try {
        const response = await fetch(`${API_URL}/chamados/${idOs}`, {
            method: 'DELETE'
        });

        const dados = await response.json().catch(() => ({}));

        if (!response.ok) throw new Error(dados.erro || 'Erro ao excluir a Ordem de Serviço.');

        alert('Ordem de Serviço excluída com sucesso!');
        carregarOrdensServico();
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

function configurarModalFuncionario() {
    document.getElementById("btnCancelarFuncionario").addEventListener("click", () => {
        document.getElementById("modalFuncionario").style.display = "none";
    });

    document.getElementById("btnSalvarFuncionario").addEventListener("click", async () => {
        if (!isAdmin) {
            alert('Apenas administradores podem atribuir funcionários a chamados.');
            return;
        }

        const select = document.getElementById("selectFuncionario");
        const idFuncionarioSelecionado = select.value;

        if (!idFuncionarioSelecionado) {
            alert("Selecione um Funcionario ao Chamado Solicitado!");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/chamados/${ordemSelecionada}/funcionario`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idFuncionario: idFuncionarioSelecionado })
            });

            const dados = await response.json();

            if (!response.ok) throw new Error(dados.erro || 'Erro ao atribuir funcionário.');

            alert('Funcionário atribuído com sucesso!');
            document.getElementById("modalFuncionario").style.display = "none";
            carregarOrdensServico();

        } catch (erro) {
            console.error(erro);
            alert(erro.message);
        }
    });
}

async function abrirModalFuncionario(idOS) {
    if (!isAdmin) {
        alert('Apenas administradores podem atribuir funcionários a chamados.');
        return;
    }

    ordemSelecionada = idOS;

    const modal = document.getElementById("modalFuncionario");
    const select = document.getElementById("selectFuncionario");

    modal.style.display = "flex";

    try {

        const response = await fetch(`${API_URL}/funcionarios`);
        const funcionarios = await response.json();

        select.innerHTML = `<option value="" disabled selected>Selecione um funcionário</option>` +
            funcionarios.map(f => `
                <option value="${f.id_funcionario}">
                    ${f.nome}
                </option>
            `).join("");

    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar funcionários.");
    }

}