# Ritmo

Demonstração pública de uma aplicação de treino em JavaScript, HTML e CSS.
A interface apresenta uma semana, as ilustrações de cada movimento, exemplos
de histórico e as etapas de uma sessão. A ficha e os registros são fictícios.

## Executar

Com Node.js 22 ou superior, execute `npm start` e abra
`http://127.0.0.1:4173`. Não há dependências de execução para instalar.

`npm test` verifica as regras de séries, descanso e pausa.

## Organização

- `data.js`: ficha de exemplo.
- `model.js`: regras de sessões, séries e tempo.
- `views.js`: apresentação das telas.
- `demo.js`: navegação entre os exemplos.
- `assets/`: ilustrações locais.

A versão pública é somente consulta: não edita fichas, não lê dados pessoais
e não grava treinos. As funções do modelo permanecem disponíveis no código
para examinar as regras usadas pelo aplicativo.

[Abrir demonstração](https://guirab.com.br/demos/ritmo/index.html)
