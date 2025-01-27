export class VendaController {
    constructor(sistema) {
        this.sistema = sistema;
        this.vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
        this.clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
        this.produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
        this.setupEnterKeyHandler();
    }

    setupEnterKeyHandler() {
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('vendaForm');
            if (form) {
                form.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        const activeElement = document.activeElement;
                        // Prevent default only if not a button or submit input
                        if (activeElement.tagName !== 'BUTTON' && 
                            activeElement.getAttribute('type') !== 'submit') {
                            event.preventDefault();
                            this.registrarVenda();
                        }
                    }
                });
            }
        });
    }

    renderVendasScreen() {
        return `
            <h2>Registro de Vendas</h2>
            <form id="vendaForm" onsubmit="event.preventDefault(); sistema.vendaController.registrarVenda(event)">
                <div class="cliente-select-container">
                    <input type="text" 
                           id="clienteSearch" 
                           placeholder="Buscar cliente por nome ou telefone..." 
                           oninput="sistema.vendaController.filtrarClientes(this.value)"
                           autocomplete="off">
                    <div id="clienteSearchResults" class="search-results"></div>
                    <input type="hidden" id="clienteIndex" required>
                </div>

                <select id="produto" required>
                    <option value="">Selecione o Produto</option>
                    ${this.produtos.map((produto, index) => `
                        <option value="${index}">${produto.descricao} - R$ ${produto.preco.toFixed(2)} (${produto.estoque} un.)</option>
                    `).join('')}
                </select>

                <input type="number" id="quantidade" placeholder="Quantidade" min="1" required>
                <select id="formaPagamento" required>
                    <option value="">Forma de Pagamento</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                </select>
                <button type="submit">Registrar Venda</button>
            </form>
            
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Valor Total</th>
                        <th>Forma Pagamento</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.vendas.map((venda, index) => `
                        <tr>
                            <td>${venda.nomeCliente}</td>
                            <td>${venda.descricaoProduto}</td>
                            <td>${venda.quantidade}</td>
                            <td>R$ ${venda.valorTotal.toFixed(2)}</td>
                            <td>${this.traduzirFormaPagamento(venda.formaPagamento)}</td>
                            <td>${new Date(venda.data).toLocaleString()}</td>
                            <td>
                                <button onclick="sistema.vendaController.cancelarVenda(${index})">Cancelar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    filtrarClientes(termo) {
        const searchResults = document.getElementById('clienteSearchResults');
        const hiddenInput = document.getElementById('clienteIndex');
        
        if (!termo.trim()) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }

        const termoLower = termo.toLowerCase();
        const clientesFiltrados = this.clientes.filter(cliente => 
            cliente.nome.toLowerCase().includes(termoLower) ||
            cliente.telefone.includes(termo)
        );

        if (clientesFiltrados.length === 0) {
            searchResults.innerHTML = '<div class="no-results">Nenhum cliente encontrado</div>';
            searchResults.style.display = 'block';
            return;
        }

        searchResults.innerHTML = clientesFiltrados.map((cliente, idx) => `
            <div class="search-result-item" 
                 onclick="sistema.vendaController.selecionarCliente(${this.clientes.indexOf(cliente)}, '${cliente.nome}', '${cliente.telefone}')"
                 onkeydown="if(event.key === 'Enter') sistema.vendaController.selecionarCliente(${this.clientes.indexOf(cliente)}, '${cliente.nome}', '${cliente.telefone}')"
                 tabindex="0">
                <strong>${cliente.nome}</strong><br>
                <small>${cliente.telefone}</small>
            </div>
        `).join('');
        
        searchResults.style.display = 'block';
    }

    selecionarCliente(index, nome, telefone) {
        const searchInput = document.getElementById('clienteSearch');
        const searchResults = document.getElementById('clienteSearchResults');
        const hiddenInput = document.getElementById('clienteIndex');
        
        searchInput.value = `${nome} - ${telefone}`;
        hiddenInput.value = index;
        searchResults.style.display = 'none';

        // Move focus to the next field (produto)
        document.getElementById('produto').focus();
    }

    registrarVenda(event) {
        // Prevent form from resetting
        if (event) {
            event.preventDefault();
        }

        const clienteIndex = document.getElementById('clienteIndex').value;
        const produtoSelect = document.getElementById('produto');
        const quantidadeInput = document.getElementById('quantidade');
        const formaPagamentoSelect = document.getElementById('formaPagamento');

        const produtoIndex = produtoSelect.value;
        const quantidade = parseInt(quantidadeInput.value);
        const formaPagamento = formaPagamentoSelect.value;

        // Validações
        if (!clienteIndex) {
            this.sistema.showNotification('Selecione um cliente', 'error');
            document.getElementById('clienteSearch').focus();
            return;
        }

        if (!produtoIndex) {
            this.sistema.showNotification('Selecione um produto', 'error');
            produtoSelect.focus();
            return;
        }

        if (quantidade <= 0) {
            this.sistema.showNotification('Quantidade deve ser maior que zero', 'error');
            quantidadeInput.focus();
            return;
        }

        if (!formaPagamento) {
            this.sistema.showNotification('Selecione uma forma de pagamento', 'error');
            formaPagamentoSelect.focus();
            return;
        }

        const cliente = this.clientes[clienteIndex];
        const produto = this.produtos[produtoIndex];

        // Verificar estoque
        if (quantidade > produto.estoque) {
            this.sistema.showNotification(`Estoque insuficiente. Disponível: ${produto.estoque} unidades`, 'error');
            quantidadeInput.focus();
            return;
        }

        const valorTotal = produto.preco * quantidade;
        const dataVenda = new Date();

        const novaVenda = { 
            clienteIndex, 
            produtoIndex, 
            quantidade, 
            valorTotal,
            formaPagamento,
            data: dataVenda.toISOString(),
            nomeCliente: cliente.nome,
            descricaoProduto: produto.descricao,
            status: 'concluida'
        };

        // Reduzir estoque
        this.produtos[produtoIndex].estoque -= quantidade;
        this.produtos[produtoIndex].ultimaAtualizacao = dataVenda.toISOString();
        localStorage.setItem('produtos', JSON.stringify(this.produtos));

        this.vendas.push(novaVenda);
        localStorage.setItem('vendas', JSON.stringify(this.vendas));
        
        // Gerar recibo
        this.sistema.gerarRecibo(novaVenda);
        
        this.sistema.showNotification('Venda registrada com sucesso!', 'success');
        
        // Update current screen (vendas) without changing to a different screen
        this.sistema.updateScreenContent('vendas', { keepLastScreen: true });
    }

    cancelarVenda(index) {
        const venda = this.vendas[index];

        if (confirm('Tem certeza que deseja cancelar esta venda? Ela será completamente removida do sistema.')) {
            // Estornar estoque
            const produtoIndex = venda.produtoIndex;
            this.produtos[produtoIndex].estoque += venda.quantidade;
            this.produtos[produtoIndex].ultimaAtualizacao = new Date().toISOString();
            localStorage.setItem('produtos', JSON.stringify(this.produtos));

            // Completamente remover a venda do histórico
            this.vendas.splice(index, 1);
            localStorage.setItem('vendas', JSON.stringify(this.vendas));

            this.sistema.showNotification('Venda cancelada e removida do histórico com sucesso. Estoque restaurado.', 'success');
            
            // Stay on the current screen (vendas)
            this.sistema.updateScreenContent('vendas', { keepLastScreen: true });
        }
    }

    traduzirFormaPagamento(forma) {
        const formasPagamento = {
            'dinheiro': 'Dinheiro',
            'cartao_credito': 'Cartão de Crédito',
            'cartao_debito': 'Cartão de Débito',
            'pix': 'PIX'
        };
        return formasPagamento[forma] || forma;
    }
}