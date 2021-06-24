import chai from 'chai';
import { expect } from 'chai';
chai.use(require('chai-datetime'));
import { Command, parseCommand, parseAdd } from '../src/command';
import addDays from 'date-fns/addDays';
import setHours from 'date-fns/setHours';
import setMinutes from 'date-fns/setMinutes';
import setSeconds from 'date-fns/setSeconds';
import setMillis from 'date-fns/setMilliseconds';

describe('command', () => {
  it('parse abs date', () => {
    const c = parseAdd('here to do something on 2021-12-01 at 09:00');
    expect(c.dest).equal('here');
    expect(c.what).equal('do something');
    expect(c.when).equalTime(new Date('2021-12-01T08:00:00.000Z'));
  });
  it('parse rel date', () => {
    const c = parseAdd('here to do something tomorrow at 9am');
    expect(c.dest).equal('here');
    expect(c.what).equal('do something');
    expect(c.when).equalTime(setHours(setMinutes(setSeconds(setMillis(addDays(new Date(), 1), 0), 0), 0), 9));
  });
});
