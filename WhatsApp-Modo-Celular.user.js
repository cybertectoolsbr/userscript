// ==UserScript==
// @name         WhatsApp Web - Modo celular
// @namespace    cybertectools-whatsapp-celular
// @version      0.1.2
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
    if (window.top !== window.self) return;

    const ID = 'wac-modo-celular';
    // Versão do código carregado nesta página; manter igual ao @version.
    const VERSAO_SCRIPT = '0.1.2';
    const CHAVE = 'cybertectools-whatsapp-modo-celular-v1';
    const ATRIBUTO = 'data-wac-layout';
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

    function marcar(elemento, valor) {
        if (!elemento || elemento === document.body || elemento === document.documentElement) return;
        if (elemento.getAttribute(ATRIBUTO) !== valor) elemento.setAttribute(ATRIBUTO, valor);
        marcados.add(elemento);
    }

    function limparLayout() {
        marcados.forEach((elemento) => elemento.removeAttribute(ATRIBUTO));
        marcados.clear();
        assinatura = [];
        document.documentElement.classList.remove('wac-ativo', 'wac-lista', 'wac-conversa');
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
                if (navegacao) marcar(filho, 'navegacao');
                else if (chat) marcar(filho, 'auxiliar');
                else marcar(filho, 'inicio');
            }
        }
        document.documentElement.classList.add('wac-ativo');
        document.documentElement.classList.toggle('wac-lista', vista === 'lista');
        document.documentElement.classList.toggle('wac-conversa', vista === 'conversa');
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
            html.wac-lista [data-wac-layout="auxiliar"] { display:none !important; }
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
                .versao { display:block; box-sizing:border-box; height:16px; padding:0 10px;
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
