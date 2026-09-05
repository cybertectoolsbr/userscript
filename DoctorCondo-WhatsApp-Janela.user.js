// ==UserScript==
// @name         DoctorCondo - WhatsApp em janela
// @namespace    doctorcondo-whatsapp-janela
// @version      0.4.6
// @author       CYBERTECTOOLS
// @description  Reutiliza uma janela do WhatsApp Web pela barra, pelos moradores e pelo compartilhamento dos horários
// @match        https://app2.doctorcondo.com.br/*
// @match        https://web.whatsapp.com/*
// @updateURL    https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/DoctorCondo-WhatsApp-Janela.user.js
// @downloadURL  https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/DoctorCondo-WhatsApp-Janela.user.js
// @grant        GM_getTab
// @grant        GM_saveTab
// @grant        GM_getTabs
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @grant        window.focus
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
    'use strict';


    if (window.self !== window.top ||
        new URLSearchParams(window.location.search).has('dc_plate_panel')) return;
    // A página provisória usada para abrir o pop-up não deve interceptar a
    // própria navegação para o WhatsApp, mesmo se o gerenciador a reinjetar.
    if (!['https:', 'http:'].includes(window.location.protocol)) return;

    const ID = 'dc-whatsapp-janela';
    // Versão do código carregado nesta página; manter igual ao @version.
    const VERSAO_SCRIPT = '0.4.6';
    const DESTINO = 'https://web.whatsapp.com/';
    const CHAVE_LAYOUT_CELULAR = 'cybertectools-whatsapp-modo-celular-v1';
    const REGISTRO = 'dcWhatsappJanela';
    const FOCO = ID + '-foco';
    const RESPOSTA = ID + '-resposta';
    const PRONTA = ID + '-pronta';
    const ABERTURA = ID + '-abertura';
    const STATUS_CELULAR = ID + '-celular-versao';
    const PRAZO_ABERTURA = 120000;
    const PROTOCOLO = 2;
    const ehWhatsApp = window.location.hostname === 'web.whatsapp.com';
    const temPermissoes = typeof GM_getTabs === 'function' &&
        typeof GM_getTab === 'function' && typeof GM_saveTab === 'function' &&
        typeof GM_getValue === 'function' &&
        typeof GM_setValue === 'function' && typeof GM_deleteValue === 'function' &&
        typeof GM_addValueChangeListener === 'function' &&
        typeof GM_removeValueChangeListener === 'function' && typeof GM_openInTab === 'function';
    let botao;
    let modal;
    let focoAnterior;
    let atualizacaoPendente = false;
    let acionando = false;
    let conversaPendente = null;

    function publicarVersaoJanela() {
        if (!document.documentElement) {
            window.setTimeout(publicarVersaoJanela, 25);
            return;
        }
        document.documentElement.setAttribute('data-dc-waj-versao', VERSAO_SCRIPT);
    }
    publicarVersaoJanela();

    function validarConversa(conversa) {
        return Boolean(conversa && typeof conversa.numero === 'string' &&
            typeof conversa.mensagem === 'string' &&
            (/^[1-9]\d{7,14}$/.test(conversa.numero) ||
                (conversa.numero === '' && conversa.mensagem.trim().length > 0)));
    }

    function urlConversa(conversa) {
        if (!conversa) return DESTINO;
        if (!validarConversa(conversa)) throw new Error('Conversa inválida');
        const url = new URL('send', DESTINO);
        // Compartilhamentos sem telefone deixam a escolha do contato no WhatsApp.
        if (conversa.numero) url.searchParams.set('phone', conversa.numero);
        if (conversa.mensagem) url.searchParams.set('text', conversa.mensagem);
        return url.href;
    }

    function calcularGeometriaJanela() {
        const tela = window.screen;
        const areaLargura = tela.availWidth || 1920;
        const areaAltura = tela.availHeight || 820;
        let modoPc = false;
        try { modoPc = localStorage.getItem(CHAVE_LAYOUT_CELULAR) === 'pc'; }
        catch (_) { /* Preferência opcional. */ }
        const largura = modoPc ? Math.round(areaLargura * 0.40) : Math.min(areaLargura,
            Math.max(480, Math.min(640, Math.round(areaLargura * 0.32))));
        return {
            largura,
            altura: areaAltura,
            esquerda: Math.round((tela.availLeft || 0) + areaLargura - largura),
            topo: Math.round(tela.availTop || 0)
        };
    }

    function ajustarJanelaAtual() {
        if (!ehWhatsApp) return;
        const geometria = calcularGeometriaJanela();
        try {
            window.moveTo(geometria.esquerda, geometria.topo);
            window.resizeTo(geometria.largura, geometria.altura);
        } catch (_) { /* O navegador pode recusar em uma aba comum. */ }
    }

    function interpretarLinkWhatsApp(link) {
        try {
            // Usa o href atual, inclusive quando o conversor antigo já o ajustou.
            const url = new URL(link.href);
            if (!['https:', 'http:'].includes(url.protocol)) return null;
            let telefone;
            if (url.hostname === 'wa.me') telefone = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, '');
            else if (['api.whatsapp.com', 'www.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname) &&
                /^\/send\/?$/.test(url.pathname)) telefone = url.searchParams.get('phone');
            else return null;
            if (telefone === '' || telefone === null) {
                const compartilhamento = { numero: '', mensagem: url.searchParams.get('text') || '' };
                return validarConversa(compartilhamento) ? compartilhamento : null;
            }
            if (!telefone || !/^\+?[\d\s().-]+$/.test(telefone)) return null;
            let numero = telefone.replace(/\D/g, '');
            if (numero.startsWith('00')) numero = numero.slice(2);
            // Links do WhatsApp já usam número internacional: não adivinhar o DDI.
            const conversa = { numero, mensagem: url.searchParams.get('text') || '' };
            return validarConversa(conversa) ? conversa : null;
        } catch (_) { return null; }
    }

    function tratarLinkWhatsApp(evento) {
        if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
        const alvo = evento.target instanceof Element ? evento.target : evento.target?.parentElement;
        const link = alvo?.closest('a[href]');
        if (!link) return;
        const conversa = interpretarLinkWhatsApp(link);
        if (!conversa) return;
        // A barra de horários e outros módulos podem criar links temporários ou
        // usar classes diferentes. Todo destino WhatsApp válido usa a janela gerenciada.
        evento.preventDefault();
        evento.stopImmediatePropagation();
        abrirJanela('janela', conversa);
    }

    function consultarApi(executar) {
        return new Promise((resolve, reject) => {
            const tempo = window.setTimeout(() => reject(new Error('Tampermonkey sem resposta')), 4000);
            executar((resultado) => {
                window.clearTimeout(tempo);
                resolve(resultado);
            });
        });
    }

    // O cadastro pertence à aba e desaparece quando ela é fechada.
    // A extensão mantém esse vínculo mesmo após COOP romper window.opener.
    const cadastro = temPermissoes ? consultarApi((cb) => GM_getTab(cb)).then(async (aba) => {
        const anterior = aba[REGISTRO];
        aba[REGISTRO] = {
            id: anterior?.id || crypto.randomUUID(),
            tipo: ehWhatsApp ? 'whatsapp' : 'doctorcondo',
            protocolo: PROTOCOLO,
            abrindoAte: anterior?.abrindoAte || 0
        };
        if (ehWhatsApp) {
            GM_addValueChangeListener(FOCO, (_chave, _antes, pedido, remoto) => {
                if (!remoto || !pedido || pedido.alvo !== aba[REGISTRO].id ||
                    Math.abs(Date.now() - pedido.quando) > 15000) return;
                GM_deleteValue(FOCO);
                if (pedido.acao === 'conversa' && !validarConversa(pedido.conversa)) {
                    GM_setValue(RESPOSTA, { pedido: pedido.id, sucesso: false });
                    return;
                }
                let sucesso = true;
                let destino;
                try {
                    if (pedido.acao === 'conversa') destino = urlConversa(pedido.conversa);
                    window.focus();
                    window.setTimeout(ajustarJanelaAtual, 0);
                } catch (_) { sucesso = false; }
                GM_setValue(RESPOSTA, { pedido: pedido.id, sucesso });
                // A resposta confirma o recebimento, não login/conversa carregada.
                // Navega na própria aba; nunca clica em Enviar nem acessa APIs internas.
                if (sucesso && destino) window.setTimeout(() => window.location.assign(destino), 0);
            });
        }
        await consultarApi((cb) => GM_saveTab(aba, cb));
        if (ehWhatsApp) {
            await Promise.resolve(GM_deleteValue(ABERTURA));
            GM_setValue(PRONTA, { id: aba[REGISTRO].id, quando: Date.now() });
            window.setTimeout(ajustarJanelaAtual, 0);
        }
        return aba;
    }) : Promise.resolve(null);
    // Evita rejeição sem tratamento enquanto o usuário ainda não clicou.
    cadastro.catch(() => {});

    // O modo celular não possui permissões do Tampermonkey. Ele publica sua
    // versão no DOM, e este complemento mantém um sinal recente para a barra.
    function registrarVersaoCelular() {
        if (!ehWhatsApp || !temPermissoes || !document.documentElement) return;
        const versao = document.documentElement.getAttribute('data-wac-versao');
        if (!/^\d{1,6}(?:\.\d{1,6}){1,4}$/.test(versao || '')) return;
        GM_setValue(STATUS_CELULAR, { versao, quando: Date.now() });
    }
    function iniciarRegistroVersaoCelular() {
        if (!ehWhatsApp) return;
        if (!document.documentElement) {
            window.setTimeout(iniciarRegistroVersaoCelular, 25);
            return;
        }
        new MutationObserver(registrarVersaoCelular).observe(document.documentElement, {
            attributes: true, attributeFilter: ['data-wac-versao']
        });
        registrarVersaoCelular();
        // Cobre a ordem em que os dois userscripts são iniciados pelo gerenciador.
        cadastro.then(() => {
            registrarVersaoCelular();
            window.setTimeout(registrarVersaoCelular, 100);
            window.setTimeout(registrarVersaoCelular, 500);
        }).catch(() => {});
        window.setInterval(registrarVersaoCelular, 30000);
    }
    iniciarRegistroVersaoCelular();

    // Entrega à barra as versões realmente carregadas nas abas ainda abertas.
    function iniciarPonteVersoesCarregadas() {
        if (ehWhatsApp) return;
        if (!document.documentElement) {
            window.setTimeout(iniciarPonteVersoesCarregadas, 25);
            return;
        }
        if (document.documentElement.hasAttribute('data-dc-component-versions-bridge')) return;
        document.addEventListener('dc-component-versions-request', async (evento) => {
            let pedido;
            try { pedido = JSON.parse(evento.detail); } catch (_) { return; }
            if (!pedido || typeof pedido.id !== 'string' ||
                !/^[a-zA-Z0-9-]{1,80}$/.test(pedido.id)) return;
            let celular = null;
            try {
                if (temPermissoes) {
                    const status = await Promise.resolve(GM_getValue(STATUS_CELULAR, null));
                    if (status && /^\d{1,6}(?:\.\d{1,6}){1,4}$/.test(status.versao || '') &&
                        typeof status.quando === 'number' && Date.now() - status.quando < 90000) {
                        celular = status.versao;
                    }
                }
            } catch (_) { /* A barra ainda recebe a versão deste complemento. */ }
            document.dispatchEvent(new CustomEvent('dc-component-versions-response', {
                detail: JSON.stringify({ id: pedido.id, janela: VERSAO_SCRIPT, celular })
            }));
        });
        document.documentElement.setAttribute('data-dc-component-versions-bridge', '1');
    }
    iniciarPonteVersoesCarregadas();

    // Consulta pública dos três arquivos pela extensão; preserva @grant none da
    // barra (incluindo o observador XHR do site) e do modo celular. Sem URL livre.
    function iniciarPonteAtualizacoes() {
        if (!document.documentElement) { window.setTimeout(iniciarPonteAtualizacoes, 50); return; }
        if (typeof GM_xmlhttpRequest !== 'function' ||
            document.documentElement.hasAttribute('data-dc-updates-bridge')) return;
        const permitidos = new Set(['DoctorCondo-Operador.user.js',
            'DoctorCondo-WhatsApp-Janela.user.js', 'WhatsApp-Modo-Celular.user.js']);
        const emAndamento = new Set();
        document.addEventListener('dc-updates-request', (evento) => {
            let pedido;
            try { pedido = JSON.parse(evento.detail); } catch (_) { return; }
            if (!pedido || !permitidos.has(pedido.arquivo) ||
                typeof pedido.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(pedido.id)) return;
            const responder = (texto) => document.dispatchEvent(new CustomEvent('dc-updates-response', {
                detail: JSON.stringify({ id: pedido.id, ...(typeof texto === 'string' ? { texto } : {}) })
            }));
            if (emAndamento.has(pedido.arquivo)) { responder(); return; }
            emAndamento.add(pedido.arquivo);
            let finalizado = false;
            let requisicao;
            const concluir = (texto) => {
                if (finalizado) return;
                finalizado = true;
                window.clearTimeout(tempo);
                emAndamento.delete(pedido.arquivo);
                responder(texto);
            };
            // anonymous pode usar fetch na extensão; cronômetro próprio também
            // cobre implementações em que details.timeout não é aplicado.
            const tempo = window.setTimeout(() => {
                concluir();
                try { requisicao?.abort(); } catch (_) { /* Pedido já encerrado. */ }
            }, 15000);
            try {
                requisicao = GM_xmlhttpRequest({
                    method: 'GET', anonymous: true, nocache: true, timeout: 15000,
                    url: 'https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/' +
                        pedido.arquivo + '?dc_update=' + Date.now(),
                    onload: (resposta) => concluir(resposta.status === 200 &&
                        typeof resposta.responseText === 'string' && resposta.responseText.length <= 1000000
                        ? resposta.responseText : undefined),
                    onerror: () => concluir(), ontimeout: () => concluir(), onabort: () => concluir()
                });
            } catch (_) { concluir(); }
        });
        document.documentElement.setAttribute('data-dc-updates-bridge', '1');
    }
    iniciarPonteAtualizacoes();

    if (ehWhatsApp) return;

    async function marcarAbertura(ate) {
        const aba = await cadastro;
        aba[REGISTRO].abrindoAte = ate;
        await consultarApi((cb) => GM_saveTab(aba, cb));
        if (ate > 0) {
            await Promise.resolve(GM_setValue(ABERTURA, {
                id: aba[REGISTRO].id, quando: Date.now(), ate
            }));
        } else await Promise.resolve(GM_deleteValue(ABERTURA));
    }

    async function consultarAberturaCompartilhada() {
        const abertura = await Promise.resolve(GM_getValue(ABERTURA, null));
        if (!abertura || typeof abertura !== 'object' ||
            typeof abertura.ate !== 'number' || abertura.ate <= 0) return null;
        return abertura;
    }

    if (temPermissoes) GM_addValueChangeListener(PRONTA, () => {
        marcarAbertura(0).catch(() => {});
    });

    function focarExistente(alvo, conversa) {
        return new Promise((resolve) => {
            const pedido = { id: crypto.randomUUID(), alvo, quando: Date.now(),
                acao: conversa ? 'conversa' : 'foco', ...(conversa ? { conversa } : {}) };
            const tempo = window.setTimeout(() => terminar(false), 3000);
            const listener = GM_addValueChangeListener(RESPOSTA, (_chave, _antes, resposta) => {
                if (resposta?.pedido === pedido.id) terminar(resposta.sucesso);
            });
            function terminar(sucesso) {
                window.clearTimeout(tempo);
                GM_removeValueChangeListener(listener);
                // O telefone/texto só transitam na extensão durante o pedido.
                GM_deleteValue(FOCO);
                resolve(sucesso);
            }
            GM_setValue(FOCO, pedido);
        });
    }

    async function abrirJanela(modo = 'janela', conversa = null) {
        if (acionando) return;
        conversaPendente = conversa;
        if (!temPermissoes) {
            mostrarOpcoes('Atualize o script inteiro no Tampermonkey, incluindo o cabeçalho de permissões, e recarregue as páginas.');
            return;
        }
        acionando = true;
        try {
            const executar = async () => {
                await cadastro;
                const abas = await consultarApi((cb) => GM_getTabs(cb));
                const registros = Object.values(abas).map((aba) => aba[REGISTRO]).filter(Boolean);
                const existente = registros.find((aba) => aba.tipo === 'whatsapp');
                if (existente) {
                    if (conversa && existente.protocolo !== PROTOCOLO) {
                        mostrarOpcoes('Atualize o complemento e recarregue a janela do WhatsApp para usar esse atalho. Depois tente novamente.');
                        return;
                    }
                    await marcarAbertura(0);
                    if (await focarExistente(existente.id, conversa)) fecharOpcoes();
                    else mostrarOpcoes('O WhatsApp já está aberto, mas não respondeu. Vá até ele com Alt + Tab e recarregue essa página. Nenhuma nova janela foi aberta.');
                    return;
                }
                const aberturaCompartilhada = await consultarAberturaCompartilhada();
                if (aberturaCompartilhada) {
                    mostrarOpcoes('Aguarde a janela do WhatsApp terminar de abrir. A trava compartilhada impediu outra guia. Se você fechou essa janela, use a liberação manual.',
                        aberturaCompartilhada.ate < Date.now());
                    return;
                }
                const pendente = registros.find((aba) => aba.abrindoAte > 0);
                if (pendente) {
                    mostrarOpcoes('Aguarde o WhatsApp terminar de abrir. Se ele já carregou, recarregue a página do WhatsApp para ativar o complemento. Uma demora não abre outra janela automaticamente.', pendente.abrindoAte < Date.now());
                    return;
                }
                await marcarAbertura(Date.now() + PRAZO_ABERTURA);
                if (!abrirNovaJanela(modo, conversa)) await marcarAbertura(0);
            };
            // Serializa também cliques vindos de duas abas do DoctorCondo.
            if (navigator.locks) await navigator.locks.request(ID + '-abrir', executar);
            else await executar();
        } catch (_) {
            mostrarOpcoes('Não foi possível consultar as janelas pelo Tampermonkey. Recarregue o DoctorCondo e tente novamente.');
        } finally {
            acionando = false;
        }
    }

    function abrirNovaJanela(modo, conversa) {
        const geometria = calcularGeometriaJanela();
        let janela;

        try {
            const destino = urlConversa(conversa);
            if (modo === 'aba') {
                GM_openInTab(destino, { active: true, insert: true, setParent: true });
                fecharOpcoes();
                return true;
            }
            // A consulta à extensão ocorre dentro da ativação iniciada pelo clique.
            // Isolar a janela ANTES de carregar o serviço externo.
            janela = window.open('about:blank', '_blank',
                `popup=yes,width=${geometria.largura},height=${geometria.altura},` +
                `left=${geometria.esquerda},top=${geometria.topo},resizable=yes,scrollbars=yes`);
            if (!janela) {
                mostrarOpcoes(true);
                return false;
            }
            janela.opener = null;
            const meta = janela.document.createElement('meta');
            meta.name = 'referrer';
            meta.content = 'no-referrer';
            janela.document.head.appendChild(meta);
            const link = janela.document.createElement('a');
            link.href = destino;
            link.rel = 'noreferrer';
            link.referrerPolicy = 'no-referrer';
            janela.document.body.appendChild(link);
            link.click();
            fecharOpcoes();
            return true;
        } catch (erro) {
            // Não ler conteúdo ou sessão do WhatsApp após a navegação.
            try { if (janela) janela.close(); } catch (_) { /* Janela isolada. */ }
            mostrarOpcoes(true);
            return false;
        }
    }

    function fecharOpcoes() {
        if (modal && modal.open) modal.close();
    }

    function mostrarOpcoes(bloqueada = false, recuperar = false) {
        if (!modal) {
            modal = document.createElement('dialog');
            modal.id = ID + '-modal';
            modal.setAttribute('aria-labelledby', ID + '-titulo');
            modal.setAttribute('aria-describedby', ID + '-aviso');
            modal.innerHTML = `
                <h2 id="${ID}-titulo">WhatsApp Web</h2>
                <p id="${ID}-aviso" role="status"></p>
                <p>As conversas abrem em uma janela própria do navegador.
                O WhatsApp não permite carregar sua tela dentro do DoctorCondo.</p>
                <div class="dc-waj-acoes">
                    <button type="button" data-dc-waj="janela">Abrir / mostrar janela</button>
                    <button type="button" data-dc-waj="aba">Abrir em aba</button>
                    <button type="button" data-dc-waj="fechar">Fechar</button>
                    <button type="button" data-dc-waj="liberar" hidden>Já fechei: liberar abertura</button>
                </div>
                <p class="dc-waj-versao" title="Versão do complemento carregada nesta página">Janela v${VERSAO_SCRIPT}</p>`;
            modal.querySelector('[data-dc-waj="janela"]')
                .addEventListener('click', () => abrirJanela('janela', conversaPendente));
            modal.querySelector('[data-dc-waj="fechar"]')
                .addEventListener('click', fecharOpcoes);
            modal.querySelector('[data-dc-waj="aba"]')
                .addEventListener('click', () => abrirJanela('aba', conversaPendente));
            modal.querySelector('[data-dc-waj="liberar"]').addEventListener('click', async () => {
                try {
                    await marcarAbertura(0);
                    GM_setValue(PRONTA, { id: crypto.randomUUID(), quando: Date.now() });
                    mostrarOpcoes('Abertura liberada. Clique em Abrir / mostrar janela para tentar novamente.');
                } catch (_) { mostrarOpcoes('Recarregue o DoctorCondo para tentar novamente.'); }
            });
            modal.addEventListener('close', () => {
                conversaPendente = null;
                if (focoAnterior && focoAnterior.isConnected) focoAnterior.focus();
            });
        }
        if (!modal.isConnected) document.body.appendChild(modal);
        modal.querySelector('[data-dc-waj="liberar"]').hidden = !recuperar;
        modal.querySelector('#' + ID + '-aviso').textContent = typeof bloqueada === 'string'
            ? bloqueada : bloqueada
                ? 'A janela não pôde ser aberta. Você pode permitir pop-ups para este site e tentar novamente, ou abrir em uma aba.'
                : 'Se o WhatsApp já estiver aberto, o botão traz essa janela para frente.';
        if (!modal.open) {
            focoAnterior = document.activeElement;
            modal.showModal();
        }
    }

    function posicionarBotao() {
        if (!document.body) return;
        const barra = document.querySelector('#dc-operator-shortcuts');
        const destino = barra || document.body;
        if (botao.parentElement !== destino) destino.appendChild(botao);
        botao.classList.toggle('dc-waj-flutuante', !barra);
    }

    function iniciar() {
        if (!document.head || !document.body) {
            window.setTimeout(iniciar, 50);
            return;
        }
        // Evita duplicação se o mesmo complemento for injetado duas vezes.
        if (document.getElementById(ID + '-estilo')) return;
        // Delegação cobre modais criados depois e o clique no ícone dentro do link.
        // Captura antes dos handlers do site para impedir a abertura original em _blank.
        window.addEventListener('click', tratarLinkWhatsApp, true);

        const estilo = document.createElement('style');
        estilo.id = ID + '-estilo';
        estilo.textContent = `
            #${ID} {
                display: inline-flex; align-items: center; gap: 5px;
                flex-shrink: 0; height: 32px; padding: 4px 8px;
                border: 1px solid #187348; border-radius: 4px;
                color: #fff; background: #187348; cursor: pointer;
                font: 600 13px Arial, sans-serif;
            }
            #${ID}:hover { background: #105832; }
            #${ID}:focus-visible { outline: 3px solid #63bd8a; outline-offset: 2px; }
            #${ID} svg { width: 17px; height: 17px; flex-shrink: 0; }
            #${ID} .dc-waj-versao-botao {
                font: 10px/1.2 Arial, sans-serif; color: #d8f3e4; white-space: nowrap;
            }
            @media (max-width: 1299px) {
                #dc-operator-shortcuts #${ID} {
                    box-sizing: border-box; width: 32px; min-width: 32px;
                    padding-right: 4px; padding-left: 4px; gap: 0;
                    justify-content: center;
                }
                #dc-operator-shortcuts #${ID} .dc-operator-shortcut-label,
                #dc-operator-shortcuts #${ID} .dc-waj-versao-botao { display: none; }
            }
            #${ID}.dc-waj-flutuante {
                position: fixed; right: 20px; bottom: 20px; z-index: 1210;
                height: 40px; box-shadow: 0 2px 10px #0003;
            }
            #${ID}-modal {
                box-sizing: border-box; width: min(480px, calc(100vw - 32px));
                max-height: calc(100vh - 32px); overflow: auto;
                padding: 24px; border: 1px solid #d7e2e6; border-radius: 12px;
                color: #263c32; background: #fff;
                font: 15px/1.5 Arial, sans-serif; box-shadow: 0 12px 48px #0004;
            }
            #${ID}-modal::backdrop { background: #10271d88; }
            #${ID}-modal h2 { font-size: 21px; margin: 0 0 12px; }
            #${ID}-modal p { margin: 0 0 16px; }
            #${ID}-modal .dc-waj-versao {
                margin: 14px 0 0; text-align: right; color: #52685d; font-size: 11px;
                display: flex; align-items: center; justify-content: flex-end; gap: 4px;
            }
            #${ID}-modal .dc-waj-acoes { display: flex; flex-wrap: wrap; gap: 8px; }
            #${ID}-modal button, #${ID}-modal a {
                display: inline-flex; align-items: center;
                padding: 8px 12px; border-radius: 6px; border: 1px solid #b9cdc2;
                background: #f4f8f6; color: #174f33; text-decoration: none;
                font: inherit; cursor: pointer;
            }
            #${ID}-modal [data-dc-waj="janela"] {
                background: #187348; color: #fff; border-color: #187348;
            }
            #${ID}-modal [hidden] { display: none; }
            #${ID}-modal :focus-visible { outline: 3px solid #63bd8a; outline-offset: 2px; }
        `;
        document.head.appendChild(estilo);

        botao = document.createElement('button');
        botao.id = ID;
        botao.type = 'button';
        botao.className = 'dc-operator-shortcut';
        botao.title = `Abrir ou mostrar WhatsApp Web. Shift + clique para opções. Janela v${VERSAO_SCRIPT} carregada nesta página.`;
        botao.setAttribute('aria-label', botao.title);
        botao.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="1.8" aria-hidden="true" focusable="false">
                <path d="M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.7-4.5A9 9 0 1 1 21 11.5Z"/>
                <path d="M8 7c-2 4 5 11 9 7l-3-2-1 1c-1.5-.5-2.5-1.5-3-3l1-1Z"/>
            </svg>
            <span class="dc-operator-shortcut-label">WhatsApp</span>
            <small class="dc-waj-versao-botao" aria-hidden="true">v${VERSAO_SCRIPT}</small>`;
        botao.addEventListener('click', (evento) => {
            if (evento.shiftKey) mostrarOpcoes();
            else abrirJanela();
        });
        posicionarBotao();

        // A barra pode aparecer depois ou ser recriada pela navegação do site.
        const observador = new MutationObserver(() => {
            if (atualizacaoPendente) return;
            atualizacaoPendente = true;
            window.requestAnimationFrame(() => {
                atualizacaoPendente = false;
                posicionarBotao();
            });
        });
        observador.observe(document.body, { childList: true, subtree: true });
    }

    iniciar();
})();
