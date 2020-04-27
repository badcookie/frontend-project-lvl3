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
      feeds: document.querySelector('.rss-feeds'),
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
    const proxyUrl = 'https://cors-anywhere.herokuapp.com';

    const firstValidUrl = 'https://www.example.com/rss1.xml';
    const firstResponseRss = readFixture('rss1.xml');

    const secondValidUrl = 'https://www.example.com/rss2.xml';
    const secondResponseRss = readFixture('rss2.xml');

    nock(proxyUrl)
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .get(`/${firstValidUrl}`)
      .reply(200, firstResponseRss);

    nock(proxyUrl)
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .get(`/${secondValidUrl}`)
      .reply(200, secondResponseRss);

    await userEvent.type(elements.input, firstValidUrl, { allAtOnce: true });
    elements.input.setAttribute('value', firstValidUrl);

    await timer.start(10);
    elements.form.submit();

    await timer.start(10);
    await timer.start(10);
    await timer.start(10);
    await timer.start(10);

    expect(getTree()).toMatchSnapshot();

    await timer.start(10);

    await userEvent.type(elements.input, '', { allAtOnce: true });
    elements.input.setAttribute('value', '');

    await timer.start(10);
    expect(getTree()).toMatchSnapshot();

    await userEvent.type(elements.input, secondValidUrl, { allAtOnce: true });
    elements.input.setAttribute('value', secondValidUrl);

    await timer.start(10);
    elements.form.submit();

    await timer.start(10);
    await timer.start(10);
    await timer.start(10);
    await timer.start(10);

    expect(getTree()).toMatchSnapshot();

    // const feedLink = elements.feeds.querySelector('a');
    // await userEvent.click(feedLink);

    // expect(getTree()).toMatchSnapshot();
  });
});
