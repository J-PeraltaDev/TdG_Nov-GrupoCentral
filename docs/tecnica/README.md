# Documentación técnica

La pide RNF-17 (instalación, modelo de datos y despliegue). Es la de la v1.0, al cierre del
Sprint 5. El manual de usuario se escribe en la validación (Objetivo 4), con las pantallas finales
y lo que cambie en el piloto (plan del Sprint 5, decisión 56).

| Tema                    | Dónde                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalación             | [`README.md`](../../README.md) del repositorio: requisitos, instalación, entorno de desarrollo, usuarios de prueba y scripts                                   |
| Arquitectura            | El SDD (IEEE 1016), fuera del repositorio, y las decisiones de [`docs/adr/`](../adr/). Lo que se apartó del SDD, en [`docs/cambios-sdd.md`](../cambios-sdd.md) |
| Modelo de datos         | [`modelo-de-datos.md`](modelo-de-datos.md): tablas, vistas, funciones, disparadores, acceso y lo que guarda el dispositivo                                     |
| Despliegue              | [`despliegue.md`](despliegue.md): dónde vive cada pieza, las variables y los secretos, y cómo llega un cambio a producción                                     |
| Pruebas                 | Por nivel y por caso de uso, en cada informe de [`docs/sprints/`](../sprints/); la del Sprint 5 es [`S5.md`](../sprints/S5.md)                                 |
| Convenciones del código | [`CLAUDE.md`](../../CLAUDE.md): nombres, ramas, commits, migraciones y las reglas de seguridad de la base                                                      |
