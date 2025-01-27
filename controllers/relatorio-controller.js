export class RelatorioController {
    constructor() {
        this.clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
        this.produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
        this.vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
    }

    renderRelatorios() {
        return `
            <h2>Relatórios Gerenciais</h2>
            <div class="relatorios-container">
                <div class="relatorio-secao">
                    <h3>Relatórios Rápidos</h3>
                    <div class="relatorio-grid">
                        <button onclick="sistema.relatorioController.gerarRelatorioVendasRapido()">Vendas do Dia</button>
                        <button onclick="sistema.relatorioController.gerarRelatorioEstoqueRapido()">Estoque Atual</button>
                        <button onclick="sistema.relatorioController.gerarRelatorioClientesRapido()">Clientes Cadastrados</button>
                    </div>
                </div>

                <div class="relatorio-secao">
                    <h3>Relatórios Detalhados</h3>
                    <form id="relatorioDetalhadoForm">
                        <div class="filtro-relatorio">
                            <label>Tipo de Relatório:</label>
                            <select id="tipoRelatorio">
                                <option value="vendas">Vendas</option>
                                <option value="estoque">Estoque</option>
                                <option value="clientes">Clientes</option>
                            </select>
                        </div>

                        <div class="filtro-relatorio">
                            <label>Período:</label>
                            <input type="date" id="dataInicio">
                            <input type="date" id="dataFim">
                        </div>

                        <div class="filtro-relatorio">
                            <label>Filtros Adicionais:</label>
                            <select id="filtroAdicional">
                                <option value="">Sem Filtro Adicional</option>
                                <option value="maiores_compradores">Maiores Compradores</option>
                                <option value="produtos_mais_vendidos">Produtos Mais Vendidos</option>
                                <option value="clientes_inativos">Clientes Inativos</option>
                            </select>
                        </div>

                        <button type="button" onclick="sistema.relatorioController.gerarRelatorioDetalhado()">Gerar Relatório Detalhado</button>
                    </form>
                </div>

                <div class="relatorio-secao">
                    <h3>Gráficos e Análises</h3>
                    <div class="graficos-container" id="graficosContainer">
                        ${this.renderGraficosPreview()}
                    </div>
                </div>
            </div>

            <div id="relatorioOutput" class="relatorio-output"></div>
        `;
    }

    renderGraficosPreview() {
        return `
            <div class="grafico-preview">
                <h4>Vendas Mensais</h4>
                <canvas id="graficoVendasMensais"></canvas>
            </div>
            <div class="grafico-preview">
                <h4>Estoque de Produtos</h4>
                <canvas id="graficoEstoqueProdutos"></canvas>
            </div>
        `;
    }

    gerarRelatorioVendasRapido() {
        const hoje = new Date().toISOString().split('T')[0];
        const vendasHoje = this.vendas.filter(venda => 
            new Date(venda.data).toISOString().split('T')[0] === hoje
        );

        const totalVendasHoje = vendasHoje.reduce((total, venda) => total + venda.valorTotal, 0);

        const relatorio = `
            RELATÓRIO DE VENDAS - ${hoje}
            ===============================
            Total de Vendas: ${vendasHoje.length}
            Valor Total: R$ ${totalVendasHoje.toFixed(2)}

            Detalhes das Vendas:
            ${vendasHoje.map(venda => `
            - ${venda.nomeCliente}: ${venda.descricaoProduto} 
              Quantidade: ${venda.quantidade} 
              Valor: R$ ${venda.valorTotal.toFixed(2)}
            `).join('\n')}
        `;

        this.exibirRelatorio(relatorio);
    }

    gerarRelatorioEstoqueRapido() {
        const relatorio = `
            RELATÓRIO DE ESTOQUE
            ====================
            Total de Produtos: ${this.produtos.length}

            Produtos em Estoque:
            ${this.produtos.map(produto => `
            - ${produto.descricao}: ${produto.estoque} unidades 
              Preço: R$ ${produto.preco.toFixed(2)}
              ${produto.estoque <= 10 ? '⚠️ ESTOQUE BAIXO' : ''}
            `).join('\n')}

            Produtos com Estoque Crítico:
            ${this.produtos.filter(p => p.estoque <= 5).map(p => `
            ⚠️ ${p.descricao}: ${p.estoque} unidades
            `).join('\n') || 'Nenhum produto com estoque crítico'}
        `;

        this.exibirRelatorio(relatorio);
    }

    gerarRelatorioClientesRapido() {
        const relatorio = `
            RELATÓRIO DE CLIENTES
            =====================
            Total de Clientes: ${this.clientes.length}

            Detalhes dos Clientes:
            ${this.clientes.map(cliente => `
            - ${cliente.nome}
              Telefone: ${cliente.telefone}
              Endereço: ${cliente.endereco}
            `).join('\n')}
        `;

        this.exibirRelatorio(relatorio);
    }

    gerarRelatorioDetalhado() {
        const tipoRelatorio = document.getElementById('tipoRelatorio').value;
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        const filtroAdicional = document.getElementById('filtroAdicional').value;

        let relatorio = '';

        switch(tipoRelatorio) {
            case 'vendas':
                relatorio = this.gerarRelatorioVendasDetalhado(dataInicio, dataFim, filtroAdicional);
                break;
            case 'estoque':
                relatorio = this.gerarRelatorioEstoqueDetalhado(filtroAdicional);
                break;
            case 'clientes':
                relatorio = this.gerarRelatorioClientesDetalhado(dataInicio, dataFim, filtroAdicional);
                break;
        }

        this.exibirRelatorio(relatorio);
    }

    gerarRelatorioVendasDetalhado(dataInicio, dataFim, filtroAdicional) {
        let vendasFiltradas = this.vendas;

        if (dataInicio && dataFim) {
            vendasFiltradas = vendasFiltradas.filter(venda => {
                const dataVenda = new Date(venda.data);
                return dataVenda >= new Date(dataInicio) && dataVenda <= new Date(dataFim);
            });
        }

        let relatorio = `
            RELATÓRIO DETALHADO DE VENDAS
            =============================
            Período: ${dataInicio || 'Início'} a ${dataFim || 'Hoje'}
            Total de Vendas: ${vendasFiltradas.length}
            Valor Total: R$ ${vendasFiltradas.reduce((total, venda) => total + venda.valorTotal, 0).toFixed(2)}
        `;

        if (filtroAdicional === 'maiores_compradores') {
            const comprasPorCliente = vendasFiltradas.reduce((acc, venda) => {
                acc[venda.nomeCliente] = (acc[venda.nomeCliente] || 0) + venda.valorTotal;
                return acc;
            }, {});

            relatorio += '\n\nMAIORES COMPRADORES:\n';
            Object.entries(comprasPorCliente)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([cliente, total]) => {
                    relatorio += `- ${cliente}: R$ ${total.toFixed(2)}\n`;
                });
        }

        if (filtroAdicional === 'produtos_mais_vendidos') {
            const vendasPorProduto = vendasFiltradas.reduce((acc, venda) => {
                acc[venda.descricaoProduto] = (acc[venda.descricaoProduto] || 0) + venda.quantidade;
                return acc;
            }, {});

            relatorio += '\n\nPRODUTOS MAIS VENDIDOS:\n';
            Object.entries(vendasPorProduto)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([produto, quantidade]) => {
                    relatorio += `- ${produto}: ${quantidade} unidades\n`;
                });
        }

        return relatorio;
    }

    gerarRelatorioEstoqueDetalhado(filtroAdicional) {
        let relatorio = `
            RELATÓRIO DETALHADO DE ESTOQUE
            ==============================
            Total de Produtos: ${this.produtos.length}
        `;

        if (filtroAdicional === 'produtos_mais_vendidos') {
            const vendasPorProduto = this.vendas.reduce((acc, venda) => {
                acc[venda.descricaoProduto] = (acc[venda.descricaoProduto] || 0) + venda.quantidade;
                return acc;
            }, {});

            relatorio += '\n\nPRODUTOS MAIS VENDIDOS:\n';
            Object.entries(vendasPorProduto)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([produto, quantidade]) => {
                    const produtoInfo = this.produtos.find(p => p.descricao === produto);
                    relatorio += `- ${produto}: ${quantidade} unidades\n  Estoque Atual: ${produtoInfo.estoque}\n`;
                });
        }

        return relatorio;
    }

    gerarRelatorioClientesDetalhado(dataInicio, dataFim, filtroAdicional) {
        let relatorio = `
            RELATÓRIO DETALHADO DE CLIENTES
            ================================
            Total de Clientes: ${this.clientes.length}
        `;

        if (filtroAdicional === 'clientes_inativos') {
            const clientesInativos = this.clientes.filter(cliente => {
                const vendasCliente = this.vendas.filter(venda => venda.nomeCliente === cliente.nome);
                return vendasCliente.length === 0 || 
                       (dataInicio && dataFim && 
                        !vendasCliente.some(venda => 
                            new Date(venda.data) >= new Date(dataInicio) && 
                            new Date(venda.data) <= new Date(dataFim)
                        ));
            });

            relatorio += '\n\nCLIENTES INATIVOS:\n';
            clientesInativos.forEach(cliente => {
                relatorio += `- ${cliente.nome} (${cliente.telefone})\n`;
            });
        }

        return relatorio;
    }

    exibirRelatorio(texto) {
        const outputDiv = document.getElementById('relatorioOutput');
        outputDiv.innerHTML = `
            <pre>${texto}</pre>
            <button onclick="sistema.relatorioController.baixarRelatorio('${texto.replace(/'/g, "\\'")}')" class="btn-download">Baixar Relatório</button>
        `;
    }

    baixarRelatorio(texto) {
        const blob = new Blob([texto], {type: 'text/plain'});
        const dataAtual = new Date().toISOString().replace(/:/g, '-');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${dataAtual}.txt`;
        link.click();
    }

    renderGraficoVendasMensais() {
        const ctx = document.getElementById('graficoVendasMensais');
        if (!ctx) return;

        // Agrupar vendas por mês
        const vendasPorMes = this.vendas.reduce((acc, venda) => {
            const data = new Date(venda.data);
            const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            acc[mes] = (acc[mes] || 0) + venda.valorTotal;
            return acc;
        }, {});

        const meses = Object.keys(vendasPorMes).sort();
        const valoresVendas = meses.map(mes => vendasPorMes[mes]);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Vendas Mensais (R$)',
                    data: valoresVendas,
                    backgroundColor: '#00ff00',
                    borderColor: '#00ff00',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#00ff00'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#00ff00'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#00ff00'
                        }
                    }
                }
            }
        });
    }

    renderGraficoEstoqueProdutos() {
        const ctx = document.getElementById('graficoEstoqueProdutos');
        if (!ctx) return;

        const nomeProdutos = this.produtos.map(p => p.descricao);
        const estoqueProdutos = this.produtos.map(p => p.estoque);

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: nomeProdutos,
                datasets: [{
                    label: 'Estoque de Produtos',
                    data: estoqueProdutos,
                    backgroundColor: [
                        '#00ff00', '#007f00', '#00bf00', 
                        '#00ff40', '#00bf40', '#007f40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#00ff00'
                        }
                    }
                }
            }
        });
    }
}