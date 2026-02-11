import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calculatorOutline,
  addOutline,
  trashOutline,
  downloadOutline,
  refreshOutline,
  trophyOutline,
  informationCircleOutline,
  barChartOutline,
  checkmarkCircle,
  businessOutline,
  trendingUpOutline,
  timeOutline,
  cashOutline,
  duplicateOutline
} from 'ionicons/icons';

addIcons({
  calculatorOutline,
  addOutline,
  trashOutline,
  downloadOutline,
  refreshOutline,
  trophyOutline,
  informationCircleOutline,
  barChartOutline,
  checkmarkCircle,
  businessOutline,
  trendingUpOutline,
  timeOutline,
  cashOutline,
  duplicateOutline
});

interface Fornecedor {
  id: string;
  nome: string;
  valor: number;
  ipi: number;
  pis: number;
  cofins: number;
  prazo: number;
  frete: number;
}

interface Resultado extends Fornecedor {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  Final: number;
}

@Component({
  selector: 'app-calculo-custo',
  templateUrl: './calculo-custo.component.html',
  styleUrls: ['./calculo-custo.component.scss'],
  standalone: false,
})
export class CalculoCustoComponent implements OnInit {
  private readonly FIX_INFLACAO_PCT = 0;
  private readonly FIX_ICMS_CORREC_D = 0;
  private readonly FIX_ICMS_REAL_D = 10;
  private readonly FIX_DIAS_FORMACAO = 15;
  private readonly FIX_FRETE_VP_DIAS = 15;

  taxaFin: number = 1.8;
  fornecedores: Fornecedor[] = [];
  resultados: Resultado[] = [];
  animacaoCalculando = false;

  get temResultados(): boolean {
    return this.resultados.length > 0;
  }

  get vencedor(): Resultado | null {
    return this.resultados.length > 0 ? this.resultados[0] : null;
  }

  get economiaTotal(): number {
    if (!this.resultados.length || this.resultados.length < 2) return 0;
    const segundoMelhor = this.resultados[1]?.Final || 0;
    const melhor = this.resultados[0]?.Final || 0;
    return segundoMelhor - melhor;
  }

  get percentualEconomia(): string {
    if (!this.resultados.length || this.resultados.length < 2 || !this.resultados[1]?.Final) return '0';
    const melhor = this.resultados[0]?.Final || 0;
    const segundoMelhor = this.resultados[1]?.Final || 0;
    return ((segundoMelhor - melhor) / segundoMelhor * 100).toFixed(2);
  }

  ngOnInit() {
    this.carregarDados();
  }

  private carregarDados() {
    const salvo = localStorage.getItem('custo-real-v4');
    if (salvo) {
      try {
        const dados = JSON.parse(salvo);
        this.taxaFin = dados.taxaFin ?? 1.8;
        this.fornecedores = dados.fornecedores?.length
          ? dados.fornecedores
          : this.fornecedorPadrao();
      } catch (e) {
        this.fornecedores = this.fornecedorPadrao();
      }
    } else {
      this.fornecedores = this.fornecedorPadrao();
    }
  }

  private salvarDados() {
    const dados = {
      taxaFin: this.taxaFin,
      fornecedores: this.fornecedores
    };
    localStorage.setItem('custo-real-v4', JSON.stringify(dados));
  }

  private fornecedorPadrao(): Fornecedor[] {
    return [{
      id: Date.now().toString(),
      nome: 'Fornecedor 1',
      valor: 0,
      ipi: 0,
      pis: 1.65,
      cofins: 7.6,
      prazo: 0,
      frete: 0,
    }];
  }

  adicionarFornecedor() {
    const novo: Fornecedor = {
      id: Date.now().toString(),
      nome: `Fornecedor ${this.fornecedores.length + 1}`,
      valor: 0,
      ipi: 0,
      pis: 1.65,
      cofins: 7.6,
      prazo: 0,
      frete: 0,
    };
    this.fornecedores = [...this.fornecedores, novo];
    this.salvarDados();
  }

  duplicarFornecedor(fornecedor: Fornecedor) {
    const duplicado: Fornecedor = {
      ...fornecedor,
      id: Date.now().toString(),
      nome: `${fornecedor.nome} (cópia)`
    };
    this.fornecedores = [...this.fornecedores, duplicado];
    this.salvarDados();
  }

