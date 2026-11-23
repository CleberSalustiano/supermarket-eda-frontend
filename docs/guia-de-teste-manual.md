# Guia de teste manual

Este guia mostra, passo a passo, como rodar o sistema na sua máquina e testar as três telas web: **Caixa**, **Gestão** e **Estoque**. Você não precisa conhecer o código.

Os textos citados entre aspas são exatamente os que aparecem na tela. Se algo estiver diferente, anote a tela e o passo e avise a equipe.

Todos os comandos abaixo são executados no Terminal, a partir da pasta do projeto.

---

## 1. Subir o sistema

1. Abra o Terminal e entre na pasta do backend:

   ```bash
   cd backend-services
   ```

2. Suba tudo com um único comando:

   ```bash
   npm run local:up
   ```

3. Aguarde. Na primeira vez o processo instala a infraestrutura e compila os serviços, o que pode levar vários minutos. Ao final, o Terminal mostra a mensagem de conclusão e o caminho do arquivo de dados de teste.

4. Confira os endereços das telas. Deixe-os abertos em abas separadas:

   | Tela | Endereço | Para que serve |
   |---|---|---|
   | Caixa | http://localhost:4101 | Vender no balcão |
   | Gestão | http://localhost:4100 | Produtos, funcionários e resultado |
   | Estoque | http://localhost:4102 | Ainda é uma tela inicial |

**Pré-requisitos:** Docker (ou Colima) instalado e Node.js 20.19 ou superior. Se o comando falhar logo no início, veja a seção "Problemas comuns" no fim deste guia.

---

## 2. Dados de teste

Os dados de teste são criados pelo `npm run local:up`. Os identificadores de funcionários mudam sempre que o ambiente é recriado com `npm run local:up -- --reset`. Por isso, **pegue os IDs e os PINs no arquivo gerado**, e não neste guia:

- `backend-services/.local-run/test-data.md`

Esse arquivo traz:

- os **IDs dos funcionários** (`employeeId`), que você usa para o ID do operador;
- os **PINs** dos funcionários;
- o ID da loja (tenant), o caixa e o fundo de troco sugeridos.

Resumo do que o ambiente já tem:

- **Loja (tenant):** `8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1`
- **Caixa:** `register-01`, com fundo de troco de `150,00`
- **Funcionários:** `CASHIER-01` (Ana Souza), `MANAGER-01` (Bruno Lima) e `ADMIN-01` (Carla Mendes)
- **Aprovação do gerente (cancelar venda paga ou concluída):** é preciso o código de um funcionário (`MANAGER-01` ou `ADMIN-01`) **e** o PIN dele. A conferência é feita pelo serviço de gestão. `CASHIER-01` não pode aprovar.
- **Bloqueios por tentativas erradas:** 5 erros em 15 minutos bloqueiam o código do funcionário por 15 minutos. 10 erros em 15 minutos, de códigos diferentes, bloqueiam as aprovações do caixa por 15 minutos.
- Os PINs estão no arquivo `backend-services/.local-run/test-data.md`. Eles não são escritos neste guia.

**Produtos já cadastrados e com preço no caixa:**

| Código de barras | Produto | Unidade | Preço |
|---|---|---|---|
| 7891234567890 | Arabica coffee beans 1kg | UN | R$ 22,90 |
| 7891000100013 | Whole milk 1L | UN | R$ 4,99 |
| 7891000100020 | White rice 5kg | UN | R$ 27,50 |
| 7891000100037 | Banana prata | KG | R$ 6,49 |
| 7891000100044 | Extra virgin olive oil 500ml | UN | R$ 34,90 |
| 7891000100051 | Sliced bread 500g | UN | R$ 7,99 |

---

## 3. Caixa (http://localhost:4101)

### 3.1 Abrir o caixa

