# ExpoRed 2027 — Datos solicitados para el alta de expositores

Documento del formulario actual, actualizado al 1 de octubre de 2026. Los labels, las opciones y los textos entre comillas se transcriben exactamente como están implementados, incluidas sus aclaraciones entre paréntesis.

El formulario reúne los datos de la empresa, del responsable del stand y del responsable del pago, junto con la información necesaria para facturar y conocer los impuestos sobre los que el expositor actúa como agente de retención.

## Presentación del formulario

- **Título:** “Datos del Expositor”.
- **Texto superior:** “TU PARTICIPACIÓN EN EXPORED 2027”.
- **Introducción:** “Completá los datos de tu empresa para continuar con la gestión de tu participación en ExpoRed 2027.”
- **Aviso de obligatoriedad:** “Los campos con * son obligatorios.”
- **Organización:** tres pasos: “Datos de la empresa”, “Datos del expositor” y “Gestión de pago”.

Hay **14 campos que se solicitan siempre** y **3 campos condicionales**, hasta un total de **17 campos**. Todos los campos visibles son obligatorios. Los campos condicionales solo se muestran y se exigen cuando corresponde según las respuestas.

Los labels detallados abajo reciben un asterisco de obligatoriedad en pantalla. Los campos comienzan vacíos y las opciones no tienen una respuesta preseleccionada. No hay ejemplos ni placeholders dentro de los campos de texto. El desplegable de IVA comienza con “Seleccioná una opción”.

## Sección 1 de 3 — Datos de la empresa

**Descripción exacta:** “Razón social y nombre comercial de tu empresa.”

| Orden | Label exacto | Tipo de campo | Qué aclaramos en el label | Obligatorio y límites | Identificador |
| --- | --- | --- | --- | --- | --- |
| 1 | Razón Social (para la facturación) | Texto de una línea | La razón social se utilizará para la facturación. | Sí. Hasta 180 caracteres. | `razonSocial` |
| 2 | Nombre Comercial (repetir si es igual a la Razón Social) | Texto de una línea | Debe completarse también cuando coincida con la razón social; se solicita repetirlo. | Sí. Hasta 180 caracteres. | `nombreComercial` |

No hay texto de ayuda adicional debajo de estos campos.

**Botón:** “Continuar”.

**Texto junto al botón:** “A continuación: datos del expositor.”

## Sección 2 de 3 — Datos del expositor

**Descripción exacta:** “Datos del responsable que toma las decisiones sobre el stand.”

| Orden | Label exacto | Tipo de campo | Qué aclaramos en el label | Obligatorio y límites | Identificador |
| --- | --- | --- | --- | --- | --- |
| 3 | Nombre y Apellido (del responsable y toma de decisiones sobre el stand) | Texto de una línea | Se solicita el nombre de la persona responsable de las decisiones sobre el stand. | Sí. Hasta 160 caracteres. | `responsableStand` |
| 4 | Teléfono (del responsable y toma de decisiones sobre el stand) | Teléfono (`tel`) | El teléfono debe corresponder a ese responsable. | Sí. Hasta 40 caracteres, con entre 6 y 20 dígitos. | `telefonoStand` |
| 5 | Mail (del responsable y toma de decisiones sobre el stand) | Correo electrónico (`email`) | El mail debe corresponder a ese responsable. | Sí. Formato de email válido, hasta 254 caracteres. | `emailStand` |
| 6 | Nombre del Stand (nombre por el cual será identificado en la Expo, puede ser el mismo al comercial) | Texto de una línea | Será el nombre utilizado para identificar el stand en la Expo; puede coincidir con el nombre comercial. | Sí. Hasta 180 caracteres. | `nombreStand` |

No hay texto de ayuda adicional debajo de estos campos. La indicación de incluir el código de área aparece en el mensaje de error del teléfono, no en su label.

**Botones:** “Volver” y “Continuar”.

## Sección 3 de 3 — Gestión de pago

**Descripción exacta:** “Información de la persona responsable del pago y la factura.”

Los siguientes grupos se documentan por separado para facilitar la lectura. En pantalla pertenecen a una sola sección llamada “Gestión de pago”; no tienen estos subtítulos internos.

### Responsable del pago y CUIT

| Orden | Label exacto | Tipo de campo | Qué aclaramos en el label o debajo del campo | Obligatorio y límites | Identificador |
| --- | --- | --- | --- | --- | --- |
| 7 | Nombre y Apellido (del responsable del pago) | Texto de una línea | Se solicita el nombre de la persona responsable del pago. | Sí. Hasta 160 caracteres. | `responsablePago` |
| 8 | Teléfono (del responsable del pago) | Teléfono (`tel`) | El teléfono debe corresponder al responsable del pago. | Sí. Hasta 40 caracteres, con entre 6 y 20 dígitos. | `telefonoPago` |
| 9 | Mail (del responsable del pago) | Correo electrónico (`email`) | El mail debe corresponder al responsable del pago. | Sí. Formato de email válido, hasta 254 caracteres. | `emailPago` |
| 10 | CUIT | Texto de una línea restringido a dígitos, con teclado numérico en dispositivos compatibles | Ayuda exacta debajo del campo: “Ingresá los 11 dígitos, sin guiones ni espacios.” | Sí. Exactamente 11 dígitos y validación del dígito verificador. | `cuit` |

