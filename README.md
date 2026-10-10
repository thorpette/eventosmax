# eventosmax
BPMN project: Gestión de Venta y Validación de Entradas para Eventos en Directo

## 🚀 Inicio rápido para probar la demo

Requisitos: [Git](https://git-scm.com) y [Node.js ≥ 20 LTS](https://nodejs.org).

```bash
git clone https://github.com/thorpette/eventosmax.git
cd eventosmax/passlive
npm run install:all   # instala API + frontend (~1-3 min)
npm run seed          # datos de demo: local, evento +18, clientes
npm run demo          # arranca API (4000) y web (5173)
```

Abre **<http://localhost:5173>** y sigue el recorrido de 2 minutos del
[README de passlive](passlive/README.md).

## Contenido

- `ia/` — Fuentes originales (BPMN, pantallas Stitch, design system).
- `docs/plan-arquitectura.json` — Plan de arquitectura generado (resumen BPMN, discrepancias, mapeo, endpoints, supuestos y riesgos).
- `docs/demo-*.png` — Capturas del recorrido de demo verificado.
- `passlive/` — Código generado: API REST (TypeScript estricto) + frontend React/Vite/Tailwind.

Ver [passlive/README.md](passlive/README.md) para instrucciones detalladas, variables de entorno, supuestos y solución de problemas.
