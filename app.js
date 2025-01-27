import { ClienteController } from './controllers/cliente-controller.js';
import { ProdutoController } from './controllers/produto-controller.js';
import { VendaController } from './controllers/venda-controller.js';
import { RelatorioController } from './controllers/relatorio-controller.js';
import { KeyboardNavigation } from './keyboard-nav.js';

class SistemaGas {
    constructor() {
        this.clienteController = new ClienteController(this);
        this.produtoController = new ProdutoController(this);
        this.vendaController = new VendaController(this);
        this.relatorioController = new RelatorioController();
        this.dadosEmpresa = JSON.parse(localStorage.getItem('dadosEmpresa') || '{}');
        this.lastActiveScreen = 'dashboard'; // Track last active screen
        
        this.inicializarSistema();
    }

    inicializarSistema() {
        // Verificar e criar dados iniciais se necessário
        this.verificarPrimeiroAcesso();
        this.showScreen('dashboard');

        // Initialize keyboard navigation
        this.keyboardNavigation = new KeyboardNavigation(this);
    }

    verificarPrimeiroAcesso() {
        const primeiroAcesso = localStorage.getItem('primeiroAcesso') === null;
        
        if (primeiroAcesso) {
            // Criar dados iniciais de exemplo
            const clientesIniciais = [
                { 
                    nome: 'Cliente Padrão', 
                    telefone: '1199999999', 
                    endereco: 'Endereço Padrão',
                    dataCadastro: new Date().toISOString()
                }
            ];

            const produtosIniciais = [
                { 
                    descricao: 'Gás P13', 
                    preco: 80.00, 
                    estoque: 50,
                    dataUltimaAtualizacao: new Date().toISOString()
                },
                { 
                    descricao: 'Gás P45', 
                    preco: 250.00, 
                    estoque: 20,
                    dataUltimaAtualizacao: new Date().toISOString()
                }
            ];

            localStorage.setItem('clientes', JSON.stringify(clientesIniciais));
            localStorage.setItem('produtos', JSON.stringify(produtosIniciais));
            localStorage.setItem('primeiroAcesso', 'false');
        }
    }

    showScreen(screen) {
        // Store last active screen
        this.updateScreenContent(screen);
    }

    updateScreenContent(screen, options = {}) {
        const { keepLastScreen = false } = options;
        const content = document.getElementById('content');
        
        // Only update lastActiveScreen if keepLastScreen is false and we're explicitly changing screens
        if (!keepLastScreen) {
            this.lastActiveScreen = screen;
        }

        switch(screen) {
            case 'dashboard':
                content.innerHTML = this.renderDashboard();
                break;
            case 'clientes':
                content.innerHTML = this.clienteController.renderClientesScreen();
                break;
            case 'produtos':
                content.innerHTML = this.produtoController.renderProdutosScreen();
                break;
            case 'vendas':
                content.innerHTML = this.vendaController.renderVendasScreen();
                break;
            case 'relatorios':
                content.innerHTML = this.relatorioController.renderRelatorios();
                this.relatorioController.renderGraficoVendasMensais();
                this.relatorioController.renderGraficoEstoqueProdutos();
                break;
            case 'configuracoes':
                content.innerHTML = this.renderConfiguracoes();
                break;
        }

        // Ensure first focusable element gets focus
        const firstFocusableElement = content.querySelector('input, button, select');
        if (firstFocusableElement) {
            firstFocusableElement.focus();
        }
    }

