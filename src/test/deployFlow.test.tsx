import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/supabase', () => {
  const ok = Promise.resolve({ error: null, data: null });
  const chain: Record<string, unknown> = {};
  for (const k of ['from', 'insert', 'update', 'upsert', 'eq', 'select']) chain[k] = () => chain;
  chain.then = ok.then.bind(ok);
  return { supabase: chain };
});

const { EnergyDeployment } = await import('@/components/EnergyDeployment');
const { useEnergyStore } = await import('@/stores/energyStore');
const { useSeasonStore } = await import('@/stores/seasonStore');
const { useUserStore } = await import('@/stores/userStore');
const { drawEncounter } = await import('@/game/voyage');
const { toDayKey } = await import('@/lib/gameEngine');

describe('the day’s departure', () => {
  it('deals the card, takes the spend, then reveals how it went', async () => {
    const leg = 4;
    const card = drawEncounter(leg, toDayKey(new Date()))!;
    useSeasonStore.setState({
      activeSeason: { id: 's1', seasonNumber: 1, name: 'S1', description: null, startDate: new Date(2026, 0, 1), endDate: new Date(2027, 0, 1), status: 'active', totalDistanceKm: 0 },
      participation: { id: 'p1', seasonId: 's1', joinedAt: '', joinedAtLeg: leg, currentLeg: leg, legProgress: 0, status: 'active' },
    });
    const now = new Date();
    useUserStore.setState({ voyageLog: {}, departureMinutes: (now.getHours() * 60 + now.getMinutes() + 720) % 1440 });
    useEnergyStore.getState().reset();
    useEnergyStore.getState().chargeEnergy(card.choices[0].favours, 3);

    const onClose = vi.fn();
    render(<EnergyDeployment open onClose={onClose} />);

    expect(screen.getByText(card.title)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: card.choices[0].label }));

    // Now the spend, headed by the choice.
    expect(screen.getByText(card.choices[0].label)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Best mix' }));
    fireEvent.click(screen.getByRole('button', { name: /Stoke the boiler/ }));

    expect(await screen.findByText('Triumph')).toBeInTheDocument();
    expect(screen.getByText(card.choices[0].win)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Carry on' }));
    expect(onClose).toHaveBeenCalled();
  });
});