1. Abra http://localhost:4101.
2. **Você deve ver:** a tela "Abrir caixa", com os campos "Caixa" (já preenchido com `register-01`), "ID do operador" (já preenchido em ambiente de desenvolvimento) e "Fundo de troco" com `150,00`. Abaixo do campo do operador aparece a dica "Copie o ID na gestão, em Funcionários.".
3. Clique em "Abrir caixa" (ou pressione Enter).
4. **Você deve ver:** no topo, o indicador do caixa com "Caixa register-01", o indicador de estado "Aberto" e o texto "Operador" seguido de parte do ID. Na área principal aparece "Nenhuma venda em andamento." com o botão "Nova venda" (tecla F2).

Para usar o ID de um funcionário em vez do pré-preenchido, siga o passo 4.4 (Copiar ID) e cole o ID no campo "ID do operador".

### 3.2 Venda completa só com o teclado

Esta venda cobre as teclas do caixa: F2, leitura de código de barras, venda com várias unidades, pagamento em dinheiro com troco e conclusão com F9.

> **Atenção no Mac:** as teclas F2, F4, F8 e F9 podem controlar brilho ou volume. Pressione **fn + F2** (e assim por diante), ou ative em Ajustes do Sistema, em Teclado, a opção "Usar as teclas F1, F2 etc. como teclas de função".

1. Pressione **F2**.
   - **Você deve ver:** o campo "Código de barras" fica habilitado e com o cursor dentro dele. A dica abaixo diz "Para várias unidades: 3*7891234567890". Na área principal aparece "Registre o primeiro item pelo código de barras."
2. Digite `7891234567890` e pressione Enter.
   - **Você deve ver:** a linha "Arabica coffee beans 1kg", com "1 × R$ 22,90" e o total "R$ 22,90". O cursor continua no campo de código. A linha recém-adicionada fica destacada por um instante e depois clareia.
3. Digite `2*7891000100013` e pressione Enter. Esse é o formato **quantidade*código**, usado para várias unidades do mesmo produto.
   - **Você deve ver:** a linha "Whole milk 1L", com "2 × R$ 4,99" e o total "R$ 9,98". No total da venda aparece "3 itens" e o valor "R$ 32,88".
4. Pressione **F8**.
   - **Você deve ver:** a seção "Pagamento", com "Forma de pagamento" já em "Dinheiro" e o campo "Valor recebido". Como o campo está vazio, o cursor vai para ele.
5. Digite `50,00` no campo "Valor recebido" e pressione **F8** de novo.
   - **Você deve ver:** a tela "Pagamento recebido" com o troco "R$ 17,12" e o botão "Concluir venda" (tecla F9).
6. Pressione **F9**.
   - **Você deve ver:** "Venda concluída às" seguido do horário, com "Total" de "R$ 32,88", "Pago" de "R$ 50,00", "Troco" de "R$ 17,12", "Forma de pagamento" como "Dinheiro" e o botão "Nova venda" (F2).
   - Se aparecer o aviso "Venda salva. A sincronização com a gestão está pendente e será refeita automaticamente.", aguarde alguns segundos. Ele some sozinho quando a sincronização termina.
7. Pressione **F2** para começar outra venda.

### 3.3 Outros caminhos do caixa

Faça cada caminho a partir de uma venda nova (F2).

**a) Cartão ou Pix.**
1. F2, digite `7891000100020` e pressione Enter (White rice 5kg, R$ 27,50).
2. Em "Forma de pagamento", escolha "Crédito" (ou "Débito", "Pix" ou "Vale").
   - **Você deve ver:** o campo "Valor recebido" preenchido e travado com o valor exato da venda, "R$ 27,50". Não há troco.
3. Pressione F8 e depois F9.
   - **Você deve ver:** o recibo com "Forma de pagamento" igual à que você escolheu e sem troco.

**b) Consultar preço (sem vender).**
1. Com a tela de venda aberta ou sem venda, digite `7891000100037` no campo "Código de barras".
2. Clique em "Consultar preço".
   - **Você deve ver:** o nome "Banana prata" e o preço em destaque "R$ 6,49". Nenhum item entra na venda.

