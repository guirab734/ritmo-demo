import test from 'node:test';
import assert from 'node:assert/strict';
import { DAYS } from './data.js';
import { newSession, completeSet, restRemainingSec, tickSession, togglePause, elapsedMs } from './model.js';

const start = () => newSession(DAYS[0], DAYS[0].exercises, 'Exemplo', 'full', 1000);
test('registrar uma série inicia o descanso pelo horário de término', () => {
  const original = start();
  const next = completeSet(original, {}, 11000);
  assert.equal(original.logs.length, 0);
  assert.equal(next.phase, 'rest');
  assert.equal(restRemainingSec(next, 41000), 30);
  assert.equal(tickSession(next, 71000).session.phase, 'work');
});
test('a pausa congela o tempo útil e o intervalo restante', () => {
  let session = completeSet(start(), {}, 11000);
  session = togglePause(session, 21000);
  assert.equal(restRemainingSec(session, 100000), 50);
  assert.equal(elapsedMs(session, 100000), 20000);
  session = togglePause(session, 121000);
  assert.equal(restRemainingSec(session, 121000), 50);
  assert.equal(elapsedMs(session, 121000), 20000);
});
test('a última série conclui a sessão sem outro descanso', () => {
  const exercises = [{ ...DAYS[0].exercises[0], sets: 1 }];
  const session = completeSet(newSession(DAYS[0], exercises, 'Exemplo', 'full', 1000), {}, 11000);
  assert.equal(session.phase, 'complete');
  assert.equal(session.restDeadline, null);
});
