import { watch } from 'melanke-watchjs';


export default (state) => {
  watch(state.form, 'processState', () => {
    const { form: { processState } } = state;

    const submitButton = document.querySelector('button');
    const inputField = document.querySelector('input');
    const formContainer = document.querySelector('.jumbotron');

    const existingFeedback = formContainer.querySelector('.feedback');
    if (existingFeedback) {
      formContainer.removeChild(existingFeedback);
    }

    switch (processState) {
      case 'filling': {
        submitButton.disabled = false;
        break;
      }
      case 'sending': {
        submitButton.disabled = true;
        break;
      }
      case 'failed': {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-danger');
        feedbackElement.textContent = state.form.message;
        formContainer.appendChild(feedbackElement);
        inputField.style.borderColor = 'red';
        break;
      }
      case 'finished': {
        const feedbackElement = document.createElement('div');
        feedbackElement.classList.add('feedback', 'text-success');
        feedbackElement.textContent = state.form.message;
        formContainer.appendChild(feedbackElement);
        inputField.value = '';
        inputField.style.removeProperty('border');
        break;
      }
      default: {
        throw new Error(`Unknown state: ${processState}`);
      }
    }

    console.log(state);
  });
};