**c) Remover uma unidade.**
1. Com "Whole milk 1L" de 2 unidades na venda, clique em "Remover 1" na linha do produto.
   - **Você deve ver:** a linha com "1 × R$ 4,99" e o total atualizado. O botão tem o nome acessível "Remover 1 unidade de Whole milk 1L".

**d) Cancelar uma venda em andamento.**
1. Com um item na venda, pressione **F4**.
   - **Você deve ver:** a caixa de diálogo "Cancelar venda", com a frase "Esta ação não pode ser desfeita.", o campo "Motivo do cancelamento" e os botões "Voltar" e "Confirmar cancelamento". Para venda aberta não há campo de gerente.
2. Digite um motivo com pelo menos 4 letras, por exemplo `teste de cancelamento`, e clique em "Confirmar cancelamento".
   - **Você deve ver:** "Venda cancelada. Motivo: teste de cancelamento." Pressione F2 para começar outra venda.
3. Para testar a tecla Esc: pressione F4 e depois **Esc**. A caixa de diálogo fecha e o cursor volta ao campo de código de barras.

**e) Cancelar uma venda paga, com o gerente.**
1. F2, digite `7891234567890`, pressione Enter, pressione F8, digite `50,00` e pressione F8 de novo. A venda está paga e aguarda F9.
2. Pressione **F4**.
   - **Você deve ver:** os campos "Código do gerente" e "PIN do gerente", com a dica "Vendas pagas ou concluídas precisam do código e do PIN de um gerente.".
3. Clique em "Confirmar cancelamento" sem preencher os campos.
   - **Você deve ver:** "Informe o código do gerente." e "O PIN tem de 4 a 12 dígitos.".
4. Preencha o motivo, digite `MANAGER-01` no código e `0000` no PIN (um PIN errado de propósito) e clique em "Confirmar cancelamento".
   - **Você deve ver:** "Código do gerente ou PIN inválido.". A caixa de diálogo continua aberta, o campo "PIN do gerente" fica vazio, e o código e o motivo continuam preenchidos. A venda continua paga.
5. Troque o código para `CASHIER-01`, digite o PIN real dele (veja `test-data.md`) e confirme.
   - **Você deve ver:** a mesma mensagem "Código do gerente ou PIN inválido.". Um caixa não pode aprovar o cancelamento.
6. Troque o código para `MANAGER-01`, digite o PIN real de Bruno Lima (veja `test-data.md`) e confirme.
   - **Você deve ver:** "Venda cancelada. Motivo: ..." e, abaixo, "Aprovado por Bruno Lima (MANAGER-01).".

> Cada tentativa errada conta para os bloqueios do §2 e do §4.6. Por isso, não repita os erros sem necessidade.

**f) Gestão indisponível (o serviço de gestão parado).**
1. Monte uma venda paga, como no passo 1 da letra e), mas não cancele ainda.
2. Pare só o serviço de gestão. No Terminal, na pasta `backend-services`, rode:

   ```bash
   npm run local:stop -- management-service
   ```

3. No caixa, pressione **F4**, digite o código e o PIN **certos** de um gerente (veja `test-data.md`) e clique em "Confirmar cancelamento".
   - **Você deve ver:** "Gestão indisponível, tente novamente. A venda não foi cancelada." A caixa de diálogo continua aberta, e a venda continua paga.
4. No Terminal, na pasta `backend-services`, suba o serviço de volta sem recriar o resto. Aguarde a mensagem de conclusão:

   ```bash
   npm run local:up -- --skip-build --no-seed
   ```

   Os serviços que já estão no ar são reaproveitados. Só a gestão volta.
5. No caixa, digite de novo o PIN do gerente e confirme.
   - **Você deve ver:** "Venda cancelada. Motivo: ..." e "Aprovado por Bruno Lima (MANAGER-01).".