El CUIT se conserva como texto, no como un número para cálculos. No se pueden ingresar letras, espacios ni guiones, ni escribir un duodécimo dígito. Diez dígitos o menos no permiten completar el envío. Tener once dígitos es necesario, pero también debe pasar la validación del dígito verificador; se rechazan secuencias con los once dígitos iguales. No se consulta un padrón para verificar la titularidad del CUIT.

Los datos del responsable del pago se solicitan por separado de los del responsable del stand. Si se trata de la misma persona, se completan nuevamente; no hay un control para copiar esos datos automáticamente.

### Agente de retención

Esta pregunta aparece **inmediatamente después del CUIT**, antes de “Condición frente al IVA”.

| Orden | Label exacto | Tipo de campo | Opciones o aclaración | Cuándo se muestra y es obligatorio | Identificador |
| --- | --- | --- | --- | --- | --- |
| 11 | ¿Es agente de retención? | Selección única, botones de opción (`radio`) | “Sí” / “No”. Solo se puede elegir una respuesta. | Siempre. Es obligatorio responder. | `agenteRetencion` |
| 12 | En caso afirmativo, indique los impuestos: | Selección múltiple, casillas de verificación (`checkbox`) | “IVA”, “Ganancias”, “Ingresos Brutos”, “Otros”. | Solo si se responde “Sí”. Debe marcarse al menos un impuesto. | `impuestosRetencion` |
| 13 | Ingresos Brutos — Jurisdicción | Texto de una línea | Solicita la jurisdicción correspondiente a Ingresos Brutos. Sin texto de ayuda adicional. | Solo si se responde “Sí” y se marca “Ingresos Brutos”. Obligatorio en ese caso, hasta 180 caracteres. | `jurisdiccionIngresosBrutos` |
| 14 | Otros — Indique los impuestos | Texto de una línea | Solicita especificar los impuestos incluidos en “Otros”. Sin texto de ayuda adicional. | Solo si se responde “Sí” y se marca “Otros”. Obligatorio en ese caso, hasta 300 caracteres. | `otrosImpuestosRetencion` |

Las opciones de impuestos se muestran en este orden:

1. IVA.
2. Ganancias.
3. Ingresos Brutos.
4. Otros.

Se puede seleccionar más de una opción, incluso las cuatro. Las casillas de impuestos no son excluyentes; los botones “Sí” y “No” sí lo son.

Los campos de jurisdicción y otros impuestos aparecen **debajo del grupo de casillas**, en ese orden, cuando corresponda. Son campos de texto libre, no desplegables.

**Comportamiento condicional:**

- Al responder “No”, se ocultan y se borran las selecciones de impuestos, la jurisdicción y el detalle de otros impuestos.
- Al desmarcar “Ingresos Brutos”, se oculta y se borra su jurisdicción.
- Al desmarcar “Otros”, se oculta y se borra su detalle.
- Si después se vuelve a seleccionar una opción, su detalle debe completarse nuevamente.
- Los campos ocultos no bloquean el envío.

### Condición frente al IVA, forma de pago y factura

| Orden | Label exacto | Tipo de campo | Opciones o aclaración | Obligatorio y límites | Identificador |
| --- | --- | --- | --- | --- | --- |
| 15 | Condición frente al IVA | Lista desplegable (`select`), selección única | Texto inicial: “Seleccioná una opción”. Opciones: “Responsable Inscripto” y “Exento”. | Sí. Debe elegirse una de esas dos opciones. | `condicionIVA` |
| 16 | Forma de pago | Selección múltiple, casillas (`checkbox`) | “Cheque” / “Transferencia”. Se puede elegir una o ambas; ambas se envían como `Cheque; Transferencia`. | Sí, al menos una. | `formaPago` |
| 17 | Detalle (texto para el cuerpo de la factura) | Texto de varias líneas (`textarea`), inicialmente cuatro filas | El texto ingresado será el detalle para el cuerpo de la factura. | Sí. Hasta 2.000 caracteres. Se conservan los saltos de línea internos. | `detalleFactura` |

No hay texto de ayuda adicional debajo de estos tres campos. La lista de IVA no incluye Monotributista, Consumidor Final ni otras categorías; la forma de pago no incluye Efectivo.

**Botones:** “Volver” y “Enviar datos”.

## Validaciones y mensajes que ve el expositor

Se eliminan los espacios al principio y al final de los valores antes de validar y enviar. Un campo obligatorio con solo espacios se considera vacío. La validación se aplica tanto en el formulario como en el servidor.

