import { useState } from 'react';
import type { FormEvent } from 'react';
import { FormProvider, useFormContext } from './FormContext';
import InputField from './InputField';
import type { FormProviderOptions, FormValues, ValidationRules } from './form.types';
import { email, minLength, required } from './validationRules';
import './simple-form.css';

const emptyValues = { name: '', email: '' };
const contactRules: ValidationRules = {
  name: [required('Nhập họ tên.'), minLength(2, 'Họ tên phải có ít nhất 2 ký tự.')],
  email: [required('Nhập email.'), email('Email không hợp lệ.')],
};

type SubmitHandler = (values: FormValues) => void;
type SimpleFormProps = Partial<FormProviderOptions> & { onSubmit?: SubmitHandler };

function ContactForm({ onSubmit }: { onSubmit?: SubmitHandler }) {
  const { values, isValid } = useFormContext();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      event.currentTarget.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus();
      return;
    }

    onSubmit?.(values);
    setSubmitted(true);
  }

  return (
    <form
      className="contact-form"
      aria-label="Thông tin liên hệ"
      noValidate
      onChange={() => setSubmitted(false)}
      onSubmit={handleSubmit}
    >
      <InputField name="name" label="Họ và tên" placeholder="Nhập họ và tên" />
      <InputField name="email" label="Email" type="email" placeholder="Nhập email" />
      <button type="submit">Gửi thông tin</button>
      <p role="status">{submitted ? 'Đã xác nhận thông tin hợp lệ.' : null}</p>
    </form>
  );
}

export default function SimpleForm({
  initialValues = emptyValues,
  validationRules = contactRules,
  onSubmit,
}: SimpleFormProps) {
  return (
    <FormProvider initialValues={initialValues} validationRules={validationRules}>
      <ContactForm onSubmit={onSubmit} />
    </FormProvider>
  );
}