**g) Fechar o caixa.**
1. **Com venda em andamento:** clique em "Fechar caixa" (no topo). A caixa de diálogo mostra a frase "Conclua ou cancele a venda em andamento antes de fechar o caixa." e o botão "Fechar caixa" fica desabilitado.
2. Cancele ou conclua a venda, depois clique em "Fechar caixa" de novo.
   - **Você deve ver:** o campo "Dinheiro contado na gaveta" com "150,00". Clique em "Fechar caixa" (dentro da caixa de diálogo).
   - **Você deve ver:** a tela "Abrir caixa" com a mensagem "Caixa register-01 fechado às ... Dinheiro declarado R$ 150,00.".
3. Para voltar a vender, abra o caixa de novo (passo 3.1).

**h) Produto não cadastrado.**
1. Com a venda aberta, digite `0000` e pressione Enter.
   - **Você deve ver:** "Produto não encontrado: 0000. Confira o código ou cadastre o produto na gestão.".
2. Digite um código com formato inválido, por exemplo `3*`, e pressione Enter.
   - **Você deve ver:** "Use o formato quantidade*código, por exemplo 3*7891234567890.".

**i) Sem conexão com o servidor.**
1. Com o caixa aberto na tela, em outro Terminal (na pasta `backend-services`) rode `npm run local:down`.
2. Aguarde até 15 segundos.
   - **Você deve ver:** um aviso no topo: "Sem conexão com o servidor do caixa. Tentando de novo a cada 15 segundos.", com o botão "Tentar agora".
3. Rode `npm run local:up` de novo e aguarde. Quando o servidor voltar, o aviso desaparece sozinho.

### 3.4 Teclas do caixa (resumo)

| Tecla | O que faz |
|---|---|
| F2 | Nova venda (só quando o caixa está aberto e não há venda em andamento) |
| Enter, no campo de código | Adiciona o produto |
| `3*código` | Adiciona 3 unidades do produto |
| F4 | Cancelar venda |
| F8 | Receber pagamento (o primeiro F8 leva ao campo de valor; o segundo recebe) |
| F9 | Concluir venda (depois do pagamento) |
| Esc | Fecha a caixa de diálogo e volta ao campo de código |

---

## 4. Gestão (http://localhost:4100)

### 4.1 Cadastrar um produto de teste

1. Abra http://localhost:4100. Você é levado para `/produtos`.
   - **Você deve ver:** no menu lateral, "Produtos", "Funcionários" e "Resultado". Na tela, os formulários "Cadastrar produto" e "Alterar preço" e a seção "Recentes neste navegador", com a frase "Os produtos que você cadastrar ou alterar aparecem aqui.".
2. Em "Cadastrar produto", preencha:
   - "Nome do produto": `Produto de teste`
   - "Código de barras": `7890000000011`
   - "Unidade": `UN`
   - "Preço de venda": `10,00`
3. Clique em "Cadastrar produto".
   - **Você deve ver:** "Produto cadastrado: Produto de teste." e a dica "Para vender este produto no caixa, altere o preço uma vez.". O produto aparece na lista "Recentes neste navegador".

### 4.2 Alterar o preço para liberar a venda no caixa

Um produto novo só pode ser vendido depois de uma alteração de preço. Essa é a regra atual do sistema.

1. No formulário "Alterar preço", em "Produto", clique na linha "Alterar preço" de "Produto de teste" na lista de recentes. Ou escolha o produto no seletor.
2. Em "Novo preço", digite `12,00` e clique em "Alterar preço".
   - **Você deve ver:** "Preço alterado: Produto de teste, de R$ 10,00 para R$ 12,00.".
3. Aguarde alguns segundos. Depois, no Caixa, pressione F2 (ou use a venda aberta), digite `7890000000011` e pressione Enter.
   - **Você deve ver:** "Produto de teste" na venda, com o preço "R$ 12,00". Se não aparecer, aguarde mais alguns segundos e tente de novo.

### 4.3 Alterar o preço pelo código de barras

