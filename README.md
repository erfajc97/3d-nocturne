# NOCTURNE

Landing 3D para una casa de perfume ficticia. Una sola escena WebGL fija detrás
del contenido, dirigida por scroll: velo que se disuelve al arrastrar, flacon de
vidrio con líquido ámbar, polvo de oro en suspensión y cámara cinematográfica en
siete planos.

Todo el 3D es procedural — no hay `.glb`, ni HDRI, ni texturas descargadas.

## Stack

| Pieza | Uso |
| --- | --- |
| React 19 + Vite | app |
| three + @react-three/fiber | render |
| @react-three/drei | `MeshTransmissionMaterial`, `Environment` + `Lightformer`, `MeshReflectorMaterial` |
| @react-three/postprocessing | bloom, profundidad de campo, viñeta, grano |
| GSAP + ScrollTrigger | revelados de texto |
| Lenis | scroll inercial |
| Tailwind CSS v4 | estilos |

## Correr

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

## Parámetros de URL

Para depurar y para capturas automatizadas.

| Param | Efecto |
| --- | --- |
| `?q=low`, `?q=mid`, `?q=high` | fuerza el tier de calidad en vez de detectarlo |
| `?reveal=1` | arranca con el velo ya disuelto |

## Arquitectura

```
src/
  lib/
    scroll.ts          fuente de verdad mutable de scroll/puntero
    quality.ts         tiers según capacidad del dispositivo
    glsl.ts            shaders compartidos (ruido, velo, fondo, polvo)
    useSmoothScroll.ts Lenis + ticker de GSAP + ScrollTrigger
  scene/
    Experience.tsx     el único <Canvas>, fijo, nunca se desmonta
    CameraRig.tsx      storyboard de 7 planos, dos composiciones según aspect
    Flacon.tsx         vidrio + líquido + tapón dorado
    Shroud.tsx         velo con shader de dissolve
    GlowPanel.tsx      panel emisivo detrás del vidrio
    ...
  ui/                  capa HTML sobre el canvas
```

### Decisiones que sostienen el rendimiento

- El progreso de scroll vive en un objeto mutable (`lib/scroll.ts`) y se lee
  dentro de `useFrame`. Nunca en estado de React: eso re-renderizaría el árbol
  60 veces por segundo.
- Las geometrías y materiales creados de forma imperativa (`new THREE.*` en
  `useMemo`) se liberan en el cleanup de su `useEffect`. R3F sólo libera
  automáticamente lo que se declara en JSX.
- `lib/quality.ts` desactiva suelo reflectante, sombras y profundidad de campo en
  equipos débiles: cada uno de esos efectos cuesta un render extra de escena.
- `GlowPanel` existe porque `MeshTransmissionMaterial` refracta la **escena**, no
  el environment map. Sobre un fondo casi negro el vidrio no tiene nada que
  refractar y se ve como laca opaca.

## Assets

Las tres imágenes editoriales de `public/editorial/` se generaron con Magnific.
El resto es geometría y shaders.
