import { Router, type Request, type Response } from 'express';
import { getCatenaryParams, computeSuspenderPositions } from '../services/catenary.js';
import { createSensors } from '../services/fbgSimulator.js';

const router = Router();

const BRIDGE_CONFIG = {
  span: 200,
  towerHeight: 60,
  sag: 20,
  deckWidth: 16,
  deckY: 5,
  suspenderCount: 40,
};

router.get('/config', (_req: Request, res: Response): void => {
  const { span, sag, towerHeight, deckWidth, deckY, suspenderCount } = BRIDGE_CONFIG;
  const catenary = getCatenaryParams(span, sag);
  const suspenderPositions = computeSuspenderPositions(span, sag, towerHeight, deckY, suspenderCount);

  res.json({
    span,
    towerHeight,
    sag,
    catenaryParam: catenary.a,
    deckWidth,
    deckY,
    suspenderCount,
    suspenderPositions,
  });
});

router.get('/sensors', (_req: Request, res: Response): void => {
  const sensors = createSensors(BRIDGE_CONFIG.suspenderCount);
  const { span, sag, towerHeight, deckY } = BRIDGE_CONFIG;
  const positions = computeSuspenderPositions(span, sag, towerHeight, deckY, BRIDGE_CONFIG.suspenderCount);

  res.json(
    sensors.map((s, i) => ({
      id: s.id,
      suspenderIndex: s.suspenderIndex,
      position: {
        x: positions[i]?.x ?? 0,
        y: positions[i]?.yCable ?? 0,
        z: 0,
      },
      alertThreshold: s.alertThreshold,
      safeThreshold: s.safeThreshold,
      currentMicroStrain: s.baseMicroStrain,
    }))
  );
});

export default router;