1. Em "Alterar preço", no campo "Buscar pelo código de barras", digite `7891234567890` e clique em "Buscar".
   - **Você deve ver:** "Preço atual no caixa: R$ 22,90".
2. Para testar um código que não está no caixa, digite `7890000000099` e clique em "Buscar".
   - **Você deve ver:** "Nenhum produto com esse código no caixa. Escolha um recente ou informe o ID.".
3. Para usar o ID do produto em vez da busca, abra "Tenho o ID do produto" e cole o `productId` que está em `backend-services/.local-run/test-data.md`.
4. Para alterar um preço de verdade, use "Produto de teste": busque `7890000000011`, digite `10,50` em "Novo preço" e clique em "Alterar preço".
   - **Você deve ver:** "Preço alterado: Produto de teste, de R$ 12,00 para R$ 10,50.".
   - Se você digitar o mesmo preço, aparece: "O novo preço precisa ser diferente do atual.".

### 4.4 Funcionários: lista, cadastro, ID, PIN e desativação

Esta seção usa dois funcionários de teste que você mesmo cadastra. Assim, os PINs dos funcionários do ambiente (em `test-data.md`) não precisam mudar.

1. Clique em "Funcionários" no menu lateral.
   - **Você deve ver:** o título "Funcionários cadastrados", com a lista da loja. As colunas são "Código", "Nome", "Função" e "Situação". Na situação aparece "Ativo" ou "Inativo desde ...". Cada linha tem os botões "Copiar ID", "Trocar PIN" e "Desativar". Os botões "Trocar PIN" e "Desativar" ficam desabilitados para funcionário inativo.
   - **Você deve ver:** `CASHIER-01`, `MANAGER-01` e `ADMIN-01` na lista, porque já vêm do ambiente.
2. Em "Cadastrar funcionário", preencha:
   - "Código do funcionário": `TESTE-01`
   - "Nome completo": `Operador Teste`
   - "Função": "Caixa"
   - "PIN": um número de 4 a 12 dígitos que você escolher (dica: "4 a 12 dígitos")
3. Clique em "Cadastrar funcionário".
   - **Você deve ver:** "Funcionário cadastrado: Operador Teste." e o funcionário aparece em "Funcionários cadastrados".
4. Repita o cadastro com o mesmo código `TESTE-01`.
   - **Você deve ver:** "Já existe um funcionário com o código TESTE-01.".
5. Cadastre também um gerente de teste, com outro PIN que você escolher:
   - "Código do funcionário": `TESTE-GER`
   - "Nome completo": `Gerente Teste`
   - "Função": "Gerente"
   - "PIN": um número de 4 a 12 dígitos que você escolher
6. **Copiar ID.** Na linha de `TESTE-01`, clique em "Copiar ID". Depois, no Caixa, cole o ID no campo "ID do operador" da tela "Abrir caixa".
   - **Você deve ver:** "ID copiado" por um instante. Depois de colar, a abertura do caixa usa esse funcionário como operador.
   - A confirmação depende de o navegador permitir o acesso à área de transferência, e a página precisa estar em foco. Se "ID copiado" não aparecer, selecione o texto do ID na coluna "ID" da linha (ou use "Copiar ID" de novo, com a página em foco) e copie manualmente com Cmd + C.
7. **Trocar PIN.** Na linha de `TESTE-GER`, clique em "Trocar PIN". A caixa de diálogo tem o título "Trocar o PIN de Gerente Teste".
   - Em "Novo PIN" digite um número e, em "Confirme o novo PIN", outro diferente. Clique em "Salvar PIN".
     - **Você deve ver:** "Os dois PINs precisam ser iguais."
   - Digite o mesmo número nos dois campos (um PIN diferente do atual) e clique em "Salvar PIN".
     - **Você deve ver:** "PIN de Gerente Teste alterado. Bloqueios por tentativas erradas deste código foram liberados."
   - Se você repetir o PIN atual, aparece: "PIN não aceito. Use de 4 a 12 dígitos, diferente do PIN atual."
