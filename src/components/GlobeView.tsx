import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import Globe, { type GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import type { CityMarker } from '../types';
import type { JourneyArc } from '../utils/geographicHelpers';
import { createEarthCanvas } from '../utils/earthTexture';
import { createMarkerElement } from './GlobeMarkers';
import { CATEGORY_META } from '../utils/raceHelpers';
import '../styles/globe.css';

export interface GlobeHandle {
  flyTo: (lat: number, lng: number, altitude?: number, ms?: number) => void;
  zoomBy: (factor: number) => void;
  getAltitude: () => number;
}

interface Props {
  ref?: Ref<GlobeHandle>;
  markers: CityMarker[];
  arcs: JourneyArc[];
  selectedCityId: string | null;
  autoRotate: boolean;
  reducedMotion: boolean;
  /** Horizontal offset (px) of the globe centre, leaving room for the intro. */
  offsetX?: number;
  onSelectCity: (id: string) => void;
  onSelectRace: (id: string) => void;
  onBackgroundClick?: () => void;
  onZoomChange?: (bucket: ZoomBucket) => void;
}

/**
 * far   — dots + race counts (labels on hover / selection)
 * mid   — labels for multi-race and PB cities
 * near  — all city labels; race chips for the hovered / selected city
 * close — race chips for every city
 */
export type ZoomBucket = 'far' | 'mid' | 'near' | 'close';
const zoomBucket = (alt: number): ZoomBucket => (alt > 1.5 ? 'far' : alt > 0.8 ? 'mid' : alt > 0.32 ? 'near' : 'close');

const INITIAL_POV = { lat: 47, lng: 19, altitude: 2.25 }; // Europe centred
const IDLE_RESUME_MS = 9000;

export default function GlobeView({
  ref,
  markers,
  arcs,
  selectedCityId,
  autoRotate,
  reducedMotion,
  offsetX = 0,
  onSelectCity,
  onSelectRace,
  onBackgroundClick,
  onZoomChange,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const [zoom, setZoom] = useState<ZoomBucket>('far');
  const [ready, setReady] = useState(false);

  // Latest callbacks / flags without re-initialising the globe.
  const handlersRef = useRef({ onSelectCity, onSelectRace, onBackgroundClick });
  handlersRef.current = { onSelectCity, onSelectRace, onBackgroundClick };
  const autoRotateRef = useRef(autoRotate && !reducedMotion);
  autoRotateRef.current = autoRotate && !reducedMotion;
  const idleTimer = useRef<number | undefined>(undefined);
  const selectedRef = useRef(selectedCityId);
  selectedRef.current = selectedCityId;

  // ── Initialise once ────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current!;
    const isSmall = window.matchMedia('(max-width: 760px)').matches;

    const globe = new Globe(mount, { animateIn: !reducedMotion, rendererConfig: { antialias: true, alpha: true } });
    globeRef.current = globe;

    globe
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#8fb6cc')
      .atmosphereAltitude(0.17)
      .bumpImageUrl(`${import.meta.env.BASE_URL}textures/earth-topology.png`)
      .showGraticules(false)
      .width(mount.clientWidth)
      .height(mount.clientHeight);

    // Material: matte, softly lit, palette-driven texture painted at runtime.
    const material = globe.globeMaterial() as THREE.MeshPhongMaterial;
    material.color = new THREE.Color('#203440');
    material.specular = new THREE.Color('#0d1418');
    material.shininess = 6;
    material.bumpScale = 6;

    const maxTex = globe.renderer().capabilities.maxTextureSize;
    const texWidth = Math.min(isSmall ? 4096 : 6144, maxTex);
    createEarthCanvas(texWidth)
      .then((canvas) => {
        if (globeRef.current !== globe) return;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, globe.renderer().capabilities.getMaxAnisotropy());
        material.map = tex;
        material.color = new THREE.Color('#ffffff');
        material.needsUpdate = true;
        setReady(true);
      })
      .catch((err) => {
        console.error('[Running Atlas] Earth texture failed', err);
        setReady(true);
      });

    // Lighting: soft ambient + a key light fixed to the camera (upper-left),
    // so the globe always reads as gently sculpted wherever you rotate.
    const ambient = new THREE.AmbientLight('#dfe7ea', 2.1);
    const key = new THREE.DirectionalLight('#fff3e3', 1.5);
    key.position.set(-1.2, 1.1, 1.4);
    globe.lights([ambient]);
    const camera = globe.camera();
    camera.add(key);
    globe.scene().add(camera);

    // Controls
    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.7;
    controls.minDistance = 100 * 1.08;
    controls.maxDistance = 100 * 4.5;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 0.28;

    const pauseRotation = () => {
      controls.autoRotate = false;
      window.clearTimeout(idleTimer.current);
    };
    const scheduleResume = () => {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        controls.autoRotate = autoRotateRef.current;
      }, IDLE_RESUME_MS);
    };
    controls.addEventListener('start', pauseRotation);
    controls.addEventListener('end', scheduleResume);

    globe.pointOfView(INITIAL_POV, 0);
    globe.onZoom((pov) => setZoom(zoomBucket(pov.altitude)));

    // HTML markers
    globe
      .htmlLat((d) => (d as CityMarker).location.lat)
      .htmlLng((d) => (d as CityMarker).location.lng)
      .htmlAltitude(0.004)
      .htmlTransitionDuration(0)
      .htmlElement((d) => {
        const m = d as CityMarker;
        const node = createMarkerElement(
          m,
          {
            onSelectCity: (id) => handlersRef.current.onSelectCity(id),
            onSelectRace: (id) => handlersRef.current.onSelectRace(id),
          },
          m.location.labelPosition,
        );
        // Elements are created asynchronously by globe.gl — apply current selection state.
        const sel = selectedRef.current;
        node.classList.toggle('gm--selected', sel === m.id);
        node.classList.toggle('gm--dimmed', !!sel && sel !== m.id);
        return node;
      })
      .htmlElementVisibilityModifier((elem, isVisible) => {
        elem.classList.toggle('gm--hidden', !isVisible);
      });

    // Journey arcs
    globe
      .arcStartLat((d) => (d as JourneyArc).startLat)
      .arcStartLng((d) => (d as JourneyArc).startLng)
      .arcEndLat((d) => (d as JourneyArc).endLat)
      .arcEndLng((d) => (d as JourneyArc).endLng)
      .arcColor(() => ['rgba(242,240,234,0.05)', 'rgba(242,161,138,0.75)'])
      .arcStroke(0.32)
      .arcAltitudeAutoScale(0.32)
      .arcDashLength(reducedMotion ? 1 : 0.5)
      .arcDashGap(reducedMotion ? 0 : 0.25)
      .arcDashInitialGap(() => Math.random())
      .arcDashAnimateTime(reducedMotion ? 0 : 5200)
      .arcsTransitionDuration(reducedMotion ? 0 : 900);

    // Selection rings
    globe
      .ringLat((d) => (d as CityMarker).location.lat)
      .ringLng((d) => (d as CityMarker).location.lng)
      .ringAltitude(0.002)
      .ringColor(() => (t: number) => `rgba(242,240,234,${0.55 * (1 - t)})`)
      .ringMaxRadius(2.6)
      .ringPropagationSpeed(1.6)
      .ringRepeatPeriod(1400);

    globe.onGlobeClick(() => handlersRef.current.onBackgroundClick?.());

    // Double-click a location to zoom into it.
    const onDblClick = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const coords = globe.toGlobeCoords(e.clientX - rect.left, e.clientY - rect.top);
      if (!coords) return;
      const alt = globe.pointOfView().altitude;
      pauseRotation();
      globe.pointOfView({ ...coords, altitude: Math.max(alt * 0.45, 0.18) }, reducedMotion ? 0 : 1100);
      scheduleResume();
    };
    mount.addEventListener('dblclick', onDblClick);

    // Responsive sizing
    const ro = new ResizeObserver(() => {
      globe.width(mount.clientWidth).height(mount.clientHeight);
    });
    ro.observe(mount);

    // Pause rendering while off-screen to save battery.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) globe.resumeAnimation();
      else globe.pauseAnimation();
    });
    io.observe(mount);

    return () => {
      window.clearTimeout(idleTimer.current);
      ro.disconnect();
      io.disconnect();
      mount.removeEventListener('dblclick', onDblClick);
      globe._destructor();
      mount.innerHTML = '';
      globeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onZoomChange?.(zoom);
  }, [zoom, onZoomChange]);

  // ── Data updates (camera untouched) ────────────────────────────────
  useEffect(() => {
    globeRef.current?.htmlElementsData(markers);
  }, [markers]);

  useEffect(() => {
    globeRef.current?.arcsData(arcs);
  }, [arcs]);

  useEffect(() => {
    globeRef.current?.globeOffset([offsetX, 0]);
  }, [offsetX]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const sel = markers.find((m) => m.id === selectedCityId);
    globe.ringsData(sel && !reducedMotion ? [sel] : []);
    mountRef.current?.querySelectorAll<HTMLElement>('.gm').forEach((node) => {
      node.classList.toggle('gm--selected', node.dataset.id === selectedCityId);
      node.classList.toggle('gm--dimmed', !!selectedCityId && node.dataset.id !== selectedCityId);
    });
  }, [selectedCityId, markers, reducedMotion]);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    window.clearTimeout(idleTimer.current);
    controls.autoRotate = autoRotate && !reducedMotion;
  }, [autoRotate, reducedMotion]);

  // ── Imperative API ─────────────────────────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      flyTo(lat, lng, altitude, ms = 1400) {
        const globe = globeRef.current;
        if (!globe) return;
        const alt = altitude ?? globe.pointOfView().altitude;
        globe.controls().autoRotate = false;
        globe.pointOfView({ lat, lng, altitude: alt }, reducedMotion ? 0 : ms);
      },
      zoomBy(factor) {
        const globe = globeRef.current;
        if (!globe) return;
        const pov = globe.pointOfView();
        const altitude = Math.min(Math.max(pov.altitude * factor, 0.1), 3.5);
        globe.pointOfView({ ...pov, altitude }, reducedMotion ? 0 : 500);
      },
      getAltitude() {
        return globeRef.current?.pointOfView().altitude ?? INITIAL_POV.altitude;
      },
    }),
    [reducedMotion],
  );

  return (
    <div className={`globe-stage ${ready ? 'is-ready' : ''}`} data-zoom={zoom}>
      <div className="globe-glow" aria-hidden />
      <div ref={mountRef} className="globe-mount" aria-label="Interactive 3D globe of race locations" role="application" />
      <div className="globe-legend" aria-hidden>
        {(['marathon', 'half', 'ultra'] as const).map((c) => (
          <span key={c}>
            <i style={{ background: CATEGORY_META[c].color }} />
            {CATEGORY_META[c].plural}
          </span>
        ))}
        <span>
          <i className="legend-pb" />
          Personal best
        </span>
      </div>
    </div>
  );
}
