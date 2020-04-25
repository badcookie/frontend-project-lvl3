import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';

import render from './view';
import parse from './parser';
import resources from './locales';

/* eslint-disable func-names */
/* eslint no-param-reassign: ["error", { "props": false }] */

const normalize = (url) => url.replace(/\/+$/, '');

const buildRSSUrl = (rssUrl) => `https://cors-anywhere.herokuapp.com/${rssUrl}`;

yup.addMethod(yup.string, 'notAdded', function () {
  return this.test('notAdded', function (url) {
    const { path, createError, options } = this;
    const { context: { state } } = options;

    const normalizedUrl = normalize(url);
    const feedExists = state.feeds.find(({ link }) => link === normalizedUrl);
    return feedExists ? createError({ path }) : true;
  });
});

const schema = yup.object().shape({
  url: yup.string().required().url().notAdded(),
});

const validate = (state) => {
  const dataToValidate = { url: state.form.data };
  const validationContext = { context: { state } };

  schema.validate(dataToValidate, validationContext)
    .then(() => {
      state.form.messageType = '';
      state.form.isValid = true;
    })
    .catch((error) => {
      state.form.messageType = error.type;
      state.form.isValid = false;
    });
};

export default () => {
  const state = {
    form: {
      data: '',
      isValid: false,
      messageType: 'required',
      messageContext: {},
      processState: 'filling',
    },
    feeds: [],
    posts: [],
    elements: {
      input: document.querySelector('input'),
      form: document.querySelector('form'),
      submit: document.querySelector('button'),
      formContainer: document.querySelector('.jumbotron'),
    },
  };

  state.elements.input.addEventListener('input', ({ target }) => {
    state.form.data = target.value;
    state.form.processState = 'filling';
    validate(state);
  });

  state.elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!state.form.isValid) {
      state.form.processState = 'failed';
      return;
    }

    state.form.processState = 'sending';

    // TODO: mock
    const url = normalize(state.form.data);
    const proxyUrl = buildRSSUrl(url);

    axios.get(proxyUrl)
      .then((response) => {
        const { items, ...rest } = parse(response.data);

        const feed = { ...rest, id: _.uniqueId(), link: url };
        const posts = items.map((item) => ({ ...item, id: _.uniqueId(), feedId: feed.id }));

        state.feeds = [...state.feeds, feed];
        state.posts = [...state.posts, ...posts];

        state.form.processState = 'finished';
        state.form.messageType = 'success';

        console.log(state);
      })
      .catch((error) => {
        const { response: { status, data } } = error;
        state.form.processState = 'failed';
        state.form.messageType = 'network';
        state.form.messageContext = { status, data };
        throw error;
      });
  });

  render(state);

  i18next.init({ lng: 'en', resources });
};