8. No Caixa, monte uma venda paga (passos da letra e) do §3.3) e tente cancelar com `TESTE-GER`:
   - com o PIN **antigo** (o que você digitou no cadastro), aparece "Código do gerente ou PIN inválido.";
   - com o PIN **novo** (o que você salvou em "Trocar PIN"), aparece "Venda cancelada. Motivo: ..." e "Aprovado por Gerente Teste (TESTE-GER).".
9. **Desativar.** Na linha de `TESTE-GER`, clique em "Desativar". A caixa de diálogo "Desativar funcionário" mostra o texto "Gerente Teste (TESTE-GER) não poderá mais aprovar cancelamentos no caixa. Esta ação não pode ser desfeita aqui.", com os botões "Voltar" e "Desativar".
   - Clique em "Desativar".
     - **Você deve ver:** "Gerente Teste foi desativado." A linha passa a mostrar "Inativo desde ..." e os botões "Trocar PIN" e "Desativar" ficam desabilitados.
10. Volte ao Caixa, monte outra venda paga e tente cancelar com `TESTE-GER` e o PIN novo, que antes funcionava.
    - **Você deve ver:** "Código do gerente ou PIN inválido.". A recusa é imediata, sem esperar nada.

### 4.5 Resultado (demonstrativo do dia)

1. Clique em "Resultado" no menu lateral.
   - **Você deve ver:** os campos "De" e "Até", já preenchidos com o primeiro dia do mês e o dia de hoje, e o botão "Gerar relatório".
2. Ajuste "De" e "Até" para o dia em que você fez as vendas de teste (o arquivo `test-data.md` sugere 22/11/2026) e clique em "Gerar relatório".
   - **Você deve ver:** o título "Resultado de 22/11/2026 a 22/11/2026", as linhas "Receita líquida", "(−) Perdas de estoque" e "Resultado" (o valor final em verde se for positivo e em vermelho se for negativo), a frase de contagem como "2 vendas, ... itens vendidos, ..." e a tabela "Por dia".
   - Se não houve venda no período, aparece "Nenhuma venda ou perda registrada nesse período.".
   - Se o relatório ainda não mostrar a venda que você acabou de fazer, aguarde alguns segundos e clique em "Gerar relatório" de novo.

### 4.6 Bloqueio por tentativas (opcional)

Esta seção usa um gerente de teste próprio, para não mexer nos gerentes do ambiente nem no `TESTE-GER` da seção 4.4, que já foi desativado.

> **Atenção:** o bloqueio por código só aparece se o caixa tiver no máximo 4 falhas anteriores nos últimos 15 minutos. Falhas do caixa acumulam para o bloqueio do caixa (10 em 15 minutos), e "Trocar PIN" não o libera. Por isso, faça esta seção logo depois de `npm run local:up -- --reset` (na pasta `backend-services`), ou espere 15 minutos desde o último erro.

1. Em "Cadastrar funcionário", cadastre `TESTE-LOCK`, com nome `Gerente Bloqueio`, função "Gerente" e um PIN que você escolher. Anote esse PIN.
2. No Caixa, monte uma venda paga e abra "Cancelar venda" (F4), com o código `TESTE-LOCK`.
3. Digite um PIN errado de propósito (por exemplo `0000`, desde que não seja o seu) e confirme, 5 vezes.
   - **Você deve ver:** "Código do gerente ou PIN inválido." em cada uma dessas 5 tentativas.
4. Na 6ª tentativa, digite o PIN **certo** que você anotou e confirme.
   - **Você deve ver:** "Muitas tentativas. Aguarde alguns minutos e tente de novo." A caixa de diálogo continua aberta. O PIN certo não libera o código enquanto o bloqueio dura.
5. Para liberar o código, na Gestão, em "Funcionários", clique em "Trocar PIN" de `TESTE-LOCK` e salve um PIN novo, diferente do atual.
   - **Você deve ver:** "PIN de Gerente Bloqueio alterado. Bloqueios por tentativas erradas deste código foram liberados."
