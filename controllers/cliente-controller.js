export class ClienteController {
    constructor(sistema) {
        this.sistema = sistema;
        this.clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    }

    renderClientesScreen() {
        return `
            <h2>Cadastro de Clientes</h2>
            <form onsubmit="event.preventDefault(); sistema.clienteController.adicionarCliente()">
                <input type="text" id="nome" placeholder="Nome Completo" required>
                <input type="tel" id="telefone" placeholder="Telefone" required pattern="[0-9]{10,11}" title="DDD + Número (10-11 dígitos)">
                <input type="text" id="endereco" placeholder="Endereço Completo" required>
                <input type="email" id="email" placeholder="E-mail (opcional)">
                <button type="submit">Adicionar Cliente</button>
            </form>
            
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Endereço</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.clientes.map((cliente, index) => `
                        <tr>
                            <td>${cliente.nome}</td>
                            <td>${cliente.telefone}</td>
                            <td>${cliente.endereco}</td>
                            <td>
                                <button onclick="sistema.clienteController.excluirCliente(${index})">Excluir</button>
                                <button onclick="sistema.clienteController.editarCliente(${index})">Editar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    adicionarCliente() {
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const endereco = document.getElementById('endereco').value.trim();
        const email = document.getElementById('email').value.trim();

        // Validações
        if (nome.length < 3) {
            this.sistema.showNotification('Nome deve ter pelo menos 3 caracteres', 'error');
            return;
        }

        if (!/^[0-9]{10,11}$/.test(telefone)) {
            this.sistema.showNotification('Telefone inválido', 'error');
            return;
        }

        if (endereco.length < 5) {
            this.sistema.showNotification('Endereço deve ter pelo menos 5 caracteres', 'error');
            return;
        }

        const clienteExistente = this.clientes.find(c => c.telefone === telefone);
        if (clienteExistente) {
            this.sistema.showNotification('Cliente com este telefone já cadastrado', 'error');
            return;
        }

        const novoCliente = { 
            nome, 
            telefone, 
            endereco, 
            email,
            dataCadastro: new Date().toISOString()
        };

        this.clientes.push(novoCliente);
        localStorage.setItem('clientes', JSON.stringify(this.clientes));
        this.sistema.showNotification('Cliente adicionado com sucesso!', 'success');
        
        // Update screen content without full page reload
        this.sistema.updateScreenContent('clientes');
    }

    excluirCliente(index) {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            this.clientes.splice(index, 1);
            localStorage.setItem('clientes', JSON.stringify(this.clientes));
            this.sistema.showNotification('Cliente excluído com sucesso!', 'success');
            
            // Update screen content without full page reload
            this.sistema.updateScreenContent('clientes');
        }
    }

    editarCliente(index) {
        const cliente = this.clientes[index];
        
        const editForm = `
            <h3>Editar Cliente</h3>
            <form id="editClienteForm">
                <input type="text" id="editNome" value="${cliente.nome}" required>
                <input type="tel" id="editTelefone" value="${cliente.telefone}" required>
                <input type="text" id="editEndereco" value="${cliente.endereco}" required>
                <input type="email" id="editEmail" value="${cliente.email || ''}">
                <button type="button" onclick="sistema.clienteController.salvarEdicaoCliente(${index})">Salvar</button>
                <button type="button" onclick="sistema.showScreen('clientes')">Cancelar</button>
            </form>
        `;

        document.getElementById('content').innerHTML = editForm;
    }

    salvarEdicaoCliente(index) {
        const nome = document.getElementById('editNome').value.trim();
        const telefone = document.getElementById('editTelefone').value.trim();
        const endereco = document.getElementById('editEndereco').value.trim();
        const email = document.getElementById('editEmail').value.trim();

        // Validações semelhantes ao adicionar cliente
        if (nome.length < 3) {
            this.sistema.showNotification('Nome deve ter pelo menos 3 caracteres', 'error');
            return;
        }

        if (!/^[0-9]{10,11}$/.test(telefone)) {
            this.sistema.showNotification('Telefone inválido', 'error');
            return;
        }

        if (endereco.length < 5) {
            this.sistema.showNotification('Endereço deve ter pelo menos 5 caracteres', 'error');
            return;
        }

        this.clientes[index] = { 
            nome, 
            telefone, 
            endereco, 
            email,
            dataAtualizacao: new Date().toISOString()
        };

        localStorage.setItem('clientes', JSON.stringify(this.clientes));
        this.sistema.showNotification('Cliente atualizado com sucesso!', 'success');
        
        // Update screen content without full page reload
        this.sistema.updateScreenContent('clientes');
    }
}