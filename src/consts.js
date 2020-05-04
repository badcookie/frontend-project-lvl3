export const formProcessStates = Object.freeze({
  filling: 'filling',
  sending: 'sending',
  failed: 'failed',
  finished: 'finished',
});

export const formMessageTypes = Object.freeze({
  network: 'network',
  success: 'success',
  urlRequired: 'required',
});

export const feedUpdateIntervalMs = 5 * 1000;

export const proxyAddress = 'https://cors-anywhere.herokuapp.com';
