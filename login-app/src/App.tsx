import type { ComponentType } from 'react';
import { PrototypePanel } from './proto/Panel';
import type { ScreenId } from './proto/screens';
import { useProto } from './proto/store';
import * as A from './screens/activation';
import * as C from './screens/password';
import * as B from './screens/login';
import * as D from './screens/recovery';
import * as E from './screens/session';

type Screen = ComponentType<{ screen: ScreenId }>;

// Estados de erro reaproveitam a tela-base (mesma instância), preservando o que foi digitado.
const SCREENS: Record<ScreenId, [base: ScreenId, Screen]> = {
  A01: ['A01', A.A01], A02: ['A02', A.A02], A03: ['A03', A.A03], A04: ['A04', A.A04], A05: ['A05', A.A05],
  A06: ['A06', A.A06], A07: ['A06', A.A06], A08: ['A08', A.A08], A09: ['A09', A.A09], A10: ['A10', A.A10],
  A11: ['A11', A.A11], A12: ['A11', A.A11], A13: ['A13', A.A13], A14: ['A13', A.A13], A15: ['A15', A.A15],
  B01: ['B01', B.B01], B02: ['B01', B.B01], B03: ['B03', B.B03], B04: ['B04', B.B04], B05: ['B04', B.B04],
  B06: ['B06', B.B06], B07: ['B07', B.B07],
  C01: ['C01', C.C01], C02: ['C02', C.C02], C03: ['C03', C.C03], C04: ['C04', C.C04], C05: ['C05', C.C05],
  C06: ['C06', C.C06], C07: ['C04', C.C04],
  D01: ['D01', D.D01], D02: ['D02', D.D02], D03: ['D02', D.D02], D04: ['D04', D.D04], D05: ['D05', D.D05],
  D06: ['D06', D.D06], D07: ['D07', D.D07], D08: ['D08', D.D08], D09: ['D09', D.D09],
  E01: ['E01', E.E01], E02: ['E02', E.E02], E03: ['E03', E.E03], E04: ['E04', E.E04], E05: ['E05', E.E05], E06: ['E06', E.E06],
};

export function App() {
  const { screen } = useProto();
  const [base, Current] = SCREENS[screen];
  return (
    <>
      <Current key={base} screen={screen} />
      <PrototypePanel />
    </>
  );
}
