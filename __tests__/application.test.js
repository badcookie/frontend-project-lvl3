import fs from 'fs';
import path from 'path';
// import nock from 'nock';
import timer from 'timer-promise';
import { html } from 'js-beautify';
import userEvent from '@testing-library/user-event';

import run from '../src/application';

const htmlOptions = {
  preserve_newlines: true,
  unformatted: [],
};

const fixturesPath = path.join(__dirname, '__fixtures__');
const getTree = () => html(document.body.innerHTML, htmlOptions);

let elements;

describe('ui', () => {
  beforeEach(() => {
    const initHtml = fs.readFileSync(path.join(fixturesPath, 'index.html')).toString();
    document.documentElement.innerHTML = initHtml;
    run();

    elements = {
      form: document.querySelector('form'),
      input: document.querySelector('input'),
      button: document.querySelector('button'),
    };
  });

  test('passing invalid url', async () => {
    expect(getTree()).toMatchSnapshot();

    await userEvent.type(elements.input, 'invalid url', { allAtOnce: true });
    elements.input.setAttribute('value', 'invalid url');

    await timer.start(10);
    expect(getTree()).toMatchSnapshot();

    elements.form.submit();
    await timer.start(10);

    expect(getTree()).toMatchSnapshot();
  });

  test('passing empty url', async () => {
    elements.form.submit();
    await timer.start(10);

    expect(getTree()).toMatchSnapshot();
  });
});
