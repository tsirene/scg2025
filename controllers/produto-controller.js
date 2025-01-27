export class ProdutoController {
    constructor(sistema) {
        this.sistema = sistema;
        this.produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
        this.setupEnterKeyHandler();
    }

    setupEnterKeyHandler() {
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.querySelector('form[onsubmit]');
            if (form) {
                form.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        const activeElement = document.activeElement;
                        // Prevent default only if not a button or submit input
                        if (activeElement.tagName !== 'BUTTON' && 
                            activeElement.getAttribute('type') !== 'submit') {
                            event.preventDefault();
                            this.adicionarProduto(event);
                        }
                    }
                });
            }
        });
    }

    renderProdutosScreen() {
        return `
            <h2>Cadastro de Produtos de Gás</h2>
            <form onsubmit="event.preventDefault(); sistema.produtoController.adicionarProduto(event)">
                <input type="text" id="descricao" placeholder="Descrição do Produto" required>
                <input type="number" id="preco" placeholder="Preço" step="0.01" min="0" required>
                <input type="number" id="estoque" placeholder="Quantidade em Estoque" min="0" required>
                <input type="text" id="codigoBarras" placeholder="Código de Barras (opcional)">
                <button type="submit">Adicionar Produto</button>
            </form>
            
            <table>
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Código de Barras</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.produtos.map((produto, index) => `
                        <tr class="${produto.estoque <= 10 ? 'baixo-estoque' : ''}">
                            <td>${produto.descricao}</td>
                            <td>R$ ${produto.preco.toFixed(2)}</td>
                            <td>${produto.estoque}</td>
                            <td>${produto.codigoBarras || 'N/A'}</td>
                            <td>
                                <button onclick="sistema.produtoController.excluirProduto(${index})">Excluir</button>
                                <button onclick="sistema.produtoController.editarProduto(${index})">Editar</button>
                                <button onclick="sistema.produtoController.ajustarEstoque(${index})">Ajustar Estoque</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    adicionarProduto(event) {
        const descricao = document.getElementById('descricao').value.trim();
        const preco = parseFloat(document.getElementById('preco').value);
        const estoque = parseInt(document.getElementById('estoque').value);
        const codigoBarras = document.getElementById('codigoBarras').value.trim();

        // Validações
        if (descricao.length < 3) {
            this.sistema.showNotification('Descrição deve ter pelo menos 3 caracteres', 'error');
            return;
        }

        if (preco <= 0) {
            this.sistema.showNotification('Preço deve ser maior que zero', 'error');
            return;
        }

        if (estoque < 0) {
            this.sistema.showNotification('Estoque não pode ser negativo', 'error');
            return;
        }

        // Verificar produto duplicado
        const produtoExistente = this.produtos.find(p => p.descricao.toLowerCase() === descricao.toLowerCase());
        if (produtoExistente) {
            this.sistema.showNotification('Produto já cadastrado', 'error');
            return;
        }

        const novoProduto = { 
            descricao, 
            preco, 
            estoque, 
            codigoBarras,
            dataCadastro: new Date().toISOString(),
            ultimaAtualizacao: new Date().toISOString()
        };

        this.produtos.push(novoProduto);
        localStorage.setItem('produtos', JSON.stringify(this.produtos));
        this.sistema.showNotification('Produto adicionado com sucesso!', 'success');
        
        // Update screen content without full page reload
        this.sistema.updateScreenContent('produtos');
    }

    excluirProduto(index) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            // Verificar se há vendas associadas
            const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
            const vendasAssociadas = vendas.some(venda => venda.produtoIndex == index);

            if (vendasAssociadas) {
                this.sistema.showNotification('Não é possível excluir produto com vendas associadas', 'error');
                return;
            }

            this.produtos.splice(index, 1);
            localStorage.setItem('produtos', JSON.stringify(this.produtos));
            this.sistema.showNotification('Produto excluído com sucesso!', 'success');
            
            // Update screen content without full page reload
            this.sistema.updateScreenContent('produtos');
        }
    }

    editarProduto(index) {
        const produto = this.produtos[index];
        
        const editForm = `
            <h3>Editar Produto</h3>
            <form id="editProdutoForm">
                <input type="text" id="editDescricao" value="${produto.descricao}" required>
                <input type="number" id="editPreco" value="${produto.preco}" step="0.01" min="0" required>
                <input type="text" id="editCodigoBarras" value="${produto.codigoBarras || ''}" placeholder="Código de Barras">
                <button type="button" onclick="sistema.produtoController.salvarEdicaoProduto(${index})">Salvar</button>
                <button type="button" onclick="sistema.showScreen('produtos')">Cancelar</button>
            </form>
        `;

        document.getElementById('content').innerHTML = editForm;
    }

    salvarEdicaoProduto(index) {
        const descricao = document.getElementById('editDescricao').value.trim();
        const preco = parseFloat(document.getElementById('editPreco').value);
        const codigoBarras = document.getElementById('editCodigoBarras').value.trim();

        // Validações
        if (descricao.length < 3) {
            this.sistema.showNotification('Descrição deve ter pelo menos 3 caracteres', 'error');
            return;
        }

        if (preco <= 0) {
            this.sistema.showNotification('Preço deve ser maior que zero', 'error');
            return;
        }

        this.produtos[index] = { 
            ...this.produtos[index],
            descricao, 
            preco, 
            codigoBarras,
            ultimaAtualizacao: new Date().toISOString()
        };

        localStorage.setItem('produtos', JSON.stringify(this.produtos));
        this.sistema.showNotification('Produto atualizado com sucesso!', 'success');
        
        // Update screen content without full page reload
        this.sistema.updateScreenContent('produtos');
    }

    ajustarEstoque(index) {
        const produto = this.produtos[index];
        
        const ajusteForm = `
            <h3>Ajuste de Estoque - ${produto.descricao}</h3>
            <form id="ajusteEstoqueForm">
                <p>Estoque Atual: ${produto.estoque}</p>
                <input type="number" id="quantidadeAjuste" placeholder="Quantidade de Ajuste (+/-)" required>
                <select id="tipoAjuste">
                    <option value="adicao">Adição</option>
                    <option value="subtracao">Subtração</option>
                </select>
                <input type="text" id="motivoAjuste" placeholder="Motivo do Ajuste" required>
                <button type="button" onclick="sistema.produtoController.salvarAjusteEstoque(${index})">Salvar Ajuste</button>
                <button type="button" onclick="sistema.showScreen('produtos')">Cancelar</button>
            </form>
        `;

        document.getElementById('content').innerHTML = ajusteForm;
    }

    salvarAjusteEstoque(index) {
        const quantidadeAjuste = parseInt(document.getElementById('quantidadeAjuste').value);
        const tipoAjuste = document.getElementById('tipoAjuste').value;
        const motivoAjuste = document.getElementById('motivoAjuste').value.trim();

        // Validações
        if (isNaN(quantidadeAjuste) || quantidadeAjuste <= 0) {
            this.sistema.showNotification('Quantidade de ajuste inválida', 'error');
            return;
        }

        if (motivoAjuste.length < 3) {
            this.sistema.showNotification('Motivo do ajuste deve ter pelo menos 3 caracteres', 'error');
            return;
        }

        const produto = this.produtos[index];
        let novoEstoque;

        if (tipoAjuste === 'adicao') {
            novoEstoque = produto.estoque + quantidadeAjuste;
        } else {
            novoEstoque = produto.estoque - quantidadeAjuste;
            if (novoEstoque < 0) {
                this.sistema.showNotification('Ajuste resultaria em estoque negativo', 'error');
                return;
            }
        }

        // Registrar histórico de ajuste de estoque
        if (!produto.historicoEstoque) {
            produto.historicoEstoque = [];
        }

        produto.historicoEstoque.push({
            data: new Date().toISOString(),
            tipoAjuste,
            quantidadeAjuste,
            motivoAjuste,
            estoqueAnterior: produto.estoque,
            estoqueNovo: novoEstoque
        });

        // Atualizar estoque
        this.produtos[index] = {
            ...produto,
            estoque: novoEstoque,
            ultimaAtualizacao: new Date().toISOString()
        };

        localStorage.setItem('produtos', JSON.stringify(this.produtos));
        this.sistema.showNotification('Estoque ajustado com sucesso!', 'success');
        
        // Update screen content without full page reload
        this.sistema.updateScreenContent('produtos');
    }
}