Los teléfonos admiten dígitos, espacios y los caracteres `+`, `(`, `)`, `.` y `-`. Deben contener entre 6 y 20 dígitos, además de respetar el límite de 40 caracteres totales. No se verifica que el número exista ni que pertenezca al responsable.

Los emails deben tener texto antes de `@` y un dominio con punto, sin espacios. Se valida el formato, no la existencia de la casilla.

| Situación | Mensaje exacto |
| --- | --- |
| Campo obligatorio vacío, incluida la selección de impuestos cuando corresponde | Completá este campo. |
| Email con formato inválido | Ingresá un email válido. |
| Teléfono inválido | Ingresá un teléfono válido, con código de área. |
| CUIT con longitud insuficiente o dígito verificador inválido | Ingresá un CUIT válido de 11 dígitos. |
| Límite de longitud excedido | Usá hasta N caracteres. |
| Valor de tipo incorrecto o con caracteres de control no permitidos | Ingresá un valor válido. |
| Condición frente al IVA fuera de las opciones admitidas | Seleccioná una condición frente al IVA válida. |
| Forma de pago fuera de las opciones admitidas | Seleccioná una forma de pago válida. |
| Respuesta de agente de retención fuera de las opciones admitidas | Seleccioná Sí o No. |
| Impuestos no admitidos o repetidos en el envío | Seleccioná impuestos válidos. |
| Aviso general ante errores de validación | Revisá los campos indicados para poder enviar tus datos. |

En el mensaje de longitud, `N` se reemplaza por el máximo del campo. Los controles de texto limitan la escritura al máximo configurado; la comprobación del servidor también rechaza valores excesivos recibidos por otros medios. Los mensajes sobre opciones no admitidas protegen además contra envíos manipulados: los controles normales solo ofrecen las opciones enumeradas en este documento.

## Navegación y confirmación

- Cada paso muestra “PASO 1 DE 3”, “PASO 2 DE 3” o “PASO 3 DE 3”, según corresponda.
- “Continuar” valida los campos del paso actual. Los datos se conservan al volver a un paso anterior dentro del formulario abierto, salvo los campos condicionales que se hayan ocultado.
- Los botones “Continuar” no envían la solicitud. El envío se realiza con “Enviar datos” en el tercer paso y valida el formulario completo.
- Durante el envío, el botón muestra “Enviando datos…” y los controles quedan deshabilitados para evitar envíos repetidos.
- Ante un error de envío, se conservan los valores para volver a intentar y se muestra: “No pudimos enviar el formulario. Intentá nuevamente en unos minutos.”
- Tras la respuesta exitosa, se muestra el título “Datos enviados” y el mensaje: “Gracias. Recibimos los datos de tu empresa para continuar con el proceso comercial de ExpoRed 2027.”

La confirmación comunica la recepción de los datos para continuar el proceso comercial. No afirma que el alta comercial ya esté aprobada ni que los pasos posteriores de la automatización hayan finalizado.

## Referencia para la integración

Los identificadores de las tablas son los nombres de los campos enviados a Make. Los valores se envían como texto. Las respuestas de retención se representan así:

| Campo | Formato enviado |
| --- | --- |
| `agenteRetencion` | `Sí` o `No`. |
| `impuestosRetencion` | Opciones seleccionadas separadas por punto y coma y espacio, en el orden del formulario. Ejemplo: `IVA; Ganancias; Ingresos Brutos; Otros`. Vacío cuando no corresponde. |
| `jurisdiccionIngresosBrutos` | Texto ingresado, sin espacios en los extremos. Vacío cuando no corresponde. |
| `otrosImpuestosRetencion` | Texto ingresado, sin espacios en los extremos. Vacío cuando no corresponde. |

Los límites técnicos de longitud para las selecciones son: 2 caracteres para `agenteRetencion`, 100 para `impuestosRetencion`, 60 para `condicionIVA` y 30 para `formaPago`. Además, se exige que las opciones coincidan con las permitidas.

El servidor agrega `submissionId` y `submittedAt` para identificar y fechar el envío. **No son datos solicitados al expositor.** También existe un campo oculto de control antispam, `website`, que el expositor no debe completar y que no se reenvía a Make.

## Fuente del documento

La descripción corresponde al código actual del proyecto, con las modificaciones de CUIT y agente de retención del commit `a47093e`:

- `src/lib/form-config.ts`: labels, opciones, límites y condiciones de visibilidad.
- `src/lib/validation.ts`: validación y normalización.
- `src/components/form-field.tsx`: tipos de controles y textos auxiliares.
- `src/components/exhibitor-form.tsx`: secciones, navegación, campos condicionales y envío.
- `src/components/form-progress.tsx`: nombres de pasos y progreso.
- `src/app/page.tsx`: título y presentación.

Este documento describe el formulario implementado en el proyecto; sirve como especificación para reproducirlo en Webflow.