    renderDashboard() {
        const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
        const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
        const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
        const dadosEmpresa = JSON.parse(localStorage.getItem('dadosEmpresa') || '{}');

        const totalVendas = vendas.reduce((total, venda) => total + venda.valorTotal, 0);
        const produtosMaisBaixoEstoque = produtos
            .filter(p => p.estoque < 10)
            .sort((a, b) => a.estoque - b.estoque);

        return `
            <h2>${dadosEmpresa.nome ? dadosEmpresa.nome : 'Dashboard'}</h2>
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>Total de Clientes</h3>
                    <p>${clientes.length}</p>
                </div>
                <div class="dashboard-card">
                    <h3>Total de Produtos</h3>
                    <p>${produtos.length}</p>
                </div>
                <div class="dashboard-card">
                    <h3>Total de Vendas</h3>
                    <p>R$ ${totalVendas.toFixed(2)}</p>
                </div>
                <div class="dashboard-card">
                    <h3>Produtos com Baixo Estoque</h3>
                    <ul>
                        ${produtosMaisBaixoEstoque.map(p => `
                            <li>${p.descricao} (${p.estoque} unidades)</li>
                        `).join('') || '<li>Todos os produtos estão OK</li>'}
                    </ul>
                </div>
                ${dadosEmpresa.nome ? `
                <div class="dashboard-card empresa-info">
                    <h3>Informações da Empresa</h3>
                    <p><strong>Nome:</strong> ${dadosEmpresa.nome}</p>
                    <p><strong>CNPJ:</strong> ${dadosEmpresa.cnpj}</p>
                    <p><strong>Endereço:</strong> ${dadosEmpresa.endereco}</p>
                    <p><strong>Telefone:</strong> ${dadosEmpresa.telefone}</p>
                    <p><strong>E-mail:</strong> ${dadosEmpresa.email}</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderConfiguracoes() {
        const empresa = this.dadosEmpresa;
        const configuracaoRecibo = JSON.parse(localStorage.getItem('configuracaoRecibo') || JSON.stringify({
            cabecalho: 'Recibo de Venda',
            rodape: 'Obrigado pela Compra!',
            imprimir_endereco_empresa: true,
            imprimir_cnpj: true,
            cor_fonte: '#000000',
            cor_fundo: '#FFFFFF',
            largura_recibo: '80%',
            tamanho_fonte: '12px'
        }));

        return `
            <h2>Configurações</h2>
            <div class="configuracoes-container">
                <div class="configuracoes-secao">
                    <h3>Dados da Empresa</h3>
                    <form id="empresaForm">
                        <label for="nomeEmpresa">Nome da Empresa:</label>
                        <input type="text" id="nomeEmpresa" name="nomeEmpresa" value="${empresa.nome || ''}" placeholder="Nome da empresa">
                        
                        <label for="cnpj">CNPJ:</label>
                        <input type="text" id="cnpj" name="cnpj" value="${empresa.cnpj || ''}" placeholder="CNPJ">
                        
                        <label for="endereco">Endereço:</label>
                        <input type="text" id="endereco" name="endereco" value="${empresa.endereco || ''}" placeholder="Endereço completo">
                        
                        <label for="telefone">Telefone:</label>
                        <input type="text" id="telefone" name="telefone" value="${empresa.telefone || ''}" placeholder="Telefone">
                        
                        <label for="email">E-mail:</label>
                        <input type="email" id="email" name="email" value="${empresa.email || ''}" placeholder="E-mail da empresa">
                        
                        <button type="button" onclick="sistema.salvarDadosEmpresa()">Salvar Dados da Empresa</button>
                    </form>
                </div>

                <div class="configuracoes-secao">
                    <h3>Configurações de Recibo</h3>
                    <form id="reciboForm">
                        <label for="cabecalho">Cabeçalho do Recibo:</label>
                        <input type="text" id="cabecalho" name="cabecalho" value="${configuracaoRecibo.cabecalho}" placeholder="Cabeçalho do Recibo">
                        
                        <label for="rodape">Rodapé do Recibo:</label>
                        <input type="text" id="rodape" name="rodape" value="${configuracaoRecibo.rodape}" placeholder="Rodapé do Recibo">
                        
                        <div>
                            <input type="checkbox" id="imprimir_endereco_empresa" name="imprimir_endereco_empresa" ${configuracaoRecibo.imprimir_endereco_empresa ? 'checked' : ''}>
                            <label for="imprimir_endereco_empresa">Imprimir Endereço da Empresa</label>
                        </div>
                        
                        <div>
                            <input type="checkbox" id="imprimir_cnpj" name="imprimir_cnpj" ${configuracaoRecibo.imprimir_cnpj ? 'checked' : ''}>
                            <label for="imprimir_cnpj">Imprimir CNPJ</label>
                        </div>
                        
                        <label for="cor_fonte">Cor da Fonte:</label>
                        <input type="color" id="cor_fonte" name="cor_fonte" value="${configuracaoRecibo.cor_fonte}">
                        
                        <label for="cor_fundo">Cor de Fundo:</label>
                        <input type="color" id="cor_fundo" name="cor_fundo" value="${configuracaoRecibo.cor_fundo}">
                        
                        <label for="largura_recibo">Largura do Recibo:</label>
                        <select id="largura_recibo" name="largura_recibo">
                            <option value="60%" ${configuracaoRecibo.largura_recibo === '60%' ? 'selected' : ''}>Estreito</option>
                            <option value="80%" ${configuracaoRecibo.largura_recibo === '80%' ? 'selected' : ''}>Padrão</option>
                            <option value="100%" ${configuracaoRecibo.largura_recibo === '100%' ? 'selected' : ''}>Largo</option>
                        </select>

                        <label for="tamanho_fonte">Tamanho da Fonte:</label>
                        <select id="tamanho_fonte" name="tamanho_fonte">
                            <option value="10px" ${configuracaoRecibo.tamanho_fonte === '10px' ? 'selected' : ''}>Pequeno</option>
                            <option value="12px" ${configuracaoRecibo.tamanho_fonte === '12px' ? 'selected' : ''}>Médio</option>
                            <option value="14px" ${configuracaoRecibo.tamanho_fonte === '14px' ? 'selected' : ''}>Grande</option>
                        </select>

                        <button type="button" onclick="sistema.salvarConfiguracaoRecibo()">Salvar Configurações de Recibo</button>
                    </form>
                </div>

                <div class="configuracoes-secao">
                    <h3>Backup de Dados</h3>
                    <button onclick="sistema.fazerBackup()">Exportar Dados</button>
                    <input type="file" id="importarDados" accept=".json">
                    <button onclick="sistema.importarDados()">Importar Dados</button>

                    <h3>Limpar Dados</h3>
                    <button onclick="sistema.limparDados()">Limpar Todos os Dados</button>
                </div>
            </div>
        `;
    }

    showNotification(mensagem, tipo = 'success', duracao = 3000) {
        const notificacao = document.getElementById('notification');
        notificacao.textContent = mensagem;
        notificacao.className = `notification ${tipo}`;
        notificacao.style.display = 'block';

        setTimeout(() => {
            notificacao.style.display = 'none';
        }, duracao);
    }

    salvarDadosEmpresa() {
        const empresa = {
            nome: document.getElementById('nomeEmpresa').value,
            cnpj: document.getElementById('cnpj').value,
            endereco: document.getElementById('endereco').value,
            telefone: document.getElementById('telefone').value,
            email: document.getElementById('email').value
        };

        this.dadosEmpresa = empresa;
        localStorage.setItem('dadosEmpresa', JSON.stringify(empresa));
        alert('Dados da empresa salvos com sucesso!');
    }

    salvarConfiguracaoRecibo() {
        const configuracaoRecibo = {
            cabecalho: document.getElementById('cabecalho').value,
            rodape: document.getElementById('rodape').value,
            imprimir_endereco_empresa: document.getElementById('imprimir_endereco_empresa').checked,
            imprimir_cnpj: document.getElementById('imprimir_cnpj').checked,
            cor_fonte: document.getElementById('cor_fonte').value,
            cor_fundo: document.getElementById('cor_fundo').value,
            largura_recibo: document.getElementById('largura_recibo').value,
            tamanho_fonte: document.getElementById('tamanho_fonte').value
        };

        localStorage.setItem('configuracaoRecibo', JSON.stringify(configuracaoRecibo));
        alert('Configurações de recibo salvas com sucesso!');
    }

    fazerBackup() {
        const dadosParaBackup = {
            clientes: JSON.parse(localStorage.getItem('clientes') || '[]'),
            produtos: JSON.parse(localStorage.getItem('produtos') || '[]'),
            vendas: JSON.parse(localStorage.getItem('vendas') || '[]'),
            dadosEmpresa: JSON.parse(localStorage.getItem('dadosEmpresa') || '{}'),
            configuracaoRecibo: JSON.parse(localStorage.getItem('configuracaoRecibo') || JSON.stringify({
                cabecalho: 'Recibo de Venda',
                rodape: 'Obrigado pela Compra!',
                imprimir_endereco_empresa: true,
                imprimir_cnpj: true,
                cor_fonte: '#000000',
                cor_fundo: '#FFFFFF',
                largura_recibo: '80%',
                tamanho_fonte: '12px'
            }))
        };

        const dataAtual = new Date().toISOString().replace(/:/g, '-');
        const blob = new Blob([JSON.stringify(dadosParaBackup, null, 2)], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_sistema_gas_${dataAtual}.json`;
        link.click();
    }

    importarDados() {
        const fileInput = document.getElementById('importarDados');
        const file = fileInput.files[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const dadosImportados = JSON.parse(e.target.result);
                    
                    localStorage.setItem('clientes', JSON.stringify(dadosImportados.clientes || []));
                    localStorage.setItem('produtos', JSON.stringify(dadosImportados.produtos || []));
                    localStorage.setItem('vendas', JSON.stringify(dadosImportados.vendas || []));
                    localStorage.setItem('dadosEmpresa', JSON.stringify(dadosImportados.dadosEmpresa || {}));
                    localStorage.setItem('configuracaoRecibo', JSON.stringify(dadosImportados.configuracaoRecibo || {
                        cabecalho: 'Recibo de Venda',
                        rodape: 'Obrigado pela Compra!',
                        imprimir_endereco_empresa: true,
                        imprimir_cnpj: true,
                        cor_fonte: '#000000',
                        cor_fundo: '#FFFFFF',
                        largura_recibo: '80%',
                        tamanho_fonte: '12px'
                    }));
                    
                    alert('Dados importados com sucesso!');
                    this.showScreen('dashboard');
                } catch (error) {
                    alert('Erro ao importar dados: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    }

    limparDados() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('clientes');
            localStorage.removeItem('produtos');
            localStorage.removeItem('vendas');
            localStorage.removeItem('dadosEmpresa');
            localStorage.removeItem('configuracaoRecibo');
            
            this.clienteController = new ClienteController(this);
            this.produtoController = new ProdutoController(this);
            this.vendaController = new VendaController(this);
            
            alert('Todos os dados foram limpos.');
            this.showScreen('dashboard');
        }
    }

    gerarRecibo(venda) {
        const dadosEmpresa = JSON.parse(localStorage.getItem('dadosEmpresa') || '{}');
        const configuracaoRecibo = JSON.parse(localStorage.getItem('configuracaoRecibo') || JSON.stringify({
            cabecalho: 'Recibo de Venda',
            rodape: 'Obrigado pela Compra!',
            imprimir_endereco_empresa: true,
            imprimir_cnpj: true,
            cor_fonte: '#000000',
            cor_fundo: '#FFFFFF',
            largura_recibo: '80%',
            tamanho_fonte: '12px'
        }));

        // Find the full client details using the client index from the sale
        const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
        const cliente = clientes[venda.clienteIndex];

        const recibo = document.createElement('div');
        recibo.style.backgroundColor = configuracaoRecibo.cor_fundo;
        recibo.style.color = configuracaoRecibo.cor_fonte;
        recibo.style.padding = '20px';
        recibo.style.fontFamily = 'Arial, sans-serif';
        recibo.style.width = configuracaoRecibo.largura_recibo;
        recibo.style.fontSize = configuracaoRecibo.tamanho_fonte;
        recibo.style.margin = '0 auto';  // Center the recibo

        recibo.innerHTML = `
            <h2 style="text-align: center;">${configuracaoRecibo.cabecalho}</h2>
            
            ${dadosEmpresa.nome ? `
                <div style="text-align: center; margin-bottom: 20px;">
                    <strong>${dadosEmpresa.nome}</strong><br>
                    ${dadosEmpresa.endereco ? `Endereço: ${dadosEmpresa.endereco}<br>` : ''}
                    ${dadosEmpresa.telefone ? `Telefone: ${dadosEmpresa.telefone}<br>` : ''}
                    ${dadosEmpresa.email ? `E-mail: ${dadosEmpresa.email}<br>` : ''}
                    ${configuracaoRecibo.imprimir_cnpj && dadosEmpresa.cnpj ? `CNPJ: ${dadosEmpresa.cnpj}<br>` : ''}
                </div>
            ` : ''}
            
            <hr>
            
            <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Cliente:</strong> ${venda.nomeCliente}</p>
            <p><strong>Telefone:</strong> ${cliente.telefone}</p>
            <p><strong>Endereço:</strong> ${cliente.endereco}</p>
            <p><strong>Produto:</strong> ${venda.descricaoProduto}</p>
            <p><strong>Quantidade:</strong> ${venda.quantidade}</p>
            <p><strong>Valor Total:</strong> R$ ${venda.valorTotal.toFixed(2)}</p>
            <p><strong>Forma de Pagamento:</strong> ${this.vendaController.traduzirFormaPagamento(venda.formaPagamento)}</p>
            
            <hr>
            
            <p style="text-align: center; margin-top: 20px;">${configuracaoRecibo.rodape}</p>
        `;

        const janela = window.open('', 'Recibo', 'width=600,height=800');
        janela.document.write('<html><head><title>Recibo</title></head><body>');
        janela.document.write(recibo.outerHTML);
        janela.document.write('</body></html>');
        janela.document.close();
        janela.print();
    }
}

const sistema = new SistemaGas();
window.sistema = sistema;
window.showScreen = sistema.showScreen.bind(sistema);