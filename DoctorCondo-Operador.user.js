// ==UserScript==
// @name         DoctorCondo - personal
// @namespace    doctorcondo-local
// @version      4.5.11
// @author       CybertevTools
// @description  Recolhe seções, cria atalho para veículos, facilita acessos, registra saídas e entrega de chaves em lote, e mostra anexos
// @match        https://app2.doctorcondo.com.br/*
// @updateURL    https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/DoctorCondo-Operador.user.js
// @downloadURL  https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/DoctorCondo-Operador.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CSS = `
        .dc-section-collapsed {
            display: none !important;
        }

        #dc-section-tools {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }

        #dc-section-tools .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 32px;
            box-shadow: none !important;
        }

        #dc-section-tools .btn:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: 2px;
        }

        #dc-operator-topbar {
            position: fixed;
            z-index: 1200;
            top: 0;
            right: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            height: 40px;
            padding: 4px 10px;
            background: #ffffff;
            border-bottom: 1px solid #d7e2e6;
            box-shadow: 0 1px 3px rgba(0, 0, 0, .08);
        }

        #dc-operator-shortcuts {
            position: static;
            z-index: auto;
            display: flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 4px;
            height: 32px;
        }

        body.dc-operator-topbar-active .main-header {
            top: 40px !important;
        }

        body.dc-operator-topbar-active .main-sidebar {
            top: 40px !important;
            min-height: calc(100% - 40px) !important;
        }

        body.dc-operator-topbar-active .access-log-side-bar {
            top: 90px !important;
            height: calc(100vh - 90px) !important;
            max-height: calc(100vh - 90px) !important;
        }

        #dc-operator-page-spacer {
            display: block;
            width: 100%;
            height: 40px;
            min-height: 40px;
            pointer-events: none;
        }

        .dc-operator-shortcut {
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 5px;
            width: auto;
            min-width: 0;
            height: 32px;
            padding: 4px 8px;
            color: #444444;
            background: #ffffff;
            border: 1px solid #cccccc;
            border-radius: 3px;
            box-shadow: none !important;
            cursor: pointer;
        }

        .dc-operator-shortcut-circle {
            position: static;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: auto;
            height: auto;
            color: inherit;
            background: transparent;
            border: 0;
            border-radius: 0;
            box-shadow: none;
        }

        .dc-operator-shortcut-primary {
            color: #ffffff;
            background: #58abc3;
            border-color: #4c9db6;
        }

        .dc-operator-shortcut:hover,
        .dc-operator-shortcut:focus {
            color: #ffffff;
            background: #368fa9;
            border-color: #368fa9;
        }

        .dc-operator-shortcut:focus-visible {
            outline: 2px solid #1f5f73;
            outline-offset: 1px;
            border-radius: 3px;
        }

        .dc-operator-shortcut:disabled {
            opacity: .45;
            cursor: not-allowed;
        }

        .dc-operator-shortcut-circle > .fa {
            font-size: 13px;
            line-height: 1;
        }

        .dc-operator-shortcut-label {
            position: static;
            width: auto;
            height: auto;
            padding: 0;
            margin: 0;
            overflow: visible;
            clip: auto;
            color: inherit;
            font-size: 12px;
            line-height: 1;
            white-space: nowrap;
            border: 0;
        }

        #dc-hours-modal-backdrop {
            position: fixed;
            z-index: 2000000;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(0, 0, 0, .62);
        }

        #dc-hours-modal {
            display: flex;
            flex-direction: column;
            width: min(820px, calc(100vw - 36px));
            max-height: calc(100vh - 36px);
            color: #333333;
            background: #ffffff;
            border-radius: 7px;
            box-shadow: 0 10px 32px rgba(0, 0, 0, .42);
            overflow: hidden;
        }

        #dc-hours-modal .dc-hours-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 18px;
            color: #ffffff;
            background: #4f9fb7;
        }

        #dc-hours-modal .dc-hours-modal-title {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
        }

        #dc-hours-modal .dc-hours-modal-close {
            flex: 0 0 auto;
            width: 36px;
            height: 36px;
            padding: 0;
            color: #ffffff;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, .7);
            border-radius: 50%;
        }

        #dc-hours-modal .dc-hours-modal-body {
            padding: 16px;
            overflow: auto;
        }

        #dc-hours-modal .dc-hours-cards {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
        }

        #dc-hours-modal .dc-hours-card {
            overflow: hidden;
            background: #ffffff;
            border: 1px solid #cbdde3;
            border-radius: 7px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, .08);
        }

        #dc-hours-modal .dc-hours-card-title {
            margin: 0;
            padding: 10px 14px;
            color: #285b6a;
            background: #eaf5f8;
            border-bottom: 1px solid #cbdde3;
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
        }

        #dc-hours-modal .dc-hours-card-body {
            display: grid;
            grid-template-columns: minmax(230px, .9fr) minmax(0, 1.1fr);
            gap: 16px;
            padding: 14px;
        }

        #dc-hours-modal .dc-hours-card-section-title {
            margin: 0 0 7px;
            color: #285b6a;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .02em;
            text-transform: uppercase;
        }

        #dc-hours-modal .dc-hours-period {
            margin: 0 0 10px;
        }

        #dc-hours-modal .dc-hours-period:last-child,
        #dc-hours-modal .dc-hours-rules p:last-child {
            margin-bottom: 0;
        }

        #dc-hours-modal .dc-hours-day {
            display: block;
            margin-bottom: 4px;
            font-weight: 700;
        }

        #dc-hours-modal .dc-hours-line {
            display: block;
            margin: 3px 0;
            line-height: 1.4;
        }

        #dc-hours-modal .dc-hours-allowed {
            color: #1f6f43;
        }

        #dc-hours-modal .dc-hours-blocked {
            color: #a42828;
            font-weight: 700;
        }

        #dc-hours-modal .dc-hours-limited {
            color: #966400;
            font-weight: 700;
        }

        #dc-hours-modal .dc-hours-rules {
            padding-left: 16px;
            border-left: 3px solid #d9e8ed;
        }

        #dc-hours-modal .dc-hours-rules p {
            margin: 0 0 8px;
            line-height: 1.45;
        }

        #dc-hours-modal .dc-hours-card-footer {
            display: flex;
            justify-content: flex-end;
            padding: 9px 14px;
            background: #f8fbfc;
            border-top: 1px solid #d9e8ed;
        }

        #dc-hours-modal .dc-hours-modal-footer {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: flex-end;
            padding: 12px 16px;
            border-top: 1px solid #d7e2e6;
        }

        #dc-hours-modal .dc-hours-share-item {
            color: #ffffff;
            background: #25b95f;
            border-color: #1ba552;
        }

        #dc-hours-modal .dc-hours-share-item:hover,
        #dc-hours-modal .dc-hours-share-item:focus {
            color: #ffffff;
            background: #198a47;
            border-color: #167a3f;
        }

        body.dc-side-access-collapsed .access-log-side-bar {
            display: none !important;
        }

        body.dc-side-access-collapsed .content-wrapper,
        body.dc-side-access-collapsed .main-header,
        body.dc-side-access-collapsed .main-footer {
            margin-right: 0 !important;
            width: auto !important;
            max-width: none !important;
        }

        .dc-batch-row > td {
            position: relative;
            padding-left: 38px !important;
        }

        .dc-batch-check {
            position: absolute;
            left: 11px;
            top: 50%;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 24px;
            margin: 0;
            transform: translateY(-50%);
            cursor: pointer;
        }

        .dc-batch-check input {
            width: 16px;
            height: 16px;
            margin: 0;
            cursor: pointer;
        }

        .dc-batch-toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-top: 1px solid currentColor;
            border-bottom: 1px solid currentColor;
        }

        .dc-batch-count {
            margin-right: auto;
            font-size: 12px;
            font-weight: 600;
        }

        .dc-batch-processing > td {
            outline: 2px solid currentColor;
            outline-offset: -2px;
        }

        .dc-batch-toolbar .btn {
            box-shadow: none !important;
        }

        .dc-booking-batch-row > td {
            position: relative;
            padding-left: 38px !important;
        }

        .dc-booking-batch-check {
            position: absolute;
            top: 14px;
            left: 11px;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 24px;
            margin: 0;
            cursor: pointer;
        }

        .dc-booking-batch-check input {
            width: 16px;
            height: 16px;
            margin: 0;
            cursor: pointer;
        }

        .dc-booking-batch-toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-top: 1px solid currentColor;
            border-bottom: 1px solid currentColor;
        }

        .dc-booking-batch-count {
            margin-right: auto;
            font-size: 12px;
            font-weight: 600;
        }

        .dc-booking-batch-processing > td {
            outline: 2px solid #f0ad4e;
            outline-offset: -2px;
        }

        #dc-booking-batch-progress {
            position: fixed;
            z-index: 1000001;
            right: 16px;
            bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: min(460px, calc(100vw - 32px));
            padding: 10px 12px;
            color: #ffffff;
            background: #343a40;
            border-radius: 4px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, .3);
        }

        #dc-booking-batch-progress .dc-booking-batch-progress-text {
            font-size: 12px;
            font-weight: 600;
        }

        #dc-booking-batch-progress .btn {
            flex: 0 0 auto;
            box-shadow: none !important;
        }

        .dc-resident-access-host {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
            gap: 4px;
        }

        .dc-resident-access-button {
            min-height: 28px;
            padding: 3px 8px;
            white-space: nowrap;
            box-shadow: none !important;
        }

        .dc-resident-prefill-note {
            margin: 0 15px 12px;
            padding: 8px 12px;
            font-size: 12px;
        }

        .dc-package-action-cell {
            width: auto !important;
            min-width: 78px;
            white-space: nowrap;
        }

        .dc-package-preview-button {
            min-width: 34px;
            min-height: 32px;
            margin-right: 2px;
            box-shadow: none !important;
        }

        #dc-package-preview-panel {
            position: fixed;
            z-index: 1000000;
            top: 80px;
            right: 24px;
            width: min(360px, calc(100vw - 32px));
            max-height: calc(100vh - 104px);
            margin: 0;
            overflow: hidden;
        }

        body.dc-operator-topbar-active #dc-package-preview-panel {
            top: 120px;
            max-height: calc(100vh - 144px);
        }

        #dc-package-preview-panel .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            min-height: 44px;
        }

        #dc-package-preview-panel .dc-preview-title {
            min-width: 0;
            margin: 0;
            overflow: hidden;
            font-size: 13px;
            font-weight: 600;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        #dc-package-preview-panel .dc-preview-close {
            flex: 0 0 auto;
            min-width: 32px;
            min-height: 32px;
            padding: 4px;
            box-shadow: none !important;
        }

        #dc-package-preview-panel .card-body {
            max-height: calc(100vh - 158px);
            padding: 12px;
            overflow: auto;
        }

        #dc-package-preview-panel .dc-preview-image {
            display: block;
            width: 100%;
            max-height: 420px;
            object-fit: contain;
            background: #ffffff;
            border: 1px solid rgba(127, 127, 127, .35);
        }

        #dc-package-preview-panel .dc-preview-file {
            display: block;
            margin-top: 8px;
            overflow-wrap: anywhere;
        }

        #dc-package-preview-panel .dc-preview-status {
            padding: 18px 8px;
            text-align: center;
        }

        @media (max-width: 600px) {
            #dc-section-tools {
                display: flex;
            }

            #dc-section-tools .btn {
                justify-content: center;
                min-width: 0;
                padding-left: 6px;
                padding-right: 6px;
            }

            .dc-batch-toolbar {
                align-items: stretch;
            }

            .dc-batch-count {
                flex-basis: 100%;
            }

            .dc-booking-batch-count {
                flex-basis: 100%;
            }

            #dc-package-preview-panel {
                top: 64px;
                right: 8px;
                width: calc(100vw - 16px);
                max-height: calc(100vh - 72px);
            }

            body.dc-operator-topbar-active #dc-package-preview-panel {
                top: 104px;
                max-height: calc(100vh - 112px);
            }

            #dc-operator-shortcuts {
                gap: 3px;
            }

            .dc-operator-shortcut-circle {
                width: auto;
                height: auto;
            }

            #dc-hours-modal-backdrop {
                padding: 8px;
            }

            #dc-hours-modal {
                width: calc(100vw - 16px);
                max-height: calc(100vh - 16px);
            }

            #dc-hours-modal .dc-hours-modal-body {
                padding: 8px;
            }

            #dc-hours-modal .dc-hours-card-body {
                grid-template-columns: minmax(0, 1fr);
                gap: 12px;
                padding: 11px;
            }

            #dc-hours-modal .dc-hours-rules {
                padding-top: 11px;
                padding-left: 0;
                border-top: 3px solid #d9e8ed;
                border-left: 0;
            }
        }

        @media (max-width: 700px) {
            #dc-operator-topbar {
                justify-content: flex-start;
                overflow-x: auto;
            }
        }
    `;

    const CHAVES = {
        portoes: 'dc-secoes-portoes',
        pesquisa: 'dc-secoes-pesquisa',
        lateral: 'dc-secoes-lateral'
    };

    const estados = {
        portoes: localStorage.getItem(CHAVES.portoes) === 'recolhida',
        pesquisa: localStorage.getItem(CHAVES.pesquisa) === 'recolhida',
        lateral: localStorage.getItem(CHAVES.lateral) === 'recolhida'
    };

    let atualizacaoAgendada = false;
    let processandoLote = false;
    let cancelarLote = false;
    let moradorEmProcessamento = false;
    let observador = null;
    let processandoEntregaChaves = false;
    let cancelarEntregaChaves = false;
    let abrindoEntradaVeiculos = false;
    let ultimoFocoModalHorarios = null;

    const pacotesPorCodigo = new Map();
    const detalhesPacotes = new Map();
    const cabecalhosPacotes = {};

    function normalizarCodigoPacote(codigo) {
        return String(codigo || '').trim().toUpperCase();
    }

    function urlEhDePacotes(url) {
        try {
            const destino = new URL(url, window.location.href);
            return destino.pathname.startsWith('/api/packages');
        } catch (erro) {
            return false;
        }
    }

    function registrarDadosPacotes(valor) {
        const visitados = new Set();

        function percorrer(item) {
            if (!item || typeof item !== 'object') return;
            if (visitados.has(item)) return;

            visitados.add(item);

            if (item.id && item.release_code) {
                const codigo = normalizarCodigoPacote(
                    item.release_code
                );

                pacotesPorCodigo.set(codigo, {
                    id: String(item.id),
                    releaseCode: item.release_code,
                    recipientInfo: item.recipient_info || '',
                    attachments: Array.isArray(item.attachments)
                        ? item.attachments
                        : null
                });

                if (Array.isArray(item.attachments)) {
                    detalhesPacotes.set(String(item.id), item);
                }
            }

            if (Array.isArray(item)) {
                item.forEach(percorrer);
                return;
            }

            Object.keys(item).forEach(function (chave) {
                percorrer(item[chave]);
            });
        }

        percorrer(valor);

        if (document.body) {
            agendarAtualizacao();
        }
    }

    function interpretarRespostaPacotes(xhr) {
        try {
            if (xhr.response && typeof xhr.response === 'object') {
                registrarDadosPacotes(xhr.response);
                return;
            }

            if (xhr.responseText) {
                registrarDadosPacotes(JSON.parse(xhr.responseText));
            }
        } catch (erro) {
            console.debug(
                'Não foi possível interpretar a lista de correspondências.',
                erro
            );
        }
    }

    function instalarInterceptadorPacotes() {
        const prototipo = window.XMLHttpRequest &&
            window.XMLHttpRequest.prototype;

        if (!prototipo || prototipo.__dcPackagePreviewInstalled) {
            return;
        }

        const abrirOriginal = prototipo.open;
        const enviarOriginal = prototipo.send;
        const definirCabecalhoOriginal = prototipo.setRequestHeader;

        Object.defineProperty(
            prototipo,
            '__dcPackagePreviewInstalled',
            { value: true }
        );

        prototipo.open = function (metodo, url) {
            this.__dcPackageRequest =
                String(metodo).toUpperCase() === 'GET' &&
                urlEhDePacotes(url);

            return abrirOriginal.apply(this, arguments);
        };

        prototipo.setRequestHeader = function (nome, valor) {
            if (this.__dcPackageRequest) {
                const nomeNormalizado = String(nome).toLowerCase();

                if (![
                    'content-length',
                    'cookie',
                    'host',
                    'origin',
                    'referer'
                ].includes(nomeNormalizado)) {
                    cabecalhosPacotes[nome] = valor;
                }
            }

            return definirCabecalhoOriginal.apply(this, arguments);
        };

        prototipo.send = function () {
            if (this.__dcPackageRequest) {
                this.addEventListener(
                    'load',
                    function () {
                        interpretarRespostaPacotes(this);
                    },
                    { once: true }
                );
            }

            return enviarOriginal.apply(this, arguments);
        };
    }

    instalarInterceptadorPacotes();

    function instalarEstilo() {
        if (document.querySelector('#dc-collapsible-sections-style')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'dc-collapsible-sections-style';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function obterSecaoPortoes() {
        const botao = document.querySelector(
            '.access-control-btn-bar-button'
        );

        if (!botao) return null;

        return botao.closest(
            '.d-flex.justify-content-center.mb-3'
        );
    }

    function obterSecaoPesquisa() {
        const portoes = obterSecaoPortoes();
        if (!portoes) return null;

        let candidato = portoes.nextElementSibling;

        while (candidato) {
            if (candidato.classList.contains('card')) {
                return candidato;
            }

            candidato = candidato.nextElementSibling;
        }

        return null;
    }

    function obterCabecalho() {
        const titulos = Array.from(
            document.querySelectorAll(
                'section.content-header h1, ' +
                'section.content-header h2, ' +
                'section.content-header h3, ' +
                'section.content-header h4'
            )
        );

        return titulos.find(function (titulo) {
            return titulo.textContent
                .toLowerCase()
                .includes('controle de acesso');
        }) || null;
    }

    function salvarEstado(nome) {
        localStorage.setItem(
            CHAVES[nome],
            estados[nome] ? 'recolhida' : 'expandida'
        );
    }

    function atualizarBotao(nome) {
        const botao = document.querySelector(
            '[data-dc-section="' + nome + '"]'
        );

        if (!botao) return;

        const recolhida = estados[nome];
        const icone = botao.querySelector('i');

        botao.classList.toggle('active', recolhida);
        botao.setAttribute('aria-pressed', String(recolhida));
        botao.title = recolhida
            ? 'Expandir esta seção'
            : 'Recolher esta seção';

        if (icone) {
            icone.className = recolhida
                ? 'fa fa-chevron-down'
                : 'fa fa-chevron-up';
        }
    }

    function aplicarEstados() {
        const portoes = obterSecaoPortoes();
        const pesquisa = obterSecaoPesquisa();

        if (portoes) {
            portoes.classList.toggle(
                'dc-section-collapsed',
                estados.portoes
            );
        }

        if (pesquisa) {
            pesquisa.classList.toggle(
                'dc-section-collapsed',
                estados.pesquisa
            );
        }

        if (document.body) {
            document.body.classList.toggle(
                'dc-side-access-collapsed',
                estados.lateral
            );
        }

        Object.keys(estados).forEach(atualizarBotao);
    }

    function alternar(nome) {
        estados[nome] = !estados[nome];
        salvarEstado(nome);
        aplicarEstados();
    }

    function criarBotao(nome, rotulo) {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'btn btn-sm btn-outline-info';
        botao.dataset.dcSection = nome;
        botao.innerHTML =
            '<i class="fa fa-chevron-up" aria-hidden="true"></i>' +
            '<span>' + rotulo + '</span>';
        botao.addEventListener('click', function () {
            alternar(nome);
        });
        return botao;
    }

    function criarControles() {
        const cabecalho = obterCabecalho();
        if (!cabecalho) return;

        if (estados.pesquisa) {
            estados.pesquisa = false;
            salvarEstado('pesquisa');
        }

        if (estados.lateral) {
            estados.lateral = false;
            salvarEstado('lateral');
        }

        let controles = document.querySelector('#dc-section-tools');

        if (!controles) {
            controles = document.createElement('div');
            controles.id = 'dc-section-tools';
            controles.setAttribute(
                'aria-label',
                'Recolher a seção de portões'
            );
            cabecalho.insertAdjacentElement('afterend', controles);
        }

        controles.querySelectorAll(
            '[data-dc-section="pesquisa"], ' +
            '[data-dc-section="lateral"]'
        ).forEach(function (botao) {
            botao.remove();
        });

        if (!controles.querySelector('[data-dc-section="portoes"]')) {
            controles.appendChild(criarBotao('portoes', 'Portões'));
        }
    }

    function normalizarTexto(texto) {
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function localizarBotaoEntradaVeiculos() {
        const candidatosPrincipais = Array.from(
            document.querySelectorAll('.access-control-btn-bar-button')
        );
        const candidatosAlternativos = Array.from(
            document.querySelectorAll('button, a, [role="button"]')
        );
        const candidatos = candidatosPrincipais.concat(
            candidatosAlternativos.filter(function (elemento) {
                return !candidatosPrincipais.includes(elemento);
            })
        );

        return candidatos.find(function (elemento) {
            if (
                elemento.closest('#dc-operator-shortcuts') ||
                !elemento.isConnected
            ) {
                return false;
            }

            return normalizarTexto(elemento.textContent) ===
                'entrada de veiculos';
        }) || null;
    }

    function botaoEstaDesativado(botao) {
        return Boolean(
            botao && (
                botao.disabled ||
                botao.getAttribute('aria-disabled') === 'true' ||
                botao.classList.contains('disabled')
            )
        );
    }

    function obterContextoCondominio() {
        const resultado = window.location.hash.match(
            /^#\/c\/(\d+)\/(\d+)(?:\/|$)/
        );

        return resultado ? {
            condominioId: resultado[1],
            contextoId: resultado[2],
            base: '#/c/' + resultado[1] + '/' + resultado[2]
        } : null;
    }

    function obterRotaDoctorCondo(tela) {
        const contexto = obterContextoCondominio();

        if (contexto) {
            return contexto.base + '/' + tela;
        }

        return '#/' + tela + (tela === 'guest_new_access' ? '/' : '');
    }

    function navegarParaRegistroAcesso() {
        window.location.hash = obterRotaDoctorCondo('guest_new_access');
    }

    function navegarParaCorrespondencias() {
        window.location.hash = obterRotaDoctorCondo('packages');
    }

    function navegarParaReservas() {
        window.location.hash = obterRotaDoctorCondo('bookings');
    }

    async function abrirEntradaVeiculosGlobal() {
        if (abrindoEntradaVeiculos) return;

        abrindoEntradaVeiculos = true;
        prepararAtalhosOperador();

        try {
            let original = localizarBotaoEntradaVeiculos();

            if (!original) {
                window.location.hash = obterRotaDoctorCondo(
                    'guest_new_access'
                );
                original = await aguardarCondicao(function () {
                    return localizarBotaoEntradaVeiculos();
                }, 10000);
            }

            if (botaoEstaDesativado(original)) {
                throw new Error(
                    'O botão oficial Entrada de Veículos está desativado.'
                );
            }

            original.click();
        } catch (erro) {
            window.alert(
                'Não foi possível abrir a Entrada de Veículos.\n\n' +
                (erro.message || 'Erro desconhecido.')
            );
        } finally {
            abrindoEntradaVeiculos = false;
            prepararAtalhosOperador();
        }
    }

    function localizarBuscaGeral() {
        return Array.from(document.querySelectorAll('input')).find(
            function (campo) {
                return elementoEstaVisivel(campo) &&
                    normalizarTexto(campo.placeholder || '')
                        .includes('busca geral');
            }
        ) || null;
    }

    function formatarPlacaParaBusca(valor) {
        const caracteres = String(valor || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 7);

        if (caracteres.length <= 3) return caracteres;
        return caracteres.slice(0, 3) + '-' + caracteres.slice(3);
    }

    function definirValorInputReact(campo, valor) {
        const descritor = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        );

        descritor.set.call(campo, valor);
        campo.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function tratarDigitacaoPlaca(evento) {
        const campo = evento.currentTarget;

        if (
            campo.dataset.dcPlateMode !== 'true' ||
            campo.dataset.dcFormattingPlate === 'true'
        ) {
            return;
        }

        const formatada = formatarPlacaParaBusca(campo.value);
        if (formatada === campo.value) return;

        campo.dataset.dcFormattingPlate = 'true';
        definirValorInputReact(campo, formatada);
        delete campo.dataset.dcFormattingPlate;
    }

    function desativarModoPlaca(campo) {
        if (!campo || campo.dataset.dcPlateMode !== 'true') return;

        campo.dataset.dcPlateMode = 'false';

        if (campo.dataset.dcOriginalPlaceholder !== undefined) {
            campo.placeholder = campo.dataset.dcOriginalPlaceholder;
            delete campo.dataset.dcOriginalPlaceholder;
        }

        if (campo.dataset.dcOriginalTitle !== undefined) {
            campo.title = campo.dataset.dcOriginalTitle;
            delete campo.dataset.dcOriginalTitle;
        }

        campo.removeAttribute('aria-description');
    }

    function focarBuscaDePlacas() {
        const campo = localizarBuscaGeral();

        if (!campo) {
            window.alert(
                'A Busca Geral não foi encontrada nesta tela. ' +
                'Atualize a página e tente novamente.'
            );
            return;
        }

        if (!campo.dataset.dcPlateFormatterInstalled) {
            campo.dataset.dcPlateFormatterInstalled = 'true';
            campo.addEventListener('input', tratarDigitacaoPlaca);
            campo.addEventListener('blur', function () {
                window.setTimeout(function () {
                    if (document.activeElement !== campo) {
                        desativarModoPlaca(campo);
                    }
                }, 600);
            });
        }

        if (campo.dataset.dcPlateMode !== 'true') {
            campo.dataset.dcOriginalPlaceholder = campo.placeholder || '';
            campo.dataset.dcOriginalTitle = campo.title || '';
        }

        campo.dataset.dcPlateMode = 'true';
        campo.placeholder = 'Digite a placa com ou sem hífen';
        campo.title = 'Modo placa: o hífen será inserido automaticamente';
        campo.setAttribute(
            'aria-description',
            'Digite a placa com ou sem hífen. O formato será corrigido.'
        );
        campo.focus();
        campo.select();
    }

    function fecharModalHorarios() {
        const fundo = document.querySelector('#dc-hours-modal-backdrop');
        if (!fundo) return;

        fundo.remove();
        document.removeEventListener('keydown', tratarTeclaModalHorarios);

        if (
            ultimoFocoModalHorarios &&
            ultimoFocoModalHorarios.isConnected
        ) {
            ultimoFocoModalHorarios.focus();
        }

        ultimoFocoModalHorarios = null;
    }

    function tratarTeclaModalHorarios(evento) {
        if (evento.key === 'Escape') {
            fecharModalHorarios();
        }
    }

    function obterTextoHorarioParaWhatsApp(item) {
        const textos = {
            silencio: [
                '*SILÊNCIO — HORÁRIOS E REGRAS*',
                '',
                'Todos os dias:',
                'Das 22h às 08h da manhã seguinte.',
                '',
                'Sábados, domingos e feriados:',
                'Da meia-noite (00h) às 09h, conforme o regulamento.',
                '',
                'Durante o horário de silêncio, evite qualquer barulho que possa incomodar os vizinhos.',
                'Televisão, rádio, música, eletrodomésticos e outros aparelhos devem ser utilizados em volume baixo.',
                'Gritos, conversas altas e outros ruídos também devem ser evitados.'
            ].join('\n'),
            mudancas: [
                '*MUDANÇAS — HORÁRIOS E REGRAS*',
                '',
                'De segunda-feira a sexta-feira:',
                '[PERMITIDO] 08h às 12h',
                '[NÃO PERMITIDO] 12h às 14h — intervalo',
                '[PERMITIDO] 14h às 20h',
                '',
                'Aos sábados:',
                '[PERMITIDO] 09h às 12h',
                '[NÃO PERMITIDO] 12h às 14h — intervalo',
                '[PERMITIDO] 14h às 18h',
                '',
                'Agendamento obrigatório com a Administração, com pelo menos 24 horas de antecedência.'
            ].join('\n'),
            reformas: [
                '*REFORMAS / OBRAS — HORÁRIOS E REGRAS*',
                '',
                'De segunda-feira a sexta-feira:',
                '[PERMITIDO] 08h às 12h',
                '[NÃO PERMITIDO] 12h às 14h — intervalo',
                '[PERMITIDO] 14h às 20h',
                '',
                'Aos sábados:',
                '[PERMITIDO] 10h às 12h',
                '[NÃO PERMITIDO] 12h às 14h — intervalo',
                '[PERMITIDO] 14h às 18h',
                '',
                'Domingos e feriados: NÃO É PERMITIDO.',
                '',
                'Fora desses horários, os serviços devem ser interrompidos.',
                'Emergências justificadas ou situações autorizadas pela Administração são exceções.'
            ].join('\n'),
            salao: [
                '*SALÃO DE FESTAS — HORÁRIOS E REGRAS*',
                '',
                'De domingo a quinta-feira:',
                '[PERMITIDO] Até 22h: uso normal, respeitando os vizinhos.',
                '[VOLUME REDUZIDO] Das 22h até 01h.',
                '[ENCERRAR] Após 01h.',
                '',
                'Sextas-feiras, sábados e vésperas de feriado:',
                '[PERMITIDO] Até meia-noite (00h): uso normal, respeitando os vizinhos.',
                '[VOLUME REDUZIDO] Da meia-noite até 02h.',
                '[ENCERRAR] Após 02h.',
                '',
                'A música e o som devem permanecer dentro do Salão de Festas.'
            ].join('\n'),
            quiosques: [
                '*QUIOSQUES / CHURRASQUEIRAS — HORÁRIOS E REGRAS*',
                '',
                '[PERMITIDO] Utilização até a meia-noite (00h).',
                '[ENCERRAR] Após a meia-noite.',
                '',
                'Não é permitido utilizar equipamentos sonoros.',
                'A partir das 22h, o horário de silêncio deve ser respeitado.',
                'É necessário fazer reserva.',
                'Limite máximo de 10 pessoas por espaço.'
            ].join('\n')
        };

        return textos[item] || '';
    }

    function compartilharHorarioNoWhatsApp(item) {
        const texto = obterTextoHorarioParaWhatsApp(item);
        if (!texto) return;

        const link = document.createElement('a');
        link.href = 'https://wa.me/?text=' + encodeURIComponent(texto);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function abrirModalHorarios() {
        const existente = document.querySelector('#dc-hours-modal-backdrop');

        if (existente) {
            existente.querySelector('.dc-hours-modal-close').focus();
            return;
        }

        ultimoFocoModalHorarios = document.activeElement;
        const fundo = document.createElement('div');
        fundo.id = 'dc-hours-modal-backdrop';
        fundo.innerHTML = `
            <section id="dc-hours-modal" role="dialog" aria-modal="true"
                aria-labelledby="dc-hours-modal-title">
                <header class="dc-hours-modal-header">
                    <h2 id="dc-hours-modal-title"
                        class="dc-hours-modal-title">
                        Horários e regras do condomínio
                    </h2>
                    <button type="button" class="dc-hours-modal-close"
                        aria-label="Fechar horários" title="Fechar">
                        <i class="fa fa-times" aria-hidden="true"></i>
                    </button>
                </header>
                <div class="dc-hours-modal-body">
                    <div class="dc-hours-cards">
                        <article class="dc-hours-card">
                            <h3 class="dc-hours-card-title">🔇 Silêncio</h3>
                            <div class="dc-hours-card-body">
                                <section>
                                    <h4 class="dc-hours-card-section-title">
                                        Horários permitidos
                                    </h4>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-day">
                                            Todos os dias
                                        </span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">
                                            🔇 Das 22h às 08h da manhã seguinte.
                                        </span>
                                    </p>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-day">
                                            Sábados, domingos e feriados
                                        </span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">
                                            🔇 Da meia-noite (00h) às 09h,
                                            conforme o regulamento.
                                        </span>
                                    </p>
                                </section>
                                <section class="dc-hours-rules">
                                    <h4 class="dc-hours-card-section-title">
                                        Regras principais
                                    </h4>
                                    <p>Evite qualquer barulho que possa
                                        incomodar os vizinhos.</p>
                                    <p>Televisão, rádio, música,
                                        eletrodomésticos e outros aparelhos
                                        devem ser utilizados em volume baixo.</p>
                                    <p>Gritos, conversas altas e outros ruídos
                                        também devem ser evitados.</p>
                                </section>
                            </div>
                            <footer class="dc-hours-card-footer">
                                <button type="button"
                                    class="dc-hours-share-item btn btn-sm"
                                    data-dc-hours-share="silencio">
                                    <i class="fa fa-whatsapp"
                                        aria-hidden="true"></i>
                                    Enviar via WhatsApp
                                </button>
                            </footer>
                        </article>

                        <article class="dc-hours-card">
                            <h3 class="dc-hours-card-title">🚚 Mudanças</h3>
                            <div class="dc-hours-card-body">
                                <section>
                                    <h4 class="dc-hours-card-section-title">
                                        Horários permitidos
                                    </h4>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-day">
                                            De segunda-feira a sexta-feira
                                        </span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ 08h às 12h</span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">⛔ 12h às 14h —
                                            INTERVALO / NÃO PERMITIDO</span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ 14h às 20h</span>
                                    </p>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-day">Sábado</span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ 09h às 12h</span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">⛔ 12h às 14h —
                                            INTERVALO / NÃO PERMITIDO</span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ 14h às 18h</span>
                                    </p>
                                </section>
                                <section class="dc-hours-rules">
                                    <h4 class="dc-hours-card-section-title">
                                        Regras principais
                                    </h4>
                                    <p>📅 Agendamento obrigatório com a
                                        Administração, com pelo menos
                                        <strong>24 horas de antecedência</strong>.
                                    </p>
                                    <p>Durante o intervalo das 12h às 14h não é
                                        permitida a realização de mudanças.</p>
                                </section>
                            </div>
                            <footer class="dc-hours-card-footer">
                                <button type="button"
                                    class="dc-hours-share-item btn btn-sm"
                                    data-dc-hours-share="mudancas">
                                    <i class="fa fa-whatsapp"
                                        aria-hidden="true"></i>
                                    Enviar via WhatsApp
                                </button>
                            </footer>
                        </article>

                        <article class="dc-hours-card">
                            <h3 class="dc-hours-card-title">
                                🔨 Reformas / obras
                            </h3>
                            <div class="dc-hours-card-body">
                                <section>
                                    <h4 class="dc-hours-card-section-title">
                                        Horários permitidos
                                    </h4>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-day">
                                            De segunda-feira a sexta-feira
                                        </span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ 08h às 12h</span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">⛔ 12h às 14h —
                                            INTERVALO / NÃO PERMITIDO</span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ 14h às 20h</span>
                                    </p>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-day">Sábado</span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ 10h às 12h</span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">⛔ 12h às 14h —
                                            INTERVALO / NÃO PERMITIDO</span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ 14h às 18h</span>
                                    </p>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-line
                                            dc-hours-blocked">
                                            🚫 Domingos e feriados: NÃO É
                                            PERMITIDO.
                                        </span>
                                    </p>
                                </section>
                                <section class="dc-hours-rules">
                                    <h4 class="dc-hours-card-section-title">
                                        Regras principais
                                    </h4>
                                    <p>Os horários valem para reformas,
                                        consertos e serviços que façam barulho,
                                        como martelo, furadeira, serra elétrica
                                        e ferramentas semelhantes.</p>
                                    <p>Fora desses horários, os serviços devem
                                        ser interrompidos.</p>
                                    <p>Emergências justificadas ou situações
                                        autorizadas pela Administração são
                                        exceções.</p>
                                </section>
                            </div>
                            <footer class="dc-hours-card-footer">
                                <button type="button"
                                    class="dc-hours-share-item btn btn-sm"
                                    data-dc-hours-share="reformas">
                                    <i class="fa fa-whatsapp"
                                        aria-hidden="true"></i>
                                    Enviar via WhatsApp
                                </button>
                            </footer>
                        </article>

                        <article class="dc-hours-card">
                            <h3 class="dc-hours-card-title">
                                🎉 Salão de Festas
                            </h3>
                            <div class="dc-hours-card-body">
                                <section>
                                    <h4 class="dc-hours-card-section-title">
                                        Horários permitidos
                                    </h4>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-day">
                                            De domingo a quinta-feira
                                        </span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">🔊 Até 22h: uso
                                            normal, respeitando os vizinhos.</span>
                                        <span class="dc-hours-line
                                            dc-hours-limited">🔉 Das 22h até
                                            01h: somente volume reduzido.</span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">🚫 Após 01h: o
                                            evento deve ser encerrado.</span>
                                    </p>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-day">
                                            Sextas-feiras, sábados e vésperas
                                            de feriado
                                        </span>
                                        <span class="dc-hours-line
                                            dc-hours-allowed">🔊 Até meia-noite
                                            (00h): uso normal, respeitando os
                                            vizinhos.</span>
                                        <span class="dc-hours-line
                                            dc-hours-limited">🔉 Da meia-noite
                                            até 02h: somente volume reduzido.</span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">🚫 Após 02h: o
                                            evento deve ser encerrado.</span>
                                    </p>
                                </section>
                                <section class="dc-hours-rules">
                                    <h4 class="dc-hours-card-section-title">
                                        Regras principais
                                    </h4>
                                    <p>A música e o som devem permanecer dentro
                                        do Salão de Festas.</p>
                                    <p>Mesmo durante o evento, não é permitido
                                        produzir barulho que incomode os demais
                                        moradores.</p>
                                </section>
                            </div>
                            <footer class="dc-hours-card-footer">
                                <button type="button"
                                    class="dc-hours-share-item btn btn-sm"
                                    data-dc-hours-share="salao">
                                    <i class="fa fa-whatsapp"
                                        aria-hidden="true"></i>
                                    Enviar via WhatsApp
                                </button>
                            </footer>
                        </article>

                        <article class="dc-hours-card">
                            <h3 class="dc-hours-card-title">
                                🍖 Quiosques / churrasqueiras
                            </h3>
                            <div class="dc-hours-card-body">
                                <section>
                                    <h4 class="dc-hours-card-section-title">
                                        Horários permitidos
                                    </h4>
                                    <p class="dc-hours-period">
                                        <span class="dc-hours-line
                                            dc-hours-allowed">✅ Pode ser
                                            utilizado até a meia-noite (00h).
                                        </span>
                                        <span class="dc-hours-line
                                            dc-hours-blocked">🚫 Após a
                                            meia-noite, a utilização deve ser
                                            encerrada.</span>
                                    </p>
                                </section>
                                <section class="dc-hours-rules">
                                    <h4 class="dc-hours-card-section-title">
                                        Regras principais
                                    </h4>
                                    <p>Não é permitido utilizar equipamentos
                                        sonoros, como caixas de som ou aparelhos
                                        de música.</p>
                                    <p>A partir das 22h, o horário de silêncio
                                        deve ser respeitado.</p>
                                    <p>📅 É necessário fazer reserva.</p>
                                    <p>👥 Cada espaço pode receber no máximo
                                        <strong>10 pessoas</strong>.</p>
                                </section>
                            </div>
                            <footer class="dc-hours-card-footer">
                                <button type="button"
                                    class="dc-hours-share-item btn btn-sm"
                                    data-dc-hours-share="quiosques">
                                    <i class="fa fa-whatsapp"
                                        aria-hidden="true"></i>
                                    Enviar via WhatsApp
                                </button>
                            </footer>
                        </article>
                    </div>
                </div>
                <footer class="dc-hours-modal-footer">
                    <button type="button"
                        class="dc-hours-modal-close btn btn-info">
                        Fechar
                    </button>
                </footer>
            </section>
        `;

        fundo.addEventListener('click', function (evento) {
            const alvo = evento.target instanceof Element
                ? evento.target
                : null;

            const compartilhar = alvo
                ? alvo.closest('.dc-hours-share-item')
                : null;

            if (compartilhar) {
                compartilharHorarioNoWhatsApp(
                    compartilhar.dataset.dcHoursShare
                );
                return;
            }

            if (
                alvo === fundo ||
                (alvo && alvo.closest('.dc-hours-modal-close'))
            ) {
                fecharModalHorarios();
            }
        });

        document.body.appendChild(fundo);
        document.addEventListener('keydown', tratarTeclaModalHorarios);
        fundo.querySelector('.dc-hours-modal-close').focus();
    }

    function criarAtalhoOperador(acao, rotulo, icone, principal) {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'btn btn-sm ' +
            (principal ? 'btn-info ' : 'btn-default ') +
            'dc-operator-shortcut' +
            (principal ? ' dc-operator-shortcut-primary' : '');
        botao.dataset.dcOperatorAction = acao;
        botao.title = rotulo;
        botao.setAttribute('aria-label', rotulo);
        botao.innerHTML = `
            <span class="dc-operator-shortcut-circle" aria-hidden="true">
                ${icone}
            </span>
            <span class="dc-operator-shortcut-label">${rotulo}</span>
        `;
        return botao;
    }

    function obterHostAtalhosOperador() {
        let faixa = document.querySelector('#dc-operator-topbar');
        const conteudo = document.querySelector('.content-wrapper');

        if (!faixa) {
            faixa = document.createElement('header');
            faixa.id = 'dc-operator-topbar';
            faixa.setAttribute('role', 'region');
            faixa.setAttribute(
                'aria-label',
                'Faixa de atalhos do operador'
            );
            document.body.insertBefore(faixa, document.body.firstChild);
        }

        document.body.classList.add('dc-operator-topbar-active');

        let espacador = document.querySelector('#dc-operator-page-spacer');
        if (conteudo && !espacador) {
            const espacador = document.createElement('div');
            espacador.id = 'dc-operator-page-spacer';
            espacador.setAttribute('aria-hidden', 'true');
            conteudo.insertBefore(espacador, conteudo.firstChild);
        } else if (conteudo && espacador.parentElement !== conteudo) {
            conteudo.insertBefore(espacador, conteudo.firstChild);
        }

        return faixa;
    }

    function removerFaixaAtalhosOperador() {
        const faixa = document.querySelector('#dc-operator-topbar');
        if (faixa) faixa.remove();

        const espacador = document.querySelector('#dc-operator-page-spacer');
        if (espacador) espacador.remove();

        if (document.body) {
            document.body.classList.remove('dc-operator-topbar-active');
        }
    }

    function prepararAtalhosOperador() {
        const fabAntigo = document.querySelector('#dc-vehicle-entry-fab');
        if (fabAntigo) fabAntigo.remove();

        let atalhos = document.querySelector('#dc-operator-shortcuts');

        const host = obterHostAtalhosOperador();
        if (!host) return;

        if (!atalhos) {
            atalhos = document.createElement('nav');
            atalhos.id = 'dc-operator-shortcuts';
            atalhos.setAttribute(
                'aria-label',
                'Atalhos rápidos do operador'
            );
            atalhos.appendChild(criarAtalhoOperador(
                'portao',
                'Abrir portão',
                '<i class="fa fa-car"></i>',
                true
            ));
            atalhos.appendChild(criarAtalhoOperador(
                'registrar',
                'Registrar',
                '<i class="fa fa-user-plus"></i>',
                false
            ));
            atalhos.appendChild(criarAtalhoOperador(
                'placas',
                'Placas',
                '<i class="fa fa-search"></i>',
                false
            ));
            atalhos.appendChild(criarAtalhoOperador(
                'correspondencias',
                'Correspondência',
                '<i class="fa fa-envelope"></i>',
                false
            ));
            atalhos.appendChild(criarAtalhoOperador(
                'reservas',
                'Reservas',
                '<i class="fa fa-calendar"></i>',
                false
            ));
            atalhos.appendChild(criarAtalhoOperador(
                'horarios',
                'Horários',
                '<i class="fa fa-calendar"></i>',
                false
            ));

            atalhos.addEventListener('click', function (evento) {
                const botao = evento.target.closest(
                    '.dc-operator-shortcut'
                );
                if (!botao || botao.disabled) return;

                switch (botao.dataset.dcOperatorAction) {
                case 'portao':
                    abrirEntradaVeiculosGlobal();
                    break;
                case 'registrar':
                    navegarParaRegistroAcesso();
                    break;
                case 'placas':
                    focarBuscaDePlacas();
                    break;
                case 'correspondencias':
                    navegarParaCorrespondencias();
                    break;
                case 'reservas':
                    navegarParaReservas();
                    break;
                case 'horarios':
                    abrirModalHorarios();
                    break;
                }
            });
        }

        if (atalhos.parentElement !== host) {
            host.appendChild(atalhos);
        }

        document.querySelectorAll('.dc-operator-shortcuts-host')
            .forEach(function (elemento) {
                if (elemento !== host) {
                    elemento.classList.remove(
                        'dc-operator-shortcuts-host'
                    );
                }
            });
        host.classList.add('dc-operator-shortcuts-host');
        const abrirPortao = atalhos.querySelector(
            '[data-dc-operator-action="portao"]'
        );
        abrirPortao.disabled = abrindoEntradaVeiculos;
        abrirPortao.setAttribute(
            'aria-busy',
            String(abrindoEntradaVeiculos)
        );
    }

    function elementoEstaVisivel(elemento) {
        return Boolean(
            elemento &&
            elemento.isConnected &&
            (elemento.offsetWidth || elemento.offsetHeight ||
                elemento.getClientRects().length)
        );
    }

    function aguardarCondicao(obterResultado, limite) {
        const inicio = Date.now();
        const tempoLimite = limite || 8000;

        return new Promise(function (resolve, reject) {
            function verificar() {
                const resultado = obterResultado();

                if (resultado) {
                    resolve(resultado);
                    return;
                }

                if (Date.now() - inicio >= tempoLimite) {
                    reject(new Error(
                        'O DoctorCondo demorou para abrir a próxima tela.'
                    ));
                    return;
                }

                window.setTimeout(verificar, 100);
            }

            verificar();
        });
    }

    function obterCampoPerfil(dialogo, rotulo) {
        const grupo = Array.from(
            dialogo.querySelectorAll('.form-group')
        ).find(function (item) {
            const label = item.querySelector('.control-label');
            return label && normalizarTexto(label.textContent) ===
                normalizarTexto(rotulo);
        });

        if (!grupo) return '';

        const valor = grupo.querySelector('.form-control-plaintext');
        if (!valor) return '';

        const copia = valor.cloneNode(true);
        copia.querySelectorAll('.link-phone-whatsapp-label')
            .forEach(function (item) {
                item.remove();
            });

        return copia.textContent.replace(/\s+/g, ' ').trim();
    }

    function obterValorInformadoPerfil(dialogo, rotulo) {
        const valor = obterCampoPerfil(dialogo, rotulo);
        const normalizado = normalizarTexto(valor);
        const valoresVazios = [
            '',
            '-',
            'nao informado',
            'nao informada',
            'nao cadastrado',
            'nao cadastrada',
            'nao possui',
            'null',
            'undefined'
        ];

        return valoresVazios.includes(normalizado) ? '' : valor;
    }

    function localizarDialogoPerfilMorador() {
        return Array.from(document.querySelectorAll(
            '.ReactModal__Content[role="dialog"]'
        )).find(function (dialogo) {
            const rotulos = Array.from(dialogo.querySelectorAll(
                '.control-label'
            )).map(function (label) {
                return normalizarTexto(label.textContent);
            });

            const possuiDocumento = rotulos.includes('rg') ||
                rotulos.includes('rg ou cpf');

            return !dialogo.querySelector('input[name="guest.name"]') &&
                rotulos.includes('nome') &&
                rotulos.includes('celular') &&
                possuiDocumento;
        }) || null;
    }

    function preencherCampoReact(campo, valor) {
        if (!campo || !valor) return;

        const descritor = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        );

        descritor.set.call(campo, valor);
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
        campo.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    function preencherSelectReact(campo, valor) {
        if (!campo || !valor) return;

        const descritor = Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype,
            'value'
        );

        descritor.set.call(campo, valor);
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
        campo.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    function localizarGrupoCampoPorRotulo(raiz, rotulo) {
        const esperado = normalizarTexto(rotulo);
        const label = Array.from(raiz.querySelectorAll(
            'label, .control-label'
        )).find(function (item) {
            return normalizarTexto(item.textContent) === esperado;
        });

        if (!label) return null;
        return label.closest('.form-group') || label.parentElement;
    }

    function clicarElementoSeletor(elemento) {
        elemento.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
        elemento.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
        elemento.click();
    }

    async function selecionarOpcaoCampoPorRotulo(
        formulario,
        rotulo,
        textoOpcao,
        valorOpcao
    ) {
        const grupo = localizarGrupoCampoPorRotulo(formulario, rotulo);
        if (!grupo) {
            throw new Error('O campo "' + rotulo + '" não foi encontrado.');
        }

        const selectNativo = grupo.querySelector('select');
        if (selectNativo) {
            preencherSelectReact(selectNativo, valorOpcao);
            if (selectNativo.value !== valorOpcao) {
                throw new Error(
                    'Não foi possível selecionar "' + textoOpcao + '".'
                );
            }
            return;
        }

        const entrada = grupo.querySelector(
            'input[role="combobox"], ' +
            'input[aria-autocomplete="list"], ' +
            'input[id*="react-select"]'
        );
        const controle = (entrada && entrada.closest(
            '[class*="-control"]'
        )) || entrada || grupo.querySelector('[class*="-control"]');

        if (!controle) {
            throw new Error(
                'O seletor visual de "' + rotulo + '" não foi encontrado.'
            );
        }

        clicarElementoSeletor(controle);
        if (entrada) {
            entrada.focus();
            entrada.click();
        }

        const opcao = await aguardarCondicao(function () {
            const esperado = normalizarTexto(textoOpcao);
            return Array.from(document.querySelectorAll(
                '[role="option"], [id*="-option-"]'
            )).find(function (item) {
                return elementoEstaVisivel(item) &&
                    normalizarTexto(item.textContent) === esperado;
            }) || null;
        }, 4000);

        clicarElementoSeletor(opcao);

        try {
            await aguardarCondicao(function () {
                const campoInterno = grupo.querySelector(
                    'input[name="purpose"]'
                );
                if (campoInterno && campoInterno.value === valorOpcao) {
                    return true;
                }

                const valorVisivel = grupo.querySelector(
                    '[class*="-singleValue"], [class*="singleValue"]'
                );
                return valorVisivel &&
                    normalizarTexto(valorVisivel.textContent) ===
                    normalizarTexto(textoOpcao);
            }, 4000);
        } catch (erro) {
            throw new Error(
                'O DoctorCondo não confirmou a seleção "' +
                textoOpcao + '".'
            );
        }
    }

    function localizarBotaoPorTexto(raiz, texto) {
        const esperado = normalizarTexto(texto);

        return Array.from(raiz.querySelectorAll('button')).find(
            function (botao) {
                return elementoEstaVisivel(botao) &&
                    normalizarTexto(botao.textContent) === esperado;
            }
        ) || null;
    }

    async function abrirNovoAcessoComMorador(linha, nomeLista) {
        if (moradorEmProcessamento) return;

        moradorEmProcessamento = true;
        const botao = linha.querySelector(
            '.dc-resident-access-button'
        );
        const conteudoOriginal = botao ? botao.innerHTML : '';

        if (botao) {
            botao.disabled = true;
            botao.innerHTML =
                '<i class="fa fa-spinner fa-spin"></i> Carregando...';
        }

        try {
            const celula = linha.querySelector(':scope > td[role="link"]');
            if (!celula) {
                throw new Error('Não foi possível abrir o perfil do morador.');
            }

            celula.click();
            const dialogoPerfil = await aguardarCondicao(
                localizarDialogoPerfilMorador,
                8000
            );

            const dados = {
                nome: obterValorInformadoPerfil(dialogoPerfil, 'Nome') ||
                    nomeLista,
                rg: obterValorInformadoPerfil(dialogoPerfil, 'RG') ||
                    obterValorInformadoPerfil(dialogoPerfil, 'RG ou CPF'),
                cpf: obterValorInformadoPerfil(dialogoPerfil, 'CPF'),
                telefone: obterValorInformadoPerfil(
                    dialogoPerfil,
                    'Celular'
                ) || obterValorInformadoPerfil(dialogoPerfil, 'Telefone')
            };
            dados.documento = dados.rg || dados.cpf;

            const fechar = localizarBotaoPorTexto(
                dialogoPerfil,
                'Fechar'
            );
            if (!fechar) {
                throw new Error(
                    'Não foi possível fechar o perfil do morador.'
                );
            }

            fechar.click();
            await aguardarCondicao(function () {
                return !dialogoPerfil.isConnected;
            }, 4000);

            const abaVisitante = document.querySelector(
                'a[href="#guests"]'
            );
            if (!abaVisitante) {
                throw new Error(
                    'A aba "Buscar Outro Visitante" não foi encontrada.'
                );
            }

            abaVisitante.click();
            const novoVisitante = await aguardarCondicao(function () {
                return localizarBotaoPorTexto(
                    document,
                    'Novo Visitante'
                );
            }, 4000);

            novoVisitante.click();
            const campoNome = await aguardarCondicao(function () {
                const campo = document.querySelector(
                    '.ReactModal__Content input[name="guest.name"]'
                );
                return elementoEstaVisivel(campo) ? campo : null;
            }, 8000);

            const formulario = campoNome.closest('form');
            preencherCampoReact(campoNome, dados.nome);
            preencherCampoReact(
                formulario.querySelector('input[name="guest.rg"]'),
                dados.documento
            );
            preencherCampoReact(
                formulario.querySelector('input[name="guest.phone"]'),
                dados.telefone
            );

            const campoEmpresa = formulario.querySelector(
                'input[name="guest.company_name"]'
            );
            if (!campoEmpresa) {
                throw new Error(
                    'O campo "Nome da Empresa" não foi encontrado.'
                );
            }
            preencherCampoReact(campoEmpresa, 'MORADOR');

            await selecionarOpcaoCampoPorRotulo(
                formulario,
                'Propósito',
                'Motorista (taxi, app, etc)',
                'driver'
            );

            const modal = campoNome.closest(
                '.ReactModal__Content[role="dialog"]'
            );
            if (modal && !modal.querySelector(
                '.dc-resident-prefill-note'
            )) {
                const aviso = document.createElement('div');
                aviso.className =
                    'dc-resident-prefill-note alert alert-info';
                aviso.innerHTML =
                    '<i class="fa fa-user" aria-hidden="true"></i> ' +
                    '<strong>Dados copiados do morador.</strong> ' +
                    'Empresa e propósito preenchidos automaticamente. ' +
                    'Confira documento, transporte e veículo antes de ' +
                    'registrar.';

                const rodape = modal.querySelector('.card-footer');
                if (rodape) {
                    rodape.insertAdjacentElement('beforebegin', aviso);
                }
            }

            campoNome.focus();
        } catch (erro) {
            window.alert(
                'Não foi possível preparar o acesso do morador.\n\n' +
                (erro.message || 'Erro desconhecido.')
            );
        } finally {
            moradorEmProcessamento = false;

            if (botao && botao.isConnected) {
                botao.disabled = false;
                botao.innerHTML = conteudoOriginal;
            }
        }
    }

    function prepararAcessosMoradores() {
        document.querySelectorAll(
            '#unit_residents tr.tableview-row-normal'
        )
            .forEach(function (linha) {
                if (linha.querySelector('.dc-resident-access-button')) {
                    return;
                }

                const celula = linha.querySelector(
                    ':scope > td[role="link"]'
                );
                const badge = celula && celula.querySelector('.badge');
                const colunaNome = celula && celula.querySelector(
                    '.row > .col-9'
                );
                const colunaAcao = celula && celula.querySelector(
                    '.row > .col-3'
                );

                if (
                    !badge || !colunaNome || !colunaAcao ||
                    normalizarTexto(badge.textContent) !== 'morador'
                ) {
                    return;
                }

                const nome = colunaNome.textContent
                    .replace(/\s+/g, ' ')
                    .trim();
                if (!nome) return;

                const botao = document.createElement('button');
                botao.type = 'button';
                botao.className =
                    'dc-resident-access-button btn btn-sm btn-default';
                botao.title = 'Preencher um novo acesso com este morador';
                botao.setAttribute(
                    'aria-label',
                    'Registrar novo acesso para ' + nome
                );
                botao.innerHTML =
                    '<i class="fa fa-sign-in" aria-hidden="true"></i> ' +
                    'Registrar acesso';
                botao.addEventListener('click', function (evento) {
                    evento.preventDefault();
                    evento.stopPropagation();
                    abrirNovoAcessoComMorador(linha, nome);
                });

                colunaAcao.classList.add('dc-resident-access-host');
                colunaAcao.appendChild(botao);
            });
    }

    function obterBotaoSaida(linha) {
        return Array.from(linha.querySelectorAll('button')).find(
            function (botao) {
                return Boolean(botao.querySelector('.fa-sign-out')) ||
                    normalizarTexto(botao.textContent)
                        .includes('registrar saida');
            }
        ) || null;
    }

    function obterIdAcesso(linha) {
        const link = linha.querySelector(
            'a[href*="/guest_access/"]'
        );

        if (!link) return null;

        const resultado = link.getAttribute('href').match(
            /\/guest_access\/(\d+)/
        );

        return resultado ? resultado[1] : null;
    }

    function obterDescricaoAcesso(linha) {
        const coluna = linha.querySelector(
            '.col-8, .col-lg-9'
        );
        const nome = coluna && coluna.firstElementChild
            ? coluna.firstElementChild.textContent.trim()
            : 'Acesso sem nome';
        const unidade = linha.querySelector(
            'a[href*="/guest_new_access/"]'
        );
        const entrada = linha.querySelector(
            'a[href*="/guest_access/"]'
        );

        return [
            nome,
            unidade ? unidade.textContent.trim() : '',
            entrada ? entrada.textContent.trim() : ''
        ].filter(Boolean).join(' - ');
    }

    function localizarLinhaAcesso(id) {
        const links = Array.from(document.querySelectorAll(
            'a[href*="/guest_access/' + id + '"]'
        ));

        const link = links.find(function (item) {
            const href = item.getAttribute('href') || '';
            return new RegExp('/guest_access/' + id + '(?:$|[?#])')
                .test(href);
        });

        return link ? link.closest('.tableview-row-normal') : null;
    }

    function obterSelecionados() {
        return Array.from(document.querySelectorAll(
            '.dc-batch-checkbox:checked'
        )).map(function (checkbox) {
            const linha = checkbox.closest('.tableview-row-normal');

            return {
                id: obterIdAcesso(linha),
                descricao: obterDescricaoAcesso(linha)
            };
        }).filter(function (registro) {
            return Boolean(registro.id);
        });
    }

    function atualizarBarraLote(mensagem) {
        const barra = document.querySelector('.dc-batch-toolbar');
        if (!barra) return;

        const contador = barra.querySelector('.dc-batch-count');
        const selecionados = obterSelecionados().length;
        const botaoExecutar = barra.querySelector(
            '.dc-batch-run'
        );
        const botoesSelecao = barra.querySelectorAll(
            '.dc-batch-select-visible, ' +
            '.dc-batch-select-all, ' +
            '.dc-batch-clear'
        );

        if (contador) {
            contador.textContent = mensagem || (
                selecionados +
                (selecionados === 1
                    ? ' acesso selecionado'
                    : ' acessos selecionados')
            );
        }

        botoesSelecao.forEach(function (botao) {
            botao.disabled = processandoLote;
        });

        if (botaoExecutar) {
            botaoExecutar.disabled =
                !processandoLote && selecionados === 0;
            botaoExecutar.classList.toggle(
                'btn-danger',
                processandoLote
            );
            botaoExecutar.classList.toggle(
                'btn-warning',
                !processandoLote
            );
            botaoExecutar.innerHTML = processandoLote
                ? '<i class="fa fa-stop"></i> Parar lote'
                : '<i class="fa fa-sign-out"></i> Registrar saídas';
        }

        document.querySelectorAll('.dc-batch-checkbox')
            .forEach(function (checkbox) {
                checkbox.disabled = processandoLote;
            });
    }

    function selecionarLinhasVisiveis() {
        document.querySelectorAll('.dc-batch-row')
            .forEach(function (linha) {
                const checkbox = linha.querySelector(
                    '.dc-batch-checkbox'
                );

                if (checkbox && linha.offsetParent !== null) {
                    checkbox.checked = true;
                }
            });

        atualizarBarraLote();
    }

    function limparSelecao() {
        document.querySelectorAll('.dc-batch-checkbox')
            .forEach(function (checkbox) {
                checkbox.checked = false;
            });

        atualizarBarraLote();
    }

    function selecionarTodasLinhas() {
        document.querySelectorAll('.dc-batch-checkbox')
            .forEach(function (checkbox) {
                checkbox.checked = true;
            });

        atualizarBarraLote();
    }

    function criarBarraLote(linha) {
        if (document.querySelector('.dc-batch-toolbar')) return;

        const corpo = linha.closest('.card-body');

        if (!corpo || !corpo.parentElement) return;

        const barra = document.createElement('div');
        barra.className = 'dc-batch-toolbar';
        barra.innerHTML = `
            <span class="dc-batch-count">0 acessos selecionados</span>
            <button
                type="button"
                class="dc-batch-select-visible btn btn-sm btn-default">
                <i class="fa fa-check-square"></i>
                Selecionar visíveis
            </button>
            <button
                type="button"
                class="dc-batch-select-all btn btn-sm btn-default">
                <i class="fa fa-list-check"></i>
                Selecionar todos
            </button>
            <button
                type="button"
                class="dc-batch-clear btn btn-sm btn-default">
                <i class="fa fa-times"></i>
                Limpar
            </button>
            <button
                type="button"
                class="dc-batch-run btn btn-sm btn-warning"
                disabled>
                <i class="fa fa-sign-out"></i>
                Registrar saídas
            </button>
        `;

        barra.querySelector('.dc-batch-select-visible')
            .addEventListener('click', selecionarLinhasVisiveis);
        barra.querySelector('.dc-batch-select-all')
            .addEventListener('click', selecionarTodasLinhas);
        barra.querySelector('.dc-batch-clear')
            .addEventListener('click', limparSelecao);
        barra.querySelector('.dc-batch-run')
            .addEventListener('click', function () {
                if (processandoLote) {
                    cancelarLote = true;
                    atualizarBarraLote(
                        'O lote será interrompido após a saída atual'
                    );
                    return;
                }

                processarSaidasSelecionadas().catch(function (erro) {
                    processandoLote = false;
                    cancelarLote = false;
                    prepararSaidasEmLote();
                    atualizarBarraLote();
                    console.error(
                        'Erro ao registrar saídas em lote:',
                        erro
                    );
                    window.alert(
                        'O lote foi interrompido por um erro inesperado. ' +
                        'Nenhuma outra saída será processada.'
                    );
                });
            });

        corpo.insertAdjacentElement('beforebegin', barra);
    }

    function prepararSaidasEmLote() {
        const linhas = Array.from(document.querySelectorAll(
            '.tableview-row-normal'
        ));

        linhas.forEach(function (linha) {
            const botaoSaida = obterBotaoSaida(linha);
            const id = obterIdAcesso(linha);

            if (!botaoSaida || !id) return;

            linha.classList.add('dc-batch-row');
            linha.dataset.dcAccessId = id;

            if (!linha.querySelector('.dc-batch-checkbox')) {
                const rotulo = document.createElement('label');
                rotulo.className = 'dc-batch-check';
                rotulo.title = 'Selecionar para registrar saída';
                rotulo.innerHTML = `
                    <input
                        type="checkbox"
                        class="dc-batch-checkbox"
                        aria-label="Selecionar para registrar saída">
                `;

                const checkbox = rotulo.querySelector('input');
                checkbox.setAttribute(
                    'aria-label',
                    'Selecionar saída: ' + obterDescricaoAcesso(linha)
                );

                checkbox
                    .addEventListener('change', function () {
                        atualizarBarraLote();
                    });

                linha.querySelector('td').appendChild(rotulo);
            }
        });

        const primeiraLinha = linhas.find(function (linha) {
            return linha.classList.contains('dc-batch-row');
        });

        if (primeiraLinha) {
            criarBarraLote(primeiraLinha);
            atualizarBarraLote();
        }
    }

    function analisarModalSaida() {
        const popup = Array.from(document.querySelectorAll(
            '.swal2-popup.swal2-show, ' +
            '.swal2-container.swal2-backdrop-show .swal2-popup'
        )).find(function (elemento) {
            return elemento.getAttribute('aria-hidden') !== 'true' &&
                elemento.getClientRects().length;
        });

        if (!popup) return { tipo: 'nenhum' };

        const tituloElemento = popup.querySelector('.swal2-title');
        const mensagemElemento = popup.querySelector(
            '.swal2-html-container, .swal2-content'
        );
        const titulo = tituloElemento
            ? tituloElemento.textContent.trim()
            : '';
        const mensagem = mensagemElemento
            ? mensagemElemento.textContent.trim()
            : popup.textContent.trim();
        const tituloNormalizado = normalizarTexto(titulo);
        const mensagemNormalizada = normalizarTexto(mensagem);
        const botoes = Array.from(popup.querySelectorAll('button'));

        if (
            tituloNormalizado === 'confirmacao' &&
            mensagemNormalizada.includes(
                'deseja confirmar a saida do visitante'
            )
        ) {
            const botaoSim = botoes.find(function (botao) {
                return normalizarTexto(botao.textContent) === 'sim';
            });

            return botaoSim
                ? { tipo: 'confirmacao', botao: botaoSim }
                : {
                    tipo: 'inesperado',
                    mensagem: 'A confirmação apareceu sem o botão Sim.'
                };
        }

        if (
            tituloNormalizado === 'importante' &&
            mensagemNormalizada.includes(
                'saida do visitante registrada'
            )
        ) {
            const botaoOk = botoes.find(function (botao) {
                return normalizarTexto(botao.textContent) === 'ok';
            });

            return botaoOk
                ? { tipo: 'sucesso', botao: botaoOk }
                : {
                    tipo: 'inesperado',
                    mensagem: 'O aviso de sucesso apareceu sem o botão OK.'
                };
        }

        return {
            tipo: 'inesperado',
            mensagem: [titulo, mensagem].filter(Boolean).join(': ') ||
                'O DoctorCondo apresentou uma mensagem diferente.'
        };
    }

    function aguardar(tempo) {
        return new Promise(function (resolve) {
            window.setTimeout(resolve, tempo);
        });
    }

    async function aguardarConclusaoSaida(registro) {
        const inicio = Date.now();
        let confirmacaoEnviada = false;
        let sucessoConfirmadoEm = null;
        let linhaAusenteEm = null;

        while (Date.now() - inicio < 90000) {
            await aguardar(250);

            const modal = analisarModalSaida();

            if (modal.tipo === 'confirmacao') {
                if (!confirmacaoEnviada) {
                    confirmacaoEnviada = true;
                    atualizarBarraLote(
                        'Confirmando automaticamente: ' +
                        registro.descricao
                    );
                    modal.botao.click();
                }

                continue;
            }

            if (modal.tipo === 'sucesso') {
                if (!sucessoConfirmadoEm) {
                    sucessoConfirmadoEm = Date.now();
                    atualizarBarraLote(
                        'Saída confirmada. Fechando o aviso...'
                    );
                    modal.botao.click();
                }

                continue;
            }

            if (modal.tipo === 'inesperado') {
                return {
                    concluida: false,
                    motivo: 'Mensagem inesperada: ' + modal.mensagem
                };
            }

            if (
                sucessoConfirmadoEm &&
                Date.now() - sucessoConfirmadoEm > 700
            ) {
                return { concluida: true };
            }

            const linha = localizarLinhaAcesso(registro.id);

            if (!linha || !obterBotaoSaida(linha)) {
                if (!linhaAusenteEm) {
                    linhaAusenteEm = Date.now();
                }

                if (Date.now() - linhaAusenteEm > 1200) {
                    return { concluida: true };
                }
            } else {
                linhaAusenteEm = null;
            }

            if (Date.now() - inicio > 15000) {
                return {
                    concluida: false,
                    motivo: confirmacaoEnviada
                        ? 'O DoctorCondo não mostrou a confirmação de sucesso em 15 segundos.'
                        : 'A janela de confirmação não apareceu em 15 segundos.'
                };
            }
        }

        return {
            concluida: false,
            motivo: 'Tempo de espera excedido.'
        };
    }

    async function processarSaidasSelecionadas() {
        const registros = obterSelecionados();
        if (!registros.length) return;

        const resumo = registros.slice(0, 12).map(function (registro) {
            return '• ' + registro.descricao;
        });

        if (registros.length > 12) {
            resumo.push(
                '• e mais ' + (registros.length - 12) + ' acesso(s)'
            );
        }

        const confirmado = window.confirm(
            'Registrar saída de ' + registros.length +
            ' acesso(s)?\n\n' + resumo.join('\n') +
            '\n\nAs saídas serão processadas uma por vez.' +
            '\nOs botões Sim e OK serão confirmados automaticamente.'
        );

        if (!confirmado) return;

        processandoLote = true;
        cancelarLote = false;
        let concluidas = 0;
        let erro = null;

        atualizarBarraLote('Preparando o lote...');

        for (let indice = 0; indice < registros.length; indice += 1) {
            if (cancelarLote) break;

            const registro = registros[indice];
            const linha = localizarLinhaAcesso(registro.id);
            const botao = linha ? obterBotaoSaida(linha) : null;

            if (!linha || !botao || botao.disabled) {
                erro = 'O acesso não está mais disponível: ' +
                    registro.descricao;
                break;
            }

            linha.classList.add('dc-batch-processing');
            atualizarBarraLote(
                'Processando ' + (indice + 1) + ' de ' +
                registros.length + ': ' + registro.descricao
            );

            botao.click();

            const resultado = await aguardarConclusaoSaida(registro);

            if (!resultado.concluida) {
                linha.classList.remove('dc-batch-processing');
                erro = resultado.motivo + '\n\n' + registro.descricao;
                break;
            }

            concluidas += 1;
        }

        processandoLote = false;
        prepararSaidasEmLote();
        atualizarBarraLote();

        if (erro) {
            window.alert(
                'O lote foi interrompido após ' + concluidas +
                ' saída(s).\n\n' + erro
            );
            return;
        }

        if (cancelarLote) {
            window.alert(
                'Lote interrompido.\n\n' + concluidas +
                ' saída(s) concluída(s).'
            );
            return;
        }

        window.alert(
            'Lote concluído.\n\n' + concluidas +
            ' saída(s) registrada(s).'
        );
    }

    function paginaEhListaReservas() {
        return /^#\/c\/\d+\/\d+\/bookings(?:$|\/p(?:\/|$))/.test(
            window.location.hash
        );
    }

    function obterLinhasReservas() {
        if (!paginaEhListaReservas()) return [];

        return Array.from(document.querySelectorAll(
            'table tbody tr.tableview-row-normal'
        )).filter(function (linha) {
            return Boolean(
                linha.querySelector('form .fa-calendar-day') &&
                linha.querySelector('[data-table-action-button="true"]')
            );
        });
    }

    function obterTextoReserva(linha) {
        const formulario = linha && linha.querySelector('form');

        return formulario
            ? formulario.textContent.replace(/\s+/g, ' ').trim()
            : '';
    }

    function obterChaveReserva(linha) {
        return normalizarTexto(obterTextoReserva(linha));
    }

    function obterChaveGrupoReserva(linha) {
        return obterChaveReserva(linha)
            .replace(/ reservado em:.*$/, '')
            .trim();
    }

    function obterReservasSelecionadas() {
        return Array.from(document.querySelectorAll(
            '.dc-booking-batch-checkbox:checked'
        )).map(function (checkbox) {
            const linha = checkbox.closest('.tableview-row-normal');

            return {
                chave: obterChaveReserva(linha),
                descricao: obterTextoReserva(linha)
            };
        }).filter(function (registro) {
            return Boolean(registro.chave && registro.descricao);
        });
    }

    function obterPainelProgressoEntregaChaves() {
        let painel = document.querySelector('#dc-booking-batch-progress');

        if (painel) return painel;

        painel = document.createElement('div');
        painel.id = 'dc-booking-batch-progress';
        painel.setAttribute('role', 'status');
        painel.setAttribute('aria-live', 'polite');
        painel.innerHTML = `
            <span class="dc-booking-batch-progress-text"></span>
            <button type="button" class="btn btn-sm btn-outline-light">
                <i class="fa fa-stop" aria-hidden="true"></i>
                Parar após esta
            </button>
        `;

        painel.querySelector('button').addEventListener('click', function () {
            cancelarEntregaChaves = true;
            atualizarProgressoEntregaChaves(
                'O lote será interrompido após a reserva atual.'
            );
        });

        document.body.appendChild(painel);
        return painel;
    }

    function atualizarProgressoEntregaChaves(mensagem) {
        const painel = obterPainelProgressoEntregaChaves();
        const texto = painel.querySelector(
            '.dc-booking-batch-progress-text'
        );
        const botao = painel.querySelector('button');

        if (texto) texto.textContent = mensagem;
        if (botao) botao.disabled = cancelarEntregaChaves;
    }

    function removerProgressoEntregaChaves() {
        const painel = document.querySelector('#dc-booking-batch-progress');
        if (painel) painel.remove();
    }

    function atualizarBarraEntregaChaves(mensagem) {
        const barra = document.querySelector('.dc-booking-batch-toolbar');
        if (!barra) return;

        const contador = barra.querySelector('.dc-booking-batch-count');
        const selecionadas = obterReservasSelecionadas().length;
        const botaoEntregar = barra.querySelector(
            '.dc-booking-batch-run'
        );
        const botoesSelecao = barra.querySelectorAll(
            '.dc-booking-batch-select-visible, ' +
            '.dc-booking-batch-select-matching, ' +
            '.dc-booking-batch-clear'
        );

        if (contador) {
            contador.textContent = mensagem || (
                selecionadas +
                (selecionadas === 1
                    ? ' reserva selecionada'
                    : ' reservas selecionadas')
            );
        }

        botoesSelecao.forEach(function (botao) {
            botao.disabled = processandoEntregaChaves;
        });

        if (botaoEntregar) {
            botaoEntregar.disabled =
                processandoEntregaChaves || selecionadas === 0;
            botaoEntregar.innerHTML = processandoEntregaChaves
                ? '<i class="fa fa-spinner fa-spin"></i> Processando...'
                : '<i class="fa fa-key" aria-hidden="true"></i> ' +
                    'Entregar chaves';
        }

        document.querySelectorAll('.dc-booking-batch-checkbox')
            .forEach(function (checkbox) {
                checkbox.disabled = processandoEntregaChaves;
            });
    }

    function selecionarReservasVisiveis() {
        obterLinhasReservas().forEach(function (linha) {
            const checkbox = linha.querySelector(
                '.dc-booking-batch-checkbox'
            );

            if (checkbox && linha.offsetParent !== null) {
                checkbox.checked = true;
            }
        });

        atualizarBarraEntregaChaves();
    }

    function selecionarReservasMesmoHorario() {
        const selecionadas = obterReservasSelecionadas();

        if (!selecionadas.length) {
            window.alert(
                'Selecione primeiro uma reserva de referência.\n\n' +
                'O DoctorCondo marcará as reservas com a mesma data, ' +
                'unidade, local e horário.'
            );
            return;
        }

        const linhaReferencia = obterLinhasReservas().find(
            function (linha) {
                return obterChaveReserva(linha) === selecionadas[0].chave;
            }
        );

        if (!linhaReferencia) return;

        const chaveGrupo = obterChaveGrupoReserva(linhaReferencia);

        obterLinhasReservas().forEach(function (linha) {
            const checkbox = linha.querySelector(
                '.dc-booking-batch-checkbox'
            );

            if (checkbox && obterChaveGrupoReserva(linha) === chaveGrupo) {
                checkbox.checked = true;
            }
        });

        atualizarBarraEntregaChaves();
    }

    function limparSelecaoReservas() {
        document.querySelectorAll('.dc-booking-batch-checkbox')
            .forEach(function (checkbox) {
                checkbox.checked = false;
            });

        atualizarBarraEntregaChaves();
    }

    function criarBarraEntregaChaves(linha) {
        if (document.querySelector('.dc-booking-batch-toolbar')) return;

        const corpo = linha.closest('.card-body');
        if (!corpo || !corpo.parentElement) return;

        const barra = document.createElement('div');
        barra.className = 'dc-booking-batch-toolbar';
        barra.innerHTML = `
            <span class="dc-booking-batch-count">0 reservas selecionadas</span>
            <button type="button"
                class="dc-booking-batch-select-visible btn btn-sm btn-default">
                <i class="fa fa-check-square" aria-hidden="true"></i>
                Selecionar visíveis
            </button>
            <button type="button"
                class="dc-booking-batch-select-matching btn btn-sm btn-default">
                <i class="fa fa-clone" aria-hidden="true"></i>
                Selecionar mesmo horário
            </button>
            <button type="button"
                class="dc-booking-batch-clear btn btn-sm btn-default">
                <i class="fa fa-times" aria-hidden="true"></i>
                Limpar
            </button>
            <button type="button"
                class="dc-booking-batch-run btn btn-sm btn-warning" disabled>
                <i class="fa fa-key" aria-hidden="true"></i>
                Entregar chaves
            </button>
        `;

        barra.querySelector('.dc-booking-batch-select-visible')
            .addEventListener('click', selecionarReservasVisiveis);
        barra.querySelector('.dc-booking-batch-select-matching')
            .addEventListener('click', selecionarReservasMesmoHorario);
        barra.querySelector('.dc-booking-batch-clear')
            .addEventListener('click', limparSelecaoReservas);
        barra.querySelector('.dc-booking-batch-run')
            .addEventListener('click', function () {
                processarEntregasChavesSelecionadas().catch(function (erro) {
                    processandoEntregaChaves = false;
                    cancelarEntregaChaves = false;
                    removerProgressoEntregaChaves();
                    prepararEntregasChavesEmLote();
                    atualizarBarraEntregaChaves();
                    console.error(
                        'Erro ao entregar chaves em lote:',
                        erro
                    );
                    window.alert(
                        'O lote foi interrompido por um erro inesperado. ' +
                        'Nenhuma outra reserva será processada.'
                    );
                });
            });

        corpo.insertAdjacentElement('beforebegin', barra);
    }

    function prepararEntregasChavesEmLote() {
        const linhas = obterLinhasReservas();

        linhas.forEach(function (linha) {
            linha.classList.add('dc-booking-batch-row');

            if (linha.querySelector('.dc-booking-batch-checkbox')) return;

            const texto = obterTextoReserva(linha);
            if (!texto) return;

            const rotulo = document.createElement('label');
            rotulo.className = 'dc-booking-batch-check';
            rotulo.title = 'Selecionar para entregar chaves';
            rotulo.innerHTML = `
                <input type="checkbox" class="dc-booking-batch-checkbox"
                    aria-label="Selecionar reserva para entregar chaves">
            `;

            const checkbox = rotulo.querySelector('input');
            checkbox.setAttribute(
                'aria-label',
                'Selecionar reserva: ' + texto
            );
            checkbox.addEventListener('change', atualizarBarraEntregaChaves);

            linha.querySelector('td').appendChild(rotulo);
        });

        if (linhas.length) {
            criarBarraEntregaChaves(linhas[0]);
            atualizarBarraEntregaChaves();
        }
    }

    function localizarLinhaReserva(chave) {
        return obterLinhasReservas().find(function (linha) {
            return obterChaveReserva(linha) === chave;
        }) || null;
    }

    async function abrirDetalheReserva(linha) {
        const abrirMenu = linha.querySelector(
            '[data-table-action-button="true"] .dropdown-toggle'
        );

        if (!abrirMenu) {
            throw new Error('O menu da reserva não foi encontrado.');
        }

        abrirMenu.click();

        const botaoVer = await aguardarCondicao(function () {
            return Array.from(linha.querySelectorAll(
                '[data-table-action-button="true"] button'
            )).find(function (botao) {
                return elementoEstaVisivel(botao) &&
                    normalizarTexto(botao.textContent) === 'ver';
            }) || null;
        }, 4000);

        botaoVer.click();

        return aguardarCondicao(function () {
            return localizarBotaoPorTexto(document, 'Entregar Chaves');
        }, 8000);
    }

    function localizarGrupoEntregaChaves(rotulo) {
        const textoEsperado = normalizarTexto(rotulo);
        const label = Array.from(document.querySelectorAll('label'))
            .find(function (item) {
                return normalizarTexto(item.textContent)
                    .startsWith(textoEsperado);
            });

        if (!label) return null;

        return label.closest(
            '.form-group, .row, .form-row, .form-horizontal'
        );
    }

    function localizarTelaEntregaChaves() {
        const titulo = Array.from(document.querySelectorAll(
            'h1, h2, h3, h4'
        )).find(function (item) {
            return normalizarTexto(item.textContent) ===
                'entrega de chaves';
        });
        const confirmar = localizarBotaoPorTexto(document, 'Confirmar');

        if (!titulo || !confirmar) return null;

        return {
            titulo: titulo,
            confirmar: confirmar,
            grupoMorador: localizarGrupoEntregaChaves(
                'Morador da unidade'
            ),
            grupoEntreguePara: localizarGrupoEntregaChaves(
                'Entregue Para (nome)'
            )
        };
    }

    async function confirmarTelaEntregaChaves() {
        const tela = await aguardarCondicao(
            localizarTelaEntregaChaves,
            8000
        );
        const nomeMoradorElemento = tela.grupoMorador &&
            tela.grupoMorador.querySelector(
                '.field-select__single-value'
            );
        const campoEntreguePara = tela.grupoEntreguePara &&
            tela.grupoEntreguePara.querySelector(
                'input[name="keys_delivery_to_custom_name"]'
            );
        const nomeMorador = nomeMoradorElemento
            ? nomeMoradorElemento.textContent.trim()
            : '';
        const entreguePara = campoEntreguePara
            ? String(campoEntreguePara.value || '').trim()
            : '';

        if (!nomeMorador) {
            throw new Error(
                'O DoctorCondo não preencheu "Morador da unidade". ' +
                'A entrega não foi confirmada.'
            );
        }

        if (entreguePara) {
            throw new Error(
                'O campo "Entregue Para (nome)" já está preenchido. ' +
                'A entrega não foi confirmada automaticamente.'
            );
        }

        atualizarProgressoEntregaChaves(
            'Morador preenchido pelo DoctorCondo. Confirmando...'
        );
        tela.confirmar.click();

        return aguardarConclusaoEntregaChaves(tela);
    }

    function obterPopupSweetAlertVisivel() {
        return Array.from(document.querySelectorAll(
            '.swal2-popup.swal2-show, ' +
            '.swal2-container.swal2-backdrop-show .swal2-popup'
        )).find(function (popup) {
            return elementoEstaVisivel(popup) &&
                popup.getAttribute('aria-hidden') !== 'true';
        }) || null;
    }

    function localizarBotaoPopup(popup, textos) {
        return Array.from(popup.querySelectorAll('button')).find(
            function (botao) {
                return elementoEstaVisivel(botao) && textos.includes(
                    normalizarTexto(botao.textContent)
                );
            }
        ) || null;
    }

    async function aguardarConclusaoEntregaChaves(telaEntrega) {
        const inicio = Date.now();
        let sucessoConfirmadoEm = null;
        let telaFechadaEm = null;

        while (Date.now() - inicio < 90000) {
            await aguardar(250);

            const popup = obterPopupSweetAlertVisivel();

            if (popup) {
                const mensagem = normalizarTexto(popup.textContent);

                if (
                    mensagem.includes('chave') &&
                    (mensagem.includes('entregue') ||
                        mensagem.includes('sucesso'))
                ) {
                    const fechar = localizarBotaoPopup(popup, [
                        'ok', 'fechar', 'entendi'
                    ]);

                    if (!fechar) {
                        return {
                            concluida: false,
                            motivo: 'O aviso de sucesso apareceu sem um botão para fechar.'
                        };
                    }

                    if (!sucessoConfirmadoEm) {
                        sucessoConfirmadoEm = Date.now();
                        fechar.click();
                    }

                    continue;
                }

                return {
                    concluida: false,
                    motivo: 'Mensagem inesperada do DoctorCondo: ' +
                        popup.textContent.replace(/\s+/g, ' ').trim()
                };
            }

            if (
                sucessoConfirmadoEm &&
                Date.now() - sucessoConfirmadoEm > 700
            ) {
                return { concluida: true };
            }

            const confirmarAindaAberto = telaEntrega.titulo.isConnected &&
                telaEntrega.confirmar.isConnected &&
                !telaEntrega.confirmar.disabled;

            if (!confirmarAindaAberto) {
                if (!telaFechadaEm) {
                    telaFechadaEm = Date.now();
                }

                if (Date.now() - telaFechadaEm > 1200) {
                    return { concluida: true };
                }
            } else {
                telaFechadaEm = null;
            }

            if (Date.now() - inicio > 15000) {
                return {
                    concluida: false,
                    motivo: 'O DoctorCondo não confirmou a entrega em 15 segundos.'
                };
            }
        }

        return {
            concluida: false,
            motivo: 'Tempo de espera excedido.'
        };
    }

    async function voltarParaListaReservas(urlDaLista) {
        const destino = new URL(urlDaLista, window.location.href);

        if (window.location.hash !== destino.hash) {
            window.location.hash = destino.hash;
        }

        return aguardarCondicao(function () {
            return paginaEhListaReservas() && obterLinhasReservas().length
                ? true
                : null;
        }, 8000);
    }

    async function processarEntregasChavesSelecionadas() {
        const reservas = obterReservasSelecionadas();
        if (!reservas.length) return;

        const resumo = reservas.slice(0, 12).map(function (reserva) {
            return '• ' + reserva.descricao;
        });

        if (reservas.length > 12) {
            resumo.push(
                '• e mais ' + (reservas.length - 12) + ' reserva(s)'
            );
        }

        const confirmado = window.confirm(
            'Entregar chaves de ' + reservas.length + ' reserva(s)?\n\n' +
            resumo.join('\n') +
            '\n\nA ação será registrada no DoctorCondo, uma reserva por vez.' +
            '\nAs confirmações reconhecidas de entrega serão aceitas automaticamente.'
        );

        if (!confirmado) return;

        const urlDaLista = window.location.href;
        let concluidas = 0;
        let erro = null;

        processandoEntregaChaves = true;
        cancelarEntregaChaves = false;
        atualizarBarraEntregaChaves('Preparando o lote...');
        atualizarProgressoEntregaChaves('Preparando o lote de entregas...');

        for (let indice = 0; indice < reservas.length; indice += 1) {
            if (cancelarEntregaChaves) break;

            const reserva = reservas[indice];
            const linha = localizarLinhaReserva(reserva.chave);

            if (!linha) {
                erro = 'A reserva não está mais disponível na lista: ' +
                    reserva.descricao;
                break;
            }

            linha.classList.add('dc-booking-batch-processing');
            atualizarBarraEntregaChaves(
                'Processando ' + (indice + 1) + ' de ' +
                reservas.length + ' reservas'
            );
            atualizarProgressoEntregaChaves(
                'Abrindo reserva ' + (indice + 1) + ' de ' +
                reservas.length + '...'
            );

            let resultado;

            try {
                const botaoEntregar = await abrirDetalheReserva(linha);

                atualizarProgressoEntregaChaves(
                    'Abrindo a confirmação: ' + (indice + 1) + ' de ' +
                    reservas.length + '...'
                );
                botaoEntregar.click();
                resultado = await confirmarTelaEntregaChaves();
            } catch (falha) {
                erro = (falha.message ||
                    'Não foi possível confirmar a tela de entrega.') +
                    '\n\n' + reserva.descricao;
                break;
            }

            if (!resultado.concluida) {
                erro = resultado.motivo + '\n\n' + reserva.descricao;
                break;
            }

            concluidas += 1;

            if (!erro) {
                atualizarProgressoEntregaChaves(
                    'Entrega confirmada. Voltando à lista...'
                );
                await voltarParaListaReservas(urlDaLista);
            }
        }

        processandoEntregaChaves = false;
        removerProgressoEntregaChaves();

        if (paginaEhListaReservas()) {
            prepararEntregasChavesEmLote();
            atualizarBarraEntregaChaves();
        }

        if (erro) {
            window.alert(
                'O lote foi interrompido após ' + concluidas +
                ' entrega(s).\n\n' + erro
            );
            return;
        }

        if (cancelarEntregaChaves) {
            window.alert(
                'Lote interrompido.\n\n' + concluidas +
                ' entrega(s) concluída(s).'
            );
            return;
        }

        window.alert(
            'Lote concluído.\n\n' + concluidas +
            ' chave(s) entregue(s).'
        );
    }

    function localizarPacoteNaResposta(valor, id) {
        const visitados = new Set();
        let encontrado = null;

        function percorrer(item) {
            if (encontrado || !item || typeof item !== 'object') {
                return;
            }
            if (visitados.has(item)) return;

            visitados.add(item);

            if (String(item.id || '') === String(id)) {
                encontrado = item;
                return;
            }

            if (Array.isArray(item)) {
                item.forEach(percorrer);
                return;
            }

            Object.keys(item).forEach(function (chave) {
                percorrer(item[chave]);
            });
        }

        percorrer(valor);
        return encontrado;
    }

    function requisitarDetalhesPacote(id) {
        if (detalhesPacotes.has(String(id))) {
            return Promise.resolve(
                detalhesPacotes.get(String(id))
            );
        }

        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/packages/' + id + '.json', true);

            Object.keys(cabecalhosPacotes).forEach(function (nome) {
                try {
                    xhr.setRequestHeader(
                        nome,
                        cabecalhosPacotes[nome]
                    );
                } catch (erro) {
                    console.debug(
                        'Cabeçalho não reutilizado:',
                        nome
                    );
                }
            });

            xhr.addEventListener('load', function () {
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(new Error(
                        'Consulta recusada pelo DoctorCondo (' +
                        xhr.status + ').'
                    ));
                    return;
                }

                try {
                    const resposta = xhr.response &&
                        typeof xhr.response === 'object'
                        ? xhr.response
                        : JSON.parse(xhr.responseText);
                    const pacote = localizarPacoteNaResposta(
                        resposta,
                        id
                    );

                    if (!pacote) {
                        reject(new Error(
                            'A correspondência não foi encontrada na resposta.'
                        ));
                        return;
                    }

                    registrarDadosPacotes(resposta);
                    detalhesPacotes.set(String(id), pacote);
                    resolve(pacote);
                } catch (erro) {
                    reject(new Error(
                        'Não foi possível interpretar os anexos.'
                    ));
                }
            });

            xhr.addEventListener('error', function () {
                reject(new Error(
                    'Falha de comunicação com o DoctorCondo.'
                ));
            });

            xhr.send();
        });
    }

    function obterPainelPreview() {
        let painel = document.querySelector(
            '#dc-package-preview-panel'
        );

        if (painel) return painel;

        painel = document.createElement('section');
        painel.id = 'dc-package-preview-panel';
        painel.className = 'card';
        painel.setAttribute('aria-live', 'polite');
        painel.innerHTML = `
            <header class="card-header">
                <h5 class="dc-preview-title">Anexo da correspondência</h5>
                <button
                    type="button"
                    class="dc-preview-close btn btn-sm btn-default"
                    aria-label="Fechar preview"
                    title="Fechar preview">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </button>
            </header>
            <div class="card-body"></div>
        `;

        painel.querySelector('.dc-preview-close')
            .addEventListener('click', function () {
                painel.remove();
            });

        document.body.appendChild(painel);
        return painel;
    }

    function mostrarStatusPreview(painel, mensagem) {
        const corpo = painel.querySelector('.card-body');
        corpo.textContent = '';

        const status = document.createElement('div');
        status.className = 'dc-preview-status';
        status.textContent = mensagem;
        corpo.appendChild(status);
    }

    function anexoEhImagem(anexo) {
        const referencia = String(
            anexo.url || anexo.name || anexo.filename || ''
        );

        return /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i
            .test(referencia);
    }

    function renderizarAnexosPreview(painel, pacote) {
        const corpo = painel.querySelector('.card-body');
        const anexos = Array.isArray(pacote.attachments)
            ? pacote.attachments.filter(function (anexo) {
                return Boolean(anexo && anexo.url);
            })
            : [];

        corpo.textContent = '';

        if (!anexos.length) {
            mostrarStatusPreview(
                painel,
                'Esta correspondência não possui anexos.'
            );
            return;
        }

        anexos.forEach(function (anexo) {
            const bloco = document.createElement('div');
            bloco.className = 'mb-3';

            if (anexoEhImagem(anexo)) {
                const imagem = document.createElement('img');
                imagem.className = 'dc-preview-image';
                imagem.src = anexo.url;
                imagem.alt = anexo.name ||
                    anexo.filename ||
                    'Anexo da correspondência';
                imagem.loading = 'lazy';
                bloco.appendChild(imagem);
            }

            const link = document.createElement('a');
            link.className = 'dc-preview-file';
            link.href = anexo.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = anexo.name ||
                anexo.filename ||
                'Abrir anexo';
            bloco.appendChild(link);
            corpo.appendChild(bloco);
        });
    }

    async function abrirPreviewCorrespondencia(codigo, descricao) {
        const painel = obterPainelPreview();
        const titulo = painel.querySelector('.dc-preview-title');
        const pacote = pacotesPorCodigo.get(
            normalizarCodigoPacote(codigo)
        );

        titulo.textContent = descricao ||
            ('Correspondência ' + codigo);
        mostrarStatusPreview(painel, 'Carregando anexo...');

        if (!pacote || !pacote.id) {
            mostrarStatusPreview(
                painel,
                'Os dados desta linha ainda não foram carregados. ' +
                'Atualize a página e tente novamente.'
            );
            return;
        }

        painel.dataset.packageId = pacote.id;

        try {
            const detalhe = await requisitarDetalhesPacote(pacote.id);

            if (
                painel.isConnected &&
                painel.dataset.packageId === pacote.id
            ) {
                renderizarAnexosPreview(painel, detalhe);
            }
        } catch (erro) {
            if (
                painel.isConnected &&
                painel.dataset.packageId === pacote.id
            ) {
                mostrarStatusPreview(
                    painel,
                    erro.message || 'Não foi possível carregar o anexo.'
                );
            }
        }
    }

    function paginaEhListaCorrespondencias() {
        return /#\/c\/\d+\/\d+\/packages(?:\/p\/|\/?$)/
            .test(window.location.hash);
    }

    function prepararPreviewsCorrespondencias() {
        if (!paginaEhListaCorrespondencias()) return;

        document.querySelectorAll(
            'table tbody tr.tableview-row-normal'
        ).forEach(function (linha) {
            if (linha.querySelector('.dc-package-preview-button')) {
                return;
            }

            const celulas = linha.querySelectorAll(':scope > td');
            const acoes = linha.querySelector(
                '[data-table-action-button="true"]'
            );

            if (celulas.length < 4 || !acoes) return;

            const codigo = celulas[1].textContent.trim();
            const descricao = celulas[0].textContent.trim();
            if (!codigo) return;

            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className =
                'dc-package-preview-button btn btn-transparent';
            botao.title = 'Pré-visualizar anexo';
            botao.setAttribute(
                'aria-label',
                'Pré-visualizar anexo de ' + descricao
            );
            botao.innerHTML =
                '<i class="fa fa-image" aria-hidden="true"></i>';
            botao.addEventListener('click', function (evento) {
                evento.preventDefault();
                evento.stopPropagation();
                abrirPreviewCorrespondencia(codigo, descricao);
            });

            const celulaAcoes = acoes.closest('td');
            celulaAcoes.classList.add('dc-package-action-cell');
            celulaAcoes.insertBefore(botao, acoes);
        });
    }

    function iniciar() {
        instalarEstilo();
        criarControles();
        aplicarEstados();
        prepararAtalhosOperador();
        prepararSaidasEmLote();
        prepararAcessosMoradores();
        prepararPreviewsCorrespondencias();
        prepararEntregasChavesEmLote();
    }

    function agendarAtualizacao() {
        if (atualizacaoAgendada) return;

        atualizacaoAgendada = true;

        window.requestAnimationFrame(function () {
            atualizacaoAgendada = false;

            const controles = document.querySelector(
                '#dc-section-tools'
            );
            const portoes = obterSecaoPortoes();

            if (!controles || !portoes) {
                iniciar();
                return;
            }

            aplicarEstados();
            prepararAtalhosOperador();
            prepararSaidasEmLote();
            prepararAcessosMoradores();
            prepararPreviewsCorrespondencias();
            prepararEntregasChavesEmLote();
        });
    }

    function iniciarObservador() {
        if (observador || !document.documentElement) return;

        observador = new MutationObserver(function (mutacoes) {
            const precisaAtualizar = mutacoes.some(function (mutacao) {
                const alvo = mutacao.target instanceof Element
                    ? mutacao.target
                    : mutacao.target.parentElement;

                if (alvo && alvo.closest('#unit_residents')) {
                    return true;
                }

                const nosAlterados = Array.from(mutacao.addedNodes)
                    .concat(Array.from(mutacao.removedNodes));

                return nosAlterados.some(function (no) {
                    if (!(no instanceof Element)) return false;

                    return no.matches(
                        'section.content-header, ' +
                        '.access-control-btn-bar-button, ' +
                        '.tableview-row-normal'
                    ) || Boolean(no.querySelector(
                        'section.content-header, ' +
                        '.access-control-btn-bar-button, ' +
                        '.tableview-row-normal'
                    ));
                });
            });

            if (precisaAtualizar) {
                agendarAtualizacao();
            }
        });

        observador.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function iniciarAplicacao() {
        if (!document.head || !document.body) {
            window.setTimeout(iniciarAplicacao, 100);
            return;
        }

        iniciarObservador();
        iniciar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            iniciarAplicacao,
            { once: true }
        );
    } else {
        iniciarAplicacao();
    }

    window.addEventListener('resize', agendarAtualizacao, {
        passive: true
    });
    window.addEventListener('hashchange', agendarAtualizacao);

    setTimeout(iniciarAplicacao, 800);
    setTimeout(iniciarAplicacao, 2500);
})();
