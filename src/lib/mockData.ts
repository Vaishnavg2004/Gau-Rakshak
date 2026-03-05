interface MockSensorDataPoint {
  AcX: number;
  AcY: number;
  AcZ: number;
  GyX: number;
  GyY: number;
  GyZ: number;
  DS18B20_Temp: number;
  MPU_Temp: number;
  timestamp: number;
}

interface MockCowRecord {
  history: Record<string, MockSensorDataPoint>;
}

const makeHistory = (baseTemp: number, tempDrift: number): Record<string, MockSensorDataPoint> => {
  const nowSec = Math.floor(Date.now() / 1000);
  const history: Record<string, MockSensorDataPoint> = {};

  for (let i = 0; i < 24; i += 1) {
    const t = nowSec - (23 - i) * 300; // 5-minute interval
    const wave = Math.sin(i / 3);
    history[`pt_${i + 1}`] = {
      AcX: Number((0.2 + wave * 0.6).toFixed(3)),
      AcY: Number((0.1 + wave * 0.4).toFixed(3)),
      AcZ: Number((9.7 + wave * 0.3).toFixed(3)),
      GyX: Math.round(3000 + wave * 1800 + i * 40),
      GyY: Math.round(2600 + wave * 1500 + i * 30),
      GyZ: Math.round(2200 + wave * 1200 + i * 20),
      DS18B20_Temp: Number((baseTemp + wave * tempDrift).toFixed(2)),
      MPU_Temp: Number((34.5 + wave * 0.6).toFixed(2)),
      timestamp: t,
    };
  }

  return history;
};

export const mockCowsRealtime: Record<string, MockCowRecord> = {
  GR001: { history: makeHistory(38.4, 0.3) },
  GR002: { history: makeHistory(39.1, 0.45) },
  GR003: { history: makeHistory(37.9, 0.25) },
};

