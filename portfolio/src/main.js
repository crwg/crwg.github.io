import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh, SplatLoader } from "@sparkjsdev/spark";

// --- Константы ---
const CAMERA_TARGET_Y = 19; // высота точки, на которую смотрит камера
const CAMERA_TARGET_Z = 51; // начальное расстояние камеры от цели по оси Z

/// --- Панель Загрузки ---
const loaderDiv = document.createElement('div'); // Создаём красивый индикатор загрузки (без изменений в HTML)

Object.assign(loaderDiv.style, {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: '#fff',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '2rem',
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  padding: '1rem 2rem',
  borderRadius: '1rem',
  zIndex: '999',
  pointerEvents: 'none',
  transition: 'opacity 1.5s'
});
loaderDiv.textContent = 'Загрузка …';
document.body.appendChild(loaderDiv);

// --- Сцена ---
const scene = new THREE.Scene();
// Закрашиваем фон
scene.background = new THREE.Color(0x000000);

// --- Камера ---
const camera = new THREE.PerspectiveCamera(
  45, // угол обзора
  window.innerWidth / window.innerHeight,
  0.25, // ближняя плоскость отсечения
  150  // дальняя плоскость отсечения
);
camera.position.set(0, CAMERA_TARGET_Y, CAMERA_TARGET_Z);

// --- Рендерер ---
const renderer = new THREE.WebGLRenderer({ antialias: false }); // антиалиас нафиг с пляжа, не нужен для сплат вовсе
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ограничиваем для производительности
renderer.toneMapping = THREE.ACESFilmicToneMapping; // кинематографичный тонмаппинг ACES
renderer.outputColorSpace = THREE.SRGBColorSpace;   // цветовое пространство sRGB
document.body.appendChild(renderer.domElement);

// --- Spark-рендерер (Gaussian Splatting) ---
const spark = new SparkRenderer({ renderer, maxStdDev: Math.sqrt(6) });
scene.add(spark);

// --- Модель (Gaussian Splat) ---
const url = "models/room.sog";
const loader = new SplatLoader();

loader.loadAsync(url, (event) => {
  if (event.type === "progress") {
    if (event.lengthComputable) {
      const pct = Math.round((event.loaded / event.total) * 100);
      loaderDiv.textContent = `Загрузка ${pct}%`;
    } else {
      // если размер неизвестен – показываем байты
      loaderDiv.textContent = `Загружено ${event.loaded} байт`;
    }
  }
})
.then((packedSplats) => {
  const splatMesh = new SplatMesh({ packedSplats });
  splatMesh.quaternion.set(1, 0, 0, 0);
  splatMesh.position.set(0, 0, 0);
  splatMesh.rotation.x = Math.PI;
  splatMesh.scale.setScalar(1.0);
  scene.add(splatMesh);

  // Плавно убираем индикатор
  loaderDiv.style.opacity = '0';
  setTimeout(() => loaderDiv.remove(), 2000); // Dispose :D
})
.catch((error) => {
  loaderDiv.textContent = 'Ошибка загрузки';
  loaderDiv.style.color = '#ff6666';
  console.warn(error);
});

// --- Вспомогательная сетка (помогает ориентироваться в пространстве) ---
const gridHelper = new THREE.GridHelper(30, 8, 0x888888, 0x333333);
gridHelper.position.y = 1.25; // поднимаем сетку на уровень пола модели
scene.add(gridHelper);

// --- Управление камерой (OrbitControls) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, CAMERA_TARGET_Y, 0); // точка, вокруг которой вращается камера
controls.enableDamping = true;              // плавное замедление вращения
controls.dampingFactor = 0.08;

// --- Анимационный цикл ---
renderer.setAnimationLoop(() => {
  controls.update();          // обновляем контроллер (демпфирование)
  renderer.render(scene, camera);
});

// --- Обработчики событий ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// По двойному клику сбрасываем положение камеры к исходному
window.addEventListener("dblclick", () => {
  camera.position.set(0, CAMERA_TARGET_Y, CAMERA_TARGET_Z);
  controls.target.set(0, CAMERA_TARGET_Y, 0);
  controls.update();
});