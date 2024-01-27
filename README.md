# Desafio Tunts.Rocks 2024

O objetivo desse repositório e guardar os arquivos referentes ao desáfio técnico da tunts.rocks 2024.

O código consiste em uma aplicação que recebe dados de uma planilha do google sheets com informações referentes a alunos como: matrícula, nome, falta e as 3 notas. 

# Regras
Calcular a situação de cada aluno baseado na média das 3 provas (P1, P2 e P3), conforme a tabela:

Média (m) Situação:

- m<5 - Reprovado por Nota

- 5<=m<7 - Exame Final

- m>=7 - Aprovado

Caso o número de faltas ultrapasse 25% do número total de aulas o aluno terá a situação "Reprovado por Falta", independente da média. Caso a situação seja "Exame Final" é necessário calcular a "Nota para Aprovação Final"(naf) de cada aluno de acordo com seguinte fórmula:

5 <= (m + p3)/2

Caso a situação do aluno seja diferente de "Exame Final", preencha o campo "Nota para Aprovação Final" com 0.

# Iniciando a aplicação


Para instalação inicial:

- npm init
- npm install googleapis@105 @google-cloud/local-auth@2.1.0 --save

É importante que para fazer uso da aplicação, você deve ter seu próprio credentials.json, que contém os tokens para permitir que a API acesse a tabela, pois do modo que fiz apenas eu posso acessar, pois além de configurar o googleAuth, defini minha conta como a unica conta de teste que pode acessar a API. Após isso apague o arquivo token.json e ele será recriado com as informações atualizadas.

Segui esse tutorial do proprio Google para realizar a operação acima: 
- https://developers.google.com/sheets/api/quickstart/js

Também é importante modificar a const id, nela deve conter o id da sua planilha

Após isso, é só rodar com um:
- node .

Documentação utilizada: 
- https://developers.google.com/sheets/api/guides/concepts
