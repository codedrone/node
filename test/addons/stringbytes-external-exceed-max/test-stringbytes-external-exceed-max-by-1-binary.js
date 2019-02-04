'use strict';

const common = require('../../common');
const skipMessage = 'intensive toString tests due to memory confinements';
if (!common.enoughTestMem)
  common.skip(skipMessage);

const binding = require(`./build/${common.buildType}/binding`);
const assert = require('assert');

// v8 fails silently if string length > v8::String::kMaxLength
// v8::String::kMaxLength defined in v8.h
const kStringMaxLength = process.binding('buffer').kStringMaxLength;

let buf;
try {
  buf = Buffer.allocUnsafe(kStringMaxLength + 1);
} catch (e) {
  // If the exception is not due to memory confinement then rethrow it.
  if (e.message !== 'Array buffer allocation failed') throw (e);
  common.skip(skipMessage);
}

// Ensure we have enough memory available for future allocations to succeed.
if (!binding.ensureAllocation(2 * kStringMaxLength))
  common.skip(skipMessage);

const stringLengthHex = kStringMaxLength.toString(16);
common.expectsError(function() {
  buf.toString('latin1');
}, {
  message: `Cannot create a string longer than 0x${stringLengthHex} ` +
           'characters',
  code: 'ERR_STRING_TOO_LONG',
  type: Error
});

let maxString = buf.toString('latin1', 1);
assert.strictEqual(maxString.length, kStringMaxLength);
// Free the memory early instead of at the end of the next assignment
maxString = undefined;

maxString = buf.toString('latin1', 0, kStringMaxLength);
assert.strictEqual(maxString.length, kStringMaxLength);
