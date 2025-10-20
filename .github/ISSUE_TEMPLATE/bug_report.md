name: Bug report
description: Relate um problema para ajudarmos a corrigir
title: "bug: "
labels: [bug]
body:
  - type: textarea
    attributes:
      label: Descrição
      description: Descreva o que aconteceu e o esperado
    validations:
      required: true
  - type: textarea
    attributes:
      label: Como reproduzir
      description: Passos para reproduzir o problema
      placeholder: |
        1. Acessar /rota
        2. Clicar em ...
        3. Ver erro ...
  - type: input
    attributes:
      label: Ambiente
      placeholder: ex. macOS 14, Chrome 129
  - type: textarea
    attributes:
      label: Evidências
      description: Prints, logs, etc.

