# AI Summits

[English](../README.md) · [简体中文](README.zh-CN.md) · Español

Un atlas interactivo y de código abierto que representa retos conocidos de la humanidad como cimas y muestra avances históricos de la IA y sus límites.

La primera edición incluye 26 problemas de 19 disciplinas, con interfaz y contenido en inglés, chino simplificado y español. Gira el terreno, busca problemas, filtra por disciplina o estado, reproduce hitos por año y consulta sus fuentes.

No es un catálogo exhaustivo ni una clasificación en directo. La altura no mide dificultad y el color no indica un porcentaje completado. Alcanzar un objetivo concreto no resuelve toda una disciplina. El gris solo indica ausencia de hitos de IA registrados hasta el año seleccionado.

## Ejecución local

Requiere Node 24 y npm:

```sh
git clone https://github.com/HomoDeus/ai-summits.git
cd ai-summits
npm ci
npm run dev
```

Abre la URL local que muestra el servidor. No se necesitan claves de API, base de datos ni cuentas.

`npm run check` ejecuta las comprobaciones y pruebas. `npm run build` genera el sitio estático en `out/`. Consulta el [README en inglés](../README.md), la [guía de contribución](../CONTRIBUTING.md) y la [política editorial](EDITORIAL_POLICY.md) para despliegue y criterios de evidencia.

El código, los resúmenes originales y las traducciones usan la [licencia MIT](../LICENSE). Las fuentes enlazadas conservan sus propios derechos. Se agradecen aportaciones de problemas, evidencia y traducciones.
