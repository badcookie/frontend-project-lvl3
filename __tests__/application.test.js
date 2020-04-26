import fs from 'fs';
import path from 'path';
import nock from 'nock';
import timer from 'timer-promise';
import { html } from 'js-beautify';
import userEvent from '@testing-library/user-event';

import run from '../src/application';

nock.disableNetConnect();

const htmlOptions = {
  preserve_newlines: true,
  unformatted: [],
};

const fixturesPath = path.join(__dirname, '__fixtures__');

const readFixture = (filename) => {
  const filepath = path.join(fixturesPath, filename);
  return fs.readFileSync(filepath).toString();
};

const getTree = () => html(document.body.innerHTML, htmlOptions);

let elements;

describe('ui', () => {
  beforeEach(() => {
    const initHtml = readFixture('index.html');
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

  test('valid url', async () => {
    const validUrl = 'https://www.example.com/rss.xml';
    const proxyUrl = 'https://cors-anywhere.herokuapp.com';
    const responseRss = readFixture('rss.xml');

    nock(proxyUrl)
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .get(`/${validUrl}`)
      .reply(200, responseRss);

    await userEvent.type(elements.input, validUrl, { allAtOnce: true });
    elements.input.setAttribute('value', validUrl);

    await timer.start(10);
    elements.form.submit();

    await timer.start(10);
    await timer.start(10);
    await timer.start(10);
    await timer.start(10);
    await timer.start(10);

    expect(getTree()).toMatchSnapshot();
  });
});
