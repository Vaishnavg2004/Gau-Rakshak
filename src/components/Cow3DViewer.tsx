import { useRef, useMemo, type ComponentProps } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Thermometer, RotateCw, Activity } from 'lucide-react';

interface SensorData {
  AcX: number;
  AcY: number;
  AcZ: number;
  GyX: number;
  GyY: number;
  GyZ: number;
  DS18B20_Temp: number;
  MPU_Temp: number;
}

interface Cow3DViewerProps {
  sensorData: SensorData | null;
  cowId: string;
  cowName?: string;
}

// Low-pass filter for smoothing
const lerp = (current: number, target: number, alpha: number) =>
  current + (target - current) * alpha;

// Posture classification
const classifyPosture = (
  pitch: number,
  roll: number,
  gyroVariance: number
): 'Standing' | 'Grazing' | 'Lying' | 'Walking' => {
  if (gyroVariance > 8000) return 'Walking';
  if (pitch > 25) return 'Grazing';
  if (Math.abs(roll) > 45) return 'Lying';
  return 'Standing';
};

// Procedural cow model component
function CowModel({ sensorData }: { sensorData: SensorData | null }) {
  const bodyRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const cowGroupRef = useRef<THREE.Group>(null);

  // Smoothed values
  const smoothed = useRef({ pitch: 0, roll: 0, walkPhase: 0 });

  // Walking animation legs
  const legFLRef = useRef<THREE.Mesh>(null);
  const legFRRef = useRef<THREE.Mesh>(null);
  const legBLRef = useRef<THREE.Mesh>(null);
  const legBRRef = useRef<THREE.Mesh>(null);

  const isAlert = sensorData && sensorData.DS18B20_Temp > 39.5;

  const bodyColor = useMemo(() => {
    if (isAlert) return '#cc4444';
    return '#8B6914';
  }, [isAlert]);

  useFrame((_, delta) => {
    if (!sensorData) return;

    const { AcX, AcY, AcZ, GyX, GyY, GyZ } = sensorData;

    // Calculate roll and pitch from accelerometer
    const rawRoll = Math.atan2(AcY, AcZ) * (180 / Math.PI);
    const rawPitch =
      Math.atan2(-AcX, Math.sqrt(AcY * AcY + AcZ * AcZ)) * (180 / Math.PI);

    // Smoothing (complementary filter)
    const alpha = 0.08;
    smoothed.current.pitch = lerp(smoothed.current.pitch, rawPitch, alpha);
    smoothed.current.roll = lerp(smoothed.current.roll, rawRoll, alpha);

    const pitchRad = THREE.MathUtils.degToRad(smoothed.current.pitch);
    const rollRad = THREE.MathUtils.degToRad(smoothed.current.roll);

    // Gyro variance for walking detection
    const gyroVar = Math.sqrt(GyX * GyX + GyY * GyY + GyZ * GyZ);
    const isWalking = gyroVar > 8000;

    // Body rotation (subtle)
    if (bodyRef.current) {
      bodyRef.current.rotation.x = pitchRad * 0.15;
      bodyRef.current.rotation.z = rollRad * 0.1;
    }

    // Head rotation (more pronounced)
    if (headRef.current) {
      headRef.current.rotation.x = pitchRad * 0.5;
      headRef.current.rotation.z = rollRad * 0.3;
    }

    // Neck follows head partially
    if (neckRef.current) {
      neckRef.current.rotation.x = pitchRad * 0.3;
    }

    // Walking leg animation
    if (isWalking) {
      smoothed.current.walkPhase += delta * 6;
      const phase = smoothed.current.walkPhase;
      const swing = 0.3;
      if (legFLRef.current) legFLRef.current.rotation.x = Math.sin(phase) * swing;
      if (legFRRef.current) legFRRef.current.rotation.x = Math.sin(phase + Math.PI) * swing;
      if (legBLRef.current) legBLRef.current.rotation.x = Math.sin(phase + Math.PI) * swing;
      if (legBRRef.current) legBRRef.current.rotation.x = Math.sin(phase) * swing;
    } else {
      // Reset legs smoothly
      [legFLRef, legFRRef, legBLRef, legBRRef].forEach((ref) => {
        if (ref.current) {
          ref.current.rotation.x = lerp(ref.current.rotation.x, 0, 0.1);
        }
      });
    }
  });

  return (
    <group ref={cowGroupRef} position={[0, 0, 0]}>
      {/* Body */}
      <group ref={bodyRef}>
        {/* Main body (torso) */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[1.8, 1.0, 0.9]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>

        {/* Belly (slightly rounder) */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.5, 0.3, 0.85]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>

        {/* Back spots */}
        <mesh position={[0.3, 1.05, 0.35]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#f5f5dc" />
        </mesh>
        <mesh position={[-0.4, 1.05, -0.2]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#f5f5dc" />
        </mesh>

        {/* Tail */}
        <mesh position={[-0.95, 0.9, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.6]} />
          <meshStandardMaterial color="#5a3e1b" />
        </mesh>
        {/* Tail tuft */}
        <mesh position={[-0.95, 0.55, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#3a2410" />
        </mesh>

        {/* Front legs */}
        <mesh ref={legFLRef} position={[0.6, 0.15, 0.3]}>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh ref={legFRRef} position={[0.6, 0.15, -0.3]}>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>

        {/* Back legs */}
        <mesh ref={legBLRef} position={[-0.6, 0.15, 0.3]}>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh ref={legBRRef} position={[-0.6, 0.15, -0.3]}>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>

        {/* Hooves */}
        {[[0.6, 0.3], [0.6, -0.3], [-0.6, 0.3], [-0.6, -0.3]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.18, z]}>
            <boxGeometry args={[0.2, 0.08, 0.2]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
        ))}

        {/* Udder */}
        <mesh position={[-0.2, 0.35, 0]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#f0c0a0" />
        </mesh>
      </group>

      {/* Neck */}
      <group ref={neckRef} position={[0.9, 1.0, 0]}>
        <mesh position={[0.15, 0.2, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.4, 0.55, 0.45]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0.35, 0.5, 0]}>
          {/* Head box */}
          <mesh>
            <boxGeometry args={[0.5, 0.35, 0.4]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>

          {/* Snout */}
          <mesh position={[0.25, -0.05, 0]}>
            <boxGeometry args={[0.2, 0.22, 0.32]} />
            <meshStandardMaterial color="#d4a574" />
          </mesh>

          {/* Nostrils */}
          <mesh position={[0.36, -0.05, 0.08]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#3a2410" />
          </mesh>
          <mesh position={[0.36, -0.05, -0.08]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#3a2410" />
          </mesh>

          {/* Eyes */}
          <mesh position={[0.15, 0.08, 0.2]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.15, 0.08, -0.2]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>

          {/* Horns */}
          <mesh position={[-0.05, 0.22, 0.15]} rotation={[0.3, 0, 0.5]}>
            <coneGeometry args={[0.04, 0.25, 6]} />
            <meshStandardMaterial color="#e8d8c0" />
          </mesh>
          <mesh position={[-0.05, 0.22, -0.15]} rotation={[-0.3, 0, 0.5]}>
            <coneGeometry args={[0.04, 0.25, 6]} />
            <meshStandardMaterial color="#e8d8c0" />
          </mesh>

          {/* Ears */}
          <mesh position={[-0.1, 0.12, 0.22]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.12]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          <mesh position={[-0.1, 0.12, -0.22]} rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.12]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>

          {/* Alert icon above head */}
          {isAlert && (
            <mesh position={[0, 0.5, 0]}>
              <octahedronGeometry args={[0.12]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

function Scene({ sensorData }: { sensorData: SensorData | null }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#4a7c3f" />
      </mesh>

      <CowModel sensorData={sensorData} />
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={6}
        target={[0, 0.8, 0]}
      />
    </>
  );
}

export const Cow3DViewer = ({ sensorData, cowId, cowName }: Cow3DViewerProps) => {
  // Compute derived values
  const pitch = useMemo(() => {
    if (!sensorData) return 0;
    const { AcX, AcY, AcZ } = sensorData;
    return (
      Math.atan2(-AcX, Math.sqrt(AcY * AcY + AcZ * AcZ)) * (180 / Math.PI)
    );
  }, [sensorData]);

  const roll = useMemo(() => {
    if (!sensorData) return 0;
    return Math.atan2(sensorData.AcY, sensorData.AcZ) * (180 / Math.PI);
  }, [sensorData]);

  const gyroVariance = useMemo(() => {
    if (!sensorData) return 0;
    const { GyX, GyY, GyZ } = sensorData;
    return Math.sqrt(GyX * GyX + GyY * GyY + GyZ * GyZ);
  }, [sensorData]);

  const posture = useMemo(
    () => classifyPosture(pitch, roll, gyroVariance),
    [pitch, roll, gyroVariance]
  );

  const isAlert = sensorData && sensorData.DS18B20_Temp > 39.5;

  type BadgeVariant = ComponentProps<typeof Badge>['variant'];

  const postureColors: Record<'Standing' | 'Grazing' | 'Lying' | 'Walking', BadgeVariant> = {
    Standing: 'default',
    Grazing: 'secondary',
    Lying: 'outline',
    Walking: 'default',
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            3D Cow Visualization
          </h3>
          <p className="text-sm text-muted-foreground">
            {cowName || cowId} — Real-time posture & motion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={postureColors[posture]}>{posture}</Badge>
          {isAlert && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              Fever
            </Badge>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-[350px] rounded-lg overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-800">
        <Canvas camera={{ position: [3, 2.5, 3], fov: 45 }}>
          <Scene sensorData={sensorData} />
        </Canvas>
      </div>

      {/* Live sensor readout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <RotateCw className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Pitch</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {pitch.toFixed(1)}°
          </p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <RotateCw className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Roll</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {roll.toFixed(1)}°
          </p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Thermometer className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Temp</span>
          </div>
          <p className={`text-sm font-semibold ${isAlert ? 'text-destructive' : 'text-foreground'}`}>
            {sensorData ? `${(sensorData.DS18B20_Temp ?? 0).toFixed(1)}°C` : '--'}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Posture</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{posture}</p>
        </div>
      </div>
    </Card>
  );
};
