# DoctorCondo — barra e complementos WhatsApp

Distribuição dos scripts mantidos por CYBERTECTOOLS. Cada arquivo tem instalação, versão e atualização independentes.

## Instalação

Com o Tampermonkey instalado, use o link de cada script:

| Script | Versão | Instalação e atualização |
| --- | --- | --- |
| DoctorCondo - personal | 4.5.25 | [Barra do operador](https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/DoctorCondo-Operador.user.js) |
| DoctorCondo - WhatsApp em janela | 0.4.1 | [Janela do WhatsApp](https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/DoctorCondo-WhatsApp-Janela.user.js) |
| WhatsApp Web - Modo celular | 0.1.2 | [Modo celular](https://raw.githubusercontent.com/cybertectoolsbr/userscript/main/WhatsApp-Modo-Celular.user.js) |

Para usar o conjunto completo, mantenha os três scripts ativos, com somente uma cópia de cada. O complemento de janela precisa executar no DoctorCondo e no WhatsApp, no mesmo perfil do navegador. O modo celular executa somente no WhatsApp. O antigo `DoctorCondo - WhatsApp Web (TESTE)` pode ser desativado; sua função está incluída no complemento de janela.

Se já instalou um complemento por copiar/colar, abra o respectivo link e confirme que o Tampermonkey apresenta uma atualização da mesma entrada. Também é possível substituir o conteúdo inteiro da entrada existente, incluindo o cabeçalho. Os nomes e namespaces originais foram mantidos. As versões antigas dos complementos, sem os endereços de atualização, precisam desta atualização inicial manual; depois, a extensão poderá buscar novas versões pelos links configurados.

O Tampermonkey verifica novas versões pelo endereço próprio de cada script, conforme as configurações da extensão. Cada publicação deve aumentar o campo `@version` do arquivo alterado. Atualizar a barra não instala automaticamente os complementos.

## Onde conferir a versão carregada

- **Barra 4.5.25:** indicador no canto direito da barra do DoctorCondo.
- **Janela 0.4.1:** texto pequeno junto ao botão WhatsApp; o modal de **Shift + clique** também mostra a versão no canto inferior direito.
- **Celular 0.1.2:** canto inferior direito do rodapé do WhatsApp, abaixo dos controles, também disponível no modo PC.

O número mostra o código que está executando na página; não consulta a última versão no GitHub. Depois de instalar uma atualização, preserve formulários/rascunhos e recarregue as páginas correspondentes. Para o complemento de janela, recarregue DoctorCondo e WhatsApp. Não há recarga forçada.

## Complementos WhatsApp

A janela integra o botão da barra, o atalho do morador e os textos de Horários. O modo celular organiza lista e conversa em uma coluna de até 480 pixels e mantém os controles Conversas, Conversa, Modo PC e ajuste de largura. A escolha do destinatário para compartilhar horários e o envio de mensagens continuam manuais.

As versões 0.4.1 e 0.1.2 acrescentam identificação visual e endereços de atualização. Não representam uma correção confirmada para o relato de duas janelas. O reaproveitamento passou em simulações locais; instalação, foco e comportamento na sessão real do WhatsApp ainda precisam de verificação.

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
- `DoctorCondo-WhatsApp-Janela.user.js`: integração e reutilização da janela do WhatsApp.
- `WhatsApp-Modo-Celular.user.js`: apresentação compacta e controles inferiores do WhatsApp.

Este repositório de distribuição não inclui arquivos locais de desenvolvimento, capturas de tela, relatórios operacionais, credenciais ou dados de moradores e operadores.
