import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';

import render from './view';
import parse from './parser';
import resources from './locales';

/* eslint-disable func-names */
/* eslint no-param-reassign: ["error", { "props": false }] */

yup.addMethod(yup.string, 'notAdded', function () {
  return this.test('notAdded', function (url) {
    const { path, createError, options } = this;
    const { context: { state } } = options;
    const feedExists = state.feeds.find(({ link }) => url === link);
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
  };

  const inputField = document.querySelector('input');
  inputField.addEventListener('input', ({ target }) => {
    state.form.data = target.value;
    state.form.processState = 'filling';
    validate(state);
  });

  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!state.form.isValid) {
      state.form.processState = 'failed';
      return;
    }

    state.form.processState = 'sending';

    axios.get(state.form.data)
      .then((response) => {
        const { items, ...feedData } = parse(response.data);

        const feedId = _.uniqueId();
        const identifiedFeedData = { ...feedData, id: feedId };
        const identifiedPosts = items.map(
          (item) => ({ ...item, id: _.uniqueId(), feedId }),
        );

        state.feeds = [...state.feeds, identifiedFeedData];
        state.posts = [...state.posts, ...identifiedPosts];

        state.form.processState = 'finished';
        state.form.messageType = 'success';
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
