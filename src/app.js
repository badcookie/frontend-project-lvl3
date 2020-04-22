import * as yup from 'yup';

/* eslint-disable func-names */
/* eslint no-param-reassign: ["error", { "props": false }] */

// TODO: i18n
const messages = {
  error: {
    network: 'Network error',
    linkAlreadyExists: 'Link was already added',
    invalidUrl: 'Link must be valid url',
  },
  success: 'RSS has been loaded',
};

yup.addMethod(yup.string, 'notAdded', function ({ message }) {
  return this.test('notAdded', message, function (link) {
    const { path, createError, options } = this;
    const { context: { state } } = options;
    return state.links.includes(link) ? createError({ path, message }) : true;
  });
});

const schema = yup.object().shape({
  url: yup.string()
    .required()
    .url({ message: messages.error.invalidUrl })
    .notAdded({ message: messages.error.linkAlreadyExists }),
});

const handleSubmit = (state) => (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const url = formData.get('url');

  const validationContext = { context: { state } };

  schema.validate({ url }, validationContext)
    .then(() => {
      state.form.error = '';
      state.form.isValid = true;
      state.links = [...state.links, url];
    })
    .catch((error) => {
      state.form.error = error.message;
      state.form.isValid = false;
    });
};

export default () => {
  const state = {
    form: {
      isValid: true,
      error: '',
    },
    links: [],
  };

  const form = document.querySelector('form');
  form.addEventListener('submit', handleSubmit(state));
};
