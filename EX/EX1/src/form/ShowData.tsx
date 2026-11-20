import type { FormValues } from './form.types';

export default function ShowData({ data }: { data: FormValues }) {
  return (
    <figure className="submitted-data">
      <figcaption>Dữ liệu đã gửi</figcaption>
      <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
    </figure>
  );
}
