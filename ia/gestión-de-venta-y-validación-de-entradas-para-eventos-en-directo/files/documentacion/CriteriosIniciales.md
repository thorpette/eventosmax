# Criterios Iniciales

**Proyecto:** Gestión de Venta y Validación de Entradas para Eventos en Directo
**Descripción:** Sistema para la venta de entradas a eventos en directo y su validación en locales mediante Bluetooth y códigos QR, con control de acceso por edad y tipología VIP.
**Fecha:** 2026-10-09
**Proveedor IA:** deepseek, mimo

---

## Diagramas BPMN Propuestos

- **Proceso de Venta de Entradas** — Modela el flujo completo desde la selección de un evento por parte del cliente hasta la generación y entrega de la entrada digital.
- **Proceso de Validación de Entradas en Acceso** — Modela la validación de la entrada cuando el cliente llega al local, permitiendo la verificación mediante Bluetooth o códigos QR.
- **Control de Acceso por Restricciones** — Modela las verificaciones adicionales de acceso basadas en restricciones de edad y gestión diferenciada de acceso VIP, después de una validación exitosa.
- **Colaboración entre Sistema de Venta y Locales** — Modela la interacción y comunicación entre el sistema de venta de entradas y los locales para sincronizar datos de entradas y validaciones.

## Entidades Detectadas

- **Cliente** — Persona que compra y utiliza entradas para acceder a eventos. Se administra en el sistema de venta y se verifica durante el acceso para restricciones como edad. (atributos: id_cliente, nombre, edad, email, telefono)
- **Entrada** — Ticket digital que permite el acceso a un evento específico. Se genera durante la venta, contiene código QR y puede validarse por Bluetooth. Se administra su estado (válida/inválida) y tipo (VIP/general). (atributos: id_entrada, codigo_qr, tipo_vip, estado, fecha_compra, id_evento, id_cliente)
- **Evento** — Evento en directo para el cual se venden entradas. Define restricciones como si es para mayores de edad y se asocia a un local. (atributos: id_evento, nombre, fecha, hora, id_local, restriccion_edad, capacidad, precio_base)
- **Local** — Lugar físico donde se celebra el evento y donde se realiza la validación de entradas. Se administra su capacidad y eventos asociados. (atributos: id_local, nombre, direccion, capacidad_maxima, tecnologia_validacion)

> Cada entidad cuenta con un diagrama BPMN de gestión (ABM: alta, consulta, edición y baja) y con requirements de administración.