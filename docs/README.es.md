# AI Summits

[English](../README.md) · [简体中文](README.zh-CN.md) · Español

Un atlas interactivo y de código abierto que representa retos conocidos de la humanidad como cimas y muestra avances históricos de la IA y sus límites.

La primera edición incluye 115 problemas de 23 disciplinas, al menos cinco por disciplina, con interfaz y contenido en inglés, chino simplificado y español. Cada reto muestra «Dónde estamos» y «Qué queda por lograr», con una ruta de ascenso y evidencia fechada. Orbita e inclina el terreno 3D, desplázate y amplía con la rueda o dos dedos. Las cordilleras negras desconocidas se generan al viajar. Vuela a una cima, vuelve a la vista general, busca, filtra y explora hitos por año.

No es un catálogo exhaustivo ni una clasificación en directo. La altura de las cimas con nombre combina estimaciones editoriales de dificultad e importancia. Las montañas sin nombre simbolizan preguntas sin formular o registrar, sin puntuaciones ni recuentos. Los escaladores humanos y de IA indican categorías de evidencia, no porcentajes; «?» significa ausencia de registros y las banderas señalan objetivos alcanzados. Alcanzar un objetivo concreto no resuelve toda una disciplina. El gris solo indica ausencia de hitos de IA registrados hasta el año seleccionado.

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
