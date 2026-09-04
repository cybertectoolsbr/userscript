// ==UserScript==
// @name         WhatsApp Web - Modo celular
// @namespace    cybertectools-whatsapp-celular
// @version      0.1.4
// @author       CYBERTECTOOLS
// @description  Organiza o WhatsApp Web em uma coluna, alternando entre conversas e chat
// @match        https://web.whatsapp.com/*
// @updateURL    https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/WhatsApp-Modo-Celular.user.js
// @downloadURL  https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/WhatsApp-Modo-Celular.user.js
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    // BEGIN DC_UPDATE_CHECKER
    // Incorporado nos três userscripts por scripts/sync-update-checker.mjs.
    // Sem execução de código remoto: somente lê o cabeçalho e oferece o link fixo.
    function criarVerificadorAtualizacao({ id, nome, versao, arquivo, namespace }) {
        const url = 'https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/' + arquivo;
        const host = document.createElement('span');
        host.id = id;
        const raiz = host.attachShadow({ mode: 'open' });
        raiz.innerHTML = `
            <style>
                :host { display:inline-flex; vertical-align:middle; flex-shrink:0; }
                button, a { font:12px/1.4 Arial,sans-serif; cursor:pointer; }
                .verificar { width:20px; height:16px; padding:0; border:0; border-radius:3px;
                    background:transparent; color:inherit; font-size:15px; line-height:16px; }
                .verificar:hover { background:#879a9633; }
                :focus-visible { outline:2px solid #47a681; outline-offset:1px; }
                dialog { box-sizing:border-box; width:min(410px,calc(100vw - 28px));
                    max-height:calc(100dvh - 28px); overflow:auto; padding:22px;
                    border:1px solid #a5bcb1; border-radius:12px; background:#fff; color:#243c31;
                    box-shadow:0 12px 48px #0004; font:14px/1.5 Arial,sans-serif; white-space:normal; text-align:left; }
                dialog::backdrop { background:#10271d88; }
                h2 { margin:0 0 12px; font-size:18px; }
                p { margin:0 0 12px; }
                .nota { color:#52685d; font-size:12px; }
                .acoes { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
                .acoes button, .acoes a { display:inline-block; padding:7px 10px;
                    background:#f4f8f6; color:#174f33; border:1px solid #b9cdc2;
                    border-radius:6px; text-decoration:none; }
                [hidden] { display:none !important; }
            </style>
            <button class="verificar" type="button">↻</button>
            <dialog aria-labelledby="titulo" aria-describedby="estado">
                <h2 id="titulo"></h2>
                <p class="carregada"></p>
                <p id="estado" role="status" aria-live="polite"></p>
                <p class="nota">Após instalar, preserve formulários e rascunhos e recarregue a página para carregar a nova versão.</p>
                <div class="acoes">
                    <a class="instalar" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" hidden></a>
                    <button class="fechar" type="button">Fechar</button>
                </div>
            </dialog>`;
        const botao = raiz.querySelector('.verificar');
        const modal = raiz.querySelector('dialog');
        const estado = raiz.querySelector('#estado');
        const instalar = raiz.querySelector('.instalar');
        botao.title = 'Verificar atualização — ' + nome;
        botao.setAttribute('aria-label', botao.title);
        raiz.querySelector('h2').textContent = nome;
        raiz.querySelector('.carregada').textContent = 'Versão carregada: v' + versao;
        instalar.href = url;
        raiz.querySelector('.fechar').addEventListener('click', () => modal.close());
        let consultando = false;

        function consultarPelaPonte() {
            return new Promise((resolve, reject) => {
                const pedido = crypto.randomUUID();
                const tempo = window.setTimeout(() => terminar(new Error('Sem resposta')), 17000);
                function terminar(erro, texto) {
                    window.clearTimeout(tempo);
                    document.removeEventListener('dc-updates-response', receber);
                    if (erro) reject(erro); else resolve(texto);
                }
                function receber(evento) {
                    try {
                        const resposta = JSON.parse(evento.detail);
                        if (resposta.id !== pedido) return;
                        if (typeof resposta.texto !== 'string') terminar(new Error('Falha na consulta'));
                        else terminar(null, resposta.texto);
                    } catch (_) { /* Ignorar eventos fora do protocolo. */ }
                }
                document.addEventListener('dc-updates-response', receber);
                document.dispatchEvent(new CustomEvent('dc-updates-request', {
                    detail: JSON.stringify({ id: pedido, arquivo })
                }));
            });
        }

        async function consultar() {
            // O complemento de janela fornece a consulta via extensão nos dois sites.
            if (document.documentElement.hasAttribute('data-dc-updates-bridge')) return consultarPelaPonte();
            // Uso independente: consulta pública; bloqueios de rede/CSP têm saída manual.
            const controlador = new AbortController();
            const tempo = window.setTimeout(() => controlador.abort(), 12000);
            try {
                const resposta = await fetch(url + '?dc_update=' + Date.now(), {
                    credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
                    redirect: 'error', signal: controlador.signal
                });
                if (!resposta.ok) throw new Error('Resposta HTTP inválida');
                return await resposta.text();
            } finally { window.clearTimeout(tempo); }
        }

        function lerVersao(texto) {
            if (typeof texto !== 'string' || texto.length > 1000000) throw new Error('Arquivo inválido');
            const cabecalho = texto.match(/^\s*\/\/ ==UserScript==\r?\n([\s\S]*?)^\/\/ ==\/UserScript==/m)?.[1];
            if (!cabecalho) throw new Error('Cabeçalho ausente');
            const campo = (chave) => cabecalho.match(new RegExp('^// @' + chave + '\\s+([^\\r\\n]+)', 'm'))?.[1].trim();
            const publicada = campo('version');
            if (campo('name') !== nome || campo('namespace') !== namespace ||
                !/^\d{1,6}(?:\.\d{1,6}){1,4}$/.test(publicada || '')) throw new Error('Identidade ou versão inválida');
            return publicada;
        }

        function comparar(a, b) {
            const partesA = a.split('.').map(Number), partesB = b.split('.').map(Number);
            for (let i = 0; i < Math.max(partesA.length, partesB.length); i++) {
                const diferenca = (partesA[i] || 0) - (partesB[i] || 0);
                if (diferenca) return Math.sign(diferenca);
            }
            return 0;
        }

        botao.addEventListener('click', async (evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            if (!modal.open) modal.showModal();
            if (consultando) return;
            consultando = true;
            botao.disabled = true;
            instalar.hidden = true;
            estado.textContent = 'Verificando atualização…';
            try {
                const publicada = lerVersao(await consultar());
                const comparacao = comparar(publicada, versao);
                if (comparacao > 0) {
                    estado.textContent = 'Nova versão disponível: v' + publicada + '.';
                    instalar.textContent = 'Instalar v' + publicada;
                    instalar.hidden = false;
                } else if (comparacao === 0) estado.textContent = 'Esta página já está na versão publicada: v' + publicada + '.';
                else estado.textContent = 'A versão carregada é mais recente que a publicada (v' + publicada + ').';
            } catch (_) {
                estado.textContent = 'Não foi possível consultar a versão. Tente novamente ou confira pelo link de instalação.';
                instalar.textContent = 'Abrir no Tampermonkey';
                instalar.hidden = false;
            } finally {
                consultando = false;
                botao.disabled = false;
            }
        });
        return host;
    }
    // END DC_UPDATE_CHECKER
    if (window.top !== window.self) return;

    const ID = 'wac-modo-celular';
    // Versão do código carregado nesta página; manter igual ao @version.
    const VERSAO_SCRIPT = '0.1.4';
    const CHAVE = 'cybertectools-whatsapp-modo-celular-v1';
    const ATRIBUTO = 'data-wac-layout';
    const ATRIBUTO_SOBREPOSICAO = 'data-wac-sobreposicao';
    const ATRIBUTO_DOWNLOAD = 'data-wac-download';
    let compacto = true;
    try { compacto = localStorage.getItem(CHAVE) !== 'pc'; } catch (_) { /* Preferência opcional. */ }
    let vista = 'lista';
    let chatAnterior = null;
    let aguardandoChat = false;
    let agendado = false;
    let marcados = new Set();
    let host;
    let controles;
    let assinatura = [];
    let sobreposicoes = new Set();
    let promocoesDownload = new Set();

    function marcar(elemento, valor) {
        if (!elemento || elemento === document.body || elemento === document.documentElement) return;
        if (elemento.getAttribute(ATRIBUTO) !== valor) elemento.setAttribute(ATRIBUTO, valor);
        marcados.add(elemento);
    }

    function limparLayout() {
        marcados.forEach((elemento) => elemento.removeAttribute(ATRIBUTO));
        marcados.clear();
        sobreposicoes.forEach((elemento) => {
            elemento.removeAttribute(ATRIBUTO_SOBREPOSICAO);
            elemento.style.removeProperty('--wac-sobreposicao-topo');
            elemento.style.removeProperty('--wac-sobreposicao-largura');
        });
        sobreposicoes.clear();
        promocoesDownload.forEach((elemento) => elemento.removeAttribute(ATRIBUTO_DOWNLOAD));
        promocoesDownload.clear();
        assinatura = [];
        document.documentElement.classList.remove('wac-ativo', 'wac-lista', 'wac-conversa');
    }

    function sincronizarMarcacoes(anteriores, novas, atributo) {
        anteriores.forEach((elemento) => {
            if (!novas.has(elemento)) elemento.removeAttribute(atributo);
        });
        novas.forEach((valor, elemento) => {
            if (elemento.getAttribute(atributo) !== valor) elemento.setAttribute(atributo, valor);
        });
        return new Set(novas.keys());
    }

    function ajustarSobreposicoes(raiz) {
        const novas = new Map();
        const larguraDisponivel = Math.min(480, window.innerWidth);
        const larguraMaxima = Math.max(1, larguraDisponivel - 16);
        const larguraMinima = Math.min(280, larguraMaxima);
        const limiteInferior = Math.max(96, window.innerHeight - 88);
        for (const painel of raiz.querySelectorAll('[role="dialog"], [aria-modal="true"]')) {
            const caixa = painel.getBoundingClientRect();
            if (caixa.width < 2 || caixa.height < 2) continue;
            const largura = Math.min(Math.max(larguraMinima, caixa.width), larguraMaxima);
            const altura = Math.min(caixa.height, limiteInferior - 8);
            const topo = Math.min(Math.max(8, caixa.top), Math.max(8, limiteInferior - altura));
            novas.set(painel, 'painel');
            for (let elemento = painel.parentElement; elemento && elemento !== raiz; elemento = elemento.parentElement) {
                novas.set(elemento, 'caminho');
            }
            const topoCss = Math.round(topo) + 'px';
            const larguraCss = Math.round(largura) + 'px';
            if (painel.style.getPropertyValue('--wac-sobreposicao-topo') !== topoCss) {
                painel.style.setProperty('--wac-sobreposicao-topo', topoCss);
            }
            if (painel.style.getPropertyValue('--wac-sobreposicao-largura') !== larguraCss) {
                painel.style.setProperty('--wac-sobreposicao-largura', larguraCss);
            }
        }
        sobreposicoes.forEach((elemento) => {
            if (novas.has(elemento)) return;
            elemento.style.removeProperty('--wac-sobreposicao-topo');
            elemento.style.removeProperty('--wac-sobreposicao-largura');
        });
        sobreposicoes = sincronizarMarcacoes(sobreposicoes, novas, ATRIBUTO_SOBREPOSICAO);
    }

    function ocultarPromocaoDownload(lateral) {
        const novas = new Map();
        const normalizar = (texto) => (texto || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR');
        for (const controle of lateral.querySelectorAll('a, button, [role="button"]')) {
            const texto = normalizar(controle.textContent);
            if (!texto.includes('baixar o whatsapp') || !texto.includes('windows')) continue;
            let bloco = controle;
            for (let pai = controle.parentElement; pai && pai !== lateral; pai = pai.parentElement) {
                const caixa = pai.getBoundingClientRect();
                if (caixa.height > 180 || normalizar(pai.textContent) !== texto) break;
                bloco = pai;
            }
            novas.set(bloco, 'oculto');
        }
        promocoesDownload = sincronizarMarcacoes(promocoesDownload, novas, ATRIBUTO_DOWNLOAD);
    }

    function encontrarRaiz(lateral, chat) {
        // Sem chat, as larguras já foram alteradas pelo modo compacto. Reutilizar
        // a raiz reconhecida evita alternar entre ela e um contêiner da lista.
        // Só procurar novamente quando a estrutura sair do DOM ou a lista mudar.
        const raizAnterior = assinatura[0];
        if (!chat && assinatura[1] === lateral && raizAnterior?.isConnected &&
            raizAnterior.contains(lateral)) return raizAnterior;
        if (chat) {
            for (let el = lateral.parentElement; el && el.id !== 'app'; el = el.parentElement) {
                if (el.contains(chat)) return el;
            }
            return null; // Estrutura desconhecida: preservar o layout original.
        }
        // Antes de abrir um chat, procura a linha com a lista e o painel inicial.
        const largura = lateral.getBoundingClientRect().width;
        for (let el = lateral.parentElement, nivel = 0;
            el && el.id !== 'app' && nivel < 4; el = el.parentElement, nivel++) {
            if (el.children.length >= 2 && el.getBoundingClientRect().width > largura + 64) return el;
        }
        return lateral.parentElement?.id !== 'app' ? lateral.parentElement : null;
    }

    function ramo(raiz, elemento) {
        if (!elemento) return null;
        let atual = elemento;
        while (atual.parentElement && atual.parentElement !== raiz) atual = atual.parentElement;
        return atual.parentElement === raiz ? atual : null;
    }

    function aplicarLayout(lateral, chat) {
        const raiz = encontrarRaiz(lateral, chat);
        if (!raiz) return false;
        const listaRamo = ramo(raiz, lateral);
        const chatRamo = ramo(raiz, chat);
        if (!listaRamo || (chat && (!chatRamo || chatRamo === listaRamo))) return false;

        const nova = [raiz, lateral, chat, ...raiz.children];
        if (nova.length !== assinatura.length || nova.some((el, i) => el !== assinatura[i])) {
            limparLayout();
            assinatura = nova;
            marcar(raiz, 'raiz');
            for (let el = raiz.parentElement; el && el !== document.body; el = el.parentElement) marcar(el, 'ancestral');
            for (const [painel, categoria] of [[lateral, 'lista'], [chat, 'chat']]) {
                if (!painel) continue;
                for (let el = painel; el && el !== raiz; el = el.parentElement) {
                    marcar(el, el.parentElement === raiz ? categoria : 'caminho');
                }
            }
            // Os recursos da barra lateral original continuam acessíveis em Modo PC.
            // Painéis auxiliares (contato, pesquisa etc.) ocupam a tela sobre o chat.
            for (const filho of raiz.children) {
                if (filho === listaRamo || filho === chatRamo) continue;
                const navegacao = filho.matches('nav, [role="navigation"]') ||
                    filho.querySelector('nav, [role="navigation"]');
                const sobreposicao = filho.matches('[role="dialog"], [aria-modal="true"]') ||
                    filho.querySelector('[role="dialog"], [aria-modal="true"]');
                if (navegacao) marcar(filho, 'navegacao');
                else if (chat || sobreposicao) marcar(filho, 'auxiliar');
                else marcar(filho, 'inicio');
            }
        }
        document.documentElement.classList.add('wac-ativo');
        document.documentElement.classList.toggle('wac-lista', vista === 'lista');
        document.documentElement.classList.toggle('wac-conversa', vista === 'conversa');
        ajustarSobreposicoes(raiz);
        ocultarPromocaoDownload(lateral);
        return true;
    }

    function atualizar() {
        const lateral = document.querySelector('#side');
        const lista = document.querySelector('#pane-side');
        const chat = document.querySelector('#main');
        // Sem lista autenticada, não aplicar CSS ao QR Code, login ou carregamento.
        const pronto = Boolean(lateral && lista && lateral.contains(lista));
        if (!pronto) {
            limparLayout();
            host.hidden = true;
            chatAnterior = null;
            return;
        }
        host.hidden = false;
        if (chat && (chat !== chatAnterior || aguardandoChat)) {
            vista = 'conversa';
            aguardandoChat = false;
        }
        if (!chat) vista = 'lista';
        chatAnterior = chat;
        let aplicado = false;
        if (compacto) aplicado = aplicarLayout(lateral, chat);
        else if (marcados.size) limparLayout();
        if (compacto && !aplicado) limparLayout();
        controles.querySelector('[data-acao="lista"]').setAttribute('aria-pressed', String(aplicado && vista === 'lista'));
        controles.querySelector('[data-acao="conversa"]').setAttribute('aria-pressed', String(aplicado && vista === 'conversa'));
        controles.querySelector('[data-acao="conversa"]').disabled = !chat;
        const modo = controles.querySelector('[data-acao="modo"]');
        const rotulo = compacto ? 'Modo PC' : 'Modo celular';
        if (modo.textContent !== rotulo) modo.textContent = rotulo;
        host.classList.toggle('wac-pc', !aplicado);
        const aviso = controles.querySelector('[role="status"]');
        aviso.hidden = !(compacto && !aplicado);
    }

    function agendar() {
        if (agendado) return;
        agendado = true;
        window.requestAnimationFrame(() => { agendado = false; atualizar(); });
    }

    function guardarModo() {
        try { localStorage.setItem(CHAVE, compacto ? 'celular' : 'pc'); } catch (_) { /* Sem persistência. */ }
    }

    function selecionarChat(evento) {
        if (evento.type === 'keydown' && evento.key !== 'Enter') return;
        const alvo = evento.target instanceof Element ? evento.target : null;
        if (!alvo?.closest('#pane-side')) return;
        if (!alvo.closest('[role="row"], [role="listitem"], [data-id]')) return;
        if (alvo.closest('input, textarea, [contenteditable="true"], [role="menu"]')) return;
        // Deixa o WhatsApp executar sua seleção nativa. Nenhum clique é simulado.
        aguardandoChat = true;
        agendar();
    }

    function iniciar() {
        if (!document.head || !document.body) { window.setTimeout(iniciar, 50); return; }
        if (document.getElementById(ID)) return;
        const estilo = document.createElement('style');
        estilo.id = ID + '-css';
        estilo.textContent = `
            html.wac-ativo, html.wac-ativo body { min-width:0 !important; overflow:hidden !important; }
            html.wac-ativo [data-wac-layout="ancestral"] {
                transform:none !important; perspective:none !important; filter:none !important;
                contain:none !important; min-width:0 !important; overflow:visible !important;
            }
            html.wac-ativo [data-wac-layout="raiz"] {
                position:fixed !important; top:0 !important; bottom:80px !important;
                left:0 !important; right:0 !important; margin:0 auto !important;
                width:min(100%, 480px) !important; min-width:0 !important; max-width:480px !important;
                height:calc(100dvh - 80px) !important; max-height:none !important;
                display:block !important; overflow:hidden !important; box-sizing:border-box !important;
                padding:0 !important; border-radius:0 !important;
                box-shadow:0 0 0 100vmax #101817 !important;
            }
            html.wac-ativo [data-wac-layout="lista"],
            html.wac-ativo [data-wac-layout="chat"] {
                position:absolute !important; inset:0 !important; margin:0 !important;
                width:100% !important; min-width:0 !important; max-width:100% !important;
                height:100% !important; min-height:0 !important; flex:1 1 auto !important;
            }
            html.wac-ativo [data-wac-layout="caminho"] {
                width:100% !important; min-width:0 !important; max-width:100% !important;
                height:100% !important; min-height:0 !important; flex:1 1 auto !important;
            }
            html.wac-lista [data-wac-layout="chat"],
            html.wac-conversa [data-wac-layout="lista"],
            html.wac-ativo [data-wac-layout="navegacao"],
            html.wac-ativo [data-wac-layout="inicio"] { display:none !important; }
            html.wac-ativo [data-wac-layout="auxiliar"] {
                position:absolute !important; inset:0 !important; z-index:5 !important;
                min-width:0 !important; max-width:100% !important; width:100% !important;
            }
            html.wac-ativo [data-wac-sobreposicao="caminho"] {
                transform:none !important; perspective:none !important; filter:none !important;
                contain:none !important; min-width:0 !important; max-width:100% !important;
            }
            html.wac-ativo [data-wac-sobreposicao="painel"] {
                position:fixed !important;
                top:var(--wac-sobreposicao-topo, 8px) !important; bottom:auto !important;
                left:50% !important; right:auto !important;
                width:var(--wac-sobreposicao-largura, calc(100vw - 16px)) !important;
                min-width:0 !important; max-width:calc(min(100vw, 480px) - 16px) !important;
                max-height:calc(100dvh - 96px) !important; margin:0 !important;
                box-sizing:border-box !important; transform:translateX(-50%) !important;
                overflow:auto !important; z-index:20 !important;
            }
            html.wac-ativo [data-wac-download="oculto"] { display:none !important; }
            html.wac-ativo #side, html.wac-ativo #main {
                width:100% !important; min-width:0 !important; max-width:100% !important;
            }
            html.wac-ativo #pane-side { min-height:0 !important; }
            html.wac-ativo #main > header, html.wac-ativo #main > footer {
                min-width:0 !important; box-sizing:border-box !important; flex-shrink:0 !important;
            }
            #${ID} {
                position:fixed !important; bottom:0 !important; left:0 !important; right:0 !important;
                width:min(100%,480px) !important; margin:0 auto !important; z-index:2147483000 !important;
            }
            #${ID}.wac-pc { width:max-content !important; max-width:100% !important; left:auto !important; }
            #${ID}[hidden] { display:none !important; }
        `;
        document.head.appendChild(estilo);
        host = document.createElement('div');
        host.id = ID;
        host.hidden = true;
        controles = host.attachShadow({ mode: 'open' });
        controles.innerHTML = `
            <style>
                :host { font:13px system-ui,sans-serif; color:#e9edef; }
                nav { display:flex; align-items:center; gap:4px; height:64px; padding:6px 8px;
                    box-sizing:border-box; background:#172522; border-top:1px solid #30403b; }
                button { flex:1; min-width:0; min-height:44px; border:0; border-radius:16px;
                    background:transparent; color:inherit; font:inherit; cursor:pointer; padding:6px 8px; }
                button:hover { background:#25483c; }
                button[aria-pressed="true"] { background:#225943; color:#b8f7d0; }
                button:disabled { opacity:.4; cursor:default; }
                button:focus-visible { outline:2px solid #8de6b2; outline-offset:-2px; }
                [data-acao="ajustar"] { flex:0 0 40px; font-size:21px; }
                p { margin:0; padding:8px 12px; background:#172522; font-size:12px; }
                .versao { display:flex; align-items:center; justify-content:flex-end; gap:4px;
                    box-sizing:border-box; height:16px; padding:0 10px;
                    text-align:right; background:#172522; color:#a7bcb4; font:10px/16px system-ui,sans-serif;
                    white-space:nowrap; }
                [hidden] { display:none; }
                :host(.wac-pc) [data-acao="lista"], :host(.wac-pc) [data-acao="conversa"],
                :host(.wac-pc) [data-acao="ajustar"] { display:none; }
            </style>
            <p role="status" hidden>Layout não reconhecido. Use Modo PC para continuar.</p>
            <nav aria-label="Visualização do WhatsApp">
                <button type="button" data-acao="lista" aria-pressed="true">Conversas</button>
                <button type="button" data-acao="conversa" aria-pressed="false">Conversa</button>
                <button type="button" data-acao="modo">Modo PC</button>
                <button type="button" data-acao="ajustar" title="Ajustar janela para largura de celular"
                    aria-label="Ajustar janela para largura de celular">↔</button>
            </nav>
            <small class="versao" title="Versão do modo celular carregada nesta página">Celular v${VERSAO_SCRIPT}</small>`;
        controles.querySelector('.versao').appendChild(criarVerificadorAtualizacao({
            id: 'wac-update', nome: 'WhatsApp Web - Modo celular',
            versao: VERSAO_SCRIPT, arquivo: 'WhatsApp-Modo-Celular.user.js', namespace: 'cybertectools-whatsapp-celular'
        }));
        controles.addEventListener('click', (evento) => {
            const acao = evento.target.closest('button')?.dataset.acao;
            if (acao === 'lista') { vista = 'lista'; aguardandoChat = false; }
            if (acao === 'conversa') vista = 'conversa';
            if (acao === 'modo') { compacto = !compacto; guardarModo(); }
            if (acao === 'ajustar') {
                // Navegadores podem permitir redimensionamento somente em pop-ups.
                const borda = Math.max(0, window.outerWidth - window.innerWidth);
                const altura = Math.min(window.screen.availHeight || 900, 900);
                window.resizeTo(480 + borda, altura);
            }
            agendar();
        });
        document.body.appendChild(host);
        document.addEventListener('click', selecionarChat, true);
        document.addEventListener('keydown', selecionarChat, true);
        window.addEventListener('resize', agendar);
        // Observa somente a estrutura: não lê ou armazena mensagens/contatos.
        new MutationObserver(agendar).observe(document.body, { childList:true, subtree:true });
        atualizar();
    }
    iniciar();
})();