  atualizarFornecedor(id: string, campo: keyof Fornecedor, valor: any) {
    this.fornecedores = this.fornecedores.map(f =>
      f.id === id ? { ...f, [campo]: valor } : f
    );
    this.salvarDados();
  }

  removerFornecedor(id: string) {
    if (this.fornecedores.length <= 1) return;
    this.fornecedores = this.fornecedores.filter(f => f.id !== id);
    this.salvarDados();
  }

  async calcular() {
    this.animacaoCalculando = true;

    // Pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));

    const taxaMensal = this.taxaFin / 100;
    const inflacao = this.FIX_INFLACAO_PCT / 100;

    const expInflacao = (30 - this.FIX_DIAS_FORMACAO + this.FIX_ICMS_CORREC_D) / 30;
    const expFinImposto = (30 - this.FIX_DIAS_FORMACAO + this.FIX_ICMS_REAL_D) / 30;

    const fatorInflacao = Math.pow(1 + inflacao, expInflacao);
    const fatorFinImposto = Math.pow(1 + taxaMensal, -expFinImposto);

    const calculos = this.fornecedores
      .filter(f => f.valor > 0)
      .map(f => {
        const mesesPrazo = f.prazo / 30;
        const valorIPI = f.valor * (f.ipi / 100);

        const A = this.truncar(f.valor * Math.pow(1 + taxaMensal, -mesesPrazo));
        const D = this.truncar(valorIPI * (Math.pow(1 + taxaMensal, mesesPrazo) - 1));
        const freteNominal = (f.valor + valorIPI) * (f.frete / 100);
        const E = this.truncar(freteNominal * Math.pow(1 + taxaMensal, -(this.FIX_FRETE_VP_DIAS / 30)));

        const B = this.truncar(f.valor * (f.pis / 100) * fatorInflacao * fatorFinImposto);
        const C = this.truncar(f.valor * (f.cofins / 100) * fatorInflacao * fatorFinImposto);

        const Final = this.truncar(A + D + E - B - C);

        return { ...f, A, B, C, D, E, Final } as Resultado;
      })
      .sort((a, b) => a.Final - b.Final);

    this.resultados = calculos;
    this.animacaoCalculando = false;
  }

  private truncar(valor: number, casas = 4): number {
    const fator = Math.pow(10, casas);
    return Math.floor((valor || 0) * fator) / fator;
  }

  formatarBRL(valor: number): string {
    return (valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  }

  formatarBRLCompacto(valor: number): string {
    if (valor >= 1000000) return `R$ ${(valor/1000000).toFixed(2)}M`;
    if (valor >= 1000) return `R$ ${(valor/1000).toFixed(2)}K`;
    return this.formatarBRL(valor);
  }

  formatarPct(valor: number): string {
    return (valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }) + '%';
  }

  exportarCSV() {
    if (!this.temResultados) return;

    const cabecalho = [
      'Fornecedor', 'Valor', 'IPI %', 'PIS %', 'COFINS %', 'Prazo dias', 'Frete %',
      'VP Valor (A)', 'Custo IPI (D)', 'Frete VP (E)', 'PIS Adj (B)', 'COF Adj (C)', 'Custo Real Final'
    ];

    const linhas = this.resultados.map(r => [
      r.nome, r.valor, r.ipi, r.pis, r.cofins, r.prazo, r.frete,
      r.A, r.D, r.E, r.B, r.C, r.Final
    ]);

    const csv = [cabecalho, ...linhas].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custo-real-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  resetar() {
    if (!confirm('Deseja apagar todos os dados?')) return;
    localStorage.removeItem('custo-real-v4');
    window.location.reload();
  }
  // Adicione este método na classe CalculoCustoComponent
  calcularVP(valor: number, prazo: number): number {
    const taxaMensal = this.taxaFin / 100;
    return this.truncar(valor * Math.pow(1 + taxaMensal, -prazo / 30));
  }

  atualizarNomeFornecedor(id: string, event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    const novoNome = target.innerText.trim();
    if (novoNome.length === 0) return;

    this.atualizarFornecedor(id, 'nome', novoNome);
  }
}
