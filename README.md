# DoctorCondo Operador — Userscript

Distribuição pública mínima do userscript `DoctorCondo - personal`, mantido por CYBERTECTOOLS.

## Instalação

Com o Tampermonkey instalado, abra:

https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/DoctorCondo-Operador.user.js

O Tampermonkey verificará novas versões pelo mesmo endereço. Cada publicação válida deve aumentar o campo `@version` do userscript.

## Versão 4.5.25

- A barra mostra a versão carregada na aba, no canto direito, sem encobrir os atalhos.
- Em janelas estreitas, somente os atalhos rolam horizontalmente; o indicador permanece visível.
- A extensão Tampermonkey gerencia as atualizações pelo URL configurado, conforme suas preferências de atualização. Publicar no GitHub não substitui o código que já está executando numa aba aberta.
- Após instalar uma atualização, salve o trabalho pendente e recarregue o DoctorCondo para carregar a nova versão. O script não força recarregamentos.

## Versão 4.5.24

- TORRES usa as entradas disponíveis no menu global do DoctorCondo sem trocar de página, preservando a câmera e a tela atual.
- O painel permanece aberto, mantém o feedback visual e encontra novamente os botões caso o site os recrie depois de um comando.
- Respeita controles desativados, bloqueia cliques simultâneos durante o acionamento e interrompe a ação se o contexto do condomínio mudar.
- Se o menu estiver indisponível, mostra um erro sem navegar para outra página.

Quem instalou `DoctorCondo - Torres sem navegar (TESTE COMPLETO)` deve desativar essa cópia de teste e manter somente o principal `DoctorCondo - personal` ativo após atualizar. Salve qualquer formulário pendente antes de recarregar o DoctorCondo.

Abrir TORRES não aciona portas. Clicar em uma torre pode enviar um comando real imediatamente. O feedback `Comando enviado` indica encaminhamento ao botão nativo, não confirmação da abertura física.

## Conteúdo do repositório

- `DoctorCondo-Operador.user.js`: arquivo público de instalação e atualização.

Este repositório de distribuição não inclui arquivos locais de desenvolvimento, capturas de tela, relatórios operacionais, credenciais ou dados de moradores e operadores.
