import { FormProvider } from './FormContext';
import InputField from './InputField';
import type { FormProviderOptions, ValidationRules } from './form.types';
import { email, minLength, required } from './validationRules';

const emptyValues = { name: '', email: '' };
const contactRules: ValidationRules = {
  name: [required('Nhập họ tên.'), minLength(2, 'Họ tên phải có ít nhất 2 ký tự.')],
  email: [required('Nhập email.'), email('Email không hợp lệ.')],
};

export default function SimpleForm({
  initialValues = emptyValues,
  validationRules = contactRules,
}: Partial<FormProviderOptions>) {
  return (
    <FormProvider initialValues={initialValues} validationRules={validationRules}>
      <form aria-label="Thông tin liên hệ">
        <InputField name="name" label="Họ và tên" placeholder="Nhập họ và tên" />
        <InputField name="email" label="Email" type="email" placeholder="Nhập email" />
      </form>
    </FormProvider>
  );
}
