import { FormProvider } from './FormContext';
import InputField from './InputField';
import type { FormProviderOptions } from './form.types';

const emptyValues = { name: '', email: '' };
const noRules = {};

export default function SimpleForm({
  initialValues = emptyValues,
  validationRules = noRules,
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