6. No Caixa, use o PIN novo.
   - **Você deve ver:** "Venda cancelada. Motivo: ..." e "Aprovado por Gerente Bloqueio (TESTE-LOCK).".

Observação: o bloqueio do caixa (10 erros de códigos diferentes no mesmo caixa) não é liberado por "Trocar PIN". Ele passa sozinho depois de 15 minutos.

---

## 5. Estoque (http://localhost:4102)

1. Abra http://localhost:4102.
   - **Você deve ver:** o menu com a opção "Início" e a mensagem "Nenhuma operação de estoque disponível ainda", seguida de "Recebimento de notas, registro de perdas e contagem física vão aparecer aqui. Enquanto isso, use o caixa e a gestão.".
2. Esta tela ainda não tem formulários. Não tente cadastrar nada aqui.
3. Para testar o aviso de conexão, siga o passo 3.3 (i), que vale para todas as telas.

---

## 6. Tema e idioma (Preferências)

Cada tela tem, no canto superior direito, o botão **Preferências** (com ícone de ajustes). Ele abre um painel com dois controles:

- **Tema:** "Sistema", "Claro" ou "Escuro".
- **Idioma:** "Português (Brasil)" ou "English".

A escolha fica salva neste navegador. O padrão de tema é o mesmo do seu computador ("Sistema").

### 6.1 Claro e escuro

1. Abra o Caixa em http://localhost:4101 e clique em **Preferências**.
2. Clique em "Escuro".
   - **Você deve ver:** o fundo passa para um cinza-azulado escuro (não preto puro), os painéis em um tom um pouco mais claro e o texto claro. A etiqueta amarela do total continua amarela e legível.
3. Clique em "Claro".
   - **Você deve ver:** o fundo cinza-claro, os painéis brancos e o texto escuro. A troca é imediata, sem piscar.
4. Clique em "Sistema" para voltar a seguir o tema do computador.
5. Repita o teste na Gestão e no Estoque. As três telas devem mudar juntas.
6. Recarregue a página no modo "Escuro". A página deve abrir direto no escuro, sem clarear antes.

### 6.2 Português e English

1. Com o Caixa aberto, clique em **Preferências** e, em "Idioma", escolha "English".
   - **Você deve ver:** os textos mudam. Por exemplo: "Abrir caixa" vira "Open register", "Total da venda" vira "Sale total", "Cancelar venda" vira "Cancel sale". Os valores passam a ser `R$22.90` (ponto no decimal, vírgula nos milhares).
2. Na Gestão, em "English", o menu deve mostrar "Products", "Employees" e "Results". Abra "Results" e clique em "Gerar relatório" (em inglês, "Generate report"). Só depois de gerar o relatório o título aparece: "Results from ... to ...".
3. Volte para "Português (Brasil)". Os textos e a formatação `R$ 22,90` voltam ao normal.

Os nomes "Português (Brasil)" e "English" aparecem sempre no próprio idioma, de propósito.

---

## 7. Teste em 375 px (celular)

1. No Chrome, pressione `Cmd + Option + I` para abrir as ferramentas, depois clique no ícone de celular (Alternar modo de dispositivo). Escolha largura de 375 px (ou digite 375 no campo de largura).
2. No Caixa, com uma venda em andamento:
   - **Você deve ver:** o total "Total da venda" fixo no topo da tela ao rolar, sem rolagem lateral (a tela não deve ficar "mais larga" que o celular).
   - **Você deve ver:** uma barra fixa embaixo com o botão da etapa atual, por exemplo "Receber pagamento" ou "Concluir venda".
   - **Você deve ver:** no topo, um botão "Mais ações" com "Fechar caixa" e "Cancelar venda" dentro.
   - **Você deve ver:** o botão principal aparece uma única vez, na barra fixa de baixo.
