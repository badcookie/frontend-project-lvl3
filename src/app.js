import * as yup from 'yup';

/* eslint-disable func-names */
/* eslint no-param-reassign: ["error", { "props": false }] */

yup.addMethod(yup.string, 'notAdded', function ({ message }) {
  return this.test('notAdded', message, function (link) {
    const { path, createError, options } = this;
    const { context: { state } } = options;
    return state.links.includes(link) ? createError({ path, message }) : true;
  });
});

const schema = yup.object().shape({
  link: yup.string()
    .required()
    .url()
    .notAdded({ message: 'link already exists' }),
});

const updateValidationState = (state) => {
  const { form: { data }, links } = state;

  const dataToValidate = { link: data };
  const validationContext = { context: { state } };

  schema.validate(dataToValidate, validationContext)
    .then(() => {
      state.links = [...links, data];
    })
    .catch((error) => {
      state.form.error = error.message;
      state.form.isValid = false;
    });
};

export default () => {
  const state = {
    form: {
      data: '',
      isValid: true,
      error: '',
    },
    links: [],
  };

  const inputField = document.querySelector('input');
  inputField.addEventListener('change', ({ target }) => {
    state.form.data = target.value;
    updateValidationState(state);
  });
};
