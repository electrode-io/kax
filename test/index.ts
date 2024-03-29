import { assert } from 'chai';

import { getDefaultRenderer } from '../src';
import { KaxAdvancedRenderer, KaxSimpleRenderer } from '../src/renderers';

describe('Default renderer based on environment', () => {
  let envCi;
  let envTerm;
  before(() => {
    envCi = process.env.CI;
    envTerm = process.env.TERM;
  });
  after(() => {
    delete process.env.CI;
    delete process.env.TERM;
    if (envCi) process.env.CI = envCi;
    if (envTerm) process.env.TERM = envTerm;
  });
  beforeEach(() => {
    delete process.env.CI;
    delete process.env.TERM;
  });

  it('should use KaxAdvancedRenderer by default', () => {
    assert.instanceOf(getDefaultRenderer(), KaxAdvancedRenderer);
  });
  it('should use KaxSimpleRenderer when CI is set', () => {
    process.env.CI = 'true';
    assert.instanceOf(getDefaultRenderer(), KaxSimpleRenderer);
  });
  it('should use KaxSimpleRenderer when TERM is "dumb"', () => {
    process.env.TERM = 'dumb';
    assert.instanceOf(getDefaultRenderer(), KaxSimpleRenderer);
  });
  it('should use KaxAdvancedRenderer when TERM is not "dumb"', () => {
    process.env.TERM = 'xterm-color';
    assert.instanceOf(getDefaultRenderer(), KaxAdvancedRenderer);
  });
});