3. Na Gestão e no Estoque, confira que o menu vira uma linha de abas no topo e os formulários ficam uma coluna abaixo da outra, sem rolagem lateral.
4. Na Gestão, em "Funcionários", abra "Trocar PIN" e "Desativar" em uma linha. As caixas de diálogo devem caber na tela, sem rolagem lateral. No Caixa, a caixa de diálogo "Cancelar venda" com os campos "Código do gerente" e "PIN do gerente" também deve caber.
5. Repita com o tema "Escuro" e com o idioma "English", se quiser.

---

## 8. Como parar o sistema

1. No Terminal, na pasta `backend-services`, rode:

   ```bash
   npm run local:down
   ```

   Isso para os serviços, as telas e a infraestrutura. Os dados continuam salvos.

2. Para apagar também os dados (volumes e o estado do seed), use:

   ```bash
   npm run local:down -- --purge
   ```

3. Para conferir o que ainda está rodando, use `npm run local:status`.
4. As portas que devem ficar livres depois de parar são 3001 a 3003 e 4100 a 4102.

---

## Ferramentas de desenvolvimento (somente em ambiente de desenvolvimento)

- No canto inferior esquerdo de cada tela aparece o botão **Ferramentas de desenvolvimento**. Ele abre um painel com "Loja (tenant)", "Endereços dos serviços" e "Limpar dados locais deste app".
- Esse botão só existe quando o sistema roda com `npm run local:up` (modo de desenvolvimento). Ele **não aparece** nas versões de produção.
- Use "Limpar dados locais deste app" para apagar o que o navegador guardou daquela tela (caixa em andamento, recentes, operador). Não apaga nada no servidor.

---

## Problemas comuns

- **O `npm run local:up` falhou.** O Terminal mostra o caminho do log e as últimas linhas. Os logs completos ficam em `backend-services/.local-run/logs/`. Mande o arquivo de log para a equipe.
- **Quero ver o que está rodando.** Use `npm run local:status` na pasta `backend-services`.
- **"Refusing to rebuild" ou erro de porta ocupada.** Rode `npm run local:down` e depois `npm run local:up`.
- **O produto cadastrado não aparece no caixa.** Faça a alteração de preço (passo 4.2). Depois, aguarde alguns segundos.
- **Erro "product ... exists in management but its id is unknown".** Rode `npm run local:up -- --reset`. Depois, pegue os IDs de novo em `test-data.md`.
- **Os IDs de funcionário mudaram.** É normal depois de `--reset`. Use sempre o arquivo `backend-services/.local-run/test-data.md`.
- **Tela em branco ou sem dados.** Atualize a página. Se continuar, confira se `npm run local:status` mostra os serviços no ar.
- **"Gestão indisponível" no cancelamento, com a gestão no ar.** Pode ser que o token interno não bata entre o caixa e a gestão, ou que a gestão esteja parada (seção 3.3 f). Na pasta `backend-services`, rode `npm run local:down` e depois `npm run local:up`. Se a gestão estiver parada, rode só `npm run local:up -- --skip-build --no-seed`. Para ver a causa, abra `backend-services/.local-run/logs/checkout-service.log` e procure a linha "Manager approval verification failed".
- **O caixa `register-01` ficou aberto depois de um teste automático que falhou no meio.** O teste ao vivo (`cancel-paid-sale`) pode deixar o caixa aberto. Abra http://localhost:4101 e, se houver venda em andamento, cancele ou conclua a venda. Depois clique em "Fechar caixa" (no topo) e, na caixa de diálogo, em "Fechar caixa" de novo. Se o caixa já estiver fechado, a tela mostra "Abrir caixa" e não precisa fazer nada.
- **"Muitas tentativas" no cancelamento.** É o bloqueio por tentativas erradas (seção 4.6). Espere 15 minutos. Trocar o PIN de um funcionário libera só o bloqueio do código dele, não o do caixa. Para apagar todos os bloqueios locais, rode `npm run local:down -- --purge` na pasta `backend-services`. Isso apaga todos os dados locais, e depois é preciso rodar `npm run local:up` de novo.